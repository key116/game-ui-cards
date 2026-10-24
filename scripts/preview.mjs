// 生成本地预览页：模拟 ChatGPT 的 MCP Apps 宿主，把示例游戏状态交给真实的 render_game_ui 和卡片。
// 用法：node scripts/preview.mjs [failSends]  → 输出到 dist/preview/*.html，用浏览器打开即可。
// failSends：让宿主前 N 次拒绝发送，用来检查重试和手动复制。
import { mkdir, writeFile } from 'node:fs/promises';
import { callGameUiTool, callGameViewTool } from '../worker/game-ui-tools.js';
import { gameUiHtml } from '../worker/game-ui-widget.js';

class MemoryStore {
  constructor() { this.map = new Map(); this.n = 0; }
  async get(key) { const row = this.map.get(key); return row ? { etag: row.etag, json: async () => JSON.parse(row.value) } : null; }
  async put(key, value, { onlyIf }) {
    const row = this.map.get(key);
    if (onlyIf instanceof Headers ? row : row?.etag !== onlyIf?.etagMatches) return null;
    const etag = 'e' + (++this.n); this.map.set(key, { value, etag }); return { etag };
  }
}

const failSends = Number(process.argv[2] || 0);
const store = new MemoryStore();
const scenes = [];
const run = async (name, args, user) => scenes.push([name, await callGameUiTool('render_game_ui', args, store, user)]);

const bake1 = {
  '标题': '面包店学徒', '回合': 1, '数值': { '铜币': 12, '体力': '8/10', '面包': 0 },
  '地点': { '名称': '面包店后厨', '描述': '凌晨四点，烤炉刚热起来，窗外还是黑的。', '可探索': ['烤炉', '面粉仓'], '危险': ['发烫的铁盘'], '探索度': '10%' },
  '事件': '老板娘把围裙丢给你：天亮前烤好三十个面包，不然别想领工钱。',
  '人物': [{ '名称': '老板娘', '备注': '嘴硬心软，起床气很大' }],
  '任务': [{ '名称': '天亮前烤好三十个面包', '完成': false }],
  '选项': ['先揉面，把第一炉送进烤炉', '问老板娘老面种放在哪', '偷吃一个昨天剩下的牛角包']
};
const bake2 = { ...bake1, '回合': 2, '数值': { '铜币': 12, '体力': '7/10', '面包': 10 }, '事件': '第一炉出炉，香得整条街的猫都醒了。',
  '判定': { '项目': '烘焙', '骰值': 17, '目标': 50, '结果': '成功' }, '背包': [{ '名称': '老面种', '说明': '师傅留下的，据说有三十年' }],
  '选项': ['趁热再进第二炉', '给窗外的猫丢一块面包边', '去面粉仓补一袋面粉'] };
const bake3 = { ...bake2, '回合': 3, '事件': '一只橘猫跳上窗台，盯着你手里的面包。', '选项': ['把面包边分给橘猫', '关上窗户继续干活'] };
delete bake3['判定'];
const bake4 = { ...bake3, '回合': 4, '人物': [{ '名称': '老板娘', '备注': '嘴硬心软，起床气很大' }, { '名称': '橘猫', '备注': '自称是这家店真正的老板', '好感': 1 }] };
delete bake4['事件']; delete bake4['选项'];
const bake5 = { ...bake4, '回合': 5, '背包': [...bake4['背包'], { '名称': '旧食谱', '说明': '夹在面粉袋里，缺了最后一页' }, { '名称': '黄油', '说明': '刚从地窖拿上来', '数量': 2 }], '线索': ['面粉仓里有一串小脚印'] };
const bake6 = { ...bake5, '回合': 6, '地点': { '名称': '地窖', '描述': '很凉，墙上挂着一排没贴标签的罐子。', '可探索': ['酱料架', '旧木箱'], '危险': ['湿滑的台阶'], '探索度': '0%' } };
await run('1-choice-status', { state: bake1, theme: '日常 经营', new_game: true }, 'bake');
await run('2-choice-status-roll', { state: bake2 }, 'bake');
await run('3-choice-compact', { state: bake3 }, 'bake');
await run('4-character', { state: bake4 }, 'bake');
await run('5-items', { state: bake5 }, 'bake');
await run('6-map', { state: bake6 }, 'bake');
await run('7-location', { state: bake6, card: '地点' }, 'bake');
await run('8-status', { state: bake6, card: '状态' }, 'bake');
await run('9-terminal', { state: {
  '标题': '阿卡姆疑云', '时间': '1928.9.15 午后', 'HP': '11/12', 'SAN': { '值': 52, '上限': 60 }, '幸运': 45,
  '判定': { '项目': '图书馆使用', '骰值': 12, '目标': 60, '结果': '极难成功' }, '事件': '书架深处传来翻页声',
  '选项': ['翻看借阅登记簿', '走近那扇半开的铁门', '回到楼上找图书管理员问话'] }, theme: '克苏鲁', new_game: true }, 'coc');

