// =============================================================
//  Joycelyn's Islands — app shell & router.
//  The sea map shows every island; each island is a "pack" (islands/<id>/pack.js).
//  To add an island: write a pack, import it below and add it to PACKS. Nothing else in the shell changes.
// =============================================================
import { h, toast as toastFn } from './core/ui.js';
import { art, preload } from './core/art.js';
import { initAudio, playMusic, sfx, setMusic, setSfx } from './core/audio.js';
import { store } from './core/store.js';
import { openShop, openRoad, avatarEl, claimableRoad, nextRoad } from './core/economy.js';
import { BOSS_PRIZES, ALL_ITEMS, COSTUMES, PETS, DECOR, POWERUPS, ROAD } from './core/items.js';
import { openOops, openParents } from './core/books.js';
import { createRunner } from './core/runner.js';
import science from './islands/science/pack.js';
import maths from './islands/maths/pack.js';
import chinese from './islands/chinese/pack.js';

export const PACKS = [science, maths, chinese];
const PACK = Object.fromEntries(PACKS.map((p) => [p.id, p]));

// every playable mode (and zone boss), keyed by its global id
const zoneModes = (z) => [...z.modes, ...(z.boss ? [z.boss] : [])];
const MODES = {};
PACKS.forEach((p) => p.zones.forEach((z) => zoneModes(z).forEach((m) => { MODES[m.id] = { m: { ...m, zone: z.id }, pack: p, z }; })));

// ---------- progress helpers (an island may override any of these) ----------
const modeStars = (p, m) => (p.modeStars ? p.modeStars(m) : store.stars(m.id));
const zoneStars = (p, z) => (p.zoneStars ? p.zoneStars(z) : zoneModes(z).filter((m) => !m.hidden).reduce((a, m) => a + modeStars(p, m), 0));
const zoneMax = (p, z) => (p.zoneMax ? p.zoneMax(z) : zoneModes(z).filter((m) => !m.hidden).length * 3);
const bossOpen = (p, z) => z.modes.filter((m) => !m.hidden).every((m) => modeStars(p, m) >= 1);
const bossKey = (z) => z.boss ? (z.boss.reward || z.id) : null;
const zoneCrown = (z) => (z.boss ? store.bossWins(bossKey(z)) > 0 : z.modes.some((m) => m.reward && store.bossWins(m.reward) > 0));
const islandStars = (p) => p.zones.reduce((a, z) => a + zoneStars(p, z), 0);
const islandMax = (p) => p.zones.reduce((a, z) => a + (zoneMax(p, z) || 0), 0);
const totalStars = () => PACKS.reduce((a, p) => a + islandStars(p), 0);

const stage = document.getElementById('stage');
const overlay = document.getElementById('overlay');
let world = null, hubEl = null, zoneCard = null;
let view = null;                    // null = sea map, otherwise the island id

// ---------- boot ----------
preload(['heart', 'star', 'worldmap', 'trophy', 'gift', 'frog', 'owl', 'panda', ...PACKS.map((p) => p.art), store.equipped('costume') || 'c-scientist']);
setMusic(store.setting('music') !== false); setSfx(store.setting('sfx') !== false);
const params = new URLSearchParams(location.search);
const START_ISLAND = PACK[params.get('island') || location.hash.slice(1)] ? (params.get('island') || location.hash.slice(1)) : null;

const NO3D = /[?&]no3d/.test(location.search);
const flat = () => { document.getElementById('world').style.background = 'linear-gradient(#8ED8F8,#27B5D0)'; };
(NO3D ? Promise.reject(new Error('3D disabled')) : import('./world/engine.js')).then(({ createWorld }) => {
  try {
    world = createWorld(document.getElementById('world'), { onPickIsland: (id) => enterIsland(id), onPickZone: (pid, zid) => openZone(pid, zid) });
    PACKS.forEach((p) => {
      world.addIsland({ id: p.id, title: p.title, at: p.at, radius: p.radius, labelY: p.labelY, build: p.build });
      p.zones.forEach((z) => world.addZone(p.id, z.id, z.title, zoneStars(p, z), zoneMax(p, z)));
    });
    refreshWorld();
    world.showMap(10);
    document.fonts && document.fonts.ready.then(() => refreshLabels());
  } catch (e) { console.warn('3D world unavailable', e); world = null; flat(); }
}).catch((e) => { console.info(e.message); flat(); });

