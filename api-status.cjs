const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/api/status', async (req, res) => {
  const statuses = {
    supabase: { status: 'unknown', message: '' },
    stripe: { status: 'unknown', message: '' },
    packeta: { status: 'unknown', message: '' }
  };

  // Check Supabase
  const supabaseUrl = process.env.SUPABASE_URL || "https://owigcjycsaxmpsthjbrh.supabase.co";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseKey) {
    statuses.supabase.status = 'error';
    statuses.supabase.message = 'Supabase key not found in environment variables';
  } else {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from('products').select('id').limit(1);
      
      if (error) {
        statuses.supabase.status = 'error';
        statuses.supabase.message = `Supabase error: ${error.message}`;
      } else {
        statuses.supabase.status = 'ok';
        statuses.supabase.message = 'Supabase is responding correctly';
      }
    } catch (error) {
      statuses.supabase.status = 'error';
      statuses.supabase.message = `Error checking Supabase: ${error.message}`;
    }
  }

  // Check Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;
  if (!stripeKey) {
    statuses.stripe.status = 'error';
    statuses.stripe.message = 'Stripe secret key not found in environment variables';
  } else {
    try {
      const stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
      });
      
      await stripe.paymentMethods.list({ limit: 1 });
      statuses.stripe.status = 'ok';
      statuses.stripe.message = 'Stripe API is responding';
    } catch (error) {
      statuses.stripe.status = 'error';
      statuses.stripe.message = `Error connecting to Stripe: ${error.message}`;
    }
  }

  // Check Packeta
  const packetaKey = process.env.PACKETA_API_KEY || process.env.VITE_PACKETA_API_KEY;
  if (!packetaKey) {
    statuses.packeta.status = 'error';
    statuses.packeta.message = 'Packeta API key not found in environment variables';
  } else {
    statuses.packeta.status = 'ok';
    statuses.packeta.message = 'Packeta API key is present (no validation performed)';
  }

  // Overall status
  const allOk = Object.values(statuses).every(s => s.status === 'ok');
  const overallStatus = allOk ? 'All systems operational' : 'Some services have issues';

  res.json({
    timestamp: new Date().toISOString(),
    overall: allOk ? 'ok' : 'error',
    message: overallStatus,
    services: statuses
  });
});

// Add a simple root endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>API Status Check</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          a { display: inline-block; margin-top: 20px; padding: 10px 15px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }
          a:hover { background: #45a049; }
        </style>
      </head>
      <body>
        <h1>API Status Check Tool</h1>
        <p>This tool helps you verify if your API keys and services are configured correctly.</p>
        <a href="/api/status">Check API Status</a>
      </body>
    </html>
  `);
});

// Start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API status server running at http://localhost:${PORT}`);
    console.log(`Check API status at http://localhost:${PORT}/api/status`);
  });
}

module.exports = app; 