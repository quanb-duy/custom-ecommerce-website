const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

async function testSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || "https://owigcjycsaxmpsthjbrh.supabase.co";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  console.log('Testing Supabase connection...');
  
  if (!supabaseKey) {
    console.error('❌ Supabase key not found in environment variables');
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('products').select('id').limit(1);
    
    if (error) {
      console.error('❌ Supabase error:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase error:', error);
    return false;
  }
}

async function testStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  console.log('Testing Stripe connection...');
  
  if (!stripeSecretKey) {
    console.error('❌ Stripe secret key not found in environment variables');
    return false;
  }
  
  if (!stripePublishableKey) {
    console.warn('⚠️ Stripe publishable key not found in environment variables (needed for frontend)');
  } else {
    console.log('✅ Stripe publishable key found');
  }
  
  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    
    // Simple test to check if the API key is valid
    const paymentMethods = await stripe.paymentMethods.list({
      limit: 1,
    });
    
    console.log('✅ Stripe connection successful');
    return true;
  } catch (error) {
    console.error('❌ Stripe error:', error);
    return false;
  }
}

async function testPacketa() {
  const packetaApiKey = process.env.PACKETA_API_KEY || process.env.VITE_PACKETA_API_KEY;
  
  console.log('Testing Packeta API key...');
  
  if (!packetaApiKey) {
    console.error('❌ Packeta API key not found in environment variables');
    return false;
  }
  
  console.log('✅ Packeta API key found');
  
  // Since Packeta might require more complex integration, we're just checking if the key exists
  // You may want to add an actual API call if you have Packeta SDK implemented
  return true;
}

async function runAllTests() {
  console.log('🔍 TESTING API KEYS AND CONNECTIONS');
  console.log('==================================');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  const supabaseResult = await testSupabase();
  const stripeResult = await testStripe();
  const packetaResult = await testPacketa();
  
  console.log('==================================');
  console.log('SUMMARY:');
  console.log(`Supabase: ${supabaseResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Stripe: ${stripeResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Packeta: ${packetaResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (supabaseResult && stripeResult && packetaResult) {
    console.log('✅ All API connections are working!');
  } else {
    console.log('❌ Some API connections failed. Please check the details above.');
  }
}

// Run all tests
runAllTests().catch(console.error); 