export const config = { runtime: 'nodejs18.x' };

import app from '../src/app.js';

export default function handler(req, res) {
  if (req.url.startsWith('/api')) req.url = req.url.slice(4) || '/';
  return app(req, res);
}
