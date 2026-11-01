// =============================================================
//  Wild Quest · Biodiversity Island — app shell & router
// =============================================================
import { h, gameFrame, modal, intro as introModal, toast as toastFn, ask as askFn } from './ui.js';
import { art, creatureArt, preload } from './art.js';
import { initAudio, playMusic, sfx, setMusic, setSfx, setFever, stopMusic } from './audio.js';
import { store } from './store.js';
import { confetti, burstAt } from './fx.js';
import { openGuide, openOops, openParents, TOTAL_CARDS } from './guide.js';
import * as DATA from './data.js';
const { CREATURES, PLANTS } = DATA;

// static module map (lets the build step bundle everything into one HTML file)
const MODS = {
  sortstorm: () => import('./games/sortstorm.js'), lab: () => import('./games/lab.js'), detective: () => import('./games/detective.js'),
  seeds: () => import('./games/seeds.js'), plants: () => import('./games/plants.js'), guard: () => import('./games/guard.js'),
  airlift: () => import('./games/airlift.js'), survival: () => import('./games/survival.js'), hideseek: () => import('./games/hideseek.js'),
  panic: () => import('./games/panic.js'), feeding: () => import('./games/feeding.js'), boss: () => import('./games/boss.js'),
};

export const ZONES = [
  { id: 'beach', title: 'Ark Beach', art: 'desertisland', learn: 'Classify animals into birds, fish, mammals, reptiles, amphibians and insects.',
    modes: [{ id: 'sort', title: 'Sort Storm', art: 'tornado', desc: 'Animals rain from the sky. Send each one through the right Ark door before it lands!', mod: 'sortstorm' }] },
  { id: 'lab', title: 'Lab Tower', art: 'alembic', learn: 'The characteristics of each animal group, and the classification flowchart.',
    modes: [
      { id: 'build', title: 'Build-a-Beast', art: 'dna', desc: 'Mix body parts in the creature machine to fill zoo orders.', mod: 'lab' },
      { id: 'detective', title: 'Flowchart Detective', art: 'detective', desc: 'Read the clues and steer through the flowchart to unmask the mystery animal.', mod: 'detective' },
    ] },
  { id: 'greenhouse', title: 'Greenhouse', art: 'seedling', learn: 'How plants are classified and how roots, stems and leaves help them survive.',
    modes: [
      { id: 'seeds', title: 'Seed Sorter', art: 'blossom', desc: 'Catch falling plants: flowering or not? Land or water?', mod: 'seeds' },
      { id: 'grow', title: 'Plant Survivor', art: 'pottedplant', desc: 'Design a plant with the right roots, stem and leaves, then survive 3 wild days.', mod: 'plants' },
      { id: 'guard', title: 'Garden Guard', art: 'shield', desc: 'Hungry animals are coming! Use each plant\'s own defence to protect the garden.', mod: 'guard' },
    ] },
  { id: 'peaks', title: 'Biome Peaks', art: 'snowmountain', learn: 'Where animals live and how their bodies help them survive there.',
    modes: [
      { id: 'airlift', title: 'Animal Airlift', art: 'balloon', desc: 'Drop lost animals and weather crates into the right habitat.', mod: 'airlift' },
      { id: 'suit', title: 'Survival Suit', art: 'thermometer', desc: 'Switch on the right body features before the blizzard or heatwave wins.', mod: 'survival' },
    ] },
  { id: 'jungle', title: 'Hide & Seek', art: 'eyes', learn: 'How animals protect themselves: colouration, mimicry, warning, living in groups.',
    modes: [
      { id: 'hide', title: 'Hide & Seek', art: 'magnifier', desc: 'Spot the camouflaged animals hiding in each scene.', mod: 'hideseek' },
      { id: 'panic', title: 'Predator Panic', art: 'scream', desc: 'A predator charges! Pick the trick that saves the animal.', mod: 'panic' },
    ] },
  { id: 'savanna', title: 'Savanna Diner', art: 'meat', learn: 'How beaks, necks, teeth and claws help animals get food.',
    modes: [{ id: 'feed', title: 'Feeding Frenzy', art: 'giraffe', desc: 'Serve each dish to the animal whose body is built to eat it.', mod: 'feeding' }] },
  { id: 'volcano', title: 'Fake-Bot', art: 'robot', learn: 'Final revision boss: true or false, fill in the blanks, data analysis.',
    modes: [{ id: 'boss', title: 'Fake-Bot Showdown', art: 'robot', desc: 'Fake-Bot is spreading fake facts. Bust them, fix them and blast him!', mod: 'boss' }] },
];
const ALL_MODES = ZONES.flatMap((z) => z.modes.map((m) => ({ ...m, zone: z.id })));
const MAX_STARS = ALL_MODES.length * 3;

const stage = document.getElementById('stage');
const overlay = document.getElementById('overlay');
let world = null;
let hubEl = null;
let zoneCard = null;
let busy = false;

