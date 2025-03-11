
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseFunctions } from '@/hooks/useSupabaseFunctions';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBag, Check, Truck, AlertCircle } from 'lucide-react';
import { Order, OrderItem } from '@/types/supabase-custom';
import { OrderSummary } from '@/components/order/OrderSummary';
import { ShippingDetails } from '@/components/order/ShippingDetails';
import { OrderItems } from '@/components/order/OrderItems';

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('orderId');
  const { toast } = useToast();
  const { post: invokeFunction } = useSupabaseFunctions();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // If we have a direct order ID, fetch that order
        if (orderId) {
          console.log('Fetching order by ID:', orderId);
          await getOrderById(Number(orderId));
          return;
        }
        
        // If we have a session ID from Stripe, we need to verify it and get/create the order
        if (sessionId) {
          console.log('Processing Stripe session:', sessionId);
          await processStripeSession(sessionId);
          return;
        }
        
        // If we don't have either, show an error
        console.error('No order information provided');
        throw new Error('No order information provided');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error loading order details:', err);
        setError(errorMessage);
        toast({
          title: 'Error',
          description: `Could not load order details: ${errorMessage}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [sessionId, orderId, user, toast, invokeFunction]);

  const getOrderById = async (id: number) => {
    try {
      // Get the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();
        
      if (orderError) {
        throw new Error(`Order not found: ${orderError.message}`);
      }
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      console.log('Order found:', order);
      
      // Get the order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);
        
      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
      }
      
      console.log('Order items:', items);
      
      setOrderDetails(order as Order);
      setOrderItems(items || []);
      
    } catch (err) {
      throw err;
    }
  };

  const processStripeSession = async (sessionId: string) => {
    try {
      // Verify the Stripe session
      const { data, error } = await invokeFunction('verify-checkout-session', {
        body: { session_id: sessionId }
      });
      
      if (error) {
        console.error('Session verification error:', error);
        throw new Error(`Session verification failed: ${error}`);
      }
      
      console.log('Session verified:', data);
      
      // Check if the session already created an order
      if (data.session?.metadata?.order_id) {
        const orderId = Number(data.session.metadata.order_id);
        
        // First check if the order already exists in our database
        const { data: existingOrder, error: existingError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
          
        if (!existingError && existingOrder) {
          console.log('Order already exists, fetching details:', orderId);
          await getOrderById(orderId);
          return;
        }
      }
      
      // If the order doesn't exist, create it
      const sessionData = data.session;
      const lineItems = data.lineItems || [];
      
      if (!sessionData?.metadata) {
        throw new Error('Missing metadata in session');
      }
      
      // Extract order information from session metadata
      const { user_id, shipping_method, shipping_address: shippingAddressStr } = sessionData.metadata;
      
      let shippingAddress;
      try {
        shippingAddress = JSON.parse(shippingAddressStr);
      } catch (e) {
        console.error('Error parsing shipping address:', e);
        throw new Error('Invalid shipping address format');
      }
      
      // Prepare order data
      const orderData = {
        shipping_address: shippingAddress,
        total: sessionData.amount_total / 100, // Convert cents to dollars
        shipping_method: shipping_method || 'standard',
        payment_status: sessionData.payment_status,
      };
      
      // Prepare order items
      const orderItems = lineItems.map((item: any) => ({
        product_id: parseInt(item.price?.product?.metadata?.product_id) || null,
        product_name: item.description || 'Product',
        product_price: (item.price?.unit_amount || 0) / 100, // Convert cents to dollars
        quantity: item.quantity || 1
      }));
      
      // Create the order
      console.log('Creating order with data:', {
        orderData,
        orderItems,
        user_id,
        payment_intent_id: sessionData.payment_intent
      });
      
      const { data: orderResponse, error: orderError } = await invokeFunction('create-order', {
        body: {
          order_data: orderData,
          order_items: orderItems,
          user_id: user_id || user?.id,
          payment_intent_id: sessionData.payment_intent
        }
      });
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        throw new Error(`Failed to create order: ${orderError}`);
      }
      
      console.log('Order created successfully:', orderResponse);
      
      // Fetch the complete order details
      if (orderResponse.order_id) {
        await getOrderById(Number(orderResponse.order_id));
      } else {
        throw new Error('No order ID returned from order creation');
      }
      
    } catch (err) {
      throw err;
    }
  };

  const requestTracking = async () => {
    if (!orderDetails) return;
    
    setIsTrackingLoading(true);
    try {
      const { data, error } = await invokeFunction('track-order', {
        body: { order_id: orderDetails.id }
      });
      
      if (error) {
        throw new Error(`Error requesting tracking: ${error}`);
      }
      
      if (data.tracking_number) {
        setOrderDetails(prev => prev ? { ...prev, tracking_number: data.tracking_number } : null);
        toast({
          title: 'Tracking Information',
          description: `Tracking number: ${data.tracking_number}`,
        });
      } else {
        toast({
          title: 'Tracking Not Available',
          description: 'Tracking information is not available yet. Please check back later.',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsTrackingLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-3 text-lg">Loading order details...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="text-center">
            <Button asChild variant="outline">
              <a href="/products">Continue Shopping</a>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!orderDetails) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Order Found</AlertTitle>
            <AlertDescription>We couldn't find the order you're looking for.</AlertDescription>
          </Alert>
          
          <div className="text-center">
            <Button asChild variant="outline">
              <a href="/products">Continue Shopping</a>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Order Confirmed!</h1>
            <p className="text-gray-600 mt-2">
              Thank you for your purchase. Your order has been received.
            </p>
          </div>
          
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium">Order #{orderDetails.id}</h2>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(orderDetails.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {orderDetails.status}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <OrderItems items={orderItems} />
              
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <h2 className="text-lg font-medium mb-4">Order Status</h2>
                  
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="h-8 w-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-medium">Order Confirmed</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(orderDetails.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className={`h-8 w-8 ${
                        orderDetails.status === 'processing' || orderDetails.status === 'shipped' || orderDetails.status === 'delivered'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      } rounded-full flex items-center justify-center mr-3`}>
                        {orderDetails.status === 'processing' || orderDetails.status === 'shipped' || orderDetails.status === 'delivered' 
                          ? <Check className="h-4 w-4" /> 
                          : <span className="text-xs">2</span>
                        }
                      </div>
                      <div>
                        <h3 className={
                          orderDetails.status === 'processing' || orderDetails.status === 'shipped' || orderDetails.status === 'delivered'
                            ? 'font-medium'
                            : 'font-medium text-gray-400'
                        }>Processing</h3>
                        <p className="text-sm text-gray-500">
                          {orderDetails.status === 'processing' || orderDetails.status === 'shipped' || orderDetails.status === 'delivered'
                            ? 'Your order is being processed'
                            : 'Pending'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className={`h-8 w-8 ${
                        orderDetails.status === 'shipped' || orderDetails.status === 'delivered'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      } rounded-full flex items-center justify-center mr-3`}>
                        {orderDetails.status === 'shipped' || orderDetails.status === 'delivered'
                          ? <Check className="h-4 w-4" /> 
                          : <span className="text-xs">3</span>
                        }
                      </div>
                      <div>
                        <h3 className={
                          orderDetails.status === 'shipped' || orderDetails.status === 'delivered'
                            ? 'font-medium'
                            : 'font-medium text-gray-400'
                        }>Shipped</h3>
                        <p className="text-sm text-gray-500">
                          {orderDetails.status === 'shipped' || orderDetails.status === 'delivered'
                            ? `Tracking number: ${orderDetails.tracking_number || 'Pending'}`
                            : 'Your order will be shipped soon'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className={`h-8 w-8 ${
                        orderDetails.status === 'delivered'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      } rounded-full flex items-center justify-center mr-3`}>
                        {orderDetails.status === 'delivered'
                          ? <Check className="h-4 w-4" /> 
                          : <span className="text-xs">4</span>
                        }
                      </div>
                      <div>
                        <h3 className={
                          orderDetails.status === 'delivered'
                            ? 'font-medium'
                            : 'font-medium text-gray-400'
                        }>Delivered</h3>
                        <p className="text-sm text-gray-500">
                          {orderDetails.status === 'delivered'
                            ? 'Your order has been delivered'
                            : 'Your order will be delivered soon'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <OrderSummary 
                orderDetails={orderDetails} 
                isTrackingLoading={isTrackingLoading}
                onRequestTracking={requestTracking}
              />
              <ShippingDetails shippingAddress={orderDetails.shipping_address} />
              
              <div className="text-center mt-6">
                <Button asChild variant="outline" className="w-full">
                  <a href="/products">Continue Shopping</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
