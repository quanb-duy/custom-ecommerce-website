
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode in the current directory
  const env = loadEnv(mode, process.cwd(), '');
  
  // Log available environment variables in development
  if (mode === 'development') {
    console.log('Available environment variables:');
    Object.keys(env).forEach(key => {
      if (key.startsWith('VITE_')) {
        console.log(`${key}: ${key.includes('KEY') ? '[MASKED]' : env[key]}`);
      }
    });
  }
  
  return {
    server: {
      host: "0.0.0.0", // Listen on all network interfaces
      port: 8080, // Explicitly set port to 8080
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Force Railway environment variables through to the client
    define: {
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY || ''),
      'import.meta.env.VITE_PACKETA_API_KEY': JSON.stringify(env.VITE_PACKETA_API_KEY || '')
    }
  };
});
