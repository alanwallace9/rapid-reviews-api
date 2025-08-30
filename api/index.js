// api/index.js
import app from '../src/app.js';

export default function handler(req, res) {
  // Make Express see "/health" instead of "/api/health"
  if (req.url.startsWith('/api')) {
    req.url = req.url.slice(4) || '/';
  }
  return app(req, res);
}
