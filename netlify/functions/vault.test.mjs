import assert from 'node:assert/strict';
import { createHandler } from './vault.mjs';

const mem = new Map();
const store = { get: async (k) => mem.get(k) ?? null, setJSON: async (k, v) => { mem.set(k, structuredClone(v)); } };
const h = createHandler(store);
const id = 'a'.repeat(64);
const call = (method, path, body) => h(new Request('http://x' + path, { method, body: body && JSON.stringify(body) }));

assert.equal((await call('GET', '/api/vault?id=zz')).status, 400);
assert.deepEqual(await (await call('GET', `/api/vault?id=${id}`)).json(), { blob: null, rev: 0 });
assert.equal((await call('PUT', '/api/vault', { id, blob: 'QUJD', rev: 5 })).status, 409);
let r = await call('PUT', '/api/vault', { id, blob: 'QUJD', rev: 0 });
assert.deepEqual(await r.json(), { rev: 1 });
assert.equal((await call('PUT', '/api/vault', { id, blob: 'REVG', rev: 0 })).status, 409);
r = await call('PUT', '/api/vault', { id, blob: 'REVG', rev: 1 });
assert.deepEqual(await r.json(), { rev: 2 });
r = await call('GET', `/api/vault?id=${id}`);
assert.deepEqual(await r.json(), { blob: 'REVG', rev: 2 });
assert.equal((await call('PUT', '/api/vault', { id, blob: 'not base64!', rev: 2 })).status, 400);
assert.equal((await call('PUT', '/api/vault', { id: 'x', blob: 'QUJD', rev: 2 })).status, 400);
assert.equal((await call('DELETE', '/api/vault')).status, 405);
console.log('vault-functie: alle tests geslaagd');
