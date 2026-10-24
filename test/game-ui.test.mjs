import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { normalizeState, diffViews, pickChapter, pickCard, matchComponent, parseSkin } from '../worker/game-ui-core.js';
import { callGameUiTool } from '../worker/game-ui-tools.js';
import { gameUiHtml } from '../worker/game-ui-widget.js';
import core from '../worker/core.js';

class MemoryStore {
  constructor() { this.map = new Map(); this.n = 0; }
  async get(key) { const row = this.map.get(key); return row ? { etag: row.etag, json: async () => JSON.parse(row.value) } : null; }
  async put(key, value, { onlyIf }) {
    const row = this.map.get(key);
    if (onlyIf instanceof Headers ? row : row?.etag !== onlyIf?.etagMatches) return null;
    const etag = 'e' + (++this.n); this.map.set(key, { value, etag }); return { etag };
  }
}

test('keywords map Chinese, English and synonym field names to components', () => {
  assert.equal(matchComponent('背包'), '道具');
  assert.equal(matchComponent('Inventory'), '道具');
  assert.equal(matchComponent('当前地点'), '地点');
  assert.equal(matchComponent('SAN'), '数值');
  assert.equal(matchComponent('options'), '选项');
  assert.equal(matchComponent('天气'), '氛围');
  assert.equal(matchComponent('口袋'), null);
  const { view, theme } = normalizeState({
    title: '阿卡姆疑云', time: '午后', HP: '11/12', SAN: { '值': 52, '上限': 60 }, '幸运': 45,
    location: { name: '书库', description: '灯泡嗡嗡响', points: ['登记簿'], danger: ['铁门'] },
    inventory: { '医疗包': 1, '子弹': 6 }, clues: ['残卷', { '名称': '书页', '内容': '别相信月亮' }],
    roll: { skill: '图书馆', roll: 12, target: 60, outcome: '极难成功' }, '关系': { '管理员': 2 },
    '天气': '阴雨', '体温': 36, options: ['翻登记簿', { text: '走近铁门' }], tags: ['克苏鲁']
  });
  assert.equal(view['标题'], '阿卡姆疑云');
  assert.deepEqual(view['时间'], [{ label: '时间', text: '午后' }]);
  assert.deepEqual(view['数值'].map(s => [s.label, s.value, s.max]), [['HP', 11, 12], ['SAN', 52, 60], ['幸运', 45, null], ['体温', 36, null]]);
  assert.equal(view['地点'].points.filter(p => p.danger).length, 1);
  assert.deepEqual(view['道具'].map(i => [i.name, i.qty]), [['医疗包', 1], ['子弹', 6]]);
  assert.equal(view['线索'][1].desc, '别相信月亮');
  assert.equal(view['判定'].result, '极难成功');
  assert.deepEqual(view['氛围'], [{ icon: '', label: '天气', text: '阴雨' }]);
  assert.deepEqual(view['选项'].map(o => o.text), ['翻登记簿', '走近铁门']);
  assert.equal(pickChapter(theme), 'C');
});

test('theme words pick the chapter skin from the game rulebook', () => {
  assert.equal(pickChapter('中世纪 搞笑'), 'A');
  assert.equal(pickChapter('赛博朋克'), 'D');
  assert.equal(pickChapter('赛博朋克 黑客 调查'), 'D');
  assert.equal(pickChapter('8bit 像素 地下城冒险'), 'E');
  assert.equal(pickChapter('复古 RPG'), 'E');
  assert.equal(pickChapter('太空 科幻'), 'C');
  assert.equal(pickChapter('克苏鲁调查'), 'C');
  assert.equal(pickChapter('宫廷剧场'), 'B');
  assert.equal(pickChapter('随便'), null);
});

test('exactly one card per turn, chosen by options and what changed', () => {
  const base = { '数值': { '金币': 3, '体面': '5/10' }, '地点': { '名称': '田', '可探索': ['车'] }, '背包': ['卷轴'], '人物': ['巫师'] };
  const t1 = normalizeState({ ...base, '选项': ['走'] }).view;
  assert.deepEqual(pickCard(t1, diffViews(null, t1), undefined, 'A'), { type: 'choice', variant: 'with-status', skin: 'A' });
  assert.equal(pickCard(t1, diffViews(null, t1), undefined, 'C').variant, 'terminal');
  assert.equal(pickCard(t1, diffViews(t1, t1), undefined, 'A').variant, 'compact');
  const noOpt = normalizeState(base).view;
  assert.deepEqual(pickCard(noOpt, diffViews(null, noOpt), undefined, 'A'), { type: 'map', variant: '', skin: 'B' });
  const moved = normalizeState({ ...base, '地点': '老磨坊' }).view;
  assert.equal(pickCard(moved, diffViews(noOpt, moved), undefined, 'A').type, 'location');
  const gained = normalizeState({ ...base, '背包': ['卷轴', '奶酪'] }).view;
  assert.equal(pickCard(gained, diffViews(noOpt, gained), undefined, 'A').type, 'items');
  const met = normalizeState({ ...base, '人物': ['巫师', '鹅'] }).view;
  assert.equal(pickCard(met, diffViews(noOpt, met), undefined, 'A').type, 'character');
  assert.equal(pickCard(noOpt, diffViews(noOpt, noOpt), undefined, 'A').type, 'status');
  assert.equal(pickCard(t1, diffViews(t1, t1), '背包', 'A').type, 'items');
  assert.equal(pickCard(t1, diffViews(t1, t1), '状态', 'A').type, 'status');
});

