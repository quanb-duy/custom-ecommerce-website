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
    
    if (!STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set in Supabase secrets')
      return new Response(
        JSON.stringify({ 
          error: 'Service temporarily unavailable', 
          code: 'missing_api_key'
        }), 
        { 
          status: 503, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase credentials are missing')
      return new Response(
        JSON.stringify({ 
          error: 'Service temporarily unavailable', 
          code: 'missing_db_credentials'
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
        expand: ['line_items', 'customer', 'line_items.data.price.product']
      });

      console.log(`Session status: ${session.status}`);
      console.log(`Payment status: ${session.payment_status}`);
      console.log(`Metadata received:`, session.metadata);
      
      // Get line items to return product information
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
      
      let order_id = null;
      
      // Check if an order already exists for this session
      if (session.payment_intent) {
        const { data: existingOrders, error: queryError } = await supabase
          .from('orders')
          .select('id')
          .eq('payment_intent_id', session.payment_intent)
          .limit(1);
        
        if (queryError) {
          console.error('Error querying orders:', queryError);
        } else if (existingOrders && existingOrders.length > 0) {
          order_id = existingOrders[0].id;
          console.log(`Found existing order: ${order_id}`);
        }
      }
      
      // If no order exists and payment is successful, create one
      if (!order_id && session.payment_status === 'paid') {
        try {
          // Extract user_id from metadata
          const user_id = session.metadata?.user_id;
          
          if (!user_id) {
            console.error('No user_id found in session metadata. Full metadata:', session.metadata);
            // Don't try to create an order without a valid user_id
          } else {
            // Validate that user_id looks like a UUID before proceeding
            // Simple UUID format check (not perfect but catches obvious issues)
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidPattern.test(user_id)) {
              console.error(`Invalid user_id format: "${user_id}" - must be a valid UUID`);
            } else {
              // Extract shipping details from metadata
              let shipping_address = {};
              try {
                if (session.metadata?.shipping_address) {
                  shipping_address = JSON.parse(session.metadata.shipping_address);
                } else {
                  console.warn('No shipping_address found in metadata, using empty object');
                }
              } catch (e) {
                console.error('Error parsing shipping_address:', e);
                shipping_address = { error: 'Failed to parse shipping address' };
              }
              
              // Create order in database
              const { data: newOrder, error: orderError } = await supabase
                .from('orders')
                .insert({
                  user_id,
                  status: 'paid',
                  total: session.amount_total / 100,
                  shipping_method: session.metadata?.shipping_method || 'standard',
                  shipping_address,
                  payment_intent_id: session.payment_intent,
                  created_at: new Date().toISOString()
                })
                .select()
                .single();
              
              if (orderError) {
                console.error('Error creating order:', orderError);
                console.error('Order data attempted:', {
                  user_id,
                  status: 'paid',
                  total: session.amount_total / 100,
                  shipping_method: session.metadata?.shipping_method || 'standard',
                  shipping_address,
                  payment_intent_id: session.payment_intent
                });
              } else {
                order_id = newOrder.id;
                console.log(`Created new order: ${order_id}`);
                
                // Create order items
                if (lineItems && lineItems.data.length > 0) {
                  const orderItems = lineItems.data.map(item => {
                    // Try to extract product_id from metadata
                    let product_id = null;
                    try {
                      if (item.price?.product?.metadata?.product_id) {
                        const parsedId = parseInt(item.price.product.metadata.product_id);
                        if (!isNaN(parsedId) && parsedId > 0) {
                          product_id = parsedId;
                        } else {
                          console.warn(`Invalid product_id value: ${item.price.product.metadata.product_id}`);
                        }
                      } else {
                        console.warn('No product_id found in metadata for item:', item.description);
                      }
                    } catch (e) {
                      console.error('Error parsing product_id:', e);
                    }
                    
                    return {
                      order_id,
                      product_id,
                      product_name: item.description || 'Product',
                      product_price: (item.price?.unit_amount || 0) / 100,
                      quantity: item.quantity || 1
                    };
                  }).filter(item => item.product_id !== null);
                  
                  // Only insert items if we have valid product IDs
                  if (orderItems.length > 0) {
                    const { error: itemsError } = await supabase
                      .from('order_items')
                      .insert(orderItems);
                      
                    if (itemsError) {
                      console.error('Error creating order items:', itemsError);
                    } else {
                      console.log(`Created ${orderItems.length} order items for order ${order_id}`);
                    }
                  } else {
                    console.warn('No valid order items to create - all items had invalid product_id values');
                  }
                }
              }
            }
          }
        } catch (orderCreationError) {
          console.error('Error creating order from session:', orderCreationError);
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
            payment_intent: session.payment_intent
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
