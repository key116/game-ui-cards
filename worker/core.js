import { GAME_UI_URI, gameUiTools, callGameUiTool, callGameViewTool, GameUiError } from './game-ui-tools.js';
import { gameUiHtml } from './game-ui-widget.js';

const VERSION = '0.8.1';
const UI_MIME = 'text/html;profile=mcp-app';
const protocols = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

const tools = [...gameUiTools];
tools.push({
  name: 'show_game_view',
  title: '显示外部游戏画面',
  description: '把外部游戏引擎返回的画面显示成游戏卡片（和 render_game_ui 同一套卡片与皮肤）。如果你同时连着别的游戏引擎插件，先让它返回当前画面，再把那个 view 原样传进来。' +
    '会自动拆开场景末尾“📍 地点 | 🔍 线索 8 | ⏳ 时间线 2/15”这类状态行，并按存档对比上一回合标出变化。不执行动作，不改那个引擎的存档。',
  inputSchema: { type: 'object', properties: {
    view: { type: 'object', additionalProperties: true, description: '游戏引擎返回的 view 对象，原样传入。' },
    game_id: { type: 'string', maxLength: 40, description: '可选，本局编号；公开部署下建议带上，避免和别人的记录混在一起。' },
    theme: { type: 'string', maxLength: 60, description: '可选，题材词，用来选皮肤。' },
    card: { type: 'string', enum: ['自动', '选择', '状态', '背包', '人物', '地点', '地图'], description: '可选，默认没有选项时出状态卡。' }
  }, required: ['view'], additionalProperties: false },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  _meta: { ui: { resourceUri: GAME_UI_URI, visibility: ['app', 'model'] }, 'openai/outputTemplate': GAME_UI_URI, 'openai/widgetAccessible': true }
});

class ProbeError extends Error { constructor(message, code = -32602) { super(message); this.code = code; } }

export async function callProbeTool(name, args, store, userId, meta, engineSkins) {
  if (name === 'show_game_view') {
    try { return await callGameViewTool(args, store, userId, meta, engineSkins); }
    catch (e) { throw new ProbeError(e instanceof GameUiError ? e.message : '游戏画面暂时无法显示，请直接用文字继续。'); }
  }
  if (gameUiTools.some(t => t.name === name)) {
    try { return await callGameUiTool(name, args, store, userId, meta); }
    catch (e) { throw new ProbeError(e instanceof GameUiError ? e.message : '游戏界面暂时无法生成，请直接用文字继续。'); }
  }
  throw new ProbeError('未知工具。');
}

const INSTRUCTIONS =
  '游戏界面层：本服务不含任何游戏规则和剧情，只负责把游戏状态画成卡片。' +
  '跑文字游戏时，每回合先写 2～4 句叙事，再调用一次 render_game_ui，把当前完整状态（中文字段名）交给它；新游戏第一次调用填 theme 并设 new_game 为 true。' +
  '新游戏第一次调用后，工具会给出本局编号 game_id，之后每次调用都原样带上。调用后不要在文字里重复数值、背包和选项。玩家点卡片上的选项后，那句行动会作为玩家消息发来，按它继续下一回合。' +
  '数值前后要一致，不要随手改数。如果同时连着别的游戏引擎，可以把它返回的画面交给 show_game_view 显示。';

const resourceMeta = (description, modes) => ({
  ui: { csp: { connectDomains: [], resourceDomains: [] }, prefersBorder: false },
  ...(modes ? { 'openai/ui': { availableDisplayModes: modes } } : {}),
  'openai/widgetDescription': description,
  'openai/widgetPrefersBorder': false
});

function json(body, status = 200) { return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } }); }

async function processRpc(message, env, userId) {
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') return { jsonrpc: '2.0', id: message?.id ?? null, error: { code: -32600, message: 'Invalid Request' } };
  if (message.id === undefined) return null;
  const reply = result => ({ jsonrpc: '2.0', id: message.id, result });
  try {
    switch (message.method) {
      case 'initialize': return reply({ protocolVersion: protocols.includes(message.params?.protocolVersion) ? message.params.protocolVersion : protocols[0], capabilities: { tools: { listChanged: false }, resources: { listChanged: false }, extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: [UI_MIME] } } }, serverInfo: { name: 'b-game-ui', version: VERSION }, instructions: INSTRUCTIONS });
      case 'ping': return reply({});
      case 'tools/list': return reply({ tools });
      case 'resources/list': return reply({ resources: [{ uri: GAME_UI_URI, name: '游戏界面卡片', mimeType: UI_MIME }] });
      case 'resources/templates/list': return reply({ resourceTemplates: [] });
      case 'resources/read': {
        if (message.params?.uri === GAME_UI_URI) return reply({ contents: [{ uri: GAME_UI_URI, mimeType: UI_MIME, text: gameUiHtml, _meta: resourceMeta('游戏界面卡片：按游戏状态自动显示数值、地点、背包、判定、线索、人物、任务和选项按钮；点选项会把整句行动作为玩家消息发出。') }] });
        throw new ProbeError('Resource not found', -32002);
      }
      case 'tools/call': {
        if (!userId) throw new ProbeError('需要登录后才能使用。', -32001);
        try { return reply(await callProbeTool(message.params?.name, message.params?.arguments ?? {}, env.PROBE_STORE, userId, message.params?._meta || {}, env.ENGINE_SKINS)); }
        catch (e) { console.error('tool_error', JSON.stringify({ tool: message.params?.name, code: e.code ?? -32603 })); return reply({ isError: true, content: [{ type: 'text', text: e instanceof ProbeError ? e.message : '服务暂时不可用，请稍后再试。' }] }); }
      }
      default: throw new ProbeError('Method not found', -32601);
    }
  } catch (e) { return { jsonrpc: '2.0', id: message.id, error: { code: e.code ?? -32603, message: e instanceof ProbeError ? e.message : 'Internal error' } }; }
}

export default { async fetch(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/health') return json({ ok: true, version: VERSION, isolated: true, storageConfigured: !!env.PROBE_STORE });
  if (url.pathname !== '/mcp') return new Response('Not Found', { status: 404 });
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  const userId = request.headers.get('oai-authenticated-user-id');
  if (Number(request.headers.get('content-length') || 0) > 65536) return json({ error: 'Request too large' }, 413);
  let body;
  try { const text = await request.text(); if (text.length > 65536) return json({ error: 'Request too large' }, 413); body = JSON.parse(text); }
  catch { return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400); }
  if (Array.isArray(body)) return json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Batch requests are not supported' } }, 400);
  if (body?.method === 'tools/call' && !userId) return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32001, message: 'Authentication required' } }, 401);
  const result = await processRpc(body, env, userId);
  return result ? json(result) : new Response(null, { status: 202 });
} };
