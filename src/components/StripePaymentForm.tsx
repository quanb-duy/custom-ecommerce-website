import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseFunctions } from '@/hooks/useSupabaseFunctions';

// Initialize Stripe with the publishable key with fallback
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
console.log('Stripe key available:', !!stripeKey);
const stripePromise = stripeKey 
  ? loadStripe(stripeKey)
  : Promise.resolve(null);

interface StripePaymentFormProps {
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
}

export const StripePaymentForm = ({ amount, onPaymentSuccess, onPaymentError, disabled }: StripePaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { post: invokeFunction } = useSupabaseFunctions();
  
  const handleRedirectToStripe = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Creating Stripe checkout session for amount:', amount);
      
      // Create a checkout session via the server
      const { data, error: sessionError } = await invokeFunction('create-checkout-session', {
        body: {
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          success_url: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/checkout?canceled=true`
        }
      });
      
      if (sessionError) {
        throw new Error(sessionError);
      }
      
      if (!data?.sessionId) {
        throw new Error('No session ID returned from server');
      }
      
      console.log('Created checkout session:', data.sessionId);
      
      // When the customer clicks on the button, redirect them to Checkout.
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }
      
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      });
      
      if (redirectError) {
        throw new Error(redirectError.message || 'Unknown error');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error redirecting to Stripe:', err);
      setError(errorMessage);
      onPaymentError(errorMessage);
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Option for manual payment if Stripe isn't available
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
      
      <div className="p-4 bg-gray-50 rounded-md mb-4">
        <p className="text-sm text-gray-600">
          When you click "Pay with Stripe", you'll be redirected to Stripe's secure checkout page.
        </p>
      </div>
      
      <Button 
        onClick={handleRedirectToStripe}
        disabled={isLoading || disabled || !stripeKey}
        className="w-full"
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
      
      <div className="text-center mt-2">
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
