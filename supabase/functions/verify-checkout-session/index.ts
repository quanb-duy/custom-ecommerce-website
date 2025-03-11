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
        expand: ['line_items', 'line_items.data.price.product']
      });

      console.log(`Session status: ${session.status}`);
      console.log(`Payment status: ${session.payment_status}`);
      console.log(`Metadata:`, session.metadata);
      
      // Get line items to return product information
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
      
      let order_id = null;
      
      // Extract shipping details from metadata
      let shipping_address = {};
      try {
        if (session.metadata?.shipping_address) {
          console.log('Raw shipping_address from metadata:', session.metadata.shipping_address);
          
          // Try to parse the shipping address
          try {
            shipping_address = JSON.parse(session.metadata.shipping_address);
            console.log('Successfully parsed shipping address:', shipping_address);
          } catch (parseError) {
            console.error('Error parsing shipping_address JSON:', parseError);
            
            // If it's already an object, use it directly
            if (typeof session.metadata.shipping_address === 'object') {
              shipping_address = session.metadata.shipping_address;
              console.log('Using shipping_address object directly:', shipping_address);
            } else {
              console.error('Failed to parse shipping_address and it is not an object:', 
                typeof session.metadata.shipping_address);
            }
          }
        } else {
          console.warn('No shipping_address found in metadata, using empty object');
        }
      } catch (e) {
        console.error('Error handling shipping_address:', e);
        shipping_address = { error: 'Failed to process shipping address' };
      }
      
      // Log shipping address details for debugging
      if (shipping_address) {
        if (typeof shipping_address === 'object') {
          console.log('Final shipping_address type:', shipping_address.type || 'standard');
          
          if (shipping_address.type === 'packeta' && shipping_address.pickupPoint) {
            console.log('Packeta pickup point found:', shipping_address.pickupPoint);
          }
          
          if (shipping_address.billingAddress) {
            console.log('Billing address found:', shipping_address.billingAddress);
          }
        } else {
          console.error('Unexpected shipping_address type:', typeof shipping_address);
        }
      }
      
      // Get user_id from metadata or from the request
      const user_id = session.metadata?.user_id;
      
      if (!user_id) {
        console.error('No user_id found in session metadata. Full metadata:', session.metadata);
        
        // Get user_id from the request if it's provided
        const requestUserId = requestData.user_id;
        
        if (requestUserId) {
          console.log('Using user_id from request:', requestUserId);
          
          // Continue with the provided user_id
          const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert({
              user_id: requestUserId,
              status: 'paid',
              total: session.amount_total / 100,
              shipping_method: session.metadata?.shipping_method || 'standard',
              shipping_address: shipping_address,
              payment_intent_id: session.payment_intent,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (orderError) {
            console.error('Error creating order:', orderError);
            console.error('Order data attempted:', {
              user_id: requestUserId,
              status: 'paid',
              total: session.amount_total / 100,
              shipping_method: session.metadata?.shipping_method || 'standard',
              shipping_address: shipping_address,
              payment_intent_id: session.payment_intent
            });
            
            return new Response(
              JSON.stringify({ 
                error: 'Failed to create order',
                details: orderError.message
              }), 
              { 
                status: 500, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
              }
            )
          }
          
          order_id = newOrder.id;
          console.log(`Created new order with request user_id: ${order_id}`);
          
          // Create order items
          if (lineItems && lineItems.data.length > 0) {
            const validOrderItems = [];
            
            for (const item of lineItems.data) {
              // Try to extract product_id from metadata
              let product_id = null;
              let product_name = item.description || 'Product';
              
              try {
                if (item.price?.product?.metadata?.product_id) {
                  const parsedId = parseInt(item.price.product.metadata.product_id);
                  if (!isNaN(parsedId) && parsedId > 0) {
                    product_id = parsedId;
                  } else {
                    console.warn(`Invalid product_id value: ${item.price.product.metadata.product_id}`);
                  }
                }
                
                // If no valid product_id, try to find matching product
                if (!product_id) {
                  const { data: products } = await supabase
                    .from('products')
                    .select('id, name')
                    .ilike('name', `%${product_name}%`)
                    .limit(1);
                  
                  if (products && products.length > 0) {
                    product_id = products[0].id;
                    console.log(`Found matching product: ${product_id} for ${product_name}`);
                  } else {
                    console.warn(`Could not find matching product for: ${product_name}`);
                    // Use a default placeholder product ID for testing
                    product_id = 1; // Make sure your database has at least one product with this ID
                  }
                }
                
                validOrderItems.push({
                  order_id,
                  product_id,
                  product_name,
                  product_price: (item.price?.unit_amount || 0) / 100,
                  quantity: item.quantity || 1
                });
              } catch (e) {
                console.error('Error processing order item:', e);
              }
            }
            
            if (validOrderItems.length > 0) {
              console.log(`Adding ${validOrderItems.length} order items`);
              
              const { error: itemsError } = await supabase
                .from('order_items')
                .insert(validOrderItems);
                
              if (itemsError) {
                console.error('Error creating order items:', itemsError);
              } else {
                console.log('Order items created successfully');
              }
            } else {
              console.warn('No valid order items to create');
            }
          }
        } else {
          return new Response(
            JSON.stringify({ 
              error: 'Missing user_id in session metadata',
              details: 'The session does not contain a valid user_id and no user_id was provided in the request'
            }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
      } else {
        // Original code path when user_id is present in metadata
        console.log('Creating order with data:', {
          user_id,
          total: session.amount_total / 100,
          shipping_method: session.metadata?.shipping_method || 'standard',
          shipping_address
        });
        
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
          
          return new Response(
            JSON.stringify({ 
              error: 'Failed to create order',
              details: orderError.message
            }), 
            { 
              status: 500, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          )
        }
        
        order_id = newOrder.id;
        console.log(`Created new order: ${order_id}`);
        
        // Create order items
        if (lineItems && lineItems.data.length > 0) {
          const validOrderItems = [];
          
          for (const item of lineItems.data) {
            // Try to extract product_id from metadata
            let product_id = null;
            let product_name = item.description || 'Product';
            
            try {
              if (item.price?.product?.metadata?.product_id) {
                const parsedId = parseInt(item.price.product.metadata.product_id);
                if (!isNaN(parsedId) && parsedId > 0) {
                  product_id = parsedId;
                } else {
                  console.warn(`Invalid product_id value: ${item.price.product.metadata.product_id}`);
                }
              }
              
              // If no valid product_id, try to find matching product
              if (!product_id) {
                const { data: products } = await supabase
                  .from('products')
                  .select('id, name')
                  .ilike('name', `%${product_name}%`)
                  .limit(1);
                
                if (products && products.length > 0) {
                  product_id = products[0].id;
                  console.log(`Found matching product: ${product_id} for ${product_name}`);
                } else {
                  console.warn(`Could not find matching product for: ${product_name}`);
                  // Use a default placeholder product ID for testing
                  product_id = 1; // Make sure your database has at least one product with this ID
                }
              }
              
              validOrderItems.push({
                order_id,
                product_id,
                product_name,
                product_price: (item.price?.unit_amount || 0) / 100,
                quantity: item.quantity || 1
              });
            } catch (e) {
              console.error('Error processing order item:', e);
            }
          }
          
          if (validOrderItems.length > 0) {
            console.log(`Adding ${validOrderItems.length} order items`);
            
            const { error: itemsError } = await supabase
              .from('order_items')
              .insert(validOrderItems);
              
            if (itemsError) {
              console.error('Error creating order items:', itemsError);
            } else {
              console.log('Order items created successfully');
            }
          } else {
            console.warn('No valid order items to create');
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
            payment_intent: session.payment_intent
          },
          lineItems: lineItems.data
        }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    } catch (error) {
      console.error('Error processing session:', error);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message || 'An error occurred while processing the payment session'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
});
