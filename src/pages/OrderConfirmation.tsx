
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseFunctions } from '@/hooks/useSupabaseFunctions';
import { OrderSummary } from '@/components/order/OrderSummary';
import { ShippingDetails } from '@/components/order/ShippingDetails';
import { OrderItems } from '@/components/order/OrderItems';
import { Order } from '@/types/supabase-custom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, CheckCircle, Truck, Box, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/contexts/CartContext';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { post: invokeFunction } = useSupabaseFunctions();
  const { clearCart } = useCart();
  
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const orderId = searchParams.get('orderId');
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    // If we have a sessionId from Stripe, we need to verify it and get order details
    if (sessionId) {
      verifyStripeSession(sessionId);
    } 
    // If we have an orderId directly, fetch the order details
    else if (orderId) {
      fetchOrderDetails(parseInt(orderId));
    } 
    // If neither is present, show an error
    else {
      setIsLoading(false);
      setError('No order information provided');
    }
    
    // Make sure to clear the cart when order confirmation is viewed
    clearCart();
  }, [sessionId, orderId]);
  
  const verifyStripeSession = async (session_id: string) => {
    try {
      setIsLoading(true);
      
      const { data, error: functionError } = await invokeFunction('verify-checkout-session', {
        body: {
          sessionId: session_id
        }
      });
      
      if (functionError) {
        throw new Error(functionError);
      }
      
      if (!data?.order_id) {
        throw new Error('No order ID returned from payment verification');
      }
      
      // Now fetch the complete order details
      await fetchOrderDetails(data.order_id);
      
    } catch (err) {
      console.error('Error verifying payment session:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while verifying your payment');
      setIsLoading(false);
      
      toast({
        title: 'Payment Verification Error',
        description: err instanceof Error ? err.message : 'An error occurred while verifying your payment',
        variant: 'destructive',
      });
    }
  };
  
  const fetchOrderDetails = async (id: number) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error('Order not found');
      }
      
      setOrder(data as Order);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching order details');
      setIsLoading(false);
      
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'An error occurred while fetching order details',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error || !order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Order information not available'}
            </AlertDescription>
          </Alert>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/products')}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping
          </Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Thank You for Your Order!</h1>
          <p className="text-gray-600 mt-2">
            Order #{order?.id} has been placed successfully
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Box className="mr-2 h-5 w-5" /> Order Details
                </h2>
                
                <div className="space-y-4">
                  {order && <OrderSummary orderDetails={order} />}
                  <Separator />
                  {order && <ShippingDetails shippingAddress={order.shipping_address} />}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                {order && <OrderItems items={order.items || []} />}
              </CardContent>
            </Card>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/products">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
              <Button asChild className="flex-1">
                <Link to="/account">
                  View Account
                </Link>
              </Button>
            </div>
          </div>
          
          <div>
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Truck className="mr-2 h-5 w-5" /> Shipping Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm">Shipping Method</h3>
                    <p className="capitalize">
                      {order?.shipping_method === 'packeta' 
                        ? 'Packeta Pickup Point' 
                        : `${order?.shipping_method} Shipping`}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-sm">Order Status</h3>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order?.status === 'paid' ? 'bg-green-100 text-green-800' : 
                        order?.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                        order?.status === 'shipped' ? 'bg-purple-100 text-purple-800' : 
                        order?.status === 'delivered' ? 'bg-gray-100 text-gray-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order?.status}
                      </span>
                    </div>
                  </div>
                  
                  {order?.tracking_number && (
                    <div>
                      <h3 className="font-medium text-sm">Tracking Number</h3>
                      <p className="text-gray-600">{order.tracking_number}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
