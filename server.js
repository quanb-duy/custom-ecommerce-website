
const express = require('express');
const path = require('path');
const app = express();

// Get the PORT from environment or default to 8000 (matching Deno's default)
const PORT = process.env.PORT || 8000;

// Detailed environment logging to help with debugging
console.log('Starting server with environment configuration:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${PORT}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY exists: ${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}`);
console.log(`SUPABASE_ANON_PUBLIC_KEY exists: ${Boolean(process.env.SUPABASE_ANON_PUBLIC_KEY)}`);

// Check if necessary environment variables are set
const requiredEnvVars = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_STRIPE_SECRET_KEY',
  'VITE_PACKETA_API_KEY',
  'VITE_PACKETA_API_PASSWORD',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.warn('Warning: Missing environment variables:', missingEnvVars.join(', '));
  console.warn('The application will use fallback functionality');
}

// JSON parsing middleware with error handling
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('Invalid JSON received:', e);
      res.status(400).json({ error: 'Invalid JSON in request body' });
      throw new Error('Invalid JSON');
    }
  }
}));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Add health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Debug route to check environment variables (non-sensitive info)
app.get('/debug-env', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).send('Debug info not available in production');
  }
  
  const safeEnvInfo = {
    nodeEnv: process.env.NODE_ENV,
    port: PORT,
    hasSupabaseServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasSupabaseAnonKey: Boolean(process.env.SUPABASE_ANON_PUBLIC_KEY),
    hasStripePublishableKey: Boolean(process.env.VITE_STRIPE_PUBLISHABLE_KEY),
    hasPacketaApiKey: Boolean(process.env.VITE_PACKETA_API_KEY)
  };
  
  res.json(safeEnvInfo);
});

// Handle all routes by serving the index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.message === 'Invalid JSON') {
    // Already handled in the JSON middleware
    return;
  }
  
  if (!res.headersSent) {
    res.status(500).json({ 
      error: 'Internal server error', 
      message: process.env.NODE_ENV === 'production' ? undefined : err.message 
    });
  }
});

// Start the server with improved error handling
try {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