// 游戏总管的真实画面（午夜特快第 93 回合）→ 新卡片
const hub = { view: { saveId: 'save_demo', gameKey: 'midnight-express', gameName: '午夜特快', turn: 93, choices: [],
  scene: '【年轻画家】\n你：案发当晚你做了什么？\n年轻画家：我在画速写，画到凌晨一点才睡，中间没有离开过包厢。你要我证明——我没有，但我确实没有离开过。\n\n📍 餐车 | 🔍 线索 8 | ⏳ 时间线 2/15 | 💀 死亡 0/5 | ↩️ 回溯 7 | 🕐 剩余 65' } };
scenes.push(['h1-hub-status', await callGameViewTool({ view: hub }, store, 'hubuser')]);
const hub2 = { view: { ...hub.view, turn: 94, choices: [{ id: 'a', label: '翻看画家的速写本' }, { id: 'b', label: '去卧铺车厢找乘务员' }],
  scene: '你注意到速写本最后一页画着一扇半开的包厢门。\n\n📍 卧铺车厢 | 🔍 线索 9 | ⏳ 时间线 3/15 | 💀 死亡 0/5 | ↩️ 回溯 7 | 🕐 剩余 64' } };
scenes.push(['h2-hub-choice', await callGameViewTool({ view: hub2 }, store, 'hubuser')]);
// 字段声明 + 氛围 + 换地点横幅（皮肤 A）
await run('f1-fields', { state: { '标题': '海边杂货铺', '时间': '第3天 傍晚', '🪙 金币': 42, '📦 货架': '60%', '天气': '小雨', '紧张度': '平静', '选项': ['把雨伞摆到门口', '关店去码头'] },
  theme: '日常 经营', new_game: true, fields: { '紧张度': { '类型': '枚举', '选项': ['平静', '忙碌', '紧张'] } } }, 'shop');
await run('f2-move', { state: { '标题': '海边杂货铺', '时间': '第3天 夜', '🪙 金币': 38, '📦 货架': '55%', '天气': '暴雨', '紧张度': '忙碌', '地点': '码头',
  '事件': '渔夫老韩：今晚的船回不来了，你那还有绳子吗？', '选项': ['卖给他两捆绳子', '先问问出了什么事'] } }, 'shop');
// 皮肤 D 霓虹街区 / E 像素冒险海报
await run('d1-neon-choice', { state: { '标题': 'NEON-7 夜班', '时间': '02:47', '❤ HP': '7/10', '⚡ 电量': '35%', '💴 信用点': 1200, '热度': '追缉',
  '判定': { '项目': '破解', '骰值': 71, '目标': 60, '结果': '成功' }, '事件': '门禁屏闪了一下，绿灯亮起。', '选项': ['溜进机房拔走硬盘', '先黑进监控把自己抹掉', '呼叫中间人老K'] }, theme: '赛博朋克 黑客', new_game: true }, 'neon');
