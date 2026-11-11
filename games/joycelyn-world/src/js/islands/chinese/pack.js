// =============================================================
//  成語島 Idiom Island — opens the existing 成語大冒險 (games/chengyu-adventure) inside the page.
//  The game itself is not rewritten: it keeps its own progress (localStorage 'chengyuAdventure_v1').
//  Stars she earns there are read back and paid into the shared star pouch (only the new ones).
// =============================================================
import { h } from '../../core/ui.js';
import { art } from '../../core/art.js';
import { setMusic } from '../../core/audio.js';
import { store } from '../../core/store.js';
import { toast } from '../../core/ui.js';
import { buildChinese } from './island.js';

const CN_KEY = 'chengyuAdventure_v1';   // owned by 成語大冒險 — read only here
function cnState() { try { return JSON.parse(localStorage.getItem(CN_KEY) || 'null'); } catch (e) { return null; } }
const sum = (o) => Object.values(o || {}).reduce((a, x) => a + (typeof x === 'number' ? x : (x && x.stars) || 0), 0);
export function cnStars() { const s = cnState(); return s ? { ch1: sum(s.battle), ch2: sum(s.c2 && s.c2.st), dlc: sum(s.dlc && s.dlc.st) } : { ch1: 0, ch2: 0, dlc: 0 }; }
const cnTotal = () => { const s = cnStars(); return s.ch1 + s.ch2 + s.dlc; };

// pay any new 成語大冒險 stars into the shared pouch
function sync(shell, quiet = false) {
  const p = store.pack('chinese', { synced: 0 }), tot = cnTotal(), add = tot - p.synced;
  if (add > 0) { store.earn(add); p.synced = tot; store.save(); if (!quiet && shell) toast(shell.overlay, `+${add} ★ from 成語大冒險 into your pouch!`, { artId: 'star', ms: 2600 }); return add; }
  if (tot < p.synced) { p.synced = tot; store.save(); }   // its progress was reset: start counting again
  return 0;
}
const gameURL = () => (location.pathname.includes('/src/') ? '../../chengyu-adventure/index.html' : '../chengyu-adventure/index.html');

function open(m, shell) {
  shell.pause(true); setMusic(false);
  const frame = h('iframe', { class: 'cn-iframe', src: gameURL(), title: '成語大冒險', allow: 'autoplay' });
  const close = () => {
    root.remove(); setMusic(store.setting('music') !== false); shell.pause(false);
    sync(shell); store.markDay(); shell.refresh(); shell.world && shell.world.overview('chinese');
  };
  const root = h('div', { class: 'cn-frame' },
    h('div', { class: 'cn-bar' }, h('button', { class: 'btn small', onclick: close }, art('worldmap', { size: 26 }), ' 返回成語島'), h('b', {}, m.title), h('span', { class: 'cn-stars' }, art('star', { size: 24 }), ` ${cnTotal()}`)),
    frame);
  frame.addEventListener('load', () => { try { const w = frame.contentWindow; if (m.go && m.go !== 'home' && typeof w.go === 'function') w.go(m.go); } catch (e) { /* different origin (file://): stays on the home page */ } });
  shell.stage.append(root);
}

const mk = (id, title, desc, go, artId) => ({ id, title, desc, go, art: artId, noStars: true });
const ZONES = [
  { id: 'ch1', title: '成語擂台', art: 'panda', learn: '第一章：成語、詞語、錯別字。打怪獸擂台、詞語尋寶、錯別字偵探。',
    modes: [mk('cn-ch1', '成語大冒險 · 第一章', '成語擂台、詞語尋寶、錯別字偵探', 'home', 'crown'), mk('cn-report', '成績表', '星星、錯題簿、做咗幾多', 'report', 'memo')] },
  { id: 'ch2', title: '詞語村', art: 'house', learn: '第二章：量詞、擬聲詞、複句、關聯詞、同音形近字。', modes: [mk('cn-ch2', '第二章', '量詞、擬聲詞、複句、關聯詞……', 'ch2', 'books')] },
  { id: 'dlc', title: '修辭樂園', art: 'carousel', learn: '修辭手法：比喻、擬人、誇張、排比、反問、設問、對偶、頂真……', modes: [mk('cn-dlc', '修辭樂園', '11 部機動遊戲＋過山車', 'dlc', 'rollercoaster')] },
];

function parents() {
  const s = cnStars(), p = store.pack('chinese', { synced: 0 });
  return h('div', { class: 'zh' },
    h('p', {}, '成語島直接開返原本嘅「成語大冒險」（games/chengyu-adventure），冇改寫，進度照用佢自己嘅紀錄（同舊網址共用）。'),
    h('ul', {},
      h('li', {}, `第一章（成語擂台）：${s.ch1} 粒星；第二章：${s.ch2} 粒星；修辭樂園：${s.dlc} 粒星。`),
      h('li', {}, `已經轉入星星袋：${p.synced} 粒。之後每攞到新星星，返回島上就會自動加入星星袋。`),
      h('li', {}, '詳細成績同錯題：撳「成語擂台」→「成績表」。')));
}

export default {
  id: 'chinese', title: '成語島 Idiom Island', short: '中文', subject: '中文 · 成語大冒險', art: 'panda', color: '#D7263D', lang: 'zh',
  at: { x: -84, z: -34 }, radius: 22, labelY: 20,
  build: buildChinese,
  zones: ZONES, mods: {},
  welcome: '成語島：揀一個地方開始！',
  open,
  zoneStars: (z) => cnStars()[z.id] || 0,
  zoneMax: () => 0,
  modeExtra: (m) => (m.go === 'report' ? null : h('span', { class: 'mode-medal' }, art('star', { size: 24 }), h('small', {}, `${cnStars()[{ 'cn-ch1': 'ch1', 'cn-ch2': 'ch2', 'cn-dlc': 'dlc' }[m.id]] || 0}`))),
  onBoot: (shell) => sync(shell, true),
  onEnter: (shell) => sync(shell),
  parents,
};
