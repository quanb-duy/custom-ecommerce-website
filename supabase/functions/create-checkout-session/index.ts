import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0"

// Define interfaces for type safety
interface CartItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  images?: string[];
}

interface CheckoutSessionRequest {
  items: CartItem[];
  success_url: string;
  cancel_url: string;
  metadata: {
    user_id: string;
    shipping_method?: string;
    shipping_address?: string;
    [key: string]: string | undefined;
  };
}

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
    console.log('Create checkout session function invoked');
    
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
      console.log('Request data parsed:', requestData);
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
      items,
      success_url, 
      cancel_url,
      metadata = {}
    } = requestData;

    if (!items || !success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          message: 'items, success_url, and cancel_url are required'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // Create Stripe Checkout Session
    try {
      console.log('Creating checkout session...');
      
      // Ensure metadata contains required fields for order creation
      const enhancedMetadata = {
        ...metadata,
        // Make sure user_id is included
        user_id: metadata.user_id || 'unknown',
        // Include shipping method if provided
        shipping_method: metadata.shipping_method || 'standard',
        // Ensure shipping_address is a string if provided
        shipping_address: metadata.shipping_address ? 
          (typeof metadata.shipping_address === 'string' ? 
            metadata.shipping_address : 
            JSON.stringify(metadata.shipping_address)
          ) : 
          '{}'
      };
      
      console.log('Enhanced metadata:', enhancedMetadata);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: items.map((item: CartItem) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              description: item.description || undefined,
              images: item.images || undefined,
              // Add product_id to metadata for order item creation
              metadata: {
                product_id: item.id || '0'
              }
            },
            unit_amount: Math.round(item.price * 100), // Convert to cents
          },
          quantity: item.quantity || 1,
        })),
        mode: 'payment',
        success_url: success_url,
        cancel_url: cancel_url,
        metadata: enhancedMetadata,
      });

      console.log(`Checkout session created: ${session.id}`);
      console.log(`Checkout URL: ${session.url}`);
      
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
      console.error('Stripe API error:', stripeError);
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
    console.error('Error creating checkout session:', error);
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