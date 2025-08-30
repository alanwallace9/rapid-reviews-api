import express from 'express';
import cors from 'cors';
import { registerSnapshotRoutes } from './routes/snapshot.js';
import { supaAdmin } from './lib/supabaseAdmin.js';

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.length === 0) return cb(null, true);
    const ok = allowedOrigins.some(a => origin === a || origin.endsWith(a));
    return ok ? cb(null, true) : cb(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json({ limit: '1mb' }));

// health & db-check first (useful for testing envs)
app.get('/health', (_, res) => res.json({ ok: true }));

app.get('/db-check', async (_, res) => {
  try {
    const { data, error } = await supaAdmin
      .from('rapid.snapshots')
      .select('*')
      .limit(1);
    if (error) return res.status(500).json({ error });
    res.json({ ok: true, rows: data.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API routes
registerSnapshotRoutes(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