test('diff highlights stat deltas, new items, quest changes and moves', () => {
  const a = normalizeState({ '金币': 3, '体面': '5/10', '背包': ['卷轴'], '任务': [{ '名称': '问清楚', '完成': false }], '地点': '芜菁田' }).view;
  const b = normalizeState({ '金币': 2, '体面': '6/10', '背包': ['卷轴', '奶酪'], '任务': [{ '名称': '问清楚', '完成': true }, { '名称': '取魔杖' }], '地点': '老磨坊' }).view;
  const first = diffViews(null, a);
  assert.equal(first.first, true);
  assert.ok(first.sections.includes('道具'));
  const ch = diffViews(a, b);
  assert.deepEqual(ch.statDelta, { '金币': -1, '体面': 1 });
  assert.deepEqual(ch.newItems, ['奶酪']);
  assert.deepEqual(ch.questChanged, ['问清楚', '取魔杖']);
  assert.ok(ch.sections.includes('地点'));
  assert.ok(ch.summary.includes('来到：老磨坊'));
  const same = diffViews(b, b);
  assert.deepEqual(same.statDelta, {});
  assert.ok(!same.sections.includes('道具'));
});

test('tool keeps the skin across turns, resets on new game or new title', async () => {
  const store = new MemoryStore();
  const r1 = await callGameUiTool('render_game_ui', { state: { '标题': 'A', '金币': 3 }, theme: '克苏鲁', new_game: true }, store, 'u1');
  assert.equal(r1.structuredContent.chapter, 'C');
  assert.equal(r1.structuredContent.card.skin, 'C');
  const r2 = await callGameUiTool('render_game_ui', { state: { '金币': 5 }, card: '状态' }, store, 'u1');
  assert.equal(r2.structuredContent.card.skin, 'C');
  assert.equal(r2.structuredContent.card.type, 'status');
  assert.equal(r2.structuredContent.view['标题'], 'A');
  assert.equal(r2.structuredContent.changes.statDelta['金币'], 2);
  assert.match(r2.content[0].text, /金币\+2/);
  assert.match(r2.content[0].text, /状态卡/);
  const r3 = await callGameUiTool('render_game_ui', { state: { '标题': 'B', '金币': 1 } }, store, 'u1');
  assert.equal(r3.structuredContent.changes.first, true);
  const other = await callGameUiTool('render_game_ui', { state: { '金币': 9 } }, store, 'u2');
  assert.equal(other.structuredContent.changes.first, true);
  const reset = await callGameUiTool('render_game_ui', { state: { '标题': 'B', '金币': 0 }, new_game: true }, store, 'u1');
  assert.equal(reset.structuredContent.changes.first, true);
  await assert.rejects(callGameUiTool('render_game_ui', { state: {}, html: '<b>' }, store, 'u1'));
});

test('tool still renders when storage is unavailable', async () => {
  const broken = { get: async () => { throw new Error('down'); }, put: async () => { throw new Error('down'); } };
  const r = await callGameUiTool('render_game_ui', { state: { '金币': 1, '选项': ['继续'] } }, broken, 'u1');
  assert.equal(r.structuredContent.view['选项'][0].text, '继续');
  assert.match(r.content[0].text, /未能保存/);
});

test('string state and oversized input are handled safely', async () => {
  const { view } = normalizeState(JSON.stringify({ '金币': 5 }));
  assert.equal(view['数值'][0].value, 5);
  const huge = normalizeState({ '选项': Array.from({ length: 20 }, (_, i) => 'x'.repeat(200) + i) }).view;
  assert.equal(huge['选项'].length, 6);
  assert.ok(huge['选项'][0].text.length <= 80);
});

test('MCP discovery exposes the game UI tool and its widget resource', async () => {
  const send = async (method, params) => (await (await core.fetch(new Request('https://x.test/mcp', { method: 'POST', headers: { 'content-type': 'application/json', 'oai-authenticated-user-id': 'u' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }), {})).json()).result;
  const { tools } = await send('tools/list', {});
  const tool = tools.find(t => t.name === 'render_game_ui');
  assert.equal(tool._meta.ui.resourceUri, 'ui://b-game-ui/router-v5.html');
  assert.equal(tool._meta['openai/outputTemplate'], 'ui://b-game-ui/router-v5.html');
  assert.ok(tools.some(t => t.name === 'show_game_view'));
  assert.ok(!tools.some(t => /fog|probe/.test(t.name)));
  const { contents } = await send('resources/read', { uri: 'ui://b-game-ui/router-v5.html' });
  assert.equal(contents[0].mimeType, 'text/html;profile=mcp-app');
  const call = await send('tools/call', { name: 'render_game_ui', arguments: { state: { '金币': 1 } } });
  assert.equal(call.structuredContent.kind, 'game-ui');
});

test('widget uses the verified host bridge and loads nothing external', () => {
  for (const marker of ['ui/initialize', 'ui/message', 'ui/update-model-context', 'ui/notifications/tool-result', 'ui/notifications/size-changed', 'sendFollowUpMessage', 'function esc(']) {
    assert.ok(gameUiHtml.includes(marker), marker);
  }
  assert.ok(!/https?:\/\//.test(gameUiHtml));
  assert.ok(!/fonts\.googleapis/.test(gameUiHtml));
});

test('build bundle parses as a single Cloudflare worker', () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: new URL('..', import.meta.url) });
  execFileSync(process.execPath, ['--check', 'dist/worker.js'], { cwd: new URL('..', import.meta.url) });
});

