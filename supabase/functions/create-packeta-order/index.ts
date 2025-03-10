
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// Define the Packeta API base URL
const PACKETA_API_BASE_URL = "https://api.packeta.com/v5";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Create-packeta-order function invoked');
    
    // Check HTTP method
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
    
    // Get Packeta API credentials
    const packetaApiKey = Deno.env.get('VITE_PACKETA_API_KEY')
    const packetaApiPassword = Deno.env.get('PACKETA_API_PASSWORD')
    
    console.log('Supabase URL available:', !!supabaseUrl);
    console.log('Supabase Service Key available:', !!supabaseServiceKey);
    console.log('Packeta API Key available:', !!packetaApiKey);
    console.log('Packeta API Password available:', !!packetaApiPassword);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials are required but not set');
      return new Response(
        JSON.stringify({ 
          error: 'Service temporarily unavailable', 
          details: 'Missing database credentials'
        }), 
        { 
          status: 503, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }
    
    if (!packetaApiKey || !packetaApiPassword) {
      console.error('Packeta API credentials are required but not set');
      return new Response(
        JSON.stringify({ 
          error: 'Service temporarily unavailable', 
          details: 'Missing Packeta API credentials'
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
      order_id,
      shipping_address,
      items,
      user_id,
      payment_method = 'card'
    } = requestData;

    if (!order_id || !shipping_address || !items || !user_id) {
      console.error('Missing required fields in request');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required order details',
          received: JSON.stringify(requestData)
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    console.log(`Processing order ${order_id} for user: ${user_id}`);
    console.log(`Order items count: ${items.length}`);

    // 1. Verify the order exists in our database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', user_id)
      .single();

    if (orderError) {
      console.error('Error retrieving order:', orderError);
      return new Response(
        JSON.stringify({ 
          error: 'Order verification failed',
          details: orderError.message
        }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // 2. Prepare Packeta API request payload
    let packetaPayload;
    
    if (shipping_address.type === 'packeta' && shipping_address.pickupPoint) {
      // Handle Packeta pickup point
      packetaPayload = {
        apiKey: packetaApiKey,
        apiPassword: packetaApiPassword,
        number: `ECOM-${order_id}`,
        name: shipping_address.fullName,
        surname: '',
        company: '',
        email: requestData.email || '',
        phone: shipping_address.phone || '',
        addressId: shipping_address.pickupPoint.id,
        currency: 'USD',
        cod: payment_method === 'cod' ? order.total : 0,
        value: order.total,
        weight: 1, // Default weight in kg
        eshop: 'ecommerce-site',
        items: items.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          price: item.product_price
        }))
      };
    } else {
      // Handle home delivery
      packetaPayload = {
        apiKey: packetaApiKey,
        apiPassword: packetaApiPassword,
        number: `ECOM-${order_id}`,
        name: shipping_address.fullName.split(' ')[0] || '',
        surname: shipping_address.fullName.split(' ').slice(1).join(' ') || '',
        company: '',
        email: requestData.email || '',
        phone: shipping_address.phone || '',
        street: shipping_address.addressLine1 || '',
        houseNumber: '',
        city: shipping_address.city || '',
        zip: shipping_address.zipCode || '',
        countryCode: shipping_address.country === 'Czech Republic' ? 'CZ' : 
                   shipping_address.country === 'Slovakia' ? 'SK' : 'CZ',
        currency: 'USD',
        cod: payment_method === 'cod' ? order.total : 0,
        value: order.total,
        weight: 1, // Default weight in kg
        eshop: 'ecommerce-site',
        items: items.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          price: item.product_price
        }))
      };
    }

    console.log('Prepared Packeta payload:', packetaPayload);

    // 3. Send order to Packeta API
    let packetaResponse;
    try {
      const response = await fetch(`${PACKETA_API_BASE_URL}/createPacket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(packetaPayload)
      });
      
      packetaResponse = await response.json();
      console.log('Packeta API response:', packetaResponse);
      
      if (!response.ok) {
        throw new Error(`Packeta API error: ${JSON.stringify(packetaResponse)}`);
      }
    } catch (apiError) {
      console.error('Error calling Packeta API:', apiError);
      
      // Still update our order status, but note the API failure
      await supabase
        .from('orders')
        .update({ 
          status: 'processing',
          notes: `Packeta API error: ${apiError.message}`
        })
        .eq('id', order_id);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create order in Packeta system',
          details: apiError.message,
          order_status: 'processing',
          packeta_status: 'failed'
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // 4. Update order in our database with Packeta tracking information
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'processing',
        tracking_number: packetaResponse.id || `ECOM-${order_id}`,
        carrier_data: packetaResponse
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('Error updating order with tracking info:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        order_id: order_id,
        packeta_id: packetaResponse.id,
        status: 'processing',
        message: 'Order successfully created in Packeta system'
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  } catch (error) {
    console.error('Unexpected error processing order:', error);
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
