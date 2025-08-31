export const config = { runtime: 'nodejs' };

import app from '../src/app.js';

export default function handler(req, res) {
  // Log for debugging
  console.log('Original URL:', req.url);
  console.log('Method:', req.method);
  
  // Strip /api prefix if present, but ensure we have at least '/'
  if (req.url.startsWith('/api')) {
    req.url = req.url.slice(4) || '/';
  }
  
  console.log('Modified URL:', req.url);
  
  // Pass to Express app
  return app(req, res);
}
