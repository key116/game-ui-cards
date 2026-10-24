import { normalizeState, diffViews, pickChapter, pickCard, parseSkin, SKIN_LABEL, CARD_LABEL, normalizeFields, applyFields } from './game-ui-core.js';

export const GAME_UI_URI = 'ui://b-game-ui/router-v5.html';

const gameUiMeta = {
  ui: { resourceUri: GAME_UI_URI, visibility: ['model', 'app'] },
  'openai/outputTemplate': GAME_UI_URI,
  'openai/widgetAccessible': true,
  'openai/toolInvocation/invoking': '正在绘制游戏界面…',
  'openai/toolInvocation/invoked': '游戏界面已显示'
};

export const gameUiTools = [
  {
    name: 'render_game_ui',
    title: '显示游戏界面卡片',
    description:
      '把当前游戏状态显示成游戏 UI 卡片。每回合先写 2～4 句叙事，再调用一次本工具，放在回复最后。' +
      '每次只显示一张卡，由工具按字段名和本回合变化自动决定：有选项出选择卡（顶部带判定和本回合变化），否则按变化出地点卡、物品卡、角色卡或状态卡；按题材词选择皮肤（五套：纸面档案、剧场报幕、异常终端、霓虹街区=赛博朋克、像素冒险海报=8-bit 复古），也可以用 skin 直接指定，指定一次整局沿用。' +
      '玩家想单独看背包、状态、人物或地点时，把 card 设为“背包”“状态”“人物”“地点”。' +
      '字段名前可以加一个表情当图标（如 "🍞 饥饿": 6）。数值写法：数字、"当前/上限"、"40%"。天气、紧张度、氛围类字段会显示在卡片顶部的场景条。' +
      '新游戏第一次调用时用 fields 声明字段类型，之后会自动按声明校正：{"体面":{"类型":"数字","范围":"0-10"},"紧张度":{"类型":"枚举","选项":["平静","不安","紧张","敌对"]},"王冠":{"锁定":true}}。锁定的值叙事不能改，改了会被保持原值并提醒你。' +
      'state 用中文字段名，每回合交完整的当前状态，没有的字段不填。示例：' +
      '{"标题":"面包店学徒","回合":3,"数值":{"铜币":12,"体力":"6/10"},"地点":{"名称":"面包店后厨","描述":"一句画面描写","可探索":["烤炉","面粉仓"],"危险":["发烫的铁盘"]},' +
      '"事件":"猫从窗台跳下来，叼走了一个牛角包","判定":{"项目":"追猫","骰值":34,"目标":50,"结果":"成功"},"背包":[{"名称":"老面种","说明":"师傅留下的"}],' +
      '"线索":["面粉仓里有小脚印"],"人物":[{"名称":"老板娘","备注":"嘴硬心软","好感":2}],"任务":[{"名称":"天亮前烤好三十个面包","完成":false}],' +
      '"选项":["把牛角包抢回来","先把烤炉的火调小","去面粉仓看看脚印"]}。选项写成玩家会说出口的完整行动句，2～4 个。' +
      '调用后不要在文字里再罗列数值、背包或选项；玩家点卡片上的选项后，那句行动会作为玩家消息发来。',
    inputSchema: {
      type: 'object',
      properties: {
        state: { type: 'object', additionalProperties: true, description: '当前完整游戏状态，中文字段名。' },
        theme: { type: 'string', maxLength: 60, description: '题材词，如“中世纪 搞笑”“克苏鲁”“赛博朋克”。新游戏第一次调用时填。' },
        new_game: { type: 'boolean', description: '开始新的一局时为 true，清掉上一局的对比记录。' },
        card: { type: 'string', enum: ['自动', '选择', '状态', '背包', '人物', '地点', '地图'], description: '默认自动。玩家要求看某张卡时才指定。' },
        game_id: { type: 'string', maxLength: 40, description: '本局编号。新游戏第一次调用后工具会返回一个，之后每次调用都原样带上。' },
        skin: { type: 'string', enum: ['自动', '纸面档案', '剧场报幕', '异常终端', '霓虹街区', '像素冒险海报'], description: '可选，直接指定皮肤；玩家点名风格（如“赛博朋克”“8bit 像素”）时用。指定后整局沿用，换回自动按题材判断。' },
        fields: { type: 'object', additionalProperties: true, description: '可选。字段声明：类型（数字/进度/枚举/文字/真假）、范围、选项、图标、锁定。声明一次即可，之后沿用。' }
      },
      required: ['state'],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false, idempotentHint: false },
    _meta: gameUiMeta
  }
];

