// 游戏卡片路由核心：字段名（关键词）→ 组件，题材词 → 皮肤，上一回合 → 变化。
// 只整理数据，不生成 HTML；界面由 game-ui-widget.js 在卡片里绘制。

export const KEYWORD_MAP = {
  '标题': ['标题', '游戏名', '游戏', 'title', 'game', 'gamename'],
  '题材': ['题材', '标签', '风格', 'theme', 'tags', 'genre'],
  '时间': ['时间', '回合', '天数', '日期', '倒计时', 'time', 'turn', 'day', 'clock'],
  '数值': ['状态', '数值', '属性', 'stats', 'status', '生命', 'hp', '血量', '体力', '理智', 'san', '幸运', '魔力', 'mp',
    '精力', '饱食', '水分', '金币', '金钱', 'gold', '钱', '体面', '奶酪', '声望', '压力', '污染'],
  '地点': ['地点', '场景', '位置', '所在', 'location', 'scene', 'place', 'room', 'locationname'],
  '事件': ['事件', '提示', '消息', '通知', 'event', 'notice', 'message'],
  '判定': ['判定', '检定', '骰子', '掷骰', '鉴定', 'roll', 'check', 'dice'],
  '道具': ['背包', '物品', '道具', '装备', 'inventory', 'items', 'bag'],
  '线索': ['线索', '证据', '笔记', 'clues', 'evidence', 'notes'],
  '人物': ['人物', '角色', 'npc', 'npcs', 'characters', 'people', '同伴', '队友'],
  '关系': ['关系', '好感', '信任', 'relations', 'relationship', 'trust'],
  '任务': ['任务', '目标', '任务清单', 'quests', 'quest', 'objectives', 'tasks', 'todo'],
  '选项': ['选项', '行动', '可选行动', 'choices', 'options', 'actions'],
  '氛围': ['天气', '紧张度', '紧张', '气氛', '氛围', '温度', '月相', '地形', '环境', 'weather', 'tension', 'mood', 'temperature', 'terrain'],
  '字段': ['字段', '字段定义', '字段声明', 'fields', 'schema']
};

// 章节皮肤（按 AI 游戏总纲 §四，只增不改）：A 纸面档案（默认）、B 剧场报幕（地点/章节）、C 异常终端（调查、科幻、恐怖）、
// D 霓虹街区（赛博朋克）、E 像素冒险海报（8-bit 复古）。按命中的最长关键词打分，不再固定先查 C。
export const CHAPTER_MAP = {
  C: ['科幻', '太空', '末日', '废土', '未来', '规则怪谈', '调查', '侦探', '悬疑', '推理', '恐怖', '克苏鲁', 'coc',
    '惊悚', '终端', '密室', '刑侦', '诡异', 'scifi', 'space', 'horror', 'mystery', 'detective'],
  B: ['剧场', '舞台', '宫廷', '歌剧', '戏剧', '话剧', '戏班', 'theater', 'theatre'],
  D: ['赛博', '赛博朋克', '霓虹', '黑客', '义体', '仿生', '赛博城', '夜之城', '电子', '蒸汽波', '合成波', 'cyberpunk', 'cyber', 'neon', 'hacker', 'synthwave', 'vaporwave'],
  E: ['像素', '8bit', '8-bit', '8位', '八位', '复古', '街机', '红白机', '地下城', '勇者', '魔王', '打怪', '刷怪', 'rpg', 'pixel', 'retro', 'arcade', 'dungeon', 'roguelike', '肉鸽'],
  A: ['中世纪', '奇幻', '搞笑', '童话', '冒险', '武侠', '仙侠', '古风', '日常', '经营', 'fantasy', 'medieval', 'comedy']
};

