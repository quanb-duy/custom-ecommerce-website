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
import type { Json } from '@/integrations/supabase/types';

interface PickupPoint {
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

interface LineItem {
  id: string;
  price?: {
    unit_amount?: number;
    product?: {
      metadata?: {
        product_id?: string;
      };
    };
  };
  description?: string;
  quantity?: number;
}

// Convert ShippingAddress to Json format for database
const toJsonFormat = (address: ShippingAddress): Json => {
  return address as unknown as Json;
};

// Convert from Json to ShippingAddress
const fromJsonFormat = (json: Json): ShippingAddress => {
  // If json is a string, try to parse it
  if (typeof json === 'string') {
    try {
      return JSON.parse(json) as ShippingAddress;
    } catch {
      return { fullName: '', type: 'standard' };
    }
  }
  // If it's already an object, try to use it directly
  return json as unknown as ShippingAddress;
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
    if (!user && !orderId && !sessionId) {
      navigate('/');
      return;
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
            setOrderDetails({
              id: orderData.id,
              status: orderData.status,
              paymentMethod: orderData.payment_intent_id ? 'Card' : 'Cash on Delivery',
              date: new Date(orderData.created_at),
              shipping_method: orderData.shipping_method,
              total: orderData.total,
              shipping_address: fromJsonFormat(orderData.shipping_address),
              tracking_number: orderData.tracking_number,
              items: orderData.order_items
            });
            
            // If order status is 'pending' or 'paid', send to Packeta
            if ((orderData.status === 'pending' || orderData.status === 'paid') && 
                !orderData.tracking_number) {
              processPacketaOrder(orderData);
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

  const processPacketaOrder = async (orderData: {
    id: number;
    shipping_address: Json;
    order_items: OrderItem[];
    payment_intent_id?: string;
  }) => {
    setIsPacketaProcessing(true);
    
    try {
      // Find user email
      const { data: userData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user?.id)
        .single();
      
      const orderPayload = {
        order_id: orderData.id,
        shipping_address: orderData.shipping_address,
        items: orderData.order_items,
        user_id: user?.id,
        email: userData?.email || user?.email,
        payment_method: orderData.payment_intent_id ? 'card' : 'cod'
      };
      
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
      } else {
        console.log('Packeta order created:', data);
        toast({
          title: 'Order Processing',
          description: 'Your order has been received and is being prepared for shipping.',
        });
      }
    } catch (err) {
      console.error('Error sending order to Packeta:', err);
    } finally {
      setIsPacketaProcessing(false);
    }
  };
  
  const handleStripeSession = async (sessionId: string) => {
    try {
      console.log('Processing Stripe session:', sessionId);
      
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
      
      // Set flag to prevent infinite loop
      setSessionProcessed(true);
      
      // Clear the cart after successful payment
      clearCart();
      
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
      
      // Check if this order already exists in our database
      if (data.order_id) {
        // If we have an order_id from the API, redirect to the order page with the order ID
        navigate(`/order-confirmation?orderId=${data.order_id}`, { replace: true });
        return; // Exit the function early since we're redirecting
      } else {
        // For older sessions without order_id reference, create a minimal order object
        try {
          // Parse shipping data if available or create empty object
          const shippingAddress: ShippingAddress = data.session.shipping ? {
            fullName: data.session.shipping.name || '',
            addressLine1: data.session.shipping.address?.line1 || '',
            addressLine2: data.session.shipping.address?.line2 || '',
            city: data.session.shipping.address?.city || '',
            state: data.session.shipping.address?.state || '',
            zipCode: data.session.shipping.address?.postal_code || '',
            country: data.session.shipping.address?.country || '',
            type: 'standard'
          } : {
            fullName: '',
            type: 'standard'
          };
          
          // Create an order in the database using session data
          const orderPayload = {
            status: 'paid',
            payment_intent_id: data.session.id,
            total: data.session.amount_total / 100,
            shipping_method: 'standard',
            shipping_address: toJsonFormat(shippingAddress),
            user_id: user?.id,
            // Handle order items separately since they go into a different table
            // We'll extract this to insert after the order is created
          };
          
          // Create the order
          const { data: createdOrder, error } = await supabase
            .from('orders')
            .insert(orderPayload)
            .select('id')
            .single();
            
          if (error) {
            console.error('Error creating order from session:', error);
            throw new Error('Could not create order from session data');
          }
          
          if (createdOrder?.id) {
            // Insert order items if we have line items
            if (data.lineItems && data.lineItems.length > 0) {
              const orderItems = data.lineItems.map((item: LineItem) => ({
                order_id: createdOrder.id,
                product_id: parseInt(item.price?.product?.metadata?.product_id || '0'),
                product_name: item.description || '',
                product_price: (item.price?.unit_amount || 0) / 100,
                quantity: item.quantity || 1
              }));
              
              // Insert the order items
              const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);
                
              if (itemsError) {
                console.error('Error inserting order items:', itemsError);
              }
            }
            
            // Redirect to the order confirmation page with the new order ID
            navigate(`/order-confirmation?orderId=${createdOrder.id}`, { replace: true });
            return;
          }
        } catch (err) {
          console.error('Error creating order:', err);
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