export class GameUiError extends Error {}

async function sha(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

async function readRecord(store, key) {
  const object = await store.get(key);
  if (!object) return { record: null, etag: null };
  try {
    const record = await object.json();
    return { record: record?.schemaVersion === 2 ? record : null, etag: object.etag };
  } catch {
    return { record: null, etag: object.etag };
  }
}

async function writeRecord(store, key, etag, record) {
  return store.put(key, JSON.stringify(record), {
    httpMetadata: { contentType: 'application/json' },
    onlyIf: etag ? { etagMatches: etag } : new Headers({ 'If-None-Match': '*' })
  });
}

// 已知的推理类游戏代号固定用终端皮肤；其余按标题题材词判断，判断不出用 A。
const ENGINE_CHAPTER = { 'blue-rose-manor': 'C', 'midnight-express': 'C', 'faded-station': 'C', 'loop-station': 'C', 'archive-terminal': 'C', 'fog-station-lost-found': 'C' };

async function renderPipeline({ view, themeText, fieldsDecl, newGame, cardRequest, store, key, fixedChapter, skinRequest }) {
  let previous = null, etag = null;
  if (store) {
    try { ({ record: previous, etag } = await readRecord(store, key)); } catch { previous = null; }
  }
  if (newGame === true) previous = null;
  if (previous && view['标题'] && previous.view?.['标题'] && previous.view['标题'] !== view['标题']) previous = null;
  if (!view['标题'] && previous?.view?.['标题']) view['标题'] = previous.view['标题'];

  const fields = { ...(previous?.fields || {}), ...normalizeFields(fieldsDecl) };
  const warnings = applyFields(view, fields, previous?.view || null);
  // 皮肤优先级：本次指定 > 本局之前指定 > 引擎固定 > 本次题材词 > 上回合 > A。
  const pinned = skinRequest === undefined ? (previous?.pinnedSkin || null) : parseSkin(skinRequest);
  const autoChapter = fixedChapter || pickChapter(themeText) || previous?.autoChapter || (previous && !previous.pinnedSkin ? previous.chapter : null) || 'A';
  const chapter = pinned || autoChapter;
  const changes = diffViews(previous?.view || null, view);
  changes.warnings = warnings;
  const card = pickCard(view, changes, cardRequest, chapter);
  const turnIndex = (previous?.turnIndex || 0) + 1;

  let saved = false;
  if (store) {
    const record = { schemaVersion: 2, chapter, autoChapter, pinnedSkin: pinned, fields, view, turnIndex, updatedAt: new Date().toISOString() };
    try {
      saved = !!(await writeRecord(store, key, etag, record));
      if (!saved) {
        const again = await readRecord(store, key);
        saved = !!(await writeRecord(store, key, again.etag, record));
      }
    } catch { saved = false; }
  }

  const text =
    '已显示一张' + CARD_LABEL[card.type] + '（皮肤 ' + card.skin + ' ' + SKIN_LABEL[card.skin] + '）。' +
    (changes.summary.length ? '本回合变化：' + changes.summary.join('；') + '。' : '') +
    (warnings.length ? '数据校正：' + warnings.join('；') + '。下回合请按校正后的值继续。' : '') +
    (saved ? '' : '（本回合对比记录未能保存，下回合的变化高亮可能不准，不影响游戏。）') +
    (card.type === 'choice' || card.type === 'map' ? '选项已在卡片上，不要在文字里重复选项；等玩家点选或自己打字。' : '这回合没有选项按钮，可以在文字里简短问玩家想做什么。') +
    '不要在文字里罗列数值和背包。';

  return {
    content: [{ type: 'text', text }],
    structuredContent: { kind: 'game-ui', schemaVersion: 2, card, chapter, turnIndex, view, changes }
  };
}

// 记录归属：私人部署整份归主人；公开部署按平台给的匿名用户号（有就用）分人，再按 game_id 分局。
function ownerOf(userId, meta) {
  if (userId !== 'public') return userId || 'anonymous';
  const subject = meta && typeof meta['openai/subject'] === 'string' ? meta['openai/subject'] : '';
  return 'public:' + (subject || 'anon');
}
function cleanId(v) { return typeof v === 'string' ? v.trim().replace(/[^\w-]/g, '').slice(0, 40) : ''; }
function newGameId() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint8Array(8));
  return 'G' + [...r].map(n => abc[n % abc.length]).join('');
}