export const SKIN_LABEL = { A: '纸面档案', B: '剧场报幕', C: '异常终端', D: '霓虹街区', E: '像素冒险海报' };
// 玩家/AI 直接点名皮肤时用的名字。
const SKIN_ALIAS = { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E', '纸面': 'A', '纸面档案': 'A', '羊皮纸': 'A', '剧场': 'B', '剧场报幕': 'B',
  '终端': 'C', '异常终端': 'C', '霓虹': 'D', '霓虹街区': 'D', '赛博': 'D', '赛博朋克': 'D', '像素': 'E', '像素冒险海报': 'E', '8bit': 'E', '8-bit': 'E', '复古像素': 'E' };
export function parseSkin(v) {
  const t = String(v ?? '').trim().toLowerCase();
  if (!t || t === '自动' || t === 'auto') return null;
  return SKIN_ALIAS[t] || null;
}
export const CARD_LABEL = { choice: '选择卡', map: '地图节点选择卡', status: '状态卡', location: '地点卡', items: '物品卡', character: '角色卡' };
export const ORDER = ['事件', '判定', '地点', '道具', '线索', '人物', '关系', '任务', '其他'];

const NAME = ['名称', '名字', 'name', 'title', '标题', '内容', '文字', 'text', 'label'];
const DESC = ['说明', '描述', '备注', '身份', '效果', 'desc', 'description', 'note', 'detail'];
const CLOCK_LABEL = { time: '时间', clock: '时间', turn: '回合', day: '天数', date: '日期' };
const PLACE_ICONS = ['📍', '🗺', '🗺️', '🏠', '🏰', '📌'];
const LIMITS = { text: 300, list: 30, choices: 6 };

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const clip = (v, n = LIMITS.text) => String(v ?? '').slice(0, n);

// 字段名前面的表情或符号当作图标，后面的文字拿去匹配关键词。例：“🔍 线索” → 图标 🔍，名字 线索。
export function splitIcon(key) {
  const m = String(key ?? '').trim().match(/^([^\p{L}\p{N}\s]+)\s*(.*)$/u);
  if (m && m[2]) return { icon: m[1].slice(0, 4), label: m[2].trim() };
  return { icon: '', label: String(key ?? '').trim() };
}

export function matchComponent(key) {
  const k = splitIcon(key).label.toLowerCase();
  for (const [comp, words] of Object.entries(KEYWORD_MAP)) if (words.includes(k)) return comp;
  let best = null, bestLen = 0;
  for (const [comp, words] of Object.entries(KEYWORD_MAP)) {
    for (const w of words) if (w.length >= 2 && k.includes(w) && w.length > bestLen) { best = comp; bestLen = w.length; }
  }
  return best;
}

export function pickChapter(themeText) {
  const t = String(themeText || '').toLowerCase();
  if (!t) return null;
  let best = null, score = 0;
  for (const chapter of ['D', 'E', 'C', 'B', 'A']) {
    let sc = 0;
    for (const w of CHAPTER_MAP[chapter]) if (t.includes(w)) sc += w.length;
    if (sc > score) { best = chapter; score = sc; }
  }
  return best;
}

const REQUEST = { '状态': 'status', '状态卡': 'status', '地点': 'location', '地点卡': 'location', '地图': 'map', '物品': 'items', '背包': 'items',
  '物品卡': 'items', '线索': 'items', '角色': 'character', '人物': 'character', '角色卡': 'character', '选择': 'choice', '选择卡': 'choice' };

const filled = v => Array.isArray(v) ? v.length > 0 : !!v;