test('game master view is parsed into the same cards, status line split apart', async () => {
  const { callGameViewTool } = await import('../worker/game-ui-tools.js');
  const store = new MemoryStore();
  const hub = { view: { saveId: 'save_x', gameKey: 'midnight-express', gameName: '午夜特快', turn: 93, choices: [],
    scene: '【年轻画家】\n你：案发当晚你做了什么？\n年轻画家：我在画速写。\n\n📍 餐车 | 🔍 线索 8 | ⏳ 时间线 2/15 | 💀 死亡 0/5 | ↩️ 回溯 7 | 🕐 剩余 65' } };
  const r1 = await callGameViewTool({ view: hub }, store, 'u1');
  const sc = r1.structuredContent;
  assert.equal(sc.card.type, 'status');
  assert.equal(sc.card.skin, 'C');
  assert.equal(sc.view['地点'].name, '餐车');
  assert.deepEqual(sc.view['数值'].map(s => [s.icon, s.label, s.value, s.max]), [['🔍', '线索', 8, null], ['⏳', '时间线', 2, 15], ['💀', '死亡', 0, 5], ['↩️', '回溯', 7, null], ['🕐', '剩余', 65, null]]);
  assert.ok(!sc.view['事件'][0].includes('📍'));
  hub.view.turn = 94; hub.view.scene = hub.view.scene.replace('线索 8', '线索 9').replace('📍 餐车', '📍 卧铺车厢');
  const r2 = await callGameViewTool({ view: hub }, store, 'u1');
  assert.equal(r2.structuredContent.changes.statDelta['线索'], 1);
  assert.ok(r2.structuredContent.changes.summary.includes('来到：卧铺车厢'));
  hub.view.choices = [{ id: 'a', label: '去问乘务员' }];
  const r3 = await callGameViewTool({ view: hub }, store, 'u1');
  assert.equal(r3.structuredContent.card.type, 'choice');
});

test('declared fields clamp numbers, restrict enums and keep locked values', async () => {
  const store = new MemoryStore();
  const fields = { '体面': { '类型': '数字', '范围': '0-10', '图标': '🎩' }, '紧张度': { '类型': '枚举', '选项': ['平静', '紧张'] }, '王冠': { '锁定': true } };
  await callGameUiTool('render_game_ui', { state: { '标题': 'F', '体面': 5, '紧张度': '平静', '王冠': 1 }, fields, new_game: true }, store, 'u9');
  const r = await callGameUiTool('render_game_ui', { state: { '体面': 14, '紧张度': '狂暴', '王冠': 3 } }, store, 'u9');
  const v = r.structuredContent.view;
  const st = l => v['数值'].find(s => s.label === l);
  assert.equal(st('体面').value, 10);
  assert.equal(st('体面').icon, '🎩');
  assert.equal(st('体面').max, 10);
  assert.equal(v['氛围'].find(m => m.label === '紧张度').text, '平静');
  assert.equal(st('王冠').value, 1);
  assert.equal(r.structuredContent.changes.warnings.length, 3);
  assert.match(r.content[0].text, /锁定/);
});

test('skin parameter pins a skin for the whole game; D/E stay on every card type', async () => {
  assert.equal(parseSkin('霓虹街区'), 'D');
  assert.equal(parseSkin('8bit'), 'E');
  assert.equal(parseSkin('自动'), null);
  const store = new MemoryStore();
  const r1 = await callGameUiTool('render_game_ui', { state: { '标题': '杂货铺', '金币': 3 }, theme: '日常', new_game: true, skin: '像素冒险海报' }, store, 'p');
  assert.equal(r1.structuredContent.card.skin, 'E');
  const r2 = await callGameUiTool('render_game_ui', { state: { '金币': 3, '地点': { '名称': '码头', '可探索': ['渔船'] } } }, store, 'p');
  assert.equal(r2.structuredContent.card.type, 'map');
  assert.equal(r2.structuredContent.card.skin, 'E');
  const r3 = await callGameUiTool('render_game_ui', { state: { '金币': 4 }, skin: '自动' }, store, 'p');
  assert.equal(r3.structuredContent.card.skin, 'A');
  const t = normalizeState({ '选项': ['走'] , 'HP': '3/5' }).view;
  assert.equal(pickCard(t, diffViews(null, t), undefined, 'D').variant, 'with-status');
});
