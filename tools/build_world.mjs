// Build Joycelyn's Islands into ONE self-contained HTML file.
//   node tools/build_world.mjs
// Input : games/joycelyn-world/src/   (ES modules, css, art/*.webp, lib/three.js)
// Output: games/joycelyn-world/index.html   (CSS, JS, three.js and all art inlined; only Google Fonts is external)
// Needs Node 18+. esbuild is fetched by npx on first run.
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, cpSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'games/joycelyn-world/src');
const OUT = join(ROOT, 'games/joycelyn-world/index.html');
const tmp = mkdtempSync(join(tmpdir(), 'jw-build-'));

try {
  cpSync(SRC, tmp, { recursive: true });
  // 1. inline every picture as a data: URL
  const art = {};
  for (const f of readdirSync(join(SRC, 'art')).filter((n) => n.endsWith('.webp')).sort()) {
    art[f.replace(/\.webp$/, '')] = 'data:image/webp;base64,' + readFileSync(join(SRC, 'art', f)).toString('base64');
  }
  writeFileSync(join(tmp, 'js/core/art-data.js'), `export const ART = ${JSON.stringify(art)};\n`);

  // 2. bundle all modules (+ three.js) into one IIFE
  const bundle = join(tmp, 'bundle.js');
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execFileSync(npx, ['--yes', 'esbuild@0.24.0', join(tmp, 'js/main.js'), '--bundle', '--format=iife', '--minify', '--target=es2020', '--legal-comments=none', `--outfile=${bundle}`], { stdio: 'inherit', shell: process.platform === 'win32' });
  const js = readFileSync(bundle, 'utf8').replace(/<\/script/gi, '<\\/script');
  const css = readFileSync(join(SRC, 'css/game.css'), 'utf8');

  // 3. stitch the page
  let html = readFileSync(join(SRC, 'index.html'), 'utf8');
  html = html.replace('<link rel="stylesheet" href="css/game.css">', () => `<style>\n${css}\n</style>`);
  html = html.replace('<script type="module" src="js/main.js"></script>', () => `<script>\n${js}\n</script>`);
  html = html.replace(/href="art\/frog\.webp"/g, () => `href="${art.frog}"`);
  html = html.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<!-- Built by tools/build_world.mjs from games/joycelyn-world/src. Edit the source, then rebuild. -->');
  writeFileSync(OUT, html);
  console.log(`Wrote ${OUT} (${(statSync(OUT).size / 1024 / 1024).toFixed(2)} MB, ${Object.keys(art).length} pictures inlined)`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