// 每次只出一张卡（总纲：每轮只渲染有变化的一张卡；一次不渲染多张）。
export function pickCard(view, changes, requested, chapter) {
  const has = s => changes.sections.includes(s);
  const want = REQUEST[String(requested || '').trim()];
  let type;
  if (want === 'map' && view['地点']?.points?.length) type = 'map';
  else if (want === 'location' && view['地点']) type = 'location';
  else if (want === 'items' && (filled(view['道具']) || filled(view['线索']))) type = 'items';
  else if (want === 'character' && filled(view['人物'])) type = 'character';
  else if (want === 'status') type = 'status';
  else if (want === 'choice' && filled(view['选项'])) type = 'choice';
  else if (filled(view['选项'])) type = 'choice';
  else if (view['地点']?.points?.length && (changes.first || has('地点'))) type = 'map';
  else if (view['地点'] && has('地点')) type = 'location';
  else if (changes.newItems.length || changes.newClues.length) type = 'items';
  else if (changes.newPeople.length || has('关系')) type = 'character';
  else type = 'status';

  let variant = '';
  if (type === 'choice') {
    const statChanged = Object.keys(changes.statDelta).some(k => !k.startsWith('关系:'));
    variant = chapter === 'C' ? 'terminal' : (view['数值'].length && (changes.first || statChanged)) ? 'with-status' : 'compact';
  }
  // C/D/E 整局统一皮肤；A 局里地点和地图卡用 B 剧场报幕。
  const skin = ['C', 'D', 'E', 'B'].includes(chapter) ? chapter : (type === 'location' || type === 'map') ? 'B' : 'A';
  return { type, variant, skin };
}

function first(obj, keys, fallback = undefined) {
  if (!isObj(obj)) return fallback;
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  return fallback;
}
const asList = v => v === undefined || v === null ? [] : Array.isArray(v) ? v : [v];

