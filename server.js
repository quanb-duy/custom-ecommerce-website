import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Get the PORT from environment
const PORT = process.env.PORT || 8000;

// Prevent proxy issues by trusting proxies
app.set('trust proxy', true);

// Log startup configuration and node version
console.log('Starting server with configuration:');
console.log(`Node Version: ${process.version}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${PORT}`);

// IMPORTANT: Add middleware in the correct order!

// 1. Request logging with improved detail
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  next();
});

// 2. CORS headers with more complete configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, apikey, x-client-info');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 3. Health check endpoint (critical for Railway)
app.get('/health', (req, res) => {
  res.status(200).send('OK - Server is healthy');
});

// 4. Static file serving
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath, {
  // Set correct cache headers
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Cache for 1 day, revalidate on changes
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

// 5. API routes with JSON parsing
const apiRouter = express.Router();
app.use('/api', apiRouter);
apiRouter.use(express.json({ limit: '5mb' }));
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
  res.json({ status: 'API is working', timestamp: new Date().toISOString() });
});

// Explicit root route handler
app.get('/', (req, res) => {
  console.log('Serving application root');
  res.sendFile(path.join(distPath, 'index.html'));
});

// SPA fallback - Must come after all API routes
app.get('*', (req, res) => {
  console.log('Serving SPA fallback for:', req.originalUrl);
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global error handler with improved logging
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
  });
});

// Start the server with proper error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
