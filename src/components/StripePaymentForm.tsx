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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseFunctions } from '@/hooks/useSupabaseFunctions';

// Initialize Stripe with the publishable key with fallback
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
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
  const { post: invokeFunction } = useSupabaseFunctions();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet or missing API key
      setError('Stripe payment system is not available at the moment');
      onPaymentError('Stripe payment system is not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent on the server
      const { data: paymentIntentData, error: paymentIntentError } = await invokeFunction(
        'create-payment-intent',
        {
          body: { 
            amount: Math.round(amount * 100), // Convert to cents for Stripe
            currency: 'usd'
          }
        }
      );

      if (paymentIntentError) {
        console.error('Error creating payment intent:', paymentIntentError);
        throw new Error(typeof paymentIntentError === 'string' ? paymentIntentError : 'Failed to create payment intent');
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Payment error:', err);
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!stripe && (
        <Alert variant="destructive">
          <AlertDescription>
            Stripe payment system is not available. Please try again later or contact support.
          </AlertDescription>
        </Alert>
      )}
      
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
  const [stripeReady, setStripeReady] = useState(false);
  
  useEffect(() => {
    // Check if Stripe is available
    stripePromise.then(stripe => {
      setStripeReady(!!stripe);
    });
  }, []);
  
  if (!stripeReady) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            Payment system is currently unavailable. You can continue with your order and we'll contact you for payment details.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => onPaymentSuccess('manual-payment-required')}
          className="w-full"
        >
          Continue with Order (Manual Payment)
        </Button>
      </div>
    );
  }
  
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
