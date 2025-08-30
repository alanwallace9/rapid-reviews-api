import app from '../src/app.js';

// Express apps are request handlers, so just delegate:
export default function handler(req, res) {
  return app(req, res);
}
