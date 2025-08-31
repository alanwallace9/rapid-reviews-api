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
  app._router.stack.concat(api.stack).forEach(layer => {
    const r = layer.route;
    if (r) {
      const methods = Object.keys(r.methods).map(m => m.toUpperCase());
      methods.forEach(m => out.push({ method: m, path: r.path }));
    }
  });
  res.json(out);
});

// Mount everything under /api
app.use('/api', api);

export default app; // no app.listen()


export default app;   // ← no app.listen()

// redeploy again
