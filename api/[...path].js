// api/[...path].js
export const config = { runtime: 'nodejs' };
import app from '../src/app.js';

export default function handler(req, res) {
  // No URL rewriting. Express will see /api/...
  return app(req, res);
}