function refreshLabels() {
  if (!world) return;
  PACKS.forEach((p) => {
    p.zones.forEach((z) => world.updateZone(p.id, z.id, zoneStars(p, z), zoneMax(p, z), zoneCrown(z)));
    const mx = islandMax(p); world.updateIsland(p.id, `★ ${islandStars(p)}${mx ? ' / ' + mx : ''}`);
  });
}
function refreshWorld() {
  if (!world) return;
  world.setDecor(store.decor());
  world.setAvatar(store.equipped('costume') || 'c-scientist', store.equipped('pet') ? ALL_ITEMS[store.equipped('pet')]?.art : null);
  PACKS.forEach((p) => {
    p.zones.forEach((z) => { if (z.boss) world.setBoss(p.id, z.id, { art: z.boss.art, beaten: store.bossWins(bossKey(z)) > 0, open: bossOpen(p, z) }); });
    p.refreshIsland && p.refreshIsland(world.islandApi(p.id));
  });
  refreshLabels();
}
const ectx = () => ({ sfx, music: (n) => playMusic(n), toast: (t) => toastFn(overlay, t, { ms: 1800 }), onDecor: refreshWorld, onChange: () => { refreshWorld(); if (hubEl) showHub(); } });
// what islands get when they need the shell
const shell = () => ({ ...ectx(), store, overlay, stage, world, launch, refresh: () => { refreshWorld(); showHub(); }, pause: (b) => world && world.setPaused(b), view: () => view });

const runner = createRunner({
  stage, overlay, get world() { return world; }, ectx,
  find: (id) => MODES[id],
  bossOpen,
  beforeLaunch() { zoneCard?.remove(); zoneCard = null; hubEl?.remove(); hubEl = null; overlay.querySelectorAll(':scope > .toast').forEach((t) => t.remove()); },
  onQuit(m, p) { view = p.id; refreshWorld(); showHub(); world && world.overview(p.id); },
});

PACKS.forEach((p) => p.onBoot && p.onBoot(shell()));
titleScreen();

function titleScreen() {
  const cast = h('div', { class: 'title-cast' }, ['frog', 'owl', 'panda', 'penguin', 'unicorn'].map((a) => art(a)));
  const el = h('div', { class: 'title-screen' },
    h('div', {}, cast,
      h('div', { class: 'logo' }, h('span', { class: 'l1' }, store.name()), h('span', { class: 'l2' }, 'Islands')),
      h('div', { class: 'title-subjects' }, PACKS.map((p) => h('span', {}, art(p.art, { size: 30 }), p.short))),
      h('div', {}, h('button', { class: 'btn go start', onclick: start }, 'Tap to explore'))),
    h('div', { class: 'credit' }, PACKS.map((p) => p.subject).join(' · ')));
  stage.append(el);
  function start() {
    initAudio(); sfx.fanfare();
    setTimeout(() => playMusic('island'), 900);
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).onfinish = () => el.remove();
    store.markDay();
    if (START_ISLAND) setTimeout(() => enterIsland(START_ISLAND), 300);
    else { world && world.showMap(1800); setTimeout(() => { showHub(); toastFn(overlay, `Welcome, ${store.name()}! Tap an island to visit it.`, { artId: 'worldmap', ms: 3200 }); }, 500); }
  }
}

// ---------- navigation ----------
function enterIsland(id) {
  const p = PACK[id]; if (!p) return;
  sfx.whoosh(); zoneCard?.remove(); zoneCard = null;
  view = id; world && world.overview(id);
  showHub();
  p.onEnter && p.onEnter(shell());
  if (p.welcome) toastFn(overlay, p.welcome, { artId: p.art, ms: 2600 });
}
function showMap() {
  sfx.whoosh(); zoneCard?.remove(); zoneCard = null;
  view = null; world && world.showMap(); showHub();
}

