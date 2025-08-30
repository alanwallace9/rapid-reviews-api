// api/[...path].js
import app from '../src/app.js';

export default function handler(req, res) {
  // strip the /api prefix before handing to Express
  if (req.url.startsWith('/api')) {
    req.url = req.url.slice(4) || '/';
  }
  return app(req, res);
}
