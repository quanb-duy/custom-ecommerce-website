
const express = require('express');
const path = require('path');
const app = express();

// Get the PORT from environment or default to 8080
const PORT = process.env.PORT || 8080;

// Detailed environment logging to help with debugging
console.log('Starting server with environment configuration:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${PORT}`);

// Log all environment variables in development mode
if (process.env.NODE_ENV !== 'production') {
  console.log('Environment Variables:');
  Object.keys(process.env).forEach(key => {
    // Only log variables that could be relevant to our app
    if (key.startsWith('VITE_') || key === 'PORT' || key.startsWith('SUPABASE_')) {
      console.log(`${key}: ${key.includes('KEY') ? '[MASKED]' : process.env[key]}`);
    }
  });
}

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

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Add health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Handle all routes by serving the index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
