import express from 'express';
import cors from 'cors';
import { registerSnapshotRoutes } from './routes/snapshot.js';
import { supaAdmin } from './lib/supabaseAdmin.js';

const app = express();

// Mount everything under /api (so external URLs are /api/*)
const api = express.Router();

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGIN || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.length === 0) return cb(null, true);
    const ok = allowedOrigins.some(a => origin === a || origin.endsWith(a));
    return ok ? cb(null, true) : cb(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json({ limit: '1mb' }));

// ---- Routes on /api ----
api.get('/health', (_, res) => res.json({ ok: true }));

api.get('/db-check', async (_, res) => {
  try {
    const { data, error } = await supaAdmin
      .schema('rapid')
      .from('snapshots')
      .select('*')
      .limit(1);
    if (error) return res.status(500).json({ error });
    res.json({ ok: true, rows: data.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Register business routes on the /api router
registerSnapshotRoutes(api);

// Simple route inspector (GET /api/routes)
api.get('/routes', (req, res) => {
  const out = (api.stack || [])
    .filter(layer => layer.route && layer.route.path)
    .flatMap(layer => {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods || {}).map(m => m.toUpperCase());
      return methods.map(m => ({ method: m, path: `/api${path}` }));
    });
  res.json(out);
});

// Mount router at /api
app.use('/api', api);

export default app; // no app.listen()

