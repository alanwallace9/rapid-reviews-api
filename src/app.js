import express from 'express';
import cors from 'cors';
import { registerSnapshotRoutes } from './routes/snapshot.js';
import { supaAdmin } from './lib/supabaseAdmin.js';

const app = express();
const api = express.Router();  // 👈 everything under /api

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

// ---- Routes mounted on /api ----
api.get('/health', (_, res) => res.json({ ok: true }));
api.get('/ping', (_, res) => res.json({ ok: true }));
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

registerSnapshotRoutes(api); // << register POST /snapshot, GET /snapshot/:token

// (optional) route inspector for debugging
api.get('/routes', (_, res) => {
  const out = [];
  try {
    // Inspect the API router stack
    if (api.stack) {
      api.stack.forEach(layer => {
        if (layer.route) {
          const path = layer.route.path;
          const methods = Object.keys(layer.route.methods)
            .filter(Boolean)
            .map(m => m.toUpperCase());
          methods.forEach(m => out.push({ method: m, path: `/api${path}` }));
        }
      });
    }
    res.json(out);
  } catch (e) {
    res.json({ error: 'Could not inspect routes', message: e.message });
  }
});

// Mount everything under /api
app.use('/api', api);

export default app; // no app.listen()
