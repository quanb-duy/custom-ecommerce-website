import express from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { isSupabaseInitialized } from './integrations/supabase/client';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/status', async (req, res) => {
  const statuses = {
    supabase: { status: 'unknown', message: '' },
    stripe: { status: 'unknown', message: '' },
    packeta: { status: 'unknown', message: '' }
  };

  // Check Supabase
  try {
    if (isSupabaseInitialized()) {
      statuses.supabase.status = 'ok';
      statuses.supabase.message = 'Supabase client is initialized';
    } else {
      statuses.supabase.status = 'error';
      statuses.supabase.message = 'Supabase client is not properly initialized';
    }
  } catch (error) {
    statuses.supabase.status = 'error';
    statuses.supabase.message = `Error checking Supabase: ${error.message}`;
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API status endpoint running at http://localhost:${PORT}/api/status`);
  });
}

export default app; 