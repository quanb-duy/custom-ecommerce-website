import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    console.log('Verify checkout session function invoked');
    
    // Get API key from Supabase secrets
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required environment variables')
      return new Response(
        JSON.stringify({ 
          error: 'Service temporarily unavailable', 
          code: 'missing_config'
        }), 
        { 
          status: 503, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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
            message: 'Please provide session ID in the request body' 
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

    const { sessionId } = requestData;

    if (!sessionId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing session ID',
          message: 'Session ID is required'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // Retrieve the session from Stripe
    try {
      console.log(`Retrieving checkout session: ${sessionId}`);
      
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'customer']
      });

      console.log(`Session status: ${session.status}`);
      console.log(`Payment status: ${session.payment_status}`);
      
      // Get line items to return product information
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
      
      // Check if an order already exists for this session
      const { data: existingOrders, error: queryError } = await supabase
        .from('orders')
        .select('id')
        .eq('payment_intent_id', session.payment_intent)
        .limit(1);
      
      if (queryError) {
        console.error('Error querying orders:', queryError);
      }
      
      let order_id = null;
      
      // If order exists, use it
      if (existingOrders && existingOrders.length > 0) {
        order_id = existingOrders[0].id;
        console.log(`Found existing order: ${order_id}`);
      } 
      // Otherwise create a new order
      else if (session.payment_status === 'paid') {
        // Extract shipping details from session metadata or customer
        const shipping_address = session.metadata?.shipping_address ? 
          JSON.parse(session.metadata.shipping_address) : 
          session.shipping ? session.shipping : {};
        
        // Extract shipping method from metadata
        const shipping_method = session.metadata?.shipping_method || 'standard';
        
        // Calculate total amount in correct format
        const total = session.amount_total / 100;
        
        // Get user_id from metadata or customer object
        const user_id = session.metadata?.user_id || session.customer?.metadata?.user_id;
        
        // Create new order in database
        const { data: newOrder, error: insertError } = await supabase
          .from('orders')
          .insert({
            user_id,
            status: 'paid',
            total,
            shipping_method,
            shipping_address,
            payment_intent_id: session.payment_intent,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();
        
        if (insertError) {
          console.error('Error creating order:', insertError);
        } else if (newOrder) {
          order_id = newOrder.id;
          console.log(`Created new order: ${order_id}`);
          
          // Insert order items
          const orderItems = lineItems.data.map(item => ({
            order_id: order_id,
            product_id: parseInt(item.price?.product?.metadata?.product_id || '0'),
            product_name: item.description || '',
            product_price: (item.price?.unit_amount || 0) / 100,
            quantity: item.quantity || 1
          }));
          
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
            
          if (itemsError) {
            console.error('Error inserting order items:', itemsError);
          }
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          order_id,
          session: {
            id: session.id,
            status: session.status,
            payment_status: session.payment_status,
            amount_total: session.amount_total,
            currency: session.currency,
            customer_email: session.customer_email,
            metadata: session.metadata,
          },
          lineItems: lineItems.data
        }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      
      // Check if this is an invalid session ID error
      if (stripeError.message && stripeError.message.includes('No such checkout.session')) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid session ID', 
            details: 'The provided session ID does not exist or has expired'
          }), 
          { 
            status: 404, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to retrieve session', 
          details: stripeError.message
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }
  } catch (error) {
    console.error('Error verifying checkout session:', error);
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