// ---------- boot ----------
preload(['heart', 'star', 'worldmap', 'trophy', 'feather', 'milk', 'lizard', 'frog', 'tropicalfish', 'ant']);
setMusic(store.setting('music') !== false); setSfx(store.setting('sfx') !== false);

const NO3D = /[?&]no3d/.test(location.search);
(NO3D ? Promise.reject(new Error('3D disabled')) : import('./world.js')).then(({ createWorld }) => {
  try {
    world = createWorld(document.getElementById('world'), { onPick: (id) => openZone(id) });
    ZONES.forEach((z) => world.addZone(z.id, z.title, zoneStars(z), z.modes.length * 3));
    document.fonts && document.fonts.ready.then(() => refreshLabels());
  } catch (e) { console.warn('3D world unavailable', e); document.getElementById('world').style.background = 'linear-gradient(#8ED8F8,#27B5D0)'; }
}).catch((e) => { console.info(e.message); document.getElementById('world').style.background = 'linear-gradient(#8ED8F8,#27B5D0)'; });

function zoneStars(z) { return z.modes.reduce((a, m) => a + store.stars(m.id), 0); }
function refreshLabels() { if (world) ZONES.forEach((z) => world.updateZone(z.id, zoneStars(z), z.modes.length * 3)); }

titleScreen();

function titleScreen() {
  const cast = h('div', { class: 'title-cast' }, ['frog', 'penguin', 'bat', 'cactus', 'bee'].map((a) => art(a)));
  const el = h('div', { class: 'title-screen' },
    h('div', {}, cast,
      h('div', { class: 'logo' }, h('span', { class: 'l1' }, 'Wild Quest'), h('span', { class: 'l2' }, 'Biodiversity Island')),
      h('div', {}, h('button', { class: 'btn go start', onclick: start }, 'Tap to explore'))),
    h('div', { class: 'credit' }, 'P6 Science · Unit 1 Biodiversity'));
  stage.append(el);
  function start() {
    initAudio(); sfx.fanfare();
    setTimeout(() => playMusic('island'), 900);
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).onfinish = () => el.remove();
    world && world.overview(2200);
    setTimeout(showHub, 500);
  }
}

// ---------- hub ----------
function showHub() {
  hubEl?.remove();
  const musicBtn = h('button', { class: `iconbtn ${store.setting('music') === false ? 'off' : ''}`, 'aria-label': 'Music on/off', onclick: () => { const on = store.setting('music') === false; store.setting('music', on); setMusic(on); musicBtn.classList.toggle('off', !on); } }, art('notes'));
  const sfxBtn = h('button', { class: `iconbtn ${store.setting('sfx') === false ? 'off' : ''}`, 'aria-label': 'Sound effects on/off', onclick: () => { const on = store.setting('sfx') === false; store.setting('sfx', on); setSfx(on); sfxBtn.classList.toggle('off', !on); sfx.tap(); } }, art('speaker'));
  hubEl = h('div', {},
    h('div', { class: 'hub-top' },
      h('div', { class: 'pill', title: 'Stars collected' }, art('star'), `${store.totalStars()} / ${MAX_STARS}`),
      h('button', { class: 'pill', onclick: () => { sfx.tap(); openGuide(overlay, sfx); } }, art('books'), `Field Guide ${store.cardCount()}/${TOTAL_CARDS}`),
      h('button', { class: 'pill', onclick: () => { sfx.tap(); openOops(overlay, sfx, showHub); } }, art('memo'), `Oops Book ${store.get().mistakes.length}`),
      h('div', { class: 'spacer' }),
      h('button', { class: 'iconbtn', 'aria-label': 'For grown-ups', onclick: () => openParents(overlay) }, art('bulb')),
      musicBtn, sfxBtn),
    h('div', { class: 'zone-chips' }, ZONES.map((z) => h('button', { class: 'zone-chip', onclick: () => openZone(z.id) }, art(z.art), h('span', {}, z.title), h('span', { class: 'st' }, `★${zoneStars(z)}`)))));
  stage.append(hubEl);
  refreshLabels();
}

async function openZone(id) {
  if (busy) return;
  const z = ZONES.find((x) => x.id === id); if (!z) return;
  sfx.whoosh();
  zoneCard?.remove();
  world && world.focus(id);
  zoneCard = h('div', { class: 'zone-card' },
    h('button', { class: 'iconbtn close', 'aria-label': 'Close', onclick: closeZone }, art('cross')),
    h('div', { class: 'zc-head' }, art(z.art), h('h2', {}, z.title)),
    h('p', { class: 'learn' }, z.learn),
    h('div', { class: 'modes' }, z.modes.map((m) => {
      const s = store.stars(m.id);
      return h('button', { class: 'mode-btn', onclick: () => launch(m.id) }, art(m.art), h('div', { class: 'mt' }, h('b', {}, m.title), h('small', {}, m.desc)),
        h('span', { class: 'stars' }, [0, 1, 2].map((i) => h('span', { class: i < s ? '' : 'no' }, '★'))));
    })));
  stage.append(zoneCard);
}
function closeZone() { sfx.tap(); zoneCard?.remove(); zoneCard = null; world && world.overview(); }

