import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    console.log('Create-order function invoked');
    
    // Handle GET requests differently than POST requests
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({ 
          error: "This endpoint requires a POST request with order details"
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ 
          error: `This endpoint requires a POST request, received: ${req.method}`
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Supabase URL available:', !!supabaseUrl);
    console.log('Supabase Service Key available:', !!supabaseServiceKey);
    
    if (!supabaseUrl) {
      console.error('SUPABASE_URL is required but not set in Supabase secrets');
      return new Response(
        JSON.stringify({ 
          error: 'Service temporarily unavailable', 
          details: 'Missing Supabase URL'
        }), 
        { 
          status: 503, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is required but not set in Supabase secrets')
      return new Response(
        JSON.stringify({ 
          error: 'Service temporarily unavailable', 
          details: 'Missing service role key'
        }), 
        { 
          status: 503, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request data
    let requestData;
    try {
      const bodyText = await req.text();
      
      if (!bodyText || bodyText.trim() === '') {
        return new Response(
          JSON.stringify({ 
            error: 'Empty request body',
            message: 'Please provide order details in the request body'
          }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        )
      }
      
      requestData = JSON.parse(bodyText);
      console.log('Request data successfully parsed:', requestData);
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
      order_data,
      order_items,
      user_id,
      payment_intent_id = null
    } = requestData;

    if (!order_data || !order_items || !user_id) {
      console.error('Missing required fields in request:', {
        has_order_data: !!order_data,
        has_order_items: !!order_items,
        has_user_id: !!user_id,
        received_data: requestData
      });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          missing: {
            order_data: !order_data,
            order_items: !order_items,
            user_id: !user_id
          },
          received: JSON.stringify(requestData)
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    console.log(`Creating order for user: ${user_id}`)
    console.log(`Order items count: ${order_items.length}`)
    console.log(`Payment intent ID: ${payment_intent_id}`)
    console.log('Order data:', order_data)

    // Handle manual payment mode
    const isManualPayment = payment_intent_id === 'manual-payment-required';
    const finalStatus = isManualPayment ? 'pending' : (payment_intent_id ? 'paid' : 'pending');
    
    // Start a transaction to ensure both order and items are created
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        ...order_data,
        user_id,
        payment_intent_id: isManualPayment ? null : payment_intent_id,
        status: finalStatus
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      throw new Error(`Error creating order: ${orderError.message}`)
    }

    console.log(`Order created with ID: ${order.id}`)

    // Insert order items
    const orderItemsWithOrderId = order_items.map(item => ({
      ...item,
      order_id: order.id
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      throw new Error(`Error creating order items: ${itemsError.message}`)
    }

    console.log(`Order items created successfully`)

    // Update product stock
    for (const item of order_items) {
      const { error: stockError } = await supabase.rpc('decrease_product_stock', {
        product_id: item.product_id,
        quantity: item.quantity
      })

      if (stockError) {
        console.error(`Error updating stock for product ${item.product_id}: ${stockError.message}`)
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        order_id: order.id,
        status: finalStatus,
        payment_mode: isManualPayment ? 'manual' : 'online'
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  } catch (error) {
    console.error('Error creating order:', error)
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
