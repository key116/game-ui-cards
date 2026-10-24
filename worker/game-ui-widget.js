// 游戏界面卡片（按 AI 游戏总纲 §四：母卡 4 张 + 选择卡 1 张，皮肤 A/B/C/D/E）。
// 字体：内嵌 OFL 开源字体（只含拉丁字符，见 game-ui-fonts.js）；音效：Web Audio 现场合成，不加载任何外部文件。
// 每次只画一张卡；展示卡纯静态；选择卡可点，点后销毁为一行文字记录。
// 样式写死在这里，AI 只交数据；颜色显式写死，不跟随系统深浅色。
import { FONT_CSS } from './game-ui-fonts.js';

export const gameUiHtml = String.raw`<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>游戏界面</title>
<style>
/*FONTS*/
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:transparent;-webkit-text-size-adjust:100%}
body{padding:6px 10px 12px 6px;font:13px/1.5 "Songti SC","STSong","Noto Serif SC",serif}
.A{--bg:#E8DCC3;--ink:#43352A;--main:#3C4A66;--hot:#7C3B2C;--gold:#AE8A55;--soft:#F1E7D0;--mute:#8A7356;--drop:#8A6F4A;--good:#2F6B45;--bad:#7C3B2C;--warn:#9A6A1C}
.B{--bg:#221510;--ink:#F2E7D5;--main:#D9B878;--hot:#6E2E24;--gold:#B8924F;--soft:#3A2519;--mute:#A89A86;--drop:#0D0806;--good:#A9CF9A;--bad:#E0624C;--warn:#D9B878}
.C{--bg:#0A0F0A;--ink:#4ADE80;--main:#4ADE80;--hot:#F87171;--gold:#2F8A50;--soft:#102016;--mute:#4A9A68;--drop:#020502;--good:#4ADE80;--bad:#F87171;--warn:#FBBF24}
.card{position:relative;background:var(--bg);color:var(--ink);padding:10px 12px}
.card.A{border:1px solid var(--gold);box-shadow:3px 4px 0 var(--drop),0 6px 14px #43352A33}
.card.A::before{content:"";position:absolute;inset:3px;border:1px dashed #AE8A5588;pointer-events:none}
.card.B{border:3px double var(--gold);box-shadow:0 0 18px #B8924F33}
.card.C{font-family:Menlo,"SF Mono","Courier New",monospace;font-size:12px;border:1px solid var(--gold);box-shadow:0 0 0 4px #1E3A24,0 0 14px #4ADE8033;margin:4px;overflow:hidden}
.card.C::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,#FFFFFF07 0 1px,transparent 1px 3px);pointer-events:none}
.head{display:flex;align-items:baseline;gap:6px;margin-bottom:6px}
.head .t{font-weight:700;font-size:14px;letter-spacing:1px}
.head .star{color:var(--gold)}
.head .en{font-family:Georgia,serif;font-size:10px;letter-spacing:2px;color:var(--mute)}
.head .r{margin-left:auto;font-family:Georgia,serif;font-size:11px;color:var(--mute)}
.judge{display:flex;align-items:center;gap:8px;margin:2px 0 5px;font-size:12.5px}
.die{width:28px;height:28px;flex:none;display:grid;place-items:center;border:1.5px solid var(--main);color:var(--main);font-family:Georgia,serif;font-weight:700;transform:rotate(-5deg);background:var(--soft)}
.stamp{margin-left:auto;border:1.5px solid currentColor;padding:0 7px;transform:rotate(-8deg);font-weight:700;font-size:12px}
.ok{color:var(--good)}.bad{color:var(--bad)}.mid{color:var(--main)}
.news{font-size:12px;color:var(--hot);margin:0 0 6px}
.B .news{color:var(--main)}
.ev{font-size:12px;color:var(--mute);margin:0 0 6px}
.ev::before{content:"— "}
.top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 8px;font-size:11px;color:var(--mute);font-family:Georgia,serif;margin-bottom:3px}
.top b{color:var(--main);font-size:12px}
.d{font-size:10px;font-weight:700;margin-left:2px}.d.up{color:var(--good)}.d.down{color:var(--bad)}
.bar{display:flex;align-items:center;gap:6px;font-size:12px;margin:3px 0}
.bar .n{min-width:34px;flex:none;white-space:nowrap}
.bar .t{flex:1;height:6px;background:#D2C2A0;border:1px solid #B9A37C}
.B .bar .t{background:#3A2519;border-color:#6E5536}
.C .bar .t{background:#102016;border-color:#1E3A24}
.bar .t i{display:block;height:100%;background:var(--main)}
.bar .t i.low{background:var(--bad)}
.bar .v{font-family:Georgia,serif;color:var(--main);font-weight:700;min-width:40px;text-align:right}
.quick{display:flex;flex-wrap:wrap;gap:5px;margin:5px 0;font-size:11.5px}
.quick span{border:1px solid var(--gold);padding:1px 6px;background:var(--soft)}
.quick em{font-style:normal;color:var(--hot);font-weight:700;margin-left:3px}
.goal{font-size:12px;margin:3px 0}
.goal b{color:var(--hot);margin-right:6px}
.line{height:1px;background:var(--gold);margin:8px 0 7px;position:relative}
.line::before,.line::after{content:"◆";position:absolute;top:-7px;font-size:8px;color:var(--gold)}
.line::after{right:0}
.opts{margin-top:2px}
.opt{display:flex;gap:7px;align-items:flex-start;width:100%;text-align:left;font:inherit;font-size:13px;line-height:1.4;color:var(--ink);background:var(--soft);border:1px solid var(--gold);padding:6px 9px;margin:0 0 6px;cursor:pointer;box-shadow:0 3px 0 var(--drop);clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,6px 100%,0 calc(100% - 6px));transition:transform .08s,box-shadow .08s;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.opt:active,.opt.press{transform:translateY(2px);box-shadow:0 1px 0 var(--drop);border-color:var(--hot)}
.opt .k{background:var(--main);color:var(--bg);font-size:10px;width:16px;height:16px;display:grid;place-items:center;flex:none;font-family:Georgia,serif;margin-top:1px}
.C .opt{clip-path:none;box-shadow:none;font-family:inherit;font-size:12px;padding:5px 8px;margin:4px 0 0;color:var(--ink);border-color:var(--gold)}
.C .opt:active,.C .opt.press{transform:none;background:#1E3A24;border-color:var(--ink)}
.C .p{white-space:pre-wrap}
.C .p.w{color:var(--warn)}.C .p.r{color:var(--hot)}.C .p.dim{color:var(--mute)}
.rec{text-align:right;color:var(--mute);font-size:10px;margin-top:6px}
.loc-en{font-family:Georgia,serif;font-size:9px;letter-spacing:3px;color:var(--mute)}
.loc-name{font-size:16px;font-weight:700;letter-spacing:2px;color:var(--main)}
.loc-desc{font-size:12.5px;margin:4px 0 8px;opacity:.92}
.scene{margin:-10px -12px 8px;padding:16px 12px 10px;background:radial-gradient(ellipse at 70% 0%,#D9B87833,transparent 60%),linear-gradient(180deg,#3A2519,#221510)}
.A .scene{background:radial-gradient(ellipse at 70% 0%,#FFF8E655,transparent 60%),linear-gradient(180deg,#D8C7A4,#E8DCC3)}
.C .scene{background:radial-gradient(ellipse at 70% 0%,#4ADE8022,transparent 60%),linear-gradient(180deg,#102016,#0A0F0A)}
.nodes{display:flex;flex-wrap:wrap;gap:6px}
.node{font:inherit;font-size:12.5px;color:var(--ink);background:var(--soft);border:1px solid var(--gold);padding:4px 10px 4px 8px;display:flex;align-items:center;gap:6px;box-shadow:0 3px 0 var(--drop);-webkit-tap-highlight-color:transparent;touch-action:manipulation}
button.node{cursor:pointer}
button.node:active,button.node.press{transform:translateY(2px);box-shadow:0 1px 0 var(--drop)}
.node i{width:8px;height:8px;flex:none;transform:rotate(45deg);background:var(--main)}
.node.dg{border-color:var(--bad)}.node.dg i{background:var(--bad)}
.prog{font-size:11px;color:var(--mute);margin-top:8px;font-family:Georgia,serif}
.alert{font-size:12px;color:var(--bad);margin-top:5px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.tile{position:relative;border:1px solid var(--gold);background:var(--soft);padding:6px 8px;box-shadow:2px 2px 0 var(--drop);min-height:46px}
.tile .nm{font-weight:700;display:block;font-size:13px;padding-right:40px}
.tile .q{font-family:Georgia,serif;font-size:11px;color:var(--mute);margin-left:4px;font-weight:400}
.tile .ds{display:block;font-size:11px;color:var(--mute);line-height:1.4}
.tile .tag{position:absolute;top:-1px;right:-1px;font-size:10px;font-weight:700;padding:0 5px;background:var(--hot);color:var(--bg)}
.tile .tag.clue{background:var(--main)}
.tile.new{border-color:var(--hot);border-width:1.5px}
.foot{font-size:11.5px;color:var(--mute);margin-top:7px;border-top:1px solid var(--gold);padding-top:5px}
.who{display:flex;gap:10px}
.face{width:82px;height:104px;flex:none;display:grid;place-items:center;border:1px solid var(--gold);outline:3px double var(--gold);outline-offset:-7px;background:radial-gradient(circle at 50% 35%,#FFF8E6aa,transparent 65%),var(--soft);font-size:30px;font-weight:700;color:var(--main)}
.B .face,.C .face{background:radial-gradient(circle at 50% 35%,#FFFFFF22,transparent 65%),var(--soft)}
.info{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.info .nm{font-size:16px;font-weight:700;letter-spacing:1px}
.info .id{font-size:12px;color:var(--mute)}
.chips{display:flex;flex-wrap:wrap;gap:4px}
.chips span{font-size:11px;border:1px solid var(--gold);padding:0 6px}
.info .rl{margin-top:2px;font-size:11.5px;color:var(--mute)}
.info .rl b{color:var(--main);font-family:Georgia,serif}
.tl{margin-top:6px;font-size:11.5px;color:var(--mute)}
.tl div::before{content:"· ";color:var(--gold)}
.done{font-size:12.5px;padding:8px 10px;border:1px dashed var(--gold);background:var(--bg);color:var(--ink)}
.done .s{display:block;font-size:11px;color:var(--mute);margin-top:3px}
.done .s.bad{color:var(--bad)}
.recover{display:none;margin-top:6px;gap:6px;flex-wrap:wrap}
.recover.on{display:flex}
.recover button{font:inherit;font-size:12px;color:var(--ink);background:var(--soft);border:1px solid var(--hot);padding:3px 10px;cursor:pointer}
.recover textarea{flex-basis:100%;font:inherit;font-size:12px;color:var(--ink);background:var(--soft);border:1px solid var(--gold);padding:5px;min-height:40px}
.loading{color:#8A7356;padding:14px;text-align:center}
.strip{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:11.5px;color:var(--mute);margin:0 0 6px}
.strip span b{color:var(--ink);font-weight:700}
.strip .chg b{color:var(--hot)}
.cine{margin:-10px -12px 8px;padding:9px 12px 8px;text-align:center;border-bottom:1px solid var(--gold);background:linear-gradient(90deg,transparent,#B8924F22,transparent)}
.cine .l{font-size:15px;font-weight:700;letter-spacing:4px;color:var(--main)}
.cine .t{font-size:10px;letter-spacing:2px;color:var(--mute);font-family:Georgia,serif}
.B .cine .l{color:#D9B878;text-shadow:0 0 12px #D9B87855}
.C .cine{background:linear-gradient(90deg,transparent,#4ADE8018,transparent)}
.C .cine .l{color:var(--ink);text-shadow:0 0 10px #4ADE8055}
.dlg{font-size:12.5px;line-height:1.55;margin:0 0 8px;padding:6px 9px;background:var(--soft);border-left:2px solid var(--gold)}
.dlg div{margin:1px 0}
.dlg .spk{font-weight:700;color:var(--main);margin-right:2px}
.dlg .hd{font-weight:700;letter-spacing:1px;color:var(--hot)}
.C .dlg{background:#0F1A10;border-left-color:var(--ink)}
.ic{margin-right:2px}
.hint{font-size:11px;color:var(--mute);margin-top:7px;padding-top:5px;border-top:1px dashed var(--gold)}
/* ===== 皮肤 D 霓虹街区（赛博朋克） ===== */
.D{--bg:#0B0A1F;--ink:#E0E7FF;--main:#22D3EE;--hot:#FF2E88;--gold:#A855F7;--soft:#15133A;--mute:#8B8FC7;--drop:#05041A;--good:#22D3EE;--bad:#FF2E88;--warn:#FACC15}
.card.D,.done.D,.card.E,.done.E{font-family:"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif}
.card.D{margin:4px;border:1px solid var(--main);box-shadow:0 0 0 1px #FF2E8844,0 0 18px #22D3EE40,inset 0 0 26px #A855F722;background:linear-gradient(#22D3EE0C 1px,transparent 1px) 0 0/100% 16px,linear-gradient(90deg,#22D3EE0C 1px,transparent 1px) 0 0/16px 100%,var(--bg)}
.card.D::before{content:"";position:absolute;top:-1px;left:-1px;width:18px;height:18px;border-top:2px solid var(--hot);border-left:2px solid var(--hot);pointer-events:none}
.card.D::after{content:"";position:absolute;bottom:-1px;right:-1px;width:18px;height:18px;border-bottom:2px solid var(--main);border-right:2px solid var(--main);pointer-events:none}
.D .head .t{font-family:GNeon,"PingFang SC",sans-serif;letter-spacing:1.5px;text-shadow:-1px 0 #FF2E88,1px 0 #22D3EE}
.D .head .star{color:var(--hot);text-shadow:0 0 6px var(--hot)}
.D .head .en,.D .loc-en,.D .cine .t{font-family:GNeon,sans-serif;font-size:9px;letter-spacing:3px;color:var(--hot)}
.D .head .r,.D .top,.D .prog{font-family:GTerm,monospace;font-size:14px}
.D .top b,.D .bar .v,.D .tile .q,.D .info .rl b{font-family:GTerm,monospace;font-size:16px;color:var(--main);text-shadow:0 0 6px #22D3EE88}
.D .bar .t{height:5px;background:#15133A;border-color:#2A2760}
.D .bar .t i{background:linear-gradient(90deg,#22D3EE,#A855F7,#FF2E88);box-shadow:0 0 6px #22D3EE88}
.D .bar .t i.low{background:var(--hot);box-shadow:0 0 6px var(--hot)}
.D .line{background:linear-gradient(90deg,transparent,var(--hot),var(--main),transparent)}
.D .line::before,.D .line::after{color:var(--main)}
.D .opt{background:#15133AEE;border-color:#2A2760;box-shadow:none;border-left:2px solid var(--main)}
.D .opt .k{background:var(--hot);color:#fff;font-family:GNeon,sans-serif;box-shadow:0 0 6px var(--hot)}
.D .opt:active,.D .opt.press{transform:translateX(3px);box-shadow:0 0 14px #22D3EE66;border-color:var(--main)}
.D .die{transform:none;border-color:var(--main);background:#15133A;font-family:GTerm,monospace;font-size:19px;box-shadow:0 0 8px #22D3EE66}
.D .stamp{transform:none;box-shadow:0 0 8px currentColor}
.D .news{color:var(--hot)}
.D .quick span,.D .tile,.D .node{background:#15133A;border-color:#2A2760;box-shadow:none}
.D .tile.new{border-color:var(--hot);box-shadow:0 0 10px #FF2E8855}
.D .node{border-color:var(--main)}.D .node i{background:var(--main);box-shadow:0 0 5px var(--main)}
.D .scene{background:radial-gradient(ellipse at 85% 0%,#FF2E8838,transparent 60%),linear-gradient(180deg,#1A1145,#0B0A1F);border-bottom:1px solid var(--hot)}
.D .loc-name{font-family:GNeon,"PingFang SC",sans-serif;color:#fff;text-shadow:0 0 8px #22D3EE,2px 0 #FF2E88}
.D .cine{background:linear-gradient(90deg,transparent,#FF2E8826,transparent);border-bottom-color:var(--hot)}
.D .cine .l{color:#fff;text-shadow:0 0 10px var(--hot),-2px 0 var(--hot),2px 0 var(--main)}
.D .dlg{background:#15133A;border-left-color:var(--hot)}
.D .dlg .hd{color:var(--main)}
.D .face{background:radial-gradient(circle at 50% 35%,#22D3EE33,transparent 65%),#15133A;outline-color:var(--hot);color:var(--main);font-family:GNeon,sans-serif;text-shadow:0 0 10px var(--main)}
.D .chips span{border-color:var(--gold)}
.D .hint,.D .foot{border-top-color:#2A2760}
.done.D{border-color:var(--hot);box-shadow:0 0 10px #FF2E8840}
/* ===== 皮肤 E 像素冒险海报（8-bit 复古） ===== */
.E{--bg:#F4E4C1;--ink:#2B1B17;--main:#3A6EA5;--hot:#B5302A;--gold:#2B1B17;--soft:#FFF4DA;--mute:#7A5C45;--drop:#2B1B17;--good:#3E8E41;--bad:#B5302A;--warn:#F2B33D}
.card.E{margin:2px 6px 6px 2px;padding:14px 12px 10px;border:3px solid var(--ink);box-shadow:4px 4px 0 var(--ink)}
.card.E::before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:repeating-linear-gradient(90deg,var(--hot) 0 10px,var(--warn) 10px 20px);border-bottom:2px solid var(--ink);pointer-events:none}
.E .head .t{font-weight:800;letter-spacing:1px;text-shadow:2px 2px 0 #E3CFA4}
.E .head .star{color:var(--hot)}
.E .head .en,.E .loc-en,.E .cine .t{font-family:GPixel,monospace;font-size:7px;letter-spacing:1px;color:var(--hot)}
.E .head .r,.E .top,.E .prog{font-family:GPixel,"PingFang SC",monospace;font-size:8px;line-height:1.9}
.E .top b,.E .bar .v,.E .tile .q,.E .info .rl b{font-family:GPixel,monospace;font-size:9px;color:var(--main)}
.E .bar .n{font-weight:700}
.E .bar .t{height:11px;background:#E3CFA4;border:2px solid var(--ink)}
.E .bar .t i{background:repeating-linear-gradient(90deg,var(--good) 0 6px,#2E6B30 6px 8px)}
.E .bar .t i.low{background:repeating-linear-gradient(90deg,var(--bad) 0 6px,#7A1F1A 6px 8px)}
.E .line{height:0;background:none;border-top:3px dotted var(--ink)}
.E .line::before,.E .line::after{content:"■";top:-9px;font-size:9px;color:var(--hot)}
.E .opt{clip-path:none;background:var(--ink);color:#FFF4DA;border:2px solid #FFF4DA;outline:2px solid var(--ink);box-shadow:3px 3px 0 #2B1B1799;margin:2px 2px 8px}
.E .opt .k{display:block;white-space:nowrap;background:none;color:var(--warn);font-family:GPixel,monospace;font-size:9px;width:auto;height:auto;margin-top:4px}
.E .info .en{font-family:GPixel,monospace!important;font-size:7px!important;color:var(--hot)!important}
.D .info .en{font-family:GNeon,sans-serif!important;font-size:9px!important;color:var(--hot)!important}
.E .opt .k::before{content:"▶ "}
.E .opt:active,.E .opt.press{transform:translate(2px,2px);box-shadow:1px 1px 0 #2B1B1799;border-color:var(--warn)}
.E .die{transform:none;border:2px solid var(--ink);background:var(--soft);color:var(--hot);font-family:GPixel,monospace;font-size:10px;box-shadow:2px 2px 0 var(--ink)}
.E .stamp{transform:none;border-width:2px;font-weight:800}
.E .quick span{border:2px solid var(--ink);box-shadow:2px 2px 0 var(--ink)}
.E .tile{border:2px solid var(--ink);box-shadow:3px 3px 0 var(--ink)}
.E .tile.new{border-color:var(--hot)}
.E .tile .tag{border-left:2px solid var(--ink);border-bottom:2px solid var(--ink)}
.E .node{border:2px solid var(--ink);box-shadow:2px 2px 0 var(--ink)}
.E .node i{transform:none;border-radius:0}
.E .scene{margin:-14px -12px 8px;padding:18px 12px 10px;background:linear-gradient(180deg,#5DA9E9 0 70%,#8FCB6A 70%);border-bottom:3px solid var(--ink)}
.E .loc-en{color:#FFF4DA}
.E .loc-name{color:#fff;text-shadow:2px 2px 0 var(--ink),-1px -1px 0 var(--ink)}
.E .loc-desc{color:var(--ink);background:#FFF4DAE6;border:2px solid var(--ink);padding:3px 6px;margin-bottom:2px}
.E .cine{margin:-14px -12px 8px;padding:14px 12px 7px;background:var(--hot);border-bottom:3px solid var(--ink)}
.E .cine .l{color:#fff;text-shadow:2px 2px 0 var(--ink)}
.E .cine .t{color:#FFF4DA}
.E .dlg{position:relative;background:#1C1430;color:#FFF4DA;border:3px solid #FFF4DA;outline:3px solid var(--ink);margin:3px 3px 10px;padding:6px 9px 12px}
.E .dlg .spk{color:var(--warn)}
.E .dlg .hd{color:var(--warn)}
.E .dlg::after{content:"▼";position:absolute;right:7px;bottom:1px;font-size:9px;color:var(--warn);animation:bob .8s steps(2) infinite}
@keyframes bob{50%{transform:translateY(-3px)}}
.E .face{border:3px solid var(--ink);outline:none;background:repeating-linear-gradient(0deg,#FFF4DA 0 6px,#F4E4C1 6px 12px);color:var(--hot);font-size:34px;text-shadow:3px 3px 0 var(--ink)}
.E .chips span{border:2px solid var(--ink)}
.E .hint,.E .foot{border-top:2px dashed var(--ink)}
.done.E{border:3px dashed var(--ink);font-weight:700}
</style></head>
<body><main id="app"><p class="loading">正在载入游戏界面…</p></main>
<script>
(function(){
  var root = document.getElementById('app');
  var pending = {}, seq = 0, mode = 'standard', caps, ready = false, current = null, audio = null, sentText = null;

  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function fmt(v){ return typeof v === 'number' && !Number.isInteger(v) ? String(Math.round(v * 10) / 10) : String(v); }
  function has(list, x){ return Array.isArray(list) && list.indexOf(x) >= 0; }
  function list(v){ return Array.isArray(v) ? v : []; }
  function delta(d){ return typeof d === 'number' && d ? '<span class="d ' + (d > 0 ? 'up' : 'down') + '">' + (d > 0 ? '+' : '') + fmt(d) + '</span>' : ''; }
  var VITAL = /生命|hp|血|理智|san|体力|精力|电量|饱食|水分|体面|耐久|氧气/i;
  function isNum(s){ return s.value !== null && s.value !== undefined; }

  function tone(res){ return /大成功|极难成功|critical/i.test(res) ? 'ok' : /成功|通过|success/i.test(res) ? 'ok' : /失败|fail/i.test(res) ? 'bad' : 'mid'; }
  function judge(v){
    var j = v['判定']; if (!j) return '';
    return '<div class="judge"><span class="die">' + esc(j.roll) + '</span><span>' + esc(j.name) + '判定' + (j.target !== '' && j.target != null ? ' · 目标 ' + esc(j.target) : '') +
      '</span><span class="stamp ' + tone(j.result || '') + '">' + esc(j.result || '?') + '</span></div>';
  }
  function news(ch, onlyGains){
    var moods = list(ch.moodChanged);
    var s = list(ch.summary).filter(function(t){
      t = String(t);
      if (t.indexOf('来到：') === 0) return false;
      if (moods.some(function(k){ return t.indexOf(k + '：') === 0; })) return false;
      return !onlyGains || t.indexOf('：') >= 0;
    });
    return s.length && !ch.first ? '<div class="news">' + s.map(esc).join(' · ') + '</div>' : '';
  }
  function lab(s){ return (s.icon ? '<span class="ic">' + esc(s.icon) + '</span>' : '') + esc(s.label); }
  function isDialogue(t){ return /\n/.test(t) || /^[【\[]/.test(t) || /^[^\n：:]{1,10}[：:]/.test(t); }
  function dialogue(t){
    return '<div class="dlg">' + String(t).split(/\n/).filter(function(x){ return x.trim(); }).slice(0, 8).map(function(line){
      var h = line.match(/^\s*[【\[](.{1,16})[】\]]\s*$/);
      if (h) return '<div class="hd">' + esc(h[1]) + '</div>';
      var m = line.match(/^\s*([^：:]{1,10})[：:]\s*(.*)$/);
      return m ? '<div><span class="spk">' + esc(m[1]) + '：</span>' + esc(m[2]) + '</div>' : '<div>' + esc(line) + '</div>';
    }).join('') + '</div>';
  }
  function events(v){ return list(v['事件']).slice(0, 2).map(function(t){ return isDialogue(t) ? dialogue(t) : '<div class="ev">' + esc(t) + '</div>'; }).join(''); }
  function strip(v, ch, withPlace){
    var parts = [];
    if (withPlace && v['地点']) parts.push('<span>📍 <b>' + esc(v['地点'].name) + '</b></span>');
    list(v['时间']).filter(function(c){ return c.label !== '回合'; }).forEach(function(c){ parts.push('<span>' + esc(c.label) + ' <b>' + esc(c.text) + '</b></span>'); });
    list(v['氛围']).forEach(function(m){ var k = m.label || m.icon; parts.push('<span class="' + (has(ch.moodChanged, k) ? 'chg' : '') + '">' + (m.icon ? esc(m.icon) + ' ' : '') + (m.label ? esc(m.label) + ' ' : '') + '<b>' + esc(m.text) + '</b></span>'); });
    return parts.length ? '<div class="strip">' + parts.join('') + '</div>' : '';
  }
  function cine(v, ch){
    if (ch.first || !v['地点'] || !has(ch.sections, '地点')) return '';
    var t = list(v['时间']).filter(function(c){ return c.label !== '回合'; }).map(function(c){ return esc(c.text); }).join(' · ');
    return '<div class="cine"><div class="l">' + esc(v['地点'].name) + '</div>' + (t ? '<div class="t">' + t + '</div>' : '<div class="t">SCENE CHANGE</div>') + '</div>';
  }
  function turnText(v){
    var c = list(v['时间']), r = c.filter(function(x){ return x.label === '回合'; });
    return r.length ? '第 ' + esc(r[0].text) + ' 回合' : c.map(function(x){ return esc(x.text); }).join(' · ');
  }

  function statusBlock(v, ch, withTimeline){
    var stats = list(v['数值']);
    var bars = stats.filter(function(s){ return isNum(s) && s.max; }).slice(0, 4);
    var plain = stats.filter(function(s){ return bars.indexOf(s) < 0; }).slice(0, 5);
    var rt = list(v['时间']).filter(function(x){ return x.label === '回合'; })[0];
    var html = '<div class="top"><span>' + (rt ? '第 ' + esc(rt.text) + ' 回合' : '') + '</span><span>' + plain.map(function(s){
      return lab(s) + ' <b>' + (isNum(s) ? fmt(s.value) : esc(s.text)) + '</b>' + delta(ch.statDelta[s.label]);
    }).join(' · ') + '</span></div>';
    html += bars.map(function(s){
      var pct = Math.max(0, Math.min(100, s.value / s.max * 100));
      return '<div class="bar"><span class="n">' + lab(s) + '</span><span class="t"><i class="' + (pct <= 25 && VITAL.test(s.label) ? 'low' : '') + '" style="width:' + Math.round(pct) + '%"></i></span><span class="v">' + fmt(s.value) + '/' + fmt(s.max) + delta(ch.statDelta[s.label]) + '</span></div>';
    }).join('');
    var items = list(v['道具']).slice().sort(function(a, b){ return has(ch.newItems, b.name) - has(ch.newItems, a.name); }).slice(0, 4);
    if (items.length) html += '<div class="quick">' + items.map(function(it){ return '<span>' + esc(it.name) + (it.qty != null && it.qty !== 1 ? ' ×' + fmt(it.qty) : '') + (has(ch.newItems, it.name) ? '<em>新</em>' : '') + '</span>'; }).join('') + '</div>';
    var goal = list(v['任务']).filter(function(q){ return !q.done; })[0];
    if (goal) html += '<div class="goal"><b>目标</b>' + esc(goal.name) + '</div>';
    if (withTimeline) {
      var tl = list(v['事件']).concat(list(ch.summary).filter(function(t){ return String(t).indexOf('：') >= 0; })).slice(0, 3);
      if (tl.length) html += '<div class="tl">' + tl.map(function(t){ return '<div>' + esc(t) + '</div>'; }).join('') + '</div>';
    }
    return html;
  }

  function optionButtons(v, terminal){
    return '<div class="opts">' + list(v['选项']).map(function(o, i){
      var k = 'ABCDEF'.charAt(i);
      return terminal
        ? '<button type="button" class="opt" data-say="' + esc(o.text) + '">&gt; ' + k + ' ' + esc(o.text) + '</button>'
        : '<button type="button" class="opt" data-say="' + esc(o.text) + '"><span class="k">' + k + '</span><span>' + esc(o.text) + '</span></button>';
    }).join('') + '</div>';
  }

  function choiceCard(v, ch, card){
    if (card.variant === 'terminal') {
      var lines = [];
      var j = v['判定'];
      if (j) lines.push('<div class="p ' + (tone(j.result || '') === 'bad' ? 'r' : '') + '">&gt; ' + esc(j.name) + '判定 ' + esc(j.roll) + (j.target !== '' && j.target != null ? ' / ' + esc(j.target) : '') + ' [' + (tone(j.result || '') === 'bad' ? 'FAIL' : tone(j.result || '') === 'ok' ? 'OK' : '??') + '] ' + esc(j.result || '') + '</div>');
      if (!ch.first && v['地点'] && has(ch.sections, '地点')) lines.unshift('<div class="p">&gt; [场景切换] ' + esc(v['地点'].name) + '</div>');
      else if (v['地点']) lines.push('<div class="p dim">&gt; 📍 ' + esc(v['地点'].name) + list(v['氛围']).map(function(m){ return ' · ' + (m.icon ? esc(m.icon) + ' ' : '') + (m.label ? esc(m.label) + ' ' : '') + esc(m.text); }).join('') + '</div>');
      var stats = list(v['数值']).slice(0, 6).map(function(s){ return (s.icon ? esc(s.icon) + ' ' : '') + esc(s.label) + ' ' + (isNum(s) ? fmt(s.value) + (s.max ? '/' + fmt(s.max) : '') : esc(s.text)) + (typeof ch.statDelta[s.label] === 'number' ? '(' + (ch.statDelta[s.label] > 0 ? '+' : '') + fmt(ch.statDelta[s.label]) + ')' : ''); });
      if (stats.length) lines.push('<div class="p dim">&gt; ' + stats.join(' · ') + '</div>');
      var gains = list(ch.summary).filter(function(t){ t = String(t); return t.indexOf('：') >= 0 && t.indexOf('来到：') !== 0 && !list(ch.moodChanged).some(function(k){ return t.indexOf(k + '：') === 0; }); });
      if (gains.length && !ch.first) lines.push('<div class="p">&gt; ' + gains.map(esc).join(' · ') + '</div>');
      list(v['事件']).slice(0, 2).forEach(function(t){
        if (isDialogue(t)) { lines.push(dialogue(t)); return; }
        var warn = /^[!！]|警告|危险|警报|异常/.test(t);
        lines.push('<div class="p' + (warn ? ' w' : '') + '">&gt; ' + (warn ? '[!!] ' : '') + esc(t.replace(/^[!！]\s*/, '')) + '</div>');
      });
      return '<div class="card C"><div class="head"><span class="t">&gt;_ ' + esc(v['标题'] || '终端') + '</span><span class="r">' + turnText(v) + '</span></div>' + lines.join('') + optionButtons(v, true) + '<div class="rec">REC ' + recTime() + '</div></div>';
    }
    var body = '';
    if (card.variant === 'with-status') body += cine(v, ch) + strip(v, ch, !cine(v, ch)) + statusBlock(v, ch, false) + '<div class="line"></div>' + judge(v) + news(ch, true) + events(v);
    else body += cine(v, ch) + '<div class="head"><span class="star">✦</span><span class="t">你打算</span><span class="en">CHOICE</span><span class="r">' + turnText(v) + '</span></div>' + strip(v, ch, !cine(v, ch)) + judge(v) + news(ch, false) + events(v);
    return '<div class="card ' + card.skin + '">' + body + optionButtons(v, false) + '</div>';
  }

  function mapCard(v, ch, card){
    var l = v['地点'];
    var nodes = list(l.points).map(function(p){
      var say = p.danger ? '小心地靠近' + p.name : '去查看' + p.name;
      return '<button type="button" class="node' + (p.danger ? ' dg' : '') + '" data-say="' + esc(say) + '"><i></i>' + esc(p.name) + '</button>';
    }).join('');
    return '<div class="card ' + card.skin + '"><div class="scene"><div class="loc-en">LOCATION' + (v['时间'] && v['时间'][0] ? ' · ' + esc(v['时间'][0].text) : '') + '</div><div class="loc-name">' + esc(l.name) + '</div>' +
      (l.desc ? '<p class="loc-desc">' + esc(l.desc) + '</p>' : '') + '</div>' + judge(v) + news(ch, false) +
      '<div class="nodes">' + nodes + '</div>' + (l.alert ? '<div class="alert">' + esc(l.alert) + '</div>' : '') +
      '<div class="prog">' + (l.progress ? '探索度 ' + esc(l.progress) + ' · ' : '') + '点一个地点就出发 · 红色有危险</div></div>';
  }

  function locationCard(v, ch, card){
    var l = v['地点'];
    var pts = list(l.points).slice(0, 4).map(function(p){ return '<span class="node' + (p.danger ? ' dg' : '') + '"><i></i>' + esc(p.name) + '</span>'; }).join('');
    return '<div class="card ' + card.skin + '"><div class="scene"><div class="loc-en">LOCATION</div><div class="loc-name">' + esc(l.name) + '</div>' +
      (l.desc ? '<p class="loc-desc">' + esc(l.desc) + '</p>' : '') + '</div>' + judge(v) + news(ch, false) +
      (pts ? '<div class="nodes">' + pts + '</div>' : '') + (l.alert ? '<div class="alert">' + esc(l.alert) + '</div>' : '') +
      (l.progress ? '<div class="prog">探索度 ' + esc(l.progress) + '</div>' : '') + '</div>';
  }

  function itemsCard(v, ch, card){
    var tiles = list(v['道具']).map(function(it){
      var n = has(ch.newItems, it.name);
      return '<div class="tile' + (n ? ' new' : '') + '">' + (n ? '<span class="tag">新</span>' : '') + '<span class="nm">' + esc(it.name) + (it.qty != null && it.qty !== 1 ? '<span class="q">×' + fmt(it.qty) + '</span>' : '') + '</span>' + (it.desc ? '<span class="ds">' + esc(it.desc) + '</span>' : '') + '</div>';
    }).concat(list(v['线索']).map(function(c){
      var n = has(ch.newClues, c.name);
      return '<div class="tile' + (n ? ' new' : '') + '"><span class="tag clue">' + (n ? '新线索' : '线索') + '</span><span class="nm">' + esc(c.name) + '</span>' + (c.desc ? '<span class="ds">' + esc(c.desc) + '</span>' : '') + '</div>';
    })).join('');
    var gains = list(ch.summary).filter(function(t){ return /^(获得|新线索)/.test(String(t)); });
    return '<div class="card ' + card.skin + '"><div class="head"><span class="star">✦</span><span class="t">背包</span><span class="en">INVENTORY</span><span class="r">' + (list(v['道具']).length + list(v['线索']).length) + ' 件</span></div>' +
      '<div class="grid">' + tiles + '</div>' + (gains.length && !ch.first ? '<div class="foot">' + gains.map(esc).join(' · ') + '</div>' : '') + '</div>';
  }

  function characterCard(v, ch, card){
    var people = list(v['人物']);
    var p = people.filter(function(x){ return has(ch.newPeople, x.name); })[0] || people[0];
    var rels = list(v['关系']).filter(function(r){ return r.label === p.name; });
    var rel = p.rel !== null && p.rel !== undefined && p.rel !== '' ? esc(p.relLabel || '关系') + ' <b>' + esc(p.rel) + '</b>' : rels.map(function(r){ return '关系 <b>' + (isNum(r) ? fmt(r.value) : esc(r.text)) + '</b>' + delta(ch.statDelta['关系:' + r.label]); }).join('');
    var others = people.filter(function(x){ return x !== p; }).map(function(x){ return esc(x.name); });
    return '<div class="card ' + card.skin + '"><div class="who"><div class="face">' + esc(String(p.name).slice(0, 1)) + '</div><div class="info">' +
      '<span class="en" style="font-family:Georgia,serif;font-size:10px;letter-spacing:2px;color:var(--mute)">' + (has(ch.newPeople, p.name) ? 'NEW · ' : '') + 'CHARACTER</span>' +
      '<span class="nm">' + esc(p.name) + '</span>' + (p.desc ? '<span class="id">' + esc(p.desc) + '</span>' : '') +
      (others.length ? '<div class="chips">' + others.slice(0, 3).map(function(o){ return '<span>同场 ' + o + '</span>'; }).join('') + '</div>' : '') +
      (rel ? '<span class="rl">' + rel + '</span>' : '') + '</div></div></div>';
  }

  function statusCard(v, ch, card){
    var star = { C: '&gt;_', D: '◢', E: '★' }[card.skin] || '✦';
    var hasDlg = list(v['事件']).some(isDialogue);
    return '<div class="card ' + card.skin + '">' + cine(v, ch) + '<div class="head"><span class="star">' + star + '</span><span class="t">' + esc(v['标题'] || '状态') + '</span><span class="en">STATUS</span></div>' +
      strip(v, ch, !cine(v, ch)) + judge(v) + (hasDlg ? events(v) : '') + news(ch, false) + statusBlock(v, ch, !hasDlg) +
      (list(v['选项']).length ? '' : '<div class="hint">直接在聊天里说你想做什么</div>') + '</div>';
  }

  function recTime(){ var t = (current && current.turnIndex) || 1; var m = t * 3 + 2; return '00:' + (m < 10 ? '0' : '') + m + ':' + (17 + t * 7) % 60; }

  function render(sc){
    var v = sc.view || {}, ch = sc.changes || {}, card = sc.card || { type: 'status', skin: 'A' };
    ch.statDelta = ch.statDelta || {}; ch.sections = ch.sections || [];
    current = sc; sentText = null;
    var html;
    if (card.type === 'choice' && list(v['选项']).length) html = choiceCard(v, ch, card);
    else if (card.type === 'map' && v['地点']) html = mapCard(v, ch, card);
    else if (card.type === 'location' && v['地点']) html = locationCard(v, ch, card);
    else if (card.type === 'items') html = itemsCard(v, ch, card);
    else if (card.type === 'character' && list(v['人物']).length) html = characterCard(v, ch, card);
    else html = statusCard(v, ch, card);
    root.className = /^[A-E]$/.test(card.skin) ? card.skin : 'A';
    root.innerHTML = html;
    wire();
    armSound(cardSound(v, ch, card));
    size();
  }

  // ===== 音效：全部现场合成。手机需要先碰一下卡片才能出声（浏览器规定），静音模式下不响。 =====
  var WAVE = { A: 'triangle', B: 'sine', C: 'square', D: 'sawtooth', E: 'square' };
  function ac(){
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      return audio;
    } catch (e) { return null; }
  }
  function beep(f1, f2, d, at, vol, wave){
    var a = ac(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (at || 0);
    o.type = wave || WAVE[root.className] || 'square';
    o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol || .05, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .02);
  }
  function hiss(d, at, vol, freq){
    var a = ac(); if (!a) return;
    var n = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, n, a.sampleRate), x = buf.getChannelData(0);
    for (var i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + (at || 0);
    src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq || 2400; f.Q.value = .8; g.gain.value = vol || .08;
    src.connect(f); f.connect(g); g.connect(a.destination); src.start(t);
  }
  var SFX = {
    tap: function(){ beep(520, 830, .07); },
    dice: function(){ for (var i = 0; i < 4; i++) hiss(.035, i * .07, .12, 1800 + i * 500); beep(700, 700, .05, .3, .04); },
    pickup: function(){ beep(660, 660, .06, 0, .05); beep(990, 1320, .12, .07, .05); },
    ok: function(){ beep(523, 523, .08, 0); beep(659, 659, .08, .09); beep(784, 1046, .18, .18); },
    bad: function(){ beep(320, 140, .32, 0, .06); beep(300, 120, .32, .05, .03, 'sine'); },
    scene: function(){ hiss(.45, 0, .07, 900); beep(220, 440, .4, .05, .035, 'sine'); },
    blip: function(){ beep(880, 880, .05, 0, .035); }
  };
  function play(name){ try { if (SFX[name]) SFX[name](); } catch (e) {} }
  function cardSound(v, ch, card){
    var j = v['判定'];
    if (j && has(ch.sections, '判定')) return ['dice', tone(j.result || '') === 'bad' ? 'bad' : 'ok'];
    if (!ch.first && v['地点'] && has(ch.sections, '地点')) return ['scene'];
    if (list(ch.newItems).length || list(ch.newClues).length) return ['pickup'];
    return ch.first ? ['blip'] : [];
  }
  // 本卡的事件音：能直接出声就马上放；不能就等玩家第一次碰到卡片时放一次。
  function armSound(seq){
    if (!seq.length) return;
    var done = false;
    function go(){ if (done) return; done = true; play(seq[0]); if (seq[1]) setTimeout(function(){ play(seq[1]); }, 380); }
    try { var A = window.AudioContext || window.webkitAudioContext; if (audio && audio.state === 'running') { go(); return; } if (A && !audio) { audio = new A(); if (audio.state === 'running') { go(); return; } } } catch (e) {}
    root.addEventListener('pointerdown', go, { once: true });
  }

  function wire(){
    [].slice.call(root.querySelectorAll('button[data-say]')).forEach(function(b){
      b.addEventListener('touchstart', function(){ b.classList.add('press'); }, { passive: true });
      b.addEventListener('touchend', function(){ b.classList.remove('press'); });
      b.addEventListener('click', function(){
        if (sentText) return;
        sentText = b.getAttribute('data-say');
        play('tap');
        destroyTo(sentText);
        deliver(sentText, 0);
      });
    });
  }

  // 选择卡点击后销毁，收成一行文字记录（总纲：点击后本卡销毁，转为纯文字记录）。
  function destroyTo(text){
    var skin = root.className || 'A';
    root.innerHTML = '<div class="done ' + skin + '">✦ 你选择了：' + esc(text) + '<span class="s" id="st">正在发送…</span>' +
      '<div class="recover" id="recover"><button type="button" id="retry">重新发送</button><button type="button" id="copy">复制这句话</button><textarea id="manual" readonly></textarea></div></div>';
    document.getElementById('retry').addEventListener('click', function(){ document.getElementById('recover').className = 'recover'; deliver(sentText, 0); });
    document.getElementById('copy').addEventListener('click', function(){
      var m = document.getElementById('manual'); m.value = sentText || '';
      try { navigator.clipboard.writeText(m.value).then(function(){ status('已复制，粘贴到聊天框发送即可'); }, function(){ m.select(); status('请长按上面的文字复制'); }); }
      catch (e) { m.select(); status('请长按上面的文字复制'); }
    });
    size();
  }
  function status(text, bad){ var s = document.getElementById('st'); if (s) { s.textContent = text; s.className = 's' + (bad ? ' bad' : ''); } size(); }

  function supports(name){ return caps === undefined || caps === null || caps[name] !== undefined; }

  function sendOnce(text){
    if (mode === 'compat' || (!ready && window.openai && typeof window.openai.sendFollowUpMessage === 'function')) {
      if (!window.openai || typeof window.openai.sendFollowUpMessage !== 'function') return Promise.reject(new Error('宿主不支持发送消息'));
      return Promise.resolve(window.openai.sendFollowUpMessage({ prompt: text }));
    }
    var ctx = supports('updateModelContext')
      ? rpc('ui/update-model-context', { content: [{ type: 'text', text: '玩家在游戏界面卡片上选择了：' + text }], structuredContent: { gameUiChoice: { text: text, turnIndex: current && current.turnIndex, at: new Date().toISOString() } } }, 6000).catch(function(){})
      : Promise.resolve();
    return ctx.then(function(){ return rpc('ui/message', { role: 'user', content: [{ type: 'text', text: text }] }, 15000); })
      .then(function(r){ if (r && r.isError) throw new Error('宿主拒绝了这条消息'); return r; });
  }

  function deliver(text, attempt){
    status(attempt ? '正在重试发送…' : '正在发送…');
    sendOnce(text).then(function(){
      status('已发送');
    }, function(err){
      if (attempt < 1) { setTimeout(function(){ deliver(text, attempt + 1); }, 900); return; }
      status('没发出去：' + (err && err.message ? err.message : '未知原因') + '。可以重试，或复制后自己发送', true);
      var r = document.getElementById('recover'), m = document.getElementById('manual');
      if (m) m.value = text;
      if (r) r.className = 'recover on';
      size();
    });
  }

  function rpc(method, params, timeout){
    return new Promise(function(resolve, reject){
      var id = ++seq;
      var timer = setTimeout(function(){ delete pending[id]; reject(new Error(method + ' 响应超时')); }, timeout || 15000);
      pending[id] = { resolve: resolve, reject: reject, timer: timer };
      window.parent.postMessage({ jsonrpc: '2.0', id: id, method: method, params: params }, '*');
    });
  }
  function notify(method, params){ window.parent.postMessage({ jsonrpc: '2.0', method: method, params: params }, '*'); }

  var lastH = 0;
  function size(){
    var h = Math.ceil(document.body.getBoundingClientRect().height);
    if (h === lastH) return;
    lastH = h;
    if (mode === 'standard' && ready) notify('ui/notifications/size-changed', { width: Math.ceil(document.documentElement.scrollWidth), height: h });
  }

  function apply(result){
    var sc = result && (result.structuredContent || result);
    if (!sc || sc.kind !== 'game-ui' || !sc.view) return false;
    render(sc);
    return true;
  }

  window.addEventListener('message', function(event){
    if (event.source !== window.parent) return;
    var m = event.data;
    if (!m || m.jsonrpc !== '2.0') return;
    if (m.id !== undefined && pending[m.id] && (m.result !== undefined || m.error)) {
      var p = pending[m.id]; delete pending[m.id]; clearTimeout(p.timer);
      if (m.error) p.reject(new Error(m.error.message || '宿主返回错误')); else p.resolve(m.result);
      return;
    }
    if (m.method === 'ui/notifications/tool-result') apply(m.params);
    else if (m.id !== undefined && (m.method === 'ping' || m.method === 'ui/resource-teardown')) window.parent.postMessage({ jsonrpc: '2.0', id: m.id, result: {} }, '*');
  });
  window.addEventListener('openai:set_globals', function(){ if (window.openai && window.openai.toolOutput) apply({ structuredContent: window.openai.toolOutput }); });
  if ('ResizeObserver' in window) new ResizeObserver(size).observe(document.body);

  if (window.openai && window.openai.toolOutput) apply({ structuredContent: window.openai.toolOutput });
  rpc('ui/initialize', { appInfo: { name: 'b-game-ui', version: '0.8.0' }, appCapabilities: { availableDisplayModes: ['inline'] }, protocolVersion: '2026-01-26' }, 6500)
    .then(function(r){
      caps = r && r.hostCapabilities;
      ready = true;
      notify('ui/notifications/initialized', {});
      lastH = 0; size();
    }, function(){
      if (window.openai && (typeof window.openai.sendFollowUpMessage === 'function' || window.openai.toolOutput)) {
        mode = 'compat';
        if (window.openai.toolOutput) apply({ structuredContent: window.openai.toolOutput });
      } else if (!current) {
        root.innerHTML = '<p class="loading">卡片已载入，但没连上聊天。请直接在聊天里继续。</p>';
      }
    });
})();
</script></body></html>`.replace('/*FONTS*/', function(){ return FONT_CSS; });