// ---------- game runner ----------
async function launch(modeId, replay = false) {
  const m = ALL_MODES.find((x) => x.id === modeId); if (!m || busy) return;
  busy = true;
  initAudio(); sfx.pop();
  zoneCard?.remove(); zoneCard = null; hubEl?.remove(); hubEl = null;
  let mod;
  try { mod = await MODS[m.mod](); } catch (e) { console.error(e); busy = false; showHub(); return; }
  world && world.setPaused(true);
  stage.querySelectorAll('.game').forEach((g) => g.remove());

  const misses = []; const newCards = [];
  const api = { alive: true, mode: m, sfx };
  const frame = gameFrame({ title: m.title, hearts: mod.HEARTS || 0, progress: mod.PROGRESS !== false, onExit: () => { sfx.tap(); quit(); } });
  stage.append(frame.root);
  Object.assign(api, {
    frame, body: frame.body, root: frame.root,
    music: (n) => playMusic(n), fever: setFever,
    wait: (ms) => new Promise((r) => setTimeout(() => api.alive && r(), ms)),
    loop(fn) { let last = performance.now(); const step = (t) => { if (!api.alive) return; const dt = Math.min((t - last) / 1000, .05); last = t; if (fn(dt, t) !== false) requestAnimationFrame(step); }; requestAnimationFrame(step); },
    learn(id) { if (!id || !(CREATURES[id] || PLANTS[id])) return; if (store.unlock(id)) newCards.push(id); },
    miss(x) { misses.push(x); store.mistake({ ...x, game: m.title }); },
    toast: (t, o) => toastFn(frame.root, t, o),
    intro: (o) => new Promise((r) => introModal(frame.root, o).then(() => api.alive && r())),
    ask: (o) => new Promise((r) => askFn(frame.root, { sfx, ...o }).then((v) => api.alive && r(v))),
    finish: (res) => finish(res),
  });
  busy = false;

  function quit() {
    api.alive = false; setFever(false);
    frame.root.remove();
    world && world.setPaused(false);
    playMusic('island');
    showHub();
    world && world.overview();
  }

  function finish({ score = 0, correct = 0, total = 0, stars = null, won = true, headline } = {}) {
    if (!api.alive) return;
    const acc = total ? correct / total : 0;
    const st = stars ?? (won ? (acc >= .9 ? 3 : acc >= .7 ? 2 : 1) : (acc >= .6 ? 1 : 0));
    const prevBest = store.stars(m.id);
    store.record(m.id, st, score);
    setFever(false); playMusic('island');
    const starEls = [0, 1, 2].map(() => art('star'));
    const title = headline || (st === 3 ? 'Brilliant!' : st === 2 ? 'Great job!' : st === 1 ? 'Nice try!' : 'Keep training!');
    const next = (() => { const z = ZONES.find((zz) => zz.id === m.zone); const i = z.modes.findIndex((x) => x.id === m.id); return z.modes[i + 1]; })();
    const md = modal(frame.root,
      h('div', { class: 'bigstars' }, starEls),
      h('h2', {}, title),
      h('div', { class: 'result-score' }, `Score ${score}`),
      total ? h('p', {}, `${correct} of ${total} correct`) : null,
      st > prevBest && prevBest > 0 ? h('p', { class: 'learnline' }, 'New best!') : null,
      newCards.length ? h('div', {}, h('p', { style: { fontWeight: 700, marginTop: '10px' } }, `New Field Guide cards: ${newCards.length}`), h('div', { style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px' } }, newCards.slice(0, 12).map((id) => creatureArt(id, { size: 56 })))) : null,
      misses.length ? h('div', { class: 'review' }, h('b', {}, 'Remember:'), misses.slice(0, 4).map((x) => h('div', { class: 'ri' }, h('div', {}, x.q), h('div', {}, h('b', {}, '✔ '), x.ans)))) : null,
      h('div', { class: 'actions' },
        h('button', { class: 'btn ghost', onclick: () => { md.close(); quit(); } }, 'Island'),
        h('button', { class: 'btn', onclick: () => { md.close(); api.alive = false; frame.root.remove(); launch(m.id, true); } }, 'Play again'),
        next ? h('button', { class: 'btn go', onclick: () => { md.close(); api.alive = false; frame.root.remove(); launch(next.id); } }, `Next: ${next.title}`) : null));
    st >= 2 ? sfx.win() : sfx.lose();
    if (st >= 2) confetti(st === 3 ? 160 : 70);
    starEls.forEach((s, i) => { if (i < st) setTimeout(() => { s.classList.add('on'); sfx.star(); burstAt(s, { n: 14, kind: 'star', colors: ['#FFB627', '#FFE066', '#FFFFFF'] }); }, 450 + i * 380); });
  }

  try { await mod.default(api); } catch (e) { console.error(e); api.toast('Something went wrong in this game. Tap the map to go back.', { kind: 'bad', ms: 0 }); }
}

// expose for testing
window.__wq = { launch, ZONES, store, DATA };
