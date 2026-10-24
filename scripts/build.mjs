import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
const names = ['game-ui-core.js', 'game-ui-tools.js', 'game-ui-fonts.js', 'game-ui-widget.js', 'core.js'];
const modules = await Promise.all(names.map(name => readFile(new URL('../worker/' + name, import.meta.url), 'utf8')));
const core = modules.map(text => text.replace(/^import .* from .*;\n/gm, '').replace(/^export (?!default)/gm, '')).join('\n');
const adapter = await readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
if (!core.includes('export default { async fetch')) throw new Error('Unexpected core export');
const bundle = core.replace('export default { async fetch', 'const core = { async fetch') + '\n' + adapter.replace("import core from './core.js';", '');
for (const marker of ['function normalizeState', 'router-v5.html', 'render_game_ui']) {
  if (!bundle.includes(marker)) throw new Error('Bundle is missing ' + marker);
}
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/worker.js', import.meta.url), bundle);
await mkdir(new URL('../upload/', import.meta.url), { recursive: true });
await writeFile(new URL('../upload/_worker.js', import.meta.url), bundle);
await copyFile(new URL('../index.html', import.meta.url), new URL('../upload/index.html', import.meta.url));
console.log('Built standalone dist/worker.js for Cloudflare dashboard. No secrets embedded.');
