import { supaAdmin } from '../lib/supabaseAdmin.js';
import { v4 as uuidv4 } from 'uuid';

function pickBusinessType(types = []) {
  const blacklist = new Set(['establishment','point_of_interest','premise','food','store']);
  for (const t of types) if (!blacklist.has(t)) return t;
  return types[0] || null;
}

export function registerSnapshotRoutes(router) {
  // POST /api/snapshot (because router is mounted at /api)
  router.post('/snapshot', async (req, res) => {
    try {
      const { place_id, business_name, city, state } = req.body || {};
      if (!place_id || !business_name) {
        return res.status(400).json({ error: 'missing_place_id_or_name' });
      }

      const token = uuidv4().replace(/-/g, '');

      // 1) insert pending row
      const { data: snap, error: insErr } = await supaAdmin
        .schema('rapid').from('snapshots')
        .insert({
          token,
          business_name,
          city: city || null,
          state: state || null,
          google_place_id: place_id,
          status: 'pending'
        })
        .select()
        .single();

      if (insErr) return res.status(500).json({ error: 'db_insert_failed' });

      // 2) Place Details (server key)
      const fields = ['rating','user_ratings_total','types','name','geometry'].join(',');
      const detUrl =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${encodeURIComponent(place_id)}` +
        `&fields=${fields}` +
        `&key=${process.env.GOOGLE_SERVER_KEY}`;

      const details = await fetch(detUrl).then(r => r.json());
      const result = details?.result || {};
      const rating  = result?.rating ?? null;
      const reviews = result?.user_ratings_total ?? null;
      const center  = result?.geometry?.location || null;
      const chosenType = pickBusinessType(result?.types || []);

      // 3) Nearby competitors (optional)
      let competitors = [];
      if (center?.lat && center?.lng && chosenType) {
        const nearUrl =
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
          `?location=${center.lat},${center.lng}` +
          `&radius=2500` +
          `&type=${encodeURIComponent(chosenType)}` +
          `&key=${process.env.GOOGLE_SERVER_KEY}`;

        const near = await fetch(nearUrl).then(r => r.json());
        const results = Array.isArray(near?.results) ? near.results : [];
        competitors = results
          .filter(r => r.place_id !== place_id)
          .slice(0, 3)
          .map(r => ({
            name: r.name,
            place_id: r.place_id,
            rating: r.rating ?? null,
            reviews: r.user_ratings_total ?? null
          }));
      }

      // 4) update row to ready
      await supaAdmin
        .schema('rapid').from('snapshots')
        .update({
          current_rating: rating,
          current_reviews: reviews,
          competitors,
          status: 'ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', snap.id);

      return res.json({ token });
    } catch (e) {
      console.error('POST /snapshot error', e);
      return res.status(500).json({ error: 'server_error' });
    }
  });

  // GET /api/snapshot/:token (because router is mounted at /api)
  router.get('/snapshot/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { data, error } = await supaAdmin
        .schema('rapid').from('snapshots')
        .select('business_name, city, state, current_rating, current_reviews, competitors, updated_at')
        .eq('token', token)
        .maybeSingle();

      if (error) return res.status(500).json({ error: 'db_error', details: error.message });
      if (!data) return res.status(404).json({ error: 'not_found' });

      res.json(data);
    } catch (e) {
      console.error('GET /snapshot/:token error', e);
      res.status(500).json({ error: 'server_error' });
    }
  });
}

