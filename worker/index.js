import core from './core.js';

// 两种部署方式：
// 1) 私人：设置 PROBE_MCP_PATH（/probe-<64位十六进制>/mcp），只有知道这个地址的人能用，所有记录归同一个主人。
// 2) 公开：设置 PUBLIC_MODE=1，地址是 /mcp，谁都能连；每个玩家、每一局按 game_id 分开记录，旧记录 30 天后自动清理。
const TABLE_SQL = 'CREATE TABLE IF NOT EXISTS probe_objects (key TEXT PRIMARY KEY, value TEXT NOT NULL, etag TEXT NOT NULL)';
let tableReady = false;

export class D1Store {
  constructor(db) { this.db = db; }
  // 公开部署省掉手动建表：第一次请求时自动建。
  async ensureTable() { if (!tableReady) { await this.db.prepare(TABLE_SQL).bind().run(); tableReady = true; } }
  // 大约每 200 次请求清理一次 30 天没更新的记录，防止数据库越积越多。
  async sweep() {
    if (Math.random() > 0.005) return;
    const cutoff = new Date(Date.now() - 30 * 864e5).toISOString();
    try { await this.db.prepare("DELETE FROM probe_objects WHERE json_extract(value, '$.updatedAt') < ?1").bind(cutoff).run(); } catch {}
  }
  async get(key) {
    const row = await this.db.prepare('SELECT value, etag FROM probe_objects WHERE key = ?1').bind(key).first();
    return row ? { etag: row.etag, json: async () => JSON.parse(row.value) } : null;
  }
  async put(key, value, options) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    const etag = [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('');
    const condition = options.onlyIf;
    let statement;
    if (condition instanceof Headers && condition.get('If-None-Match') === '*') {
      statement = this.db.prepare('INSERT INTO probe_objects (key, value, etag) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO NOTHING').bind(key, value, etag);
    } else if (typeof condition?.etagMatches === 'string') {
      statement = this.db.prepare('UPDATE probe_objects SET value = ?1, etag = ?2 WHERE key = ?3 AND etag = ?4').bind(value, etag, key, condition.etagMatches);
    } else {
      throw new Error('Conditional writes are required');
    }
    const result = await statement.run();
    if (!result.success) throw new Error('Test database write failed');
    return result.meta.changes === 1 ? { etag } : null;
  }
}

function notFound() { return new Response('Not Found', { status: 404, headers: { 'cache-control': 'no-store' } }); }
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({ ok: true, isolated: true, build: 'cloudflare-0.8.1' }, { headers: { 'cache-control': 'no-store' } });
    }
    const isPublic = String(env.PUBLIC_MODE || '') === '1';
    const isPrivate = /^\/probe-[a-f0-9]{64}\/mcp$/.test(env.PROBE_MCP_PATH || '') && url.pathname === env.PROBE_MCP_PATH;
    if (url.search || !(isPrivate || (isPublic && url.pathname === '/mcp'))) return notFound();
    if (!env.PROBE_DB) return new Response('Storage unavailable', { status: 503 });
    url.pathname = '/mcp';
    const headers = new Headers(request.headers);
    // Cloudflare 不提供可信的登录身份，客户端发来的身份一律不信。
    headers.delete('oai-authenticated-user-email');
    headers.delete('oai-authenticated-user-full-name');
    headers.set('oai-authenticated-user-id', isPrivate ? 'isolated-cloudflare-probe-owner-v1' : 'public');
    const store = new D1Store(env.PROBE_DB);
    if (isPublic && !isPrivate) { await store.ensureTable(); await store.sweep(); }
    return core.fetch(new Request(url, { method: request.method, headers, body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body, duplex: 'half' }), { PROBE_STORE: store, ENGINE_SKINS: env.ENGINE_SKINS });
  }
};