function num(v) {
  if (typeof v === 'boolean' || v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}
const isStatObj = v => isObj(v) && ['值', '当前', 'value', 'current', '上限', 'max'].some(k => k in v);

function stat(rawLabel, raw) {
  const { icon, label } = splitIcon(rawLabel);
  let value = null, max = null, text = null;
  if (typeof raw === 'boolean') text = raw ? '是' : '否';
  else if (typeof raw === 'number') value = Number.isFinite(raw) ? raw : null;
  else if (isObj(raw)) {
    value = num(first(raw, ['值', '当前', 'value', 'current']));
    max = num(first(raw, ['上限', 'max', '最大']));
    if (value === null) text = clip(first(raw, ['值', '当前', 'value', 'current'], ''), 40);
  } else {
    const s = String(raw ?? '').trim();
    const m = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
    const pct = s.match(/^(-?\d+(?:\.\d+)?)\s*%$/);
    if (m) { value = Number(m[1]); max = Number(m[2]); }
    else if (pct) { value = Number(pct[1]); max = 100; }
    else if (num(s) !== null) value = num(s);
    else text = clip(s, 40);
  }
  return { label: clip(label, 20), icon, value, max: max || null, text };
}

function named(item) {
  if (isObj(item)) {
    let name = first(item, NAME), desc = first(item, DESC, '');
    if (name === undefined && Object.keys(item).length === 1) [name, desc] = Object.entries(item)[0];
    return { name: clip(name ?? '未命名', 60), desc: clip(isObj(desc) ? JSON.stringify(desc) : desc, 160), raw: item };
  }
  return { name: clip(item, 60), desc: '', raw: null };
}

// 把“📍 灯塔底层 | 🔍 线索 8 | ⏳ 时间线 2/15”这类状态行拆成地点和数值。至少两段、用 | 分开才算。
export function parseStatusLine(text) {
  const lines = String(text ?? '').split(/\r?\n/);
  const out = { place: null, stats: [], moods: [], rest: String(text ?? '') };
  const idx = lines.findIndex(l => l.split(/[|｜]/).filter(x => x.trim()).length >= 2);
  if (idx < 0) return out;
  for (const seg of lines[idx].split(/[|｜]/).map(x => x.trim()).filter(Boolean)) {
    const { icon, label } = splitIcon(seg);
    const m = label.match(/^(.*?)\s*[:：]?\s*(-?\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?%?)$/);
    if (m && m[1]) out.stats.push(stat((icon ? icon + ' ' : '') + m[1], m[2].replace(/\s+/g, '')));
    else if (m && !m[1]) out.stats.push(stat((icon ? icon + ' ' : '') + '数值', m[2]));
    else if (!out.place && (PLACE_ICONS.includes(icon) || matchComponent(label) === '地点')) out.place = clip(label, 40);
    else {
      const sp = label.match(/^(\S+)\s+(.+)$/);
      if (sp && matchComponent(sp[1]) === '氛围') out.moods.push({ icon, label: clip(sp[1], 12), text: clip(sp[2], 30) });
      else out.moods.push({ icon, label: '', text: clip(label, 30) });
    }
  }
  out.rest = lines.filter((_, i) => i !== idx).join('\n').trim();
  return out;
}

const done = v => typeof v === 'boolean' ? v : ['完成', '已完成', 'done', 'true', 'yes', '是', '✓', '√'].includes(String(v ?? '').trim().toLowerCase());

export function normalizeState(state) {
  if (typeof state === 'string') { try { state = JSON.parse(state); } catch { state = { '事件': state }; } }
  if (!isObj(state)) state = {};
  const view = { '数值': [], '时间': [], '事件': [], '道具': [], '线索': [], '人物': [], '关系': [], '任务': [], '选项': [], '其他': [], '氛围': [] };
  let theme = '', fields = null;
  for (const [key, value] of Object.entries(state).slice(0, 40)) {
    const comp = matchComponent(key);
    if (comp === '标题') view['标题'] = clip(value, 40);
    else if (comp === '题材') theme = Array.isArray(value) ? value.join(' ') : String(value);
    else if (comp === '字段') fields = isObj(value) ? value : null;
    else if (comp === '氛围') {
      if (isObj(value) && !isStatObj(value)) for (const [k, v] of Object.entries(value).slice(0, 6)) view['氛围'].push({ ...splitIcon(k), text: clip(isObj(v) ? first(v, ['值', 'value', '描述'], '') : v, 30) });
      else view['氛围'].push({ ...splitIcon(key), text: clip(value, 30) });
    }
    else if (comp === '时间') view['时间'].push({ label: CLOCK_LABEL[String(key).trim().toLowerCase()] || clip(key, 12), text: clip(value, 40) });
    else if (comp === '数值') {
      if (isObj(value) && !isStatObj(value)) for (const [k, v] of Object.entries(value).slice(0, 12)) view['数值'].push(stat(k, v));
      else if (Array.isArray(value)) for (const it of value.slice(0, 12)) { if (isObj(it)) view['数值'].push(stat(first(it, NAME, '数值'), it)); }
      else view['数值'].push(stat(key, value));
    } else if (comp === '地点') {
      if (isObj(value)) {
        const points = [
          ...asList(first(value, ['可探索', '探索点', '互动点', 'points', 'explore'])).slice(0, 8).map(p => ({ name: named(p).name, danger: false })),
          ...asList(first(value, ['危险', '警告', 'danger', 'hazards'])).slice(0, 8).map(p => ({ name: named(p).name, danger: true }))
        ];
        view['地点'] = { name: clip(first(value, [...NAME, '地点', 'location'], '未知地点'), 40), desc: clip(first(value, DESC, '')), points, progress: clip(first(value, ['探索度', '进度', 'progress'], ''), 8), alert: clip(first(value, ['突发', '突发事件', 'alert'], ''), 80) };
      } else view['地点'] = { name: clip(value, 40), desc: '', points: [], progress: '', alert: '' };
    } else if (comp === '事件') view['事件'].push(...asList(value).slice(0, 4).map(v => typeof v === 'string' ? clip(v, 400) : named(v).name));
    else if (comp === '判定') {
      view['判定'] = isObj(value)
        ? { name: clip(first(value, ['项目', '技能', '属性', 'name', 'skill'], '判定'), 20), roll: clip(first(value, ['骰值', '点数', '掷出', 'roll', 'value'], '?'), 12),
            target: clip(first(value, ['目标', '难度', '目标值', 'target', 'difficulty'], ''), 12), result: clip(first(value, ['结果', 'outcome', 'result'], ''), 12) }
        : { name: '判定', roll: '?', target: '', result: clip(value, 12) };
    } else if (comp === '道具') {
      if (isObj(value) && !NAME.some(k => k in value)) view['道具'] = Object.entries(value).slice(0, LIMITS.list).map(([k, v]) => ({ name: clip(k, 60), desc: '', qty: num(v) }));
      else view['道具'] = asList(value).slice(0, LIMITS.list).map(it => { const n = named(it); return { name: n.name, desc: n.desc, qty: n.raw ? num(first(n.raw, ['数量', 'qty', 'count'])) : null }; });
    } else if (comp === '线索') {
      view['线索'] = asList(value).slice(0, LIMITS.list).map(it => { const n = named(it); return { name: n.name, desc: n.raw ? clip(first(n.raw, ['内容', ...DESC], n.desc), 160) : '' }; });
    } else if (comp === '人物') {
      view['人物'] = asList(value).slice(0, LIMITS.list).map(it => {
        const n = named(it);
        let rel = null, relLabel = '';
        for (const rk of ['信任', '好感', '关系', 'trust', 'affinity']) {
          if (n.raw && n.raw[rk] !== undefined && n.raw[rk] !== null && n.raw[rk] !== '') { rel = clip(n.raw[rk], 12); relLabel = { trust: '信任', affinity: '好感' }[rk] || rk; break; }
        }
        return { name: n.name, desc: n.desc, rel, relLabel };
      });
    } else if (comp === '关系') {
      view['关系'] = isObj(value)
        ? Object.entries(value).slice(0, LIMITS.list).map(([k, v]) => stat(k, v))
        : asList(value).filter(isObj).slice(0, LIMITS.list).map(it => stat(first(it, [...NAME, '对象'], '?'), first(it, ['值', '信任', '好感', 'value'], '')));
    } else if (comp === '任务') {
      if (isObj(value) && !NAME.some(k => k in value)) view['任务'] = Object.entries(value).slice(0, LIMITS.list).map(([k, v]) => ({ name: clip(k, 60), done: done(v) }));
      else view['任务'] = asList(value).slice(0, LIMITS.list).map(it => { const n = named(it); return { name: n.name, done: n.raw ? done(first(n.raw, ['完成', '已完成', 'done', '状态', 'status'])) : false }; });
    } else if (comp === '选项') {
      view['选项'] = asList(value).map(it => { const n = named(it); return { text: clip(n.name, 80).trim(), desc: n.desc }; }).filter(o => o.text).slice(0, LIMITS.choices);
    } else if ((typeof value === 'number' && Number.isFinite(value)) || isStatObj(value) || (typeof value === 'string' && /^-?\d+(?:\.\d+)?\s*(?:\/\s*\d+(?:\.\d+)?|%)$/.test(value.trim()))) {
      view['数值'].push(stat(key, value));
    } else {
      const text = Array.isArray(value) ? value.map(v => named(v).name).join('、') : isObj(value) ? JSON.stringify(value) : String(value);
      view['其他'].push({ label: clip(key, 20), text: clip(text, 160) });
    }
  }
  // 事件文字里夹带的状态行：拆出来变成地点和数值，原文去掉这一行。
  view['事件'] = view['事件'].map(t => {
    const p = parseStatusLine(t);
    if (!p.stats.length && !p.place && !p.moods.length) return t;
    const known = new Set(view['数值'].map(s => s.label));
    for (const st of p.stats) if (!known.has(st.label)) view['数值'].push(st);
    if (p.place && !view['地点']) view['地点'] = { name: p.place, desc: '', points: [], progress: '', alert: '' };
    view['氛围'].push(...p.moods);
    return p.rest;
  }).filter(Boolean);
  return { view, theme, fields };
}

const names = (view, comp) => new Set((view?.[comp] || []).map(x => x.name));
const minus = (a, b) => [...a].filter(x => !b.has(x));
const round = d => Number.isInteger(d) ? d : Math.round(d * 100) / 100;

export function diffViews(prev, cur) {
  const firstTurn = !prev;
  prev = prev || {};
  const ch = { first: firstTurn, statDelta: {}, newItems: [], newClues: [], newPeople: [], questChanged: [], moodChanged: [], sections: [], summary: [], warnings: [] };
  const sections = new Set();
  const prevStats = new Map((prev['数值'] || []).map(s => [s.label, s]));
  for (const s of cur['数值'] || []) {
    const p = prevStats.get(s.label);
    if (p && typeof s.value === 'number' && typeof p.value === 'number' && s.value !== p.value) {
      const d = round(s.value - p.value);
      ch.statDelta[s.label] = d;
      ch.summary.push(s.label + (d > 0 ? '+' : '') + d);
    } else if (p && s.text && s.text !== p.text) ch.statDelta[s.label] = '变';
  }
  const prevRel = new Map((prev['关系'] || []).map(s => [s.label, s]));
  for (const s of cur['关系'] || []) {
    const p = prevRel.get(s.label);
    if (p && typeof s.value === 'number' && typeof p.value === 'number' && s.value !== p.value) { ch.statDelta['关系:' + s.label] = round(s.value - p.value); sections.add('关系'); }
  }
  for (const [comp, key, word] of [['道具', 'newItems', '获得'], ['线索', 'newClues', '新线索'], ['人物', 'newPeople', '遇见']]) {
    if (firstTurn) continue;
    const added = minus(names(cur, comp), names(prev, comp));
    ch[key] = added;
    if (added.length) { sections.add(comp); ch.summary.push(word + '：' + added.join('、')); }
    if (minus(names(prev, comp), names(cur, comp)).length) sections.add(comp);
  }
  const prevQ = new Map((prev['任务'] || []).map(q => [q.name, q.done]));
  if (!firstTurn) for (const q of cur['任务'] || []) {
    if (!prevQ.has(q.name) || prevQ.get(q.name) !== q.done) {
      ch.questChanged.push(q.name); sections.add('任务');
      ch.summary.push((q.done ? '完成任务：' : '新任务：') + q.name);
    }
  }
  if ((cur['地点'] || {}).name !== (prev['地点'] || {}).name) {
    sections.add('地点');
    if (!firstTurn && cur['地点']) ch.summary.push('来到：' + cur['地点'].name);
  }
  const prevMood = new Map((prev['氛围'] || []).map(m => [m.label || m.icon, m.text]));
  ch.moodChanged = [];
  if (!firstTurn) for (const m of cur['氛围'] || []) {
    const k = m.label || m.icon;
    if (prevMood.has(k) && prevMood.get(k) !== m.text) { ch.moodChanged.push(k); ch.summary.push((m.label || m.icon) + '：' + m.text); }
  }
  for (const comp of ['事件', '判定', '其他']) if (cur[comp] && (!Array.isArray(cur[comp]) || cur[comp].length)) sections.add(comp);
  if (firstTurn) for (const comp of ORDER) if (cur[comp] && (!Array.isArray(cur[comp]) || cur[comp].length)) sections.add(comp);
  ch.sections = [...sections];
  return ch;
}

export function shownComponents(view) {
  return [...ORDER, '数值', '选项'].filter(c => view[c] && (!Array.isArray(view[c]) || view[c].length));
}

// 字段声明（借鉴 Doom's Enhancement Suite 的字段类型和锁定）：
// {"饥饿": {"类型": "数字", "范围": "0-10", "图标": "🍞"}, "紧张度": {"类型": "枚举", "选项": ["平静","不安","紧张"]}, "王冠": {"锁定": true}}
const TYPE_ALIAS = { '数字': 'number', 'number': 'number', '进度': 'progress', 'progress': 'progress', '枚举': 'enum', '选项': 'enum', 'enum': 'enum',
  '文字': 'text', 'text': 'text', '真假': 'bool', 'boolean': 'bool', 'bool': 'bool' };

export function normalizeFields(raw) {
  const out = {};
  if (!isObj(raw)) return out;
  for (const [k, v] of Object.entries(raw).slice(0, 20)) {
    const { icon, label } = splitIcon(k);
    const d = isObj(v) ? v : { '类型': v };
    const range = String(first(d, ['范围', 'range'], '')).match(/(-?\d+(?:\.\d+)?)\s*[-~～到至]\s*(-?\d+(?:\.\d+)?)/);
    out[clip(label, 20)] = {
      type: TYPE_ALIAS[String(first(d, ['类型', 'type'], 'text')).toLowerCase()] || 'text',
      min: range ? Number(range[1]) : (num(first(d, ['最小', 'min'])) ?? null),
      max: range ? Number(range[2]) : (num(first(d, ['最大', '上限', 'max'])) ?? null),
      options: asList(first(d, ['选项', 'options'], [])).map(x => clip(x, 20)).slice(0, 12),
      icon: clip(first(d, ['图标', 'icon'], icon), 4),
      locked: first(d, ['锁定', 'locked'], false) === true
    };
  }
  return out;
}

// 按声明校正这一回合的数据：数字夹到范围内、枚举只认列出的词、锁定的值保持上一回合。返回提醒文字。
export function applyFields(view, fields, prevView) {
  const warnings = [];
  const prevStats = new Map((prevView?.['数值'] || []).map(s => [s.label, s]));
  const prevMood = new Map((prevView?.['氛围'] || []).map(m => [m.label, m]));
  for (const [label, f] of Object.entries(fields || {})) {
    const st = view['数值'].find(s => s.label === label);
    const md = view['氛围'].find(m => m.label === label);
    if (st) {
      if (f.icon && !st.icon) st.icon = f.icon;
      if (f.type === 'progress') st.max = st.max || 100;
      if (f.max !== null && !st.max && f.type !== 'enum') st.max = f.max;
      if (typeof st.value === 'number' && (f.min !== null || f.max !== null)) {
        const clamped = Math.min(f.max ?? Infinity, Math.max(f.min ?? -Infinity, st.value));
        if (clamped !== st.value) { warnings.push(label + ' 超出范围，已按 ' + (f.min ?? '') + '~' + (f.max ?? '') + ' 显示为 ' + clamped); st.value = clamped; }
      }
      if (f.type === 'enum' && st.text && f.options.length && !f.options.includes(st.text)) {
        const keep = prevStats.get(label)?.text || f.options[0];
        warnings.push(label + ' 只能是 ' + f.options.join('/') + '，“' + st.text + '”不在其中，已保持 ' + keep); st.text = keep;
      }
      const p = prevStats.get(label);
      if (f.locked && p && (p.value !== st.value || p.text !== st.text)) {
        warnings.push(label + ' 是锁定值，不能由叙事修改，已保持 ' + (p.value ?? p.text)); st.value = p.value; st.text = p.text; st.max = p.max;
      }
    }
    if (md) {
      if (f.icon && !md.icon) md.icon = f.icon;
      if (f.type === 'enum' && f.options.length && !f.options.includes(md.text)) {
        const keep = prevMood.get(label)?.text || f.options[0];
        warnings.push(label + ' 只能是 ' + f.options.join('/') + '，已保持 ' + keep); md.text = keep;
      }
      const p = prevMood.get(label);
      if (f.locked && p && p.text !== md.text) { warnings.push(label + ' 是锁定值，已保持 ' + p.text); md.text = p.text; }
    }
    if (!st && !md && f.locked) {
      const p = prevStats.get(label);
      if (p) view['数值'].push({ ...p });
    }
  }
  return warnings;
}
