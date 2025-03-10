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

interface OrderDetails {
  orderId: string;
  paymentStatus: string;
  paymentMethod: string;
  date?: Date;
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
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  
  // Handle Stripe checkout session completion
  useEffect(() => {
    const handleStripeSession = async () => {
      if (sessionId) {
        setIsLoading(true);
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
          
          // Clear the cart after successful payment
          clearCart();
          
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully.",
          });
          
          // Create an order based on the verified session
          if (data.session.payment_status === 'paid') {
            // Here you would typically create an order in your database
            // based on the session data and line items
            
            const stripeOrderId = `STRIPE-${data.session.id.substring(0, 8)}`;
            setOrderDetails({
              orderId: stripeOrderId,
              paymentStatus: 'Completed',
              paymentMethod: 'Stripe (Credit Card)',
              date: new Date()
            });
            
            // Optional: Create a permanent order record in your database
            // const { data: orderData, error: orderError } = await invokeFunction('create-order', {
            //   body: {
            //     order_data: {
            //       total: data.session.amount_total / 100,
            //       payment_status: 'paid',
            //       shipping_method: 'standard',
            //     },
            //     // Additional order details
            //     // ...
            //   }
            // });
          } else {
            throw new Error(`Payment not completed: ${data.session.payment_status}`);
          }
        } catch (err) {
          console.error('Error processing Stripe session:', err);
          setError('There was an error processing your payment. Please contact customer support.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    handleStripeSession();
  }, [sessionId, clearCart, toast, invokeFunction]);
  
  // Generate random order number if not provided
  const orderNumber = orderDetails?.orderId || orderId || Math.floor(Math.random() * 10000);
  
  // Estimate delivery dates
  const now = new Date();
  const estimatedDeliveryStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const estimatedDeliveryEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  
  // Redirect to home if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 pt-24">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-8"></div>
            <h1 className="text-2xl font-bold mb-4">Processing Your Order...</h1>
            <p className="text-gray-600">Please wait while we process your payment and confirm your order.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 pt-24">
        <div className="max-w-2xl mx-auto text-center">
          {error ? (
            <div className="mb-8">
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
              <div className="rounded-full bg-green-100 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold mb-4">Order Successfully Placed!</h1>
              
              <p className="text-gray-600 mb-8">
                Thank you for your order. We'll send you a confirmation email with your order details.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 text-left mb-8">
                <h2 className="text-lg font-medium mb-4">Order Summary</h2>
                
                <div className="space-y-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number</span>
                    <span className="font-medium">#{orderNumber}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date</span>
                    <span>{now.toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status</span>
                    <span className={`font-medium ${sessionId ? 'text-green-600' : 'text-orange-500'}`}>
                      {sessionId ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  
                  {sessionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method</span>
                      <span>Stripe</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-medium mb-2">Estimated Delivery</h3>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span>
                      {estimatedDeliveryStart.toLocaleDateString()} - {estimatedDeliveryEnd.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    You will receive shipping updates via email.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Button asChild size="lg">
                  <Link to="/account">View Order History</Link>
                </Button>
                
                <div>
                  <Button variant="outline" asChild>
                    <Link to="/products">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Continue Shopping
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