export async function callGameUiTool(name, args, store, userId, meta) {
  if (name !== 'render_game_ui') throw new GameUiError('未知游戏界面工具。');
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new GameUiError('参数必须是对象。');
  if (Object.keys(args).some(k => !['state', 'theme', 'new_game', 'card', 'fields', 'skin', 'game_id'].includes(k))) throw new GameUiError('包含未知参数。');
  if (args.theme !== undefined && typeof args.theme !== 'string') throw new GameUiError('theme 必须是文字。');
  if (args.card !== undefined && typeof args.card !== 'string') throw new GameUiError('card 必须是文字。');
  if (args.skin !== undefined && typeof args.skin !== 'string') throw new GameUiError('skin 必须是文字。');

  const { view, theme: themeInState, fields } = normalizeState(args.state);
  const userHash = await sha(ownerOf(userId, meta));
  let gameId = cleanId(args.game_id);
  const issued = !gameId && args.new_game === true && userId === 'public';
  if (issued) gameId = newGameId();
  const result = await renderPipeline({
    view, themeText: args.theme || themeInState, fieldsDecl: args.fields || fields, newGame: args.new_game, cardRequest: args.card,
    store, key: 'b-game-ui/v2/' + userHash + '/' + (gameId ? 'g-' + (await sha(gameId)) : 'current') + '.json', skinRequest: args.skin
  });
  if (gameId) {
    result.structuredContent.gameId = gameId;
    result.content[0].text = (issued ? '本局编号 game_id = ' + gameId + '，之后每次调用 render_game_ui 都原样带上它。' : '') + result.content[0].text;
  } else if (userId === 'public') {
    result.content[0].text += '（提醒：没带 game_id，变化对比可能和别人的记录混在一起；新游戏请设 new_game 为 true 领取编号。）';
  }
  return result;
}

// 游戏总管 get_game_view 的画面 → 同一套卡片。按存档分别记录上一回合，规则和存档仍由游戏总管负责。
export async function callGameViewTool(args, store, userId, meta) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new GameUiError('参数必须是对象。');
  if (Object.keys(args).some(k => !['view', 'theme', 'card', 'skin', 'game_id'].includes(k))) throw new GameUiError('包含未知参数。');
  const root = args.view && typeof args.view === 'object' ? args.view : {};
  const v = root.view && typeof root.view === 'object' ? root.view : root.structuredContent?.view || root;
  const state = {};
  state['标题'] = v.gameName || v.title || '游戏';
  if (v.turn !== undefined && v.turn !== null) state['回合'] = v.turn;
  if (v.scene || v.sceneText) state['事件'] = String(v.scene || v.sceneText);
  for (const k of ['location', 'locationName', 'evidence', 'clues', 'inventory', 'people', 'npcs', 'objectives', 'tasks', 'status']) if (v[k] !== undefined) state[k] = v[k];
  const choices = v.choices || v.actions;
  if (Array.isArray(choices) && choices.length) state['选项'] = choices;
  if (v.completed) state['结局'] = '本关已完结';
  const { view } = normalizeState(state);
  const userHash = await sha(ownerOf(userId, meta));
  const saveId = String(v.saveId || v.id || cleanId(args.game_id) || state['标题']);
  const gameKey = String(v.gameKey || v.gameType || '');
  return renderPipeline({
    view, themeText: args.theme || state['标题'], fieldsDecl: null, newGame: false, cardRequest: args.card || (state['选项'] ? undefined : '状态'),
    store, key: 'b-game-ui/v2/' + userHash + '/hub-' + (await sha(saveId)) + '.json',
    fixedChapter: args.theme ? null : (ENGINE_CHAPTER[gameKey] || null), skinRequest: args.skin
  });
}
