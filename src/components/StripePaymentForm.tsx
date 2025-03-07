import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Initialize Stripe with the publishable key
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey 
  ? loadStripe(stripeKey) 
  : Promise.resolve(null);

interface PaymentFormProps {
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
}

const PaymentForm = ({ amount, onPaymentSuccess, onPaymentError, disabled }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [stripeInitialized, setStripeInitialized] = useState(true);
  
  useEffect(() => {
    // Check if Stripe is initialized
    if (!stripe) {
      setStripeInitialized(false);
    } else {
      setStripeInitialized(true);
    }
  }, [stripe]);

  // If Stripe isn't initialized and we've confirmed it's not just loading
  if (!stripeInitialized && !loading) {
    return (
      <div className="p-4 border rounded-md bg-white text-center">
        <p className="text-red-500">Payment system currently unavailable</p>
        <Button 
          type="button" 
          className="mt-2"
          variant="outline"
          onClick={() => onPaymentError("Payment system unavailable")}
        >
          Try another payment method
        </Button>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent on the server
      const { data: paymentIntentData, error: paymentIntentError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: { 
            amount: Math.round(amount * 100), // Convert to cents for Stripe
            currency: 'usd'
          },
        }
      );

      if (paymentIntentError) {
        throw new Error(paymentIntentError.message || 'Failed to create payment intent');
      }

      if (!paymentIntentData?.clientSecret) {
        throw new Error('No client secret returned');
      }

      // Confirm the card payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              // You could collect these details in the form if needed
              name: 'Test Customer',
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      if (paymentIntent.status === 'succeeded') {
        toast({
          title: 'Payment successful',
          description: 'Your payment has been processed successfully',
        });
        onPaymentSuccess(paymentIntent.id);
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred during payment');
      onPaymentError(err.message || 'An error occurred during payment');
      toast({
        title: 'Payment failed',
        description: err.message || 'An error occurred during payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-md bg-white">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      
      {error && <div className="text-red-500 text-sm">{error}</div>}
      
      <Button 
        type="submit" 
        disabled={!stripe || loading || disabled} 
        className="w-full"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            Processing...
          </div>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </Button>
    </form>
  );
};

interface StripePaymentFormProps {
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
}

export const StripePaymentForm = ({ amount, onPaymentSuccess, onPaymentError, disabled }: StripePaymentFormProps) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        amount={amount} 
        onPaymentSuccess={onPaymentSuccess} 
        onPaymentError={onPaymentError}
        disabled={disabled}
      />
    </Elements>
  );
};

export default StripePaymentForm;
