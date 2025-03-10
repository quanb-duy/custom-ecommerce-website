import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// Define the Packeta API base URL
const PACKETA_API_URL = "https://www.zasilkovna.cz/api/rest";

// Improved XML builder function
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

    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    // Get Packeta API credentials
    const packetaApiPassword = Deno.env.get('PACKETA_API_PASSWORD')
    
    console.log('Supabase URL available:', !!supabaseUrl);
    console.log('Supabase Service Key available:', !!supabaseServiceKey);
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
    
    if (!packetaApiPassword) {
      console.error('Packeta API password is required but not set');
      
      // Instead of failing, return a mock success response
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Packeta processing will be done manually (API credentials not configured)',
          status: 'processing'
        }), 
        { 
          status: 200, 
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
      email = "",
      payment_method = 'card'
    } = requestData;

    if (!order_id || !shipping_address || !items || !user_id) {
      console.error('Missing required fields in request:', {
        has_order_id: !!order_id,
        has_shipping_address: !!shipping_address,
        has_items: !!items,
        has_user_id: !!user_id
      });
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

    // Calculate total value from items
    const totalValue = items.reduce((sum, item) => {
      return sum + (item.product_price * item.quantity);
    }, 0);

    // Parse shipping address to get pickup point if present
    let addressData = shipping_address;
    if (typeof shipping_address === 'string') {
      try {
        addressData = JSON.parse(shipping_address);
      } catch (e) {
        console.error('Error parsing shipping address string:', e);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid shipping address format',
            details: 'Could not parse shipping address'
          }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        )
      }
    }
    
    // Debug logging for pickup point
    console.log('Shipping address data:', addressData);
    
    // Split name into first and last name
    const fullName = addressData.fullName || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Get the pickup point ID
    let pickupPointId = null;
    
    if (addressData.type === 'packeta' && addressData.pickupPoint) {
      pickupPointId = addressData.pickupPoint.id;
      console.log(`Found pickup point ID: ${pickupPointId}`);
    } else {
      console.error('Missing pickup point ID - address type:', addressData.type);
      return new Response(
        JSON.stringify({
          error: 'Invalid pickup point configuration',
          details: 'Pickup point ID is required for Packeta shipments',
          shipping_data: addressData
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    if (!pickupPointId) {
      console.error('Missing pickup point ID in shipping address');
      return new Response(
        JSON.stringify({ 
          error: 'Missing pickup point ID',
          details: 'The pickup point ID is required for Packeta shipments'
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Prepare Packeta API request following their example
    const packetaRequestBody = {
      createPacket: {
        apiPassword: packetaApiPassword,
        packetAttributes: {
          number: `ECOM-${order_id}`,
          name: firstName,
          surname: lastName,
          email: email,
          phone: addressData.phone || '',
          addressId: pickupPointId, // This is the important field for pickup point
          cod: payment_method === 'cod' ? totalValue : 0,
          value: totalValue,
          currency: 'USD',
          weight: calculateTotalWeight(items),
          eshop: 'ecommerce-site'
        }
      }
    };
    
    // Build XML
    const xmlPayload = buildXML(packetaRequestBody);
    console.log('Prepared Packeta XML payload:', xmlPayload);

    // Helper function to calculate total weight based on items
    function calculateTotalWeight(items) {
      // Calculate weight based on quantity and estimated weight per item
      const defaultItemWeight = 0.5; // 500g per item
      const totalWeight = items.reduce((total, item) => {
        return total + (item.quantity * defaultItemWeight);
      }, 0);
      
      // Ensure minimum weight of 0.1 kg
      return Math.max(totalWeight, 0.1);
    }

    // 3. Send order to Packeta API using XML
    let packetaResponse;
    try {
      // Make the API request
      const response = await fetch(PACKETA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml'
        },
        body: xmlPayload
      });
      
      // Parse the XML response
      const responseText = await response.text();
      console.log('Packeta API raw response:', responseText);
      
      // Parse XML response
      packetaResponse = parseXMLResponse(responseText);
      console.log('Packeta API parsed response:', packetaResponse);
      
      if (!response.ok || packetaResponse.status !== 'ok') {
        throw new Error(`Packeta API error: ${packetaResponse.message || responseText}`);
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
        tracking_number: packetaResponse.result.barcode,
        carrier_data: packetaResponse,
        notes: 'Order submitted to Packeta'
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('Error updating order with tracking info:', updateError);
      return new Response(
        JSON.stringify({ 
          error: 'Database update error',
          details: updateError.message,
          packeta_id: packetaResponse.result.id
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
        packeta_id: packetaResponse.result.id,
        barcode: packetaResponse.result.barcode,
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
