import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
// @ts-expect-error - Deno will load this module at runtime
import { Builder, Parser } from "https://esm.sh/xml2js@0.6.2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// Define the Packeta API URL according to their documentation
const PACKETA_API_URL = "https://www.zasilkovna.cz/api/rest";

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

    // Get API credentials from environment variables
    const packetaApiPassword = Deno.env.get('PACKETA_API_PASSWORD')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Packeta API Password available:', !!packetaApiPassword);
    console.log('Supabase credentials available:', !!supabaseUrl && !!supabaseServiceKey);
    
    if (!packetaApiPassword) {
      console.error('Packeta API password is required but not set');
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

    if (!email) {
      console.error('Missing required email for Packeta shipping');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required email',
          details: 'Email is required for Packeta shipping'
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
    
    // 3. Extract pickup point ID and ensure it's valid
    let pickupPointId: string | number | null = null;
    
    if (parsedShippingAddress.type === 'packeta' && parsedShippingAddress.pickupPoint?.id) {
      pickupPointId = parsedShippingAddress.pickupPoint.id;
    } else if (parsedShippingAddress.pickupPoint?.id) {
      pickupPointId = parsedShippingAddress.pickupPoint.id;
    }
    
    if (!pickupPointId) {
      console.error('Missing pickup point ID in shipping address:', parsedShippingAddress);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid pickup point configuration',
          details: 'A valid pickup point ID is required for Packeta shipping'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }
    
    // Ensure numeric ID format
    const numericPointId = parseInt(String(pickupPointId), 10);
    if (isNaN(numericPointId)) {
      console.error('Pickup point ID is not a valid number:', pickupPointId);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid pickup point ID format',
          details: 'The pickup point ID must be a valid number'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }
    
    console.log(`Using pickup point ID: ${numericPointId}`);
    
    // 4. Calculate total value from items or use order total
    const totalValue = items.length > 0
      ? items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0)
      : order.total;
    
    // 5. Get name from shipping address or split into first/last name
    let firstName = '';
    let lastName = '';
    
    if (parsedShippingAddress.fullName) {
      const nameParts = parsedShippingAddress.fullName.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    // Validate required customer information
    if (!firstName || !lastName) {
      console.error('Missing required customer name information:', {
        firstName,
        lastName,
        fullName: parsedShippingAddress.fullName
      });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required customer information',
          details: 'Full name with first and last name is required for Packeta shipping'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }
    
    if (!parsedShippingAddress.phone) {
      console.error('Missing required phone number');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required customer information',
          details: 'Phone number is required for Packeta shipping'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    }
    
    // 6. Create Packeta API request following the documentation format
    const requestBody = {
      createPacket: {
        apiPassword: packetaApiPassword,
        packetAttributes: {
          number: `ORDER-${order_id}`,
          name: firstName,
          surname: lastName,
          email: email,
          phone: parsedShippingAddress.phone || '',
          addressId: numericPointId,
          cod: payment_method === 'cod' ? totalValue : 0,
          value: totalValue,
          currency: "USD",
          weight: 1.0, // Default weight in kg
          eshop: "MyEshop"
        }
      }
    };
    
    console.log('Creating XML payload from:', JSON.stringify(requestBody, null, 2));
    
    // 7. Convert to XML using xml2js
    const xmlBuilder = new Builder({
      rootName: 'createPacket',
      headless: true
    });
    
    try {
      // 8. Send to Packeta API
      console.log(`Sending request to ${PACKETA_API_URL}`);
      
      // Build XML without root wrapper since it's included in the object
      const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>\n${xmlBuilder.buildObject(requestBody.createPacket)}`;
      console.log('XML payload:', xmlPayload);
      
      const response = await fetch(PACKETA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml'
        },
        body: xmlPayload
      });
      
      // Check HTTP status
      if (!response.ok) {
        console.error(`Packeta API returned non-OK status: ${response.status} ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('Packeta API raw response:', responseText);
      
      // 9. Parse the XML response using xml2js
      const xmlParser = new Parser({ explicitArray: false });
      let parsedResponse;
      
      try {
        parsedResponse = await xmlParser.parseStringPromise(responseText);
        console.log('Packeta API parsed response:', JSON.stringify(parsedResponse, null, 2));
      } catch (parseError) {
        console.error('Error parsing Packeta API response XML:', parseError);
        console.error('Raw response that could not be parsed:', responseText);
        throw new Error(`Failed to parse Packeta API response: ${parseError.message}`);
      }
      
      if (!parsedResponse.response || parsedResponse.response.status !== 'ok') {
        const errorMessage = parsedResponse.response?.fault?.message || 
                            parsedResponse.response?.message || 
                            'Unknown Packeta API error';
        throw new Error(`Packeta API error: ${errorMessage}`);
      }
      
      // Make sure we have a valid result with ID and barcode
      if (!parsedResponse.response.result || 
          !parsedResponse.response.result.id) {
        throw new Error('Packeta API returned success but missing required result data');
      }
      
      // 10. Update order with tracking information
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'processing',
          tracking_number: parsedResponse.response.result.barcode || parsedResponse.response.result.id,
          carrier_data: parsedResponse.response,
          notes: 'Order submitted to Packeta successfully'
        })
        .eq('id', order_id);
      
      if (updateError) {
        console.error('Error updating order with tracking info:', updateError);
        return new Response(
          JSON.stringify({ 
            error: 'Database update error',
            details: updateError.message,
            tracking_number: parsedResponse.response.result.barcode || parsedResponse.response.result.id
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
          packeta_id: parsedResponse.response.result.id,
          barcode: parsedResponse.response.result.barcode,
          tracking_number: parsedResponse.response.result.barcode || parsedResponse.response.result.id,
          status: 'processing',
          message: 'Order successfully created in Packeta system'
        }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      )
    } catch (error) {
      console.error('Error calling Packeta API:', error);
      console.error('Error details:', error.message || 'No error details available');
      
      // Still update the order with an error note
      await supabase
        .from('orders')
        .update({
          notes: `Packeta API error: ${error.message || 'Unknown error'}`
        })
        .eq('id', order_id);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create order in Packeta system',
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
    console.error('Stack trace:', error.stack || 'No stack trace available');
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
