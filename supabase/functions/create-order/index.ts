
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://owigcjycsaxmpsthjbrh.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { 
      order_data,
      order_items,
      user_id,
      payment_intent_id = null
    } = await req.json()

    if (!order_data || !order_items || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    console.log(`Creating order for user: ${user_id}`)
    console.log(`Order items count: ${order_items.length}`)

    // Start a transaction to ensure both order and items are created
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        ...order_data,
        user_id,
        payment_intent_id,
        status: payment_intent_id ? 'paid' : 'pending'
      })
      .select()
      .single()

    if (orderError) {
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
        order_id: order.id
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  } catch (error) {
    console.error('Error creating order:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  }
})