// ---------- hub ----------
const clearToasts = () => overlay.querySelectorAll(':scope > .toast').forEach((t) => t.remove());
function showHub() {
  hubEl?.remove();
  const p = view && PACK[view];
  const musicBtn = h('button', { class: `iconbtn ${store.setting('music') === false ? 'off' : ''}`, 'aria-label': 'Music on/off', onclick: () => { const on = store.setting('music') === false; store.setting('music', on); setMusic(on); musicBtn.classList.toggle('off', !on); } }, art('notes'));
  const sfxBtn = h('button', { class: `iconbtn ${store.setting('sfx') === false ? 'off' : ''}`, 'aria-label': 'Sound effects on/off', onclick: () => { const on = store.setting('sfx') === false; store.setting('sfx', on); setSfx(on); sfxBtn.classList.toggle('off', !on); sfx.tap(); } }, art('speaker'));
  const gifts = claimableRoad(); const nr = nextRoad(); const sk = store.streak();
  const nOops = store.get().mistakes.length;
  hubEl = h('div', {},
    h('div', { class: 'hub-top' },
      h('button', { class: 'me-badge', 'aria-label': 'Change your outfit', onclick: () => { sfx.tap(); openShop(overlay, ectx(), 'costume'); clearToasts(); } }, avatarEl(52), h('div', {}, h('b', {}, store.name()), h('small', {}, `${totalStars()} ★ total`))),
      h('div', { class: 'pill pouch', title: 'Stars you can spend' }, art('star'), h('b', {}, store.pouch()), h('small', {}, 'to spend')),
      sk ? h('div', { class: 'pill streak', title: 'Days in a row' }, art('fire'), h('b', {}, sk)) : null,
      h('div', { class: 'spacer' }),
      p ? h('button', { class: 'pill mapbtn', onclick: () => { sfx.tap(); showMap(); } }, art('worldmap'), h('span', { class: 'pl' }, 'All islands')) : null,
      h('button', { class: 'pill', onclick: () => { sfx.tap(); openShop(overlay, ectx()); clearToasts(); } }, art('shop'), h('span', { class: 'pl' }, 'Shop')),
      h('button', { class: `pill ${gifts ? 'glow' : ''}`, onclick: () => { sfx.tap(); openRoad(overlay, ectx()); clearToasts(); } }, art('gift'), h('span', { class: 'pl' }, gifts ? `${gifts} gift${gifts > 1 ? 's' : ''}!` : nr ? `Gift at ${nr.at}★` : 'Star Road')),
      ...(p && p.books ? p.books.map((b) => h('button', { class: 'pill', onclick: () => { sfx.tap(); b.open(overlay, shell(), showHub); clearToasts(); } }, art(b.art), h('span', { class: 'pl' }, b.label()))) : []),
      h('button', { class: 'pill', onclick: () => { sfx.tap(); openOops(overlay, shell(), PACKS, showHub, p ? p.id : 'all'); clearToasts(); } }, art('memo'), h('span', { class: 'pl' }, `Oops ${p ? store.mistakesFor(p.id).length : nOops}`)),
      h('button', { class: 'iconbtn', 'aria-label': 'For grown-ups', onclick: () => { clearToasts(); openParents(overlay, shell(), PACKS, showHub); } }, art('bulb')),
      musicBtn, sfxBtn),
    p ? h('div', { class: 'zone-chips' },
      h('button', { class: 'zone-chip map-chip', onclick: () => showMap() }, art('worldmap'), h('span', {}, 'Map')),
      p.zones.map((z) => h('button', { class: `zone-chip ${zoneCrown(z) ? 'beaten' : ''}`, onclick: () => openZone(p.id, z.id) }, art(z.art), h('span', {}, z.title), h('span', { class: 'st' }, `★${zoneStars(p, z)}`))))
      : h('div', { class: 'island-cards' }, PACKS.map((q) => { const mx = islandMax(q); return h('button', { class: 'island-card', style: { '--ic': q.color }, onclick: () => enterIsland(q.id) },
        art(q.art), h('div', {}, h('b', {}, q.title), h('small', {}, q.subject), h('span', { class: 'st' }, `★ ${islandStars(q)}${mx ? ' / ' + mx : ''}`))); })));
  stage.append(hubEl);
  refreshLabels();
}

