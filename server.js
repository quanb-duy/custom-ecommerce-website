const express = require('express');
const path = require('path');
const app = express();

// Get the PORT from environment or default to 8080
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

// Serve static files from the dist directory BEFORE the JSON middleware
// This way static file requests don't need JSON parsing
app.use(express.static(path.join(__dirname, 'dist')));

// Add health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Only apply JSON parsing to API routes
// Create a router for API endpoints
const apiRouter = express.Router();
app.use('/api', apiRouter);

// Apply JSON middleware only to the API router
apiRouter.use(express.json({ limit: '1mb' }));
apiRouter.use(express.urlencoded({ extended: true }));

// JSON parsing error middleware for API routes
apiRouter.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parsing error:', err.message);
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next(err);
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
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    error: err.message || 'Something broke on the server!'
  };
  
  res.status(statusCode).json(errorResponse);
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