await run('d2-neon-status', { state: { '标题': 'NEON-7 夜班', '时间': '02:55', '❤ HP': '6/10', '⚡ 电量': '30%', '💴 信用点': 1200, '热度': '追缉', '地点': '天台停机坪',
  '事件': '【中间人老K】\n老K：硬盘到手了？我在天台等你，别带尾巴。', '背包': ['加密硬盘'] }, card: '状态' }, 'neon');
await run('d3-neon-items', { state: { '标题': 'NEON-7 夜班', '❤ HP': '6/10', '背包': [{ '名称': '加密硬盘', '说明': '荒坂内部数据' }, { '名称': '义眼补丁', '数量': 2 }], '线索': ['硬盘标签写着 0xDEAD'] }, card: '背包' }, 'neon');
await run('e1-pixel-choice', { state: { '标题': '勇者与史莱姆', '回合': 1, 'HP': '18/20', 'MP': '5/8', '💰 G': 30, 'LV': 2,
  '判定': { '项目': '攻击', '骰值': 4, '目标': 10, '结果': '失败' }, '事件': '史莱姆：噗叽！（它弹开了你的剑）', '选项': ['再砍一刀', '施放火焰术', '扔一块面包引开它', '逃跑'] }, theme: '8bit 像素 地下城', new_game: true }, 'pixel');
await run('e2-pixel-map', { state: { '标题': '勇者与史莱姆', '回合': 2, 'HP': '15/20', 'MP': '5/8', '💰 G': 42, 'LV': 2,
  '地点': { '名称': '史莱姆洞窟 B1', '描述': '滴水声在洞里回荡，地上有黏糊糊的痕迹。', '可探索': ['宝箱', '向下的楼梯'], '危险': ['巨型史莱姆'], '探索度': '20%' } } }, 'pixel');
await run('e3-pixel-character', { state: { '标题': '勇者与史莱姆', 'HP': '15/20', '人物': [{ '名称': '老铁匠', '备注': '会给新手打折', '好感': 3 }] }, card: '人物' }, 'pixel');

const host = (result) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f4f4;font-family:sans-serif"><div style="max-width:430px;margin:0 auto;padding:8px">
<iframe id="w" sandbox="allow-scripts" style="width:100%;height:300px;border:0;display:block"></iframe><pre id="log" style="font-size:11px;white-space:pre-wrap"></pre></div>
<script>
window.hostLog = []; let fails = ${failSends};
const result = ${JSON.stringify(result).replace(/</g, '\\u003c')};
const w = document.getElementById('w');
const reply = (id, payload) => w.contentWindow.postMessage({ jsonrpc: '2.0', id, ...payload }, '*');
window.addEventListener('message', (e) => {
  if (e.source !== w.contentWindow) return;
  const m = e.data; window.hostLog.push(m); document.getElementById('log').textContent += m.method + ' ' + JSON.stringify(m.params || {}).slice(0, 120) + '\\n';
  if (m.method === 'ui/initialize') { reply(m.id, { result: { protocolVersion: '2026-01-26', hostCapabilities: { message: {}, updateModelContext: {} }, hostContext: { theme: 'light' } } }); }
  if (m.method === 'ui/notifications/initialized') w.contentWindow.postMessage({ jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: result }, '*');
  if (m.method === 'ui/update-model-context') reply(m.id, { result: {} });
  if (m.method === 'ui/message') { if (fails > 0) { fails--; reply(m.id, { error: { code: -32000, message: '模拟网络中断' } }); } else reply(m.id, { result: {} }); }
  if (m.method === 'ui/notifications/size-changed') w.style.height = m.params.height + 'px';
});
w.srcdoc = ${JSON.stringify(gameUiHtml).replace(/</g, '\\u003c')};
</script></body></html>`;

await mkdir(new URL('../dist/preview/', import.meta.url), { recursive: true });
for (const [name, result] of scenes) await writeFile(new URL('../dist/preview/' + name + '.html', import.meta.url), host(result));
console.log('Wrote', scenes.map(s => 'dist/preview/' + s[0] + '.html').join(', '));
