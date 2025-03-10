import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Check, Package, ShoppingBag, Truck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseFunctions } from '@/hooks/useSupabaseFunctions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Include Json type from Supabase
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface PickupPoint {
  id?: string;
  name: string;
  address: string;
  zip: string;
  city: string;
}

interface ShippingAddress {
  type?: 'packeta' | 'standard';
  fullName: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  pickupPoint?: PickupPoint;
}

interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface OrderDetails {
  id: string | number;
  status: string;
  paymentMethod: string;
  date: Date;
  shipping_method: string;
  total: number;
  shipping_address: ShippingAddress;
  tracking_number?: string;
  items?: OrderItem[];
}

interface OrderData {
  id: number;
  status: string;
  total: number;
  shipping_method: string;
  shipping_address: Json;
  payment_intent_id?: string;
  tracking_number?: string;
  created_at: string;
  order_items: OrderItem[];
}

// Helper function to convert Json to ShippingAddress
const parseShippingAddress = (json: Json): ShippingAddress => {
  if (!json) {
    return { fullName: 'Unknown' };
  }
  
  if (typeof json === 'string') {
    try {
      return JSON.parse(json) as ShippingAddress;
    } catch (e) {
      console.error('Error parsing shipping address from string:', e);
      return { fullName: 'Error parsing address' };
    }
  }
  
  // If it's already an object (but might be a plain object, not ShippingAddress),
  // ensure it has at least the required fields
  if (typeof json === 'object' && json !== null) {
    // If it's an object but missing fullName, add a default one
    if (!('fullName' in json) && typeof json === 'object') {
      return { ...json as object, fullName: 'Unknown Customer' } as ShippingAddress;
    }
    return json as unknown as ShippingAddress;
  }
  
  // Fallback
  return { fullName: 'Invalid address data' };
};

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const { toast } = useToast();
  const { post: invokeFunction } = useSupabaseFunctions();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const sessionId = searchParams.get('session_id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isPacketaProcessing, setIsPacketaProcessing] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [sessionProcessed, setSessionProcessed] = useState(false);
  
  useEffect(() => {
    // Check if we're processing a Stripe session but user is not authenticated
    if (sessionId && !user) {
      setIsLoading(false);
      setError("Authentication required. Please sign in to view your order.");
      return;
    }
    
    if (!user && !orderId && !sessionId) {
      navigate('/');
      return;
    }
    
    // Set session as processed immediately to prevent infinite loops
    if (sessionId) {
      setSessionProcessed(true);
    }
    
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      
      try {
        // Try fetching the order from the orderId in URL parameters
        if (orderId) {
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select(`
              id, 
              status, 
              total, 
              shipping_method, 
              shipping_address, 
              payment_intent_id, 
              tracking_number,
              created_at,
              order_items:order_items(
                id, 
                product_id, 
                product_name, 
                product_price, 
                quantity
              )
            `)
            .eq('id', Number(orderId))
            .single();
          
          if (orderError) {
            console.error('Error fetching order:', orderError);
            throw new Error('Could not find order details');
          }
          
          if (orderData) {
            console.log('Order data retrieved:', orderData);
            
            setOrderDetails({
              id: orderData.id,
              status: orderData.status,
              paymentMethod: orderData.payment_intent_id ? 'Card' : 'Cash on Delivery',
              date: new Date(orderData.created_at),
              shipping_method: orderData.shipping_method,
              total: orderData.total,
              shipping_address: parseShippingAddress(orderData.shipping_address),
              tracking_number: orderData.tracking_number,
              items: orderData.order_items
            });
            
            // Check if Packeta processing has already been attempted for this order
            const orderKey = `packeta_attempted_${orderData.id}`;
            const hasAttempted = sessionStorage.getItem(orderKey) === 'true';
            
            // If order status is 'pending' or 'paid', and no tracking number exists, and we haven't tried processing before
            if (orderData.shipping_method === 'packeta' && 
                (orderData.status === 'pending' || orderData.status === 'paid') && 
                !orderData.tracking_number && !hasAttempted) {
              console.log('Order needs Packeta processing, initiating...');
              
              // Mark this order as attempted in sessionStorage
              sessionStorage.setItem(orderKey, 'true');
              
              await processPacketaOrder(orderData);
            } else if (hasAttempted && !orderData.tracking_number) {
              console.log('Packeta processing already attempted for this order, skipping...');
            } else {
              console.log('Order already has tracking or is not in a processable state');
            }
            
            // Clear the cart after successful order fetch
            clearCart();
          }
        }
        // Handle Stripe session
        else if (sessionId && !sessionProcessed) {
          await handleStripeSession(sessionId);
        } else {
          throw new Error('No order information provided');
        }
      } catch (err) {
        console.error('Error loading order details:', err);
        setError('Could not load order details. Please contact customer support.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, sessionId, user, navigate, clearCart, toast, sessionProcessed]);

  const requestTracking = async () => {
    if (!orderDetails || !user) return;
    
    setIsTrackingLoading(true);
    
    try {
      const { data, error } = await invokeFunction('track-order', {
        body: { order_id: orderDetails.id }
      });
      
      if (error) {
        throw new Error(`Error tracking order: ${error}`);
      }
      
      if (data?.tracking_number) {
        setOrderDetails(prev => prev ? {
          ...prev,
          tracking_number: data.tracking_number
        } : null);
        
        toast({
          title: "Tracking Information",
          description: `Your tracking number is: ${data.tracking_number}`,
        });
      }
    } catch (err) {
      console.error('Error requesting tracking:', err);
      toast({
        title: "Tracking Error",
        description: "Could not retrieve tracking information. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const processPacketaOrder = async (orderData: OrderData) => {
    if (isPacketaProcessing) return; // Prevent duplicate processing
    
    setIsPacketaProcessing(true);
    
    try {
      console.log('Processing Packeta order for order ID:', orderData.id);
      
      // Find user email
      const { data: userData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user?.id)
        .single();
      
      // Ensure shipping_address is properly formatted
      let shippingAddressData = orderData.shipping_address;
      
      // If it's a string, parse it
      if (typeof shippingAddressData === 'string') {
        try {
          shippingAddressData = JSON.parse(shippingAddressData);
          console.log('Parsed shipping address from string:', shippingAddressData);
        } catch (e) {
          console.error('Error parsing shipping address string:', e);
        }
      }
      
      // Manually structure the shipping address for Packeta if needed
      if (!shippingAddressData.type && shippingAddressData.pickupPoint) {
        console.log('Adding type=packeta to shipping address');
        shippingAddressData = {
          ...shippingAddressData,
          type: 'packeta'
        };
      } else if (!shippingAddressData.type) {
        console.log('No pickup point found, trying to create packeta shipping address from existing data');
        // Try to find any pickup point data
        const pickupPointData = findPickupPoint(shippingAddressData);
        
        if (pickupPointData) {
          console.log('Found pickup point data:', pickupPointData);
          shippingAddressData = {
            type: 'packeta',
            pickupPoint: pickupPointData,
            fullName: shippingAddressData.fullName || userData?.email || user?.email || 'Customer',
            phone: shippingAddressData.phone || ''
          };
        } else {
          console.error('Cannot process Packeta order: No pickup point found in shipping address');
          toast({
            title: 'Processing Error',
            description: 'Could not find pickup point information. Please contact support.',
            variant: 'destructive',
          });
          return;
        }
      }
      
      console.log('Final shipping address for Packeta:', shippingAddressData);
      
      const orderPayload = {
        order_id: orderData.id,
        shipping_address: shippingAddressData,
        items: orderData.order_items || [],
        user_id: user?.id,
        email: userData?.email || user?.email,
        payment_method: orderData.payment_intent_id ? 'card' : 'cod'
      };
      
      console.log('Sending order to Packeta with payload:', orderPayload);
      
      const { data, error } = await invokeFunction('create-packeta-order', {
        body: orderPayload
      });
      
      if (error) {
        console.error('Error sending order to Packeta:', error);
        toast({
          title: 'Order Processing',
          description: 'Your order has been received, but there was a delay in shipping processing. Our team will handle it shortly.',
          variant: 'default',
        });
        
        // Update database to mark order as needing manual Packeta processing
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            notes: `Packeta processing failed: ${error}`,
            status: 'processing'
          })
          .eq('id', orderData.id);
          
        if (updateError) {
          console.error('Error updating order status:', updateError);
        }
      } else {
        console.log('Packeta order created:', data);
        
        // Update the order details with tracking information if available
        if (data.packeta_id || data.barcode) {
          setOrderDetails(prev => prev ? {
            ...prev,
            tracking_number: data.barcode || data.packeta_id
          } : null);
          
          // Refresh order data to get the updated tracking number
          const { data: refreshedOrder } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderData.id)
            .single();
            
          if (refreshedOrder && refreshedOrder.tracking_number) {
            setOrderDetails(prev => prev ? {
              ...prev,
              tracking_number: refreshedOrder.tracking_number
            } : null);
          }
        }
        
        toast({
          title: 'Order Processing',
          description: 'Your order has been received and is being prepared for shipping.',
        });
      }
    } catch (err) {
      console.error('Error sending order to Packeta:', err);
      toast({
        title: 'Shipping Processing Error',
        description: 'There was an error processing your shipping information. Our team has been notified.',
        variant: 'destructive',
      });
    } finally {
      setIsPacketaProcessing(false);
    }
  };
  
  // Helper function to find a pickup point in a complex object
  const findPickupPoint = (obj: any): PickupPoint | null => {
    if (!obj) return null;
    
    // If the object itself has id, name, address properties, it might be a pickup point
    if (obj.id && obj.name && (obj.address || obj.street)) {
      return {
        id: obj.id,
        name: obj.name,
        address: obj.address || obj.street,
        zip: obj.zip,
        city: obj.city
      };
    }
    
    // If it has a pickupPoint property
    if (obj.pickupPoint) {
      return obj.pickupPoint;
    }
    
    // Recursively check all object properties
    if (typeof obj === 'object') {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const found = findPickupPoint(obj[key]);
          if (found) return found;
        }
      }
    }
    
    return null;
  };
  
  const handleStripeSession = async (sessionId: string) => {
    try {
      console.log('Processing Stripe session:', sessionId);
      
      // Ensure user is authenticated
      if (!user || !user.id) {
        throw new Error("Authentication required to process your order");
      }
      
      // Verify the session with Stripe
      const { data, error: verifyError } = await invokeFunction('verify-checkout-session', {
        body: { sessionId }
      });
      
      if (verifyError) {
        throw new Error(`Session verification failed: ${verifyError}`);
      }
      
      if (!data?.success) {
        throw new Error('Invalid session data received');
      }
      
      console.log('Session verified:', data);
      
      // Clear the cart after successful payment
      clearCart();
      
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
      
      // Check if this order already exists in our database
      if (data.order_id) {
        // Redirect to the order confirmation page with the order ID
        // Use replace: true to prevent back button from causing an infinite loop
        // Clear the session_id to prevent re-processing
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('session_id');
        currentUrl.searchParams.set('orderId', data.order_id.toString());
        navigate(currentUrl.pathname + currentUrl.search, { replace: true });
      } else {
        // If no order_id was returned, we need to create one
        try {
          console.log('No order_id returned from verification, attempting to create order', {
            session: data.session,
            lineItems: data.lineItems
          });
          
          // Check if we have the necessary data
          if (!user?.id) {
            throw new Error('User not authenticated');
          }
          
          if (!data.session?.payment_intent) {
            console.warn('No payment_intent in session, using session ID as fallback');
          }
          
          // Prepare shipping address data
          let shippingAddress = {};
          if (data.session.metadata?.shipping_address) {
            try {
              shippingAddress = JSON.parse(data.session.metadata.shipping_address);
            } catch (e) {
              console.error('Error parsing shipping address from metadata:', e);
            }
          } else {
            console.warn('No shipping_address in session metadata');
          }
          
          // Create order data
          const orderData = {
            shipping_address: shippingAddress,
            total: data.session.amount_total / 100,
            shipping_method: data.session.metadata?.shipping_method || 'standard',
            status: 'paid',
          };
          
          console.log('Creating order with data:', orderData);
          
          // Create order items from line items
          const orderItems = data.lineItems?.map(item => {
            // Try to extract product_id from metadata
            let product_id = 0;
            try {
              if (item.price?.product?.metadata?.product_id) {
                product_id = parseInt(item.price.product.metadata.product_id);
              }
            } catch (e) {
              console.error('Error parsing product_id:', e);
            }
            
            return {
              product_id,
              product_name: item.description || 'Product',
              product_price: (item.price?.unit_amount || 0) / 100,
              quantity: item.quantity || 1
            };
          }) || [];
          
          console.log('With order items:', orderItems);
          
          // Call create-order function
          const { data: orderResult, error: orderError } = await invokeFunction('create-order', {
            body: {
              order_data: orderData,
              order_items: orderItems,
              user_id: user.id,
              payment_intent_id: data.session.payment_intent || data.session.id
            }
          });
          
          if (orderError) {
            console.error('create-order function error:', orderError);
            throw new Error(`Error creating order: ${orderError}`);
          }
          
          console.log('Order created successfully:', orderResult);
          
          // Redirect to the order confirmation page with the new order ID
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.delete('session_id');
          currentUrl.searchParams.set('orderId', orderResult.order_id.toString());
          navigate(currentUrl.pathname + currentUrl.search, { replace: true });
        } catch (err) {
          console.error('Error creating order from session:', err);
          setError('Could not create order details. Please contact customer support.');
        }
      }
    } catch (err) {
      console.error('Error processing Stripe session:', err);
      setError('There was an error processing your payment. Please contact customer support.');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-8"></div>
            <h1 className="text-2xl font-bold mb-4">Processing Your Order...</h1>
            <p className="text-gray-600">Please wait while we confirm your order details.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <div className="max-w-2xl mx-auto">
          {error ? (
            <div className="text-center mb-8">
              <div className="rounded-full bg-red-100 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4">There Was a Problem</h1>
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button variant="outline" asChild>
                <Link to="/checkout">Return to Checkout</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="rounded-full bg-green-100 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                
                <h1 className="text-3xl font-bold mb-4">Order Successfully Placed!</h1>
                
                <p className="text-gray-600 mb-8">
                  Thank you for your order. We'll send you a confirmation email with your order details.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-medium mb-4">Order Summary</h2>
                
                <div className="space-y-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number</span>
                    <span className="font-medium">#{orderDetails?.id}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date</span>
                    <span>{orderDetails?.date.toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status</span>
                    <span className={`font-medium ${orderDetails?.status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                      {orderDetails?.status === 'paid' ? 'Paid' : 
                       orderDetails?.status === 'processing' ? 'Processing' : 'Pending'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span>{orderDetails?.paymentMethod}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping Method</span>
                    <span className="capitalize">{orderDetails?.shipping_method}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-medium">${orderDetails?.total.toFixed(2)}</span>
                  </div>
                  
                  {orderDetails?.tracking_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking Number</span>
                      <span className="font-medium">{orderDetails.tracking_number}</span>
                    </div>
                  )}
                </div>
                
                {isPacketaProcessing && (
                  <Alert className="mb-4">
                    <AlertDescription>
                      We're processing your shipping information. This may take a moment...
                    </AlertDescription>
                  </Alert>
                )}
                
                {!orderDetails?.tracking_number && orderDetails?.status !== 'pending' && (
                  <div className="mb-4">
                    <Button 
                      onClick={requestTracking}
                      disabled={isTrackingLoading}
                      className="w-full"
                    >
                      {isTrackingLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Truck className="mr-2 h-4 w-4" />
                          Get Tracking Information
                        </span>
                      )}
                    </Button>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-medium mb-2">Shipping Address</h3>
                  {orderDetails?.shipping_address?.type === 'packeta' ? (
                    <>
                      <div className="text-sm">
                        <p className="font-medium">{orderDetails.shipping_address.pickupPoint?.name}</p>
                        <p>{orderDetails.shipping_address.pickupPoint?.address}</p>
                        <p>{orderDetails.shipping_address.pickupPoint?.zip} {orderDetails.shipping_address.pickupPoint?.city}</p>
                      </div>
                      <p className="text-sm mt-2">
                        <span className="font-medium">Recipient:</span> {orderDetails.shipping_address.fullName}
                      </p>
                      {orderDetails.shipping_address.phone && (
                        <p className="text-sm">
                          <span className="font-medium">Phone:</span> {orderDetails.shipping_address.phone}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-sm">
                      <p>{orderDetails?.shipping_address?.fullName}</p>
                      <p>{orderDetails?.shipping_address?.addressLine1}</p>
                      {orderDetails?.shipping_address?.addressLine2 && (
                        <p>{orderDetails.shipping_address.addressLine2}</p>
                      )}
                      <p>
                        {orderDetails?.shipping_address?.city}, {orderDetails?.shipping_address?.state} {orderDetails?.shipping_address?.zipCode}
                      </p>
                      <p>{orderDetails?.shipping_address?.country}</p>
                      {orderDetails?.shipping_address?.phone && (
                        <p className="mt-1">
                          <span className="font-medium">Phone:</span> {orderDetails.shipping_address.phone}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {orderDetails?.items && orderDetails.items.length > 0 && (
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <h3 className="font-medium mb-2">Order Items</h3>
                    <div className="space-y-3">
                      {orderDetails.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.product_name} <span className="text-gray-500">× {item.quantity}</span>
                          </span>
                          <span className="font-medium">${(item.product_price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      Estimated delivery: 3-5 business days
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    You will receive shipping updates via email.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 flex flex-col sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
                <Button asChild>
                  <Link to="/account">View Order History</Link>
                </Button>
                
                <Button variant="outline" asChild>
                  <Link to="/products">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Continue Shopping
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
