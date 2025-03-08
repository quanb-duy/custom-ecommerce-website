import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Debug network requests in development
if (import.meta.env.DEV) {
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    console.log('Network request:', args[0], args[1] || {});
    try {
      const response = await originalFetch(...args);
      console.log('Response status:', response.status);
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
