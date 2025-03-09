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
console.log('Starting server with environment configuration:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${PORT}`);

// 1. Request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl || req.url}`);
  next();
});

// 2. CORS headers for all requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 3. Health check endpoint (before static files)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 4. Debug endpoint to check environment variables
app.get('/debug-env', (req, res) => {
  // Only return non-sensitive variables
  const safeEnv = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    NODE_VERSION: process.version,
    PLATFORM: process.platform,
    ARCH: process.arch,
    CWD: process.cwd(),
    HOSTNAME: process.env.HOSTNAME || 'unknown',
    // Check if variables exist without exposing values
    HAS_SUPABASE_URL: !!process.env.SUPABASE_URL,
    HAS_SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_PUBLIC_KEY,
    HAS_VITE_PACKETA_API_KEY: !!process.env.VITE_PACKETA_API_KEY,
    HAS_VITE_STRIPE_PUBLISHABLE_KEY: !!process.env.VITE_STRIPE_PUBLISHABLE_KEY
  };
  
  res.json(safeEnv);
});

// Static file serving BEFORE API route handling
// This must come BEFORE API and Supabase handling to prioritize static files
const distPath = path.join(__dirname, 'dist');
console.log(`Serving static files from: ${distPath}`);
app.use(express.static(distPath));

// 5. API routes with JSON parsing
// This should come AFTER static files to prevent any conflicts
const apiRouter = express.Router();
app.use('/api', apiRouter);
apiRouter.use(express.json());
apiRouter.use(express.urlencoded({ extended: true }));

// JSON parsing error handler for API routes
apiRouter.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parsing error:', err.message);
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next(err);
});

// Test API endpoint
apiRouter.get('/test', (req, res) => {
  res.json({ status: 'API is working' });
});

// 6. Block direct access to Supabase edge function URLs
app.all('/supabase/*', (req, res) => {
  return res.status(403).json({ 
    error: 'Direct access to Supabase functions is not allowed' 
  });
});

// 7. SPA fallback - serve index.html for all other routes
// This MUST be after all other routes and static file serving
app.get('*', (req, res) => {
  console.log('Serving SPA fallback for:', req.originalUrl);
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Static files are being served from: ${distPath}`);
});
