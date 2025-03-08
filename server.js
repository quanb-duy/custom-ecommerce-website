const express = require('express');
const path = require('path');
const app = express();

// Get the PORT from environment or default to 8000
const PORT = process.env.PORT || 8000;

// Detailed environment logging to help with debugging
console.log('Starting server with environment configuration:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${PORT}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY exists: ${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}`);
console.log(`SUPABASE_ANON_PUBLIC_KEY exists: ${Boolean(process.env.SUPABASE_ANON_PUBLIC_KEY)}`);

// Explicitly handle CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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

// Serve static files from the dist directory BEFORE applying any middleware
app.use(express.static(path.join(__dirname, 'dist')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Add health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Only apply JSON parsing to API routes
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

// Sample API endpoint for testing
apiRouter.post('/test', (req, res) => {
  console.log('Received API test request with body:', req.body);
  res.json({ success: true, message: 'API is working!' });
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

// Special handling for Supabase Edge functions to avoid direct browser access
app.all('/supabase/*', (req, res) => {
  console.warn('Attempt to directly access Supabase function endpoint:', req.path);
  res.status(400).json({ 
    error: 'Direct access to Supabase functions is not allowed',
    message: 'Please use the Supabase client SDK to invoke edge functions'
  });
});

// Handle all remaining routes by serving the index.html file for client-side routing
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
