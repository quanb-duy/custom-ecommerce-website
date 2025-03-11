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

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface PacketaPoint {
  id: string;
  name: string;
  address: string;
  zip: string;
  city: string;
}

interface BillingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

interface ShippingAddress {
  // Standard shipping address
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  
  // Packeta specific fields
  type?: 'packeta';
  pickupPoint?: PacketaPoint;
  billingAddress?: BillingAddress;
  
  // For handling deserialization from database
  [key: string]: any;
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
    console.log('OrderConfirmation mounted with params:', { orderId, sessionId, user: !!user });
    
    // If we have a session ID, mark it as processed immediately to prevent infinite loops
    if (sessionId) {
      setSessionProcessed(true);
    }
    
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
    
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      setError(null); // Reset error state at the beginning
      
      try {
        // Try fetching the order from the orderId in URL parameters
        if (orderId) {
          console.log(`Fetching order details for order ID: ${orderId}`);
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
            
            // Parse shipping_address if it's a string
            let shippingAddress = orderData.shipping_address;
            if (typeof shippingAddress === 'string') {
              try {
                shippingAddress = JSON.parse(shippingAddress);
              } catch (e) {
                console.error('Error parsing shipping address:', e);
                shippingAddress = { error: 'Failed to parse shipping address' };
              }
            }
            
            setOrderDetails({
              id: orderData.id,
              status: orderData.status,
              paymentMethod: orderData.payment_intent_id ? 'Card' : 'Cash on Delivery',
              date: new Date(orderData.created_at),
              shipping_method: orderData.shipping_method,
              total: orderData.total,
              shipping_address: shippingAddress as ShippingAddress,
              tracking_number: orderData.tracking_number,
              items: orderData.order_items
            });
            
            // If this is a Packeta order without a tracking number, process it
            if (orderData.shipping_method === 'packeta' && !orderData.tracking_number) {
              await processPacketaOrder({
                id: orderData.id,
                shipping_address: shippingAddress as ShippingAddress,
                shipping_method: orderData.shipping_method,
                payment_intent_id: orderData.payment_intent_id,
                order_items: orderData.order_items
              });
            }
            
            // Clear the cart after successful order fetch
            clearCart();
          }
        }
        // Handle Stripe session
        else if (sessionId && user && !sessionProcessed) {
          console.log(`Processing Stripe session: ${sessionId}`);
          await handleStripeSession(sessionId);
        } 
        // No order info
        else if (!orderId && !sessionId) {
          console.error('No order information provided');
          throw new Error('No order information provided');
        } 
        // Session processed but no order details yet - check for recent orders
        else if (sessionId && sessionProcessed && !orderId && user) {
          console.log('Session was processed, but no order ID yet. Checking for recent orders...');
          
          // Add a small delay to allow the order to be created in the database
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Check for recently created orders for this user
          const { data: recentOrders, error: recentOrdersError } = await supabase
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
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (recentOrdersError) {
            console.error('Error checking recent orders:', recentOrdersError);
          } else if (recentOrders && recentOrders.length > 0) {
            const orderData = recentOrders[0];
            console.log('Found recent order:', orderData);
            
            // Update URL with orderId and remove sessionId for better bookmarking
            const url = new URL(window.location.href);
            url.searchParams.delete('session_id');
            url.searchParams.set('orderId', orderData.id.toString());
            window.history.replaceState({}, '', url.toString());
            
            // Parse shipping_address if it's a string
            let shippingAddress = orderData.shipping_address;
            if (typeof shippingAddress === 'string') {
              try {
                shippingAddress = JSON.parse(shippingAddress);
              } catch (e) {
                console.error('Error parsing shipping address:', e);
                shippingAddress = { error: 'Failed to parse shipping address' };
              }
            }
            
            setOrderDetails({
              id: orderData.id,
              status: orderData.status,
              paymentMethod: orderData.payment_intent_id ? 'Card' : 'Cash on Delivery',
              date: new Date(orderData.created_at),
              shipping_method: orderData.shipping_method,
              total: orderData.total,
              shipping_address: shippingAddress as ShippingAddress,
              tracking_number: orderData.tracking_number,
              items: orderData.order_items
            });
            
            // If this is a Packeta order without a tracking number, process it
            if (orderData.shipping_method === 'packeta' && !orderData.tracking_number) {
              await processPacketaOrder({
                id: orderData.id,
                shipping_address: shippingAddress as ShippingAddress,
                shipping_method: orderData.shipping_method,
                payment_intent_id: orderData.payment_intent_id,
                order_items: orderData.order_items
              });
            }
            
            clearCart();
          } else {
            console.error('No recent orders found after session processing');
            throw new Error('Your payment was successful, but we could not find your order. Please contact customer support.');
          }
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

  const processPacketaOrder = async (orderData: {
    id: number;
    shipping_address: ShippingAddress;
    shipping_method: string;
    payment_intent_id?: string;
    order_items?: OrderItem[];
  }) => {
    setIsPacketaProcessing(true);
    
    try {
      console.log('Processing Packeta order for order ID:', orderData.id);
      
      // Prepare the order data
      let shippingAddress = orderData.shipping_address;
      
      // If shipping_address is a string, parse it
      if (typeof shippingAddress === 'string') {
        try {
          shippingAddress = JSON.parse(shippingAddress);
        } catch (e) {
          console.error('Error parsing shipping address:', e);
        }
      }
      
      // Check if we have all required data
      if (!shippingAddress || (shippingAddress.type === 'packeta' && !shippingAddress.pickupPoint)) {
        console.error('Invalid shipping address data for Packeta:', shippingAddress);
        toast({
          title: 'Order Processing Error',
          description: 'Missing pickup point information. Please contact customer support.',
          variant: 'destructive',
        });
        return;
      }
      
      // Get user email
      let email = user?.email;
      if (!email) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user?.id)
          .single();
          
        email = userData?.email || '';
      }
      
      // Create payload for the function
      const payload = {
        order_id: orderData.id,
        shipping_address: shippingAddress,
        items: orderData.order_items || [],
        user_id: user?.id,
        email: email,
        payment_method: orderData.payment_intent_id ? 'card' : 'cod'
      };
      
      console.log('Sending Packeta order with payload:', payload);
      
      // Call the create-packeta-order function
      const { data, error } = await invokeFunction('create-packeta-order', {
        body: payload
      });
      
      if (error) {
        console.error('Error creating Packeta order:', error);
        toast({
          title: 'Order Processing',
          description: 'Your order has been received, but there was a delay in shipping processing. Our team will handle it shortly.',
          variant: 'default',
        });
      } else {
        console.log('Packeta order created successfully:', data);
        
        // Update the order details
        if (data.packeta_id || data.tracking_number) {
          const trackingNumber = data.tracking_number || data.packeta_id || data.barcode;
          
          // Update the local state
          setOrderDetails(prev => prev ? {
            ...prev,
            tracking_number: trackingNumber
          } : null);
          
          toast({
            title: 'Order Processing',
            description: 'Your order has been received and is being prepared for shipping.',
          });
        }
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
  
  const handleStripeSession = async (sessionId: string) => {
    try {
      console.log('Verifying Stripe session:', sessionId);
      
      // Ensure user is authenticated
      if (!user || !user.id) {
        throw new Error("Authentication required to process your order");
      }
      
      // Verify the session with Stripe
      const { data, error: verifyError } = await invokeFunction('verify-checkout-session', {
        body: { 
          sessionId,
          user_id: user.id
        }
      });
      
      if (verifyError) {
        console.error('Session verification error:', verifyError);
        throw new Error(`Session verification failed: ${verifyError}`);
      }
      
      if (!data?.success) {
        console.error('Invalid session data received:', data);
        throw new Error('Invalid session data received');
      }
      
      console.log('Session verified:', data);
      
      // Clear the cart after successful payment
      clearCart();
      
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
      
      // Check if we have an order ID
      if (data.order_id) {
        console.log(`Order created with ID: ${data.order_id}`);
        
        // Update URL with orderId and remove sessionId
        const url = new URL(window.location.href);
        url.searchParams.delete('session_id');
        url.searchParams.set('orderId', data.order_id.toString());
        
        // Use history.replaceState to update URL without navigation
        window.history.replaceState({}, '', url.toString());
        
        // Add a small delay to ensure the order is saved in the database
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch the order details
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
          .eq('id', data.order_id)
          .single();
          
        if (orderError) {
          console.error('Error fetching order:', orderError);
          // Don't throw an error here, let the component try to find recent orders instead
          // We'll set a flag to indicate that the component should try to recover
          return;
        }
        
        if (orderData) {
          console.log('Order data retrieved:', orderData);
          
          // Parse shipping_address if it's a string
          let shippingAddress = orderData.shipping_address;
          if (typeof shippingAddress === 'string') {
            try {
              shippingAddress = JSON.parse(shippingAddress);
            } catch (e) {
              console.error('Error parsing shipping address:', e);
              shippingAddress = { error: 'Failed to parse shipping address' };
            }
          }
          
          setOrderDetails({
            id: orderData.id,
            status: orderData.status,
            paymentMethod: orderData.payment_intent_id ? 'Card' : 'Cash on Delivery',
            date: new Date(orderData.created_at),
            shipping_method: orderData.shipping_method,
            total: orderData.total,
            shipping_address: shippingAddress as ShippingAddress,
            tracking_number: orderData.tracking_number,
            items: orderData.order_items
          });
          
          // If this is a Packeta order without a tracking number, process it
          if (orderData.shipping_method === 'packeta' && !orderData.tracking_number) {
            await processPacketaOrder({
              id: orderData.id,
              shipping_address: shippingAddress as ShippingAddress,
              shipping_method: orderData.shipping_method,
              payment_intent_id: orderData.payment_intent_id,
              order_items: orderData.order_items
            });
          }
        }
      } else {
        console.error('No order_id in response:', data);
        // Let the component try to recover by finding the most recent order
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
