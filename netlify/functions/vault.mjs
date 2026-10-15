// Bewaart versleutelde "kluisjes" voor synchronisatie tussen apparaten.
// De server ziet alleen een onleesbare id en versleutelde bytes: nooit gebruiker, app, wachtwoord of code.
import { getStore } from '@netlify/blobs';

const ID = /^[0-9a-f]{64}$/;
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;
const MAX_BLOB = 48 * 1024;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export function createHandler(store) {
  return async (req) => {
    const url = new URL(req.url);

    if (req.method === 'GET') {
      const id = url.searchParams.get('id') || '';
      if (!ID.test(id)) return json({ error: 'bad_id' }, 400);
      const rec = await store.get(id, { type: 'json' });
      return json(rec ? { blob: rec.blob, rev: rec.rev } : { blob: null, rev: 0 });
    }

    if (req.method === 'PUT') {
      const text = await req.text();
      if (text.length > MAX_BLOB + 1024) return json({ error: 'too_large' }, 413);
      let body;
      try { body = JSON.parse(text); } catch { return json({ error: 'bad_json' }, 400); }
      const { id, blob, rev } = body || {};
      if (!ID.test(id || '')) return json({ error: 'bad_id' }, 400);
      if (typeof blob !== 'string' || !blob || blob.length > MAX_BLOB || !B64.test(blob)) return json({ error: 'bad_blob' }, 400);
      if (!Number.isInteger(rev) || rev < 0) return json({ error: 'bad_rev' }, 400);

      // Optimistische controle: schrijf alleen als je de nieuwste versie kende.
      const cur = await store.get(id, { type: 'json' });
      const curRev = cur ? cur.rev : 0;
      if (rev !== curRev) return json({ error: 'conflict', rev: curRev }, 409);
      const next = { blob, rev: curRev + 1 };
      await store.setJSON(id, next);
      return json({ rev: next.rev });
    }

    return json({ error: 'method_not_allowed' }, 405);
  };
}

export default async (req) => createHandler(getStore({ name: 'vaults', consistency: 'strong' }))(req);

export const config = { path: '/api/vault' };
