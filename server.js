import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Get the PORT from environment
const PORT = process.env.PORT || 8000;

// Log startup configuration
console.log('===== SERVER STARTING =====');
console.log(`Server version: ${new Date().toISOString()}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${PORT}`);
console.log(`__dirname: ${__dirname}`);
console.log('==========================');

// Define the dist path EARLY
const distPath = path.join(__dirname, 'dist');
console.log(`Static files path: ${distPath}`);

// 1. Process JSON and URL-encoded bodies for API routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl || req.url}`);
  next();
});

// 3. CORS headers for all requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 4. Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 5. Debug endpoint to check environment variables
app.get('/debug-env', (req, res) => {
  // Only return non-sensitive variables
  const safeEnv = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    // Check if variables exist without exposing values
    HAS_SUPABASE_URL: !!process.env.SUPABASE_URL,
    HAS_SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_PUBLIC_KEY,
    HAS_VITE_PACKETA_API_KEY: !!process.env.VITE_PACKETA_API_KEY,
    HAS_VITE_STRIPE_PUBLISHABLE_KEY: !!process.env.VITE_STRIPE_PUBLISHABLE_KEY
  };
  
  res.json(safeEnv);
});

// 6. Serve static files - MUST be before any API or catch-all routes
app.use(express.static(distPath));

// 7. API routes
const apiRouter = express.Router();
app.use('/api', apiRouter);

// Test API endpoint
apiRouter.get('/test', (req, res) => {
  res.json({ status: 'API is working' });
});

// 8. Block direct access to Supabase edge function URLs
// This prevents the browser from directly accessing these URLs
app.all('/supabase/*', (req, res) => {
  return res.status(403).json({ 
    error: 'Direct access to Supabase functions is not allowed' 
  });
});

// 9. Wildcard handler for SPA - ALL other routes go to index.html
// This is CRUCIAL: ALL paths not explicitly handled should serve the React app
app.get('*', (req, res) => {
  console.log(`SPA fallback triggered for: ${req.originalUrl}`);
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===== SERVER RUNNING =====`);
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Static files being served from: ${distPath}`);
  console.log(`==========================`);
});
