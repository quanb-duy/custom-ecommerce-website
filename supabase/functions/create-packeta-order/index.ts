import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// Define the Packeta API URL according to their documentation
const PACKETA_API_URL = "https://www.zasilkovna.cz/api/rest";

// Simple XML builder function
function buildXML(obj: Record<string, unknown>): string {
  const xml = ['<?xml version="1.0" encoding="utf-8"?>'];
  
  function addToXml(object: any, name: string, indent = ''): void {
    if (object === null || object === undefined) return;
    
    if (typeof object === 'object' && !Array.isArray(object)) {
      xml.push(`${indent}<${name}>`);
      const newIndent = indent + '  ';
      for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          addToXml(object[key], key, newIndent);
        }
      }
      xml.push(`${indent}</${name}>`);
    } else if (Array.isArray(object)) {
      for (const item of object) {
        addToXml(item, name, indent);
      }
    } else {
      xml.push(`${indent}<${name}>${object}</${name}>`);
    }
  }
  
  const rootKey = Object.keys(obj)[0];
  addToXml(obj[rootKey], rootKey);
  
  return xml.join('\n');
}

// Simple XML parser
function parseXMLResponse(xml: string): any {
  const result: any = {};
  
  try {
    // Extract status
    const statusMatch = xml.match(/<status>(.*?)<\/status>/);
    if (statusMatch) {
      result.status = statusMatch[1];
    }
    
    // Extract result elements
    result.result = {};
    
    // Extract ID
    const idMatch = xml.match(/<id>(.*?)<\/id>/);
    if (idMatch) {
      result.result.id = idMatch[1];
    }
    
    // Extract barcode
    const barcodeMatch = xml.match(/<barcode>(.*?)<\/barcode>/);
    if (barcodeMatch) {
      result.result.barcode = barcodeMatch[1];
    }
    
    // Extract error message if present
    const errorMatch = xml.match(/<message>(.*?)<\/message>/);
    if (errorMatch) {
      result.message = errorMatch[1];
    }
    
    return result;
  } catch (e) {
    console.error("Error parsing XML:", e);
    return { status: "error", message: "Failed to parse XML response" };
  }
}

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
    
    // 3. Extract pickup point ID
    let pickupPointId = null;
    
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
    
    console.log(`Using pickup point ID: ${pickupPointId}`);
    
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
          addressId: pickupPointId,
          cod: payment_method === 'cod' ? totalValue : 0,
          value: totalValue,
          currency: "USD",
          weight: 1.0, // Default weight in kg
          eshop: "MyEshop"
        }
      }
    };
    
    console.log('Creating XML payload from:', requestBody);
    
    // 7. Convert to XML
    const xmlPayload = buildXML(requestBody);
    console.log('XML payload:', xmlPayload);
    
    // 8. Send to Packeta API
    try {
      console.log(`Sending request to ${PACKETA_API_URL}`);
      
      const response = await fetch(PACKETA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml'
        },
        body: xmlPayload
      });
      
      const responseText = await response.text();
      console.log('Packeta API response:', responseText);
      
      // 9. Parse the XML response
      const parsedResponse = parseXMLResponse(responseText);
      console.log('Parsed response:', parsedResponse);
      
      if (parsedResponse.status !== 'ok') {
        throw new Error(`Packeta API error: ${parsedResponse.message || 'Unknown error'}`);
      }
      
      // 10. Update order with tracking information
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'processing',
          tracking_number: parsedResponse.result.barcode || parsedResponse.result.id,
          carrier_data: parsedResponse,
          notes: 'Order submitted to Packeta successfully'
        })
        .eq('id', order_id);
      
      if (updateError) {
        console.error('Error updating order with tracking info:', updateError);
        return new Response(
          JSON.stringify({ 
            error: 'Database update error',
            details: updateError.message,
            tracking_number: parsedResponse.result.barcode || parsedResponse.result.id
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
          packeta_id: parsedResponse.result.id,
          barcode: parsedResponse.result.barcode,
          tracking_number: parsedResponse.result.barcode || parsedResponse.result.id,
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
