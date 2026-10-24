import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker, { D1Store } from '../worker/index.js';

function database() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/0001_probe.sql', import.meta.url), 'utf8'));
  return { db, prepare(sql) { return { bind(...args) { return {
    async first() { return db.prepare(sql).get(...args) ?? null; },
    async run() { return { success: true, meta: { changes: Number(db.prepare(sql).run(...args).changes) } }; }
  }; } }; } };
}
const path = '/probe-' + 'a'.repeat(64) + '/mcp'; // Fixture, never a deployed secret.
function rpc(urlPath, name, args, identity = 'forged-id') {
  return new Request('https://probe.test' + urlPath, { method: 'POST', headers: { 'content-type': 'application/json', 'oai-authenticated-user-id': identity }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) });
}
test('public and unconfigured endpoints cannot access data, even with forged identity', async () => {
  const env = { PROBE_DB: database(), PROBE_MCP_PATH: path };
  const args = { state: { '金币': 3 } };
  for (const route of ['/mcp', '/probe-' + 'b'.repeat(64) + '/mcp', path + '?x=1']) assert.equal((await worker.fetch(rpc(route, 'render_game_ui', args), env)).status, 404);
  assert.equal((await worker.fetch(rpc(path, 'render_game_ui', args), { ...env, PROBE_MCP_PATH: '/mcp' })).status, 404);
  assert.equal(env.PROBE_DB.db.prepare('SELECT count(*) AS n FROM probe_objects').get().n, 0);
});
test('private route keeps one game record in SQL storage and ignores spoofed identities', async () => {
  const env = { PROBE_DB: database(), PROBE_MCP_PATH: path };
  const call = async (name, args, id) => (await (await worker.fetch(rpc(path, name, args, id), env)).json()).result;
  const first = await call('render_game_ui', { state: { '标题': '测试局', '金币': 3 }, theme: '中世纪', new_game: true }, 'attacker-one');
  assert.equal(first.structuredContent.chapter, 'A');
  assert.equal(first.structuredContent.changes.first, true);
  const second = await call('render_game_ui', { state: { '标题': '测试局', '金币': 1 } }, 'attacker-two');
  assert.equal(second.structuredContent.changes.statDelta['金币'], -2);
  assert.equal(second.structuredContent.card.type, 'status');
  assert.equal(second.structuredContent.turnIndex, 2);
  assert.equal((await call('render_game_ui', { state: {}, extra: 1 })).isError, true);
  assert.equal(env.PROBE_DB.db.prepare('SELECT count(*) AS n FROM probe_objects').get().n, 1);
});
test('SQL conditions reject concurrent creates and stale updates without overwriting state', async () => {
  const db = database(), store = new D1Store(db);
  const create = { onlyIf: new Headers({ 'If-None-Match': '*' }) };
  const first = await Promise.all([store.put('same', 'one', create), store.put('same', 'two', create)]);
  assert.equal(first.filter(Boolean).length, 1);
  const old = await store.get('same');
  const updates = await Promise.all(['"three"', '"four"'].map(v => store.put('same', v, { onlyIf: { etagMatches: old.etag } })));
  assert.equal(updates.filter(Boolean).length, 1);
  assert.notEqual((await store.get('same')).etag, old.etag);
});

test('public mode: /mcp works, table is created automatically, games are kept apart by game_id', async () => {
  const db = new DatabaseSync(':memory:');
  const raw = { db, prepare(sql) { return { bind(...args) { return {
    async first() { return db.prepare(sql).get(...args) ?? null; },
    async run() { return { success: true, meta: { changes: Number(db.prepare(sql).run(...args).changes) } }; }
  }; } }; } };
  const env = { PROBE_DB: raw, PUBLIC_MODE: '1' };
  const call = async (args, meta) => {
    const req = new Request('https://pub.test/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'render_game_ui', arguments: args, _meta: meta } }) });
    return (await (await worker.fetch(req, env)).json()).result;
  };
  const a1 = await call({ state: { '标题': '甲', '金币': 3 }, new_game: true });
  const b1 = await call({ state: { '标题': '乙', '金币': 50 }, new_game: true });
  const idA = a1.structuredContent.gameId, idB = b1.structuredContent.gameId;
  assert.match(idA, /^G[A-Z2-9]{8}$/);
  assert.notEqual(idA, idB);
  assert.match(a1.content[0].text, /本局编号/);
  const a2 = await call({ state: { '标题': '甲', '金币': 5 }, game_id: idA });
  assert.equal(a2.structuredContent.changes.statDelta['金币'], 2);
  const b2 = await call({ state: { '标题': '乙', '金币': 40 }, game_id: idB });
  assert.equal(b2.structuredContent.changes.statDelta['金币'], -10);
  const s1 = await call({ state: { '金币': 1 } }, { 'openai/subject': 'user-x' });
  assert.equal(s1.structuredContent.changes.first, true);
  assert.equal((await worker.fetch(new Request('https://pub.test/probe-' + 'a'.repeat(64) + '/mcp', { method: 'POST', body: '{}' }), env)).status, 404);
});