async function openZone(pid, zid) {
  if (runner.busy) return;
  const p = PACK[pid], z = p?.zones.find((x) => x.id === zid); if (!z) return;
  if (view !== pid) { view = pid; showHub(); }
  sfx.whoosh();
  zoneCard?.remove();
  world && world.focus(pid, zid);
  const starRow = (s) => h('span', { class: 'stars' }, [0, 1, 2].map((i) => h('span', { class: i < s ? '' : 'no' }, '★')));
  let bossRow = null;
  if (z.boss) {
    const open = bossOpen(p, z), wins = store.bossWins(bossKey(z)), b = z.boss;
    const need = z.modes.filter((m) => !m.hidden && modeStars(p, m) < 1).length;
    const prize = ALL_ITEMS[BOSS_PRIZES[bossKey(z)]];
    bossRow = h('button', { class: `mode-btn boss-btn ${open ? '' : 'locked'} ${wins ? 'beaten' : ''}`, onclick: () => { if (open) launch(b.id); else { sfx.bad(); toastFn(overlay, b.lockText || `Get at least 1 ★ in every game here to wake up ${b.title}.`, { ms: 2400, artId: 'lock' }); } } },
      h('div', { class: 'boss-face' }, art(b.art, { fx: b.fx || '' }), open ? null : art('lock', { cls: 'boss-lock' })),
      h('div', { class: 'mt' }, h('b', {}, `${b.label || 'Boss'}: ${b.title}`),
        h('small', {}, wins ? `Beaten ×${wins}. Rematch for more stars!` : open ? `Ready to fight! First win: ${prize ? prize.name : 'a prize'}.` : `Locked — ${need} ${p.unitName || 'game'}${need > 1 ? 's still need' : ' still needs'} a star.`)),
      starRow(modeStars(p, b)));
  }
  zoneCard = h('div', { class: `zone-card zc-${pid}` },
    h('button', { class: 'iconbtn close', 'aria-label': 'Close', onclick: closeZone }, art('cross')),
    h('div', { class: 'zc-head' }, art(z.art), h('h2', {}, z.title)),
    h('p', { class: 'learn' }, z.learn),
    h('div', { class: 'modes' }, z.modes.filter((m) => !m.hidden).map((m) => h('button', { class: `mode-btn ${m.isBoss ? 'boss-btn' : ''}`, onclick: () => launch(m.id) },
      art(m.art), h('div', { class: 'mt' }, h('b', {}, m.title), h('small', {}, m.desc)),
      p.modeExtra ? p.modeExtra(m) : null,
      m.noStars ? null : starRow(modeStars(p, m)))), bossRow));
  stage.append(zoneCard);
}
function closeZone() { sfx.tap(); zoneCard?.remove(); zoneCard = null; world && (view ? world.overview(view) : world.showMap()); }

// ---------- launching ----------
function launch(modeId, opts) {
  const f = MODES[modeId]; if (!f) return;
  if (f.pack.open) { zoneCard?.remove(); zoneCard = null; f.pack.open(f.m, shell(), opts); return; }
  runner.launch(modeId, opts);
}

// expose for testing (window.__wq keeps the original Wild Quest test hooks working)
window.__world = { launch, PACKS, MODES, store, openZone, enterIsland, showMap, refresh: () => { refreshWorld(); showHub(); }, view: () => view };
window.__wq = { launch, ZONES: science.zones, store, DATA: science.DATA, openZone: (id) => openZone('science', id), BOSSES: science.BOSSES, ITEMS: { COSTUMES, PETS, DECOR, POWERUPS, ROAD, BOSS_PRIZES } };
