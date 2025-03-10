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
    // Handle GET requests differently than POST requests
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({ 
          error: "This endpoint requires a POST request with checkout details"
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // Get API key from Supabase secrets
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

    // Parse the request body
    let requestData;
    try {
      const bodyText = await req.text();
      
      if (!bodyText || bodyText.trim() === '') {
        return new Response(
          JSON.stringify({ 
            error: 'Empty request body', 
            message: 'Please provide checkout details in the request body' 
          }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        )
      }
      
      requestData = JSON.parse(bodyText);
      console.log('Request data successfully parsed');
    } catch (parseError) {
      console.error('JSON parsing error:', parseError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON format in request body',
          details: parseError.message
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    const { 
      amount, 
      currency = 'usd', 
      success_url, 
      cancel_url 
    } = requestData;

    if (!amount || !success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          message: 'amount, success_url, and cancel_url are required'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // Create Stripe Checkout Session
    try {
      console.log(`Creating checkout session for amount: ${amount} ${currency}`)
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: 'Order Payment',
                description: 'Payment for your order',
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: success_url,
        cancel_url: cancel_url,
      });

      console.log(`Checkout session created: ${session.id}`)
      
      return new Response(
        JSON.stringify({ 
          success: true,
          sessionId: session.id,
          url: session.url
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
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        type: error.name || 'UnknownError' 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  }
}) 