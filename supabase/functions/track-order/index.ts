
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user's ID
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Get the request body
    const { order_id } = await req.json()

    if (!order_id) {
      throw new Error('Order ID is required')
    }

    // Verify the order belongs to the user
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !orderData) {
      throw new Error('Order not found or not accessible')
    }

    // If the order already has a tracking number, return it
    if (orderData.tracking_number) {
      return new Response(
        JSON.stringify({
          success: true,
          tracking_number: orderData.tracking_number,
          status: orderData.status
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Mock tracking functionality - in a real scenario, you would call the Packeta API here
    const trackingNumber = `PKT${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`
    
    // Update the order with the tracking number
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ tracking_number: trackingNumber })
      .eq('id', order_id)

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`)
    }

    // Return the tracking number
    return new Response(
      JSON.stringify({
        success: true,
        tracking_number: trackingNumber,
        status: orderData.status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
