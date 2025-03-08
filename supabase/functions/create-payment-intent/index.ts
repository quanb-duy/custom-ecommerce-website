
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get API key from Supabase secrets (not environment variables)
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    if (!STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set in Supabase secrets')
      return new Response(
        JSON.stringify({ 
          error: 'Payment service is temporarily unavailable', 
          code: 'missing_api_key'
        }), 
        { 
          status: 503, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { amount, currency = 'usd', payment_method_types = ['card'] } = await req.json()

    if (!amount) {
      return new Response(
        JSON.stringify({ error: 'Amount is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // Create payment intent
    console.log(`Creating payment intent for amount: ${amount} ${currency}`)
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method_types,
        // In production, consider validating more data
      })

      console.log(`Payment intent created: ${paymentIntent.id}`)
      
      return new Response(
        JSON.stringify({ 
          clientSecret: paymentIntent.client_secret,
          id: paymentIntent.id
        }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError)
      return new Response(
        JSON.stringify({ 
          error: 'Payment processing error', 
          details: stripeError.message
        }), 
        { 
          status: 422, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  }
})
