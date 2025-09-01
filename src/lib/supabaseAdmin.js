//import { createClient } from '@supabase/supabase-js';

//export const supaAdmin = createClient(
//  process.env.SUPABASE_URL,
//  process.env.SUPABASE_SERVICE_KEY,
//  { auth: { persistSession: false } }
//);


// Server-side Supabase client (service role)
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Simple helper to upsert snapshot rows
export async function upsertSnapshotByToken(token, payload) {
  const { error } = await supabase
    .from('rapid.snapshots')
    .upsert({ token, ...payload, updated_at: new Date().toISOString() }, { onConflict: 'token' });
  if (error) throw error;
}

export async function fetchSnapshot(token) {
  const { data, error } = await supabase
    .from('rapid.snapshots')
    .select('*')
    .eq('token', token)
    .single();
  if (error) throw error;
  return data;
}

export async function appendAiReply(token, review_id, reply) {
  // Load, push, save back to ai_replies
  const snap = await fetchSnapshot(token);
  const list = Array.isArray(snap.ai_replies) ? snap.ai_replies : [];
  list.push({ review_id, reply, generated_at: new Date().toISOString() });

  const { error } = await supabase
    .from('rapid.snapshots')
    .update({ ai_replies: list, updated_at: new Date().toISOString() })
    .eq('token', token);
  if (error) throw error;
}

export async function insertLead({ token, name, email, phone }) {
  const { error } = await supabase.from('rapid.leads').insert({ token, name, email, phone });
  if (error) throw error;
}
