// Serverless entry. No URL rewrites.
export const config = { runtime: 'nodejs' };
import app from '../src/app.js';

export default function handler(req, res) {
  return app(req, res);
}
