import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Define interfaces for type safety
interface PacketaPoint {
  id: string;
  name: string;
  address?: string;
  zip?: string;
  city?: string;
  [key: string]: string | number | boolean | undefined; // For any additional properties
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
    console.log('Create-packeta-order function invoked - Collecting data for manual processing');
    
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
    
    console.log('Supabase credentials available:', !!supabaseUrl && !!supabaseServiceKey);
    
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request data
    let requestData;
    try {
      const bodyText = await req.text();
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
      order_id,
      shipping_address,
      items = [],
      user_id,
      email = '',
      payment_method = 'card'
    } = requestData;

    if (!order_id || !shipping_address || !user_id) {
      console.error('Missing required fields in request:', {
        has_order_id: !!order_id,
        has_shipping_address: !!shipping_address,
        has_user_id: !!user_id
      });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required order details'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }

    // 1. Verify the order exists in our database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
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

    console.log('Order found:', order);

    // 2. Parse shipping address if it's a string
    let parsedShippingAddress = shipping_address;
    if (typeof shipping_address === 'string') {
      try {
        parsedShippingAddress = JSON.parse(shipping_address);
      } catch (e) {
        console.error('Error parsing shipping address string:', e);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid shipping address format',
            details: 'Could not parse shipping address string'
          }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        )
      }
    }
    
    console.log('Parsed shipping address:', parsedShippingAddress);
    
    // 3. Extract pickup point ID and info for manual processing
    let pickupPointInfo: PacketaPoint | null = null;
    let customerInfo = {};
    
    if (parsedShippingAddress.type === 'packeta' && parsedShippingAddress.pickupPoint) {
      pickupPointInfo = parsedShippingAddress.pickupPoint as PacketaPoint;
      
      // Get customer name and phone
      if (parsedShippingAddress.fullName) {
        const nameParts = parsedShippingAddress.fullName.split(' ');
        customerInfo = {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          fullName: parsedShippingAddress.fullName,
          phone: parsedShippingAddress.phone || '',
          email: email || ''
        };
      }
    }
    
    if (!pickupPointInfo) {
      console.error('Missing pickup point info in shipping address:', parsedShippingAddress);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid pickup point configuration',
          details: 'Pickup point information is required for Packeta shipping'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }
    
    console.log('Using pickup point:', pickupPointInfo);
    
    // Calculate total from items
    const totalValue = items.length > 0
      ? items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0)
      : order.total;
    
    try {
      // Prepare packeta data for manual processing
      const packetaData = {
        pickupPoint: pickupPointInfo,
        customer: customerInfo,
        orderNumber: `ORDER-${order_id}`,
        orderValue: totalValue,
        isCashOnDelivery: payment_method === 'cod',
        items: items.map(item => ({
          name: item.product_name || 'Product',
          quantity: item.quantity,
          price: item.product_price
        }))
      };
      
      // Update order with packeta info for manual processing
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'processing',
          shipping_method: 'packeta',
          packeta_data: packetaData,
          notes: 'Order ready for manual Packeta label creation'
        })
        .eq('id', order_id);
      
      if (updateError) {
        console.error('Error updating order with Packeta info:', updateError);
        return new Response(
          JSON.stringify({ 
            error: 'Database update error',
            details: updateError.message
          }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          order_id: order_id,
          pickup_point: pickupPointInfo.name,
          status: 'processing',
          message: 'Order saved for manual Packeta label creation'
        }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    } catch (error) {
      console.error('Error processing Packeta order:', error);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to process Packeta order',
          details: error.message || 'Unknown error'
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
        error: 'An unexpected error occurred',
        details: error.message || 'Unknown error'
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  }
});
