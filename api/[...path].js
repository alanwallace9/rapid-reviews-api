// api/[...path].js
import app from '../src/app.js';

export default function handler(req, res) {
  // Make Express see "/db-check" instead of "/api/db-check"
  if (req.url.startsWith('/api')) {
    req.url = req.url.slice(4) || '/';
  }
  return app(req, res);
}
