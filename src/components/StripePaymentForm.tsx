import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseFunctions } from '@/hooks/useSupabaseFunctions';
import { CartItem } from '@/contexts/CartContext';

interface StripePaymentFormProps {
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
  cartItems?: CartItem[]; // Use the proper CartItem type
}

interface CheckoutItem {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  images?: string[];
}

export const StripePaymentForm = ({ 
  amount, 
  onPaymentSuccess, 
  onPaymentError, 
  disabled,
  cartItems = []
}: StripePaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { post: invokeFunction } = useSupabaseFunctions();
  
  const handleStripeCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting Stripe checkout process for amount:', amount);
      
      // Prepare checkout session items from cart items
      const items: CheckoutItem[] = cartItems.map(item => ({
        name: item.product.name,
        description: item.product.description?.substring(0, 100) || '',
        price: item.product.price,
        quantity: item.quantity,
        images: item.product.image ? [item.product.image] : undefined
      }));
      
      // If no cart items, use a fallback item
      if (items.length === 0) {
        items.push({
          name: 'Order Payment',
          description: 'Payment for your order',
          price: amount,
          quantity: 1
        });
      }
      
      // Create a checkout session
      const { data, error: sessionError } = await invokeFunction('create-checkout-session', {
        body: {
          items,
          success_url: `${window.location.origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/checkout?canceled=true`,
          metadata: {
            order_id: new Date().getTime().toString() // We'll replace this with a real order ID later
          }
        }
      });
      
      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw new Error(sessionError);
      }
      
      if (!data?.url) {
        console.error('No checkout URL returned:', data);
        throw new Error('No checkout URL returned from server');
      }
      
      console.log('Redirecting to Stripe checkout:', data.url);
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error with Stripe checkout:', err);
      setError(errorMessage);
      onPaymentError(errorMessage);
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };
  
  // Fallback manual payment option
  const handleManualPayment = () => {
    console.log('Using manual payment option');
    onPaymentSuccess('manual-payment-required');
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="p-4 bg-blue-50 rounded-md mb-4 border border-blue-200">
        <p className="text-sm text-blue-700 font-medium">
          Secure Payment
        </p>
        <p className="text-sm text-blue-600 mt-1">
          You'll be redirected to Stripe's secure payment page to complete your purchase.
        </p>
      </div>
      
      <Button 
        onClick={handleStripeCheckout}
        disabled={isLoading || disabled}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            Processing...
          </div>
        ) : (
          `Pay with Stripe $${amount.toFixed(2)}`
        )}
      </Button>
      
      <div className="text-center mt-4">
        <button 
          onClick={handleManualPayment}
          className="text-gray-500 hover:text-gray-700 text-sm"
          disabled={isLoading || disabled}
        >
          Continue with Order (Manual Payment)
        </button>
      </div>
    </div>
  );
};
