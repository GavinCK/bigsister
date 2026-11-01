// =============================================================
//  Joycelyn Biodiversity Island (Wild Quest) — app shell & router
// =============================================================
import { h, gameFrame, modal, intro as introModal, toast as toastFn, ask as askFn } from './ui.js';
import { art, creatureArt, preload } from './art.js';
import { initAudio, playMusic, sfx, setMusic, setSfx, setFever, setIntensity, setDanger } from './audio.js';
import { store } from './store.js';
import { confetti, burstAt } from './fx.js';
import { openGuide, openOops, openParents, TOTAL_CARDS } from './guide.js';
import { openShop, openRoad, openGift, avatarEl, powerTray, claimableRoad, nextRoad } from './economy.js';
import { BOSS_PRIZES, ALL_ITEMS, COSTUMES, PETS, DECOR, POWERUPS, ROAD } from './items.js';
import { BOSSES } from './bosses.js';
import * as DATA from './data.js';
const { CREATURES, PLANTS } = DATA;

// static module map (lets the build step bundle everything into one HTML file)
const MODS = {
  sortstorm: () => import('./games/sortstorm.js'), lab: () => import('./games/lab.js'), detective: () => import('./games/detective.js'),
  seeds: () => import('./games/seeds.js'), plants: () => import('./games/plants.js'), guard: () => import('./games/guard.js'),
  airlift: () => import('./games/airlift.js'), survival: () => import('./games/survival.js'), hideseek: () => import('./games/hideseek.js'),
  panic: () => import('./games/panic.js'), feeding: () => import('./games/feeding.js'), boss: () => import('./games/boss.js'),
  bossfight: () => import('./games/bossfight.js'),
};

const zb = (key) => ({ id: `boss-${key}`, title: BOSSES[key].name, art: BOSSES[key].art, fx: BOSSES[key].fx, mod: 'bossfight', key, isBoss: true, reward: key });
export const ZONES = [
  { id: 'beach', title: 'Ark Beach', art: 'desertisland', learn: 'Classify animals into birds, fish, mammals, reptiles, amphibians and insects.',
    modes: [{ id: 'sort', title: 'Sort Storm', art: 'tornado', desc: 'Animals rain from the sky. Send each one through the right Ark door before it lands!', mod: 'sortstorm' }], boss: zb('beach') },
  { id: 'lab', title: 'Lab Tower', art: 'alembic', learn: 'The characteristics of each animal group, and the classification flowchart.',
    modes: [
      { id: 'build', title: 'Build-a-Beast', art: 'dna', desc: 'Mix body parts in the creature machine to fill zoo orders.', mod: 'lab' },
      { id: 'detective', title: 'Flowchart Detective', art: 'detective', desc: 'Read the clues and steer through the flowchart to unmask the mystery animal.', mod: 'detective' },
    ], boss: zb('lab') },
  { id: 'greenhouse', title: 'Greenhouse', art: 'seedling', learn: 'How plants are classified and how roots, stems and leaves help them survive.',
    modes: [
      { id: 'seeds', title: 'Seed Sorter', art: 'blossom', desc: 'Catch falling plants: flowering or not? Land or water?', mod: 'seeds' },
      { id: 'grow', title: 'Plant Survivor', art: 'pottedplant', desc: 'Design a plant with the right roots, stem and leaves, then survive 3 wild days.', mod: 'plants' },
      { id: 'guard', title: 'Garden Guard', art: 'shield', desc: 'Hungry animals are coming! Use each plant\'s own defence to protect the garden.', mod: 'guard' },
    ], boss: zb('greenhouse') },
  { id: 'peaks', title: 'Biome Peaks', art: 'snowmountain', learn: 'Where animals live and how their bodies help them survive there.',
    modes: [
      { id: 'airlift', title: 'Animal Airlift', art: 'balloon', desc: 'Drop lost animals and weather crates into the right habitat.', mod: 'airlift' },
      { id: 'suit', title: 'Survival Suit', art: 'thermometer', desc: 'Switch on the right body features before the blizzard or heatwave wins.', mod: 'survival' },
    ], boss: zb('peaks') },
  { id: 'jungle', title: 'Hide & Seek', art: 'eyes', learn: 'How animals protect themselves: colouration, mimicry, warning, living in groups.',
    modes: [
      { id: 'hide', title: 'Hide & Seek', art: 'magnifier', desc: 'Spot the camouflaged animals hiding in each scene.', mod: 'hideseek' },
      { id: 'panic', title: 'Predator Panic', art: 'scream', desc: 'A predator charges! Pick the trick that saves the animal.', mod: 'panic' },
    ], boss: zb('jungle') },
  { id: 'savanna', title: 'Savanna Diner', art: 'meat', learn: 'How beaks, necks, teeth and claws help animals get food.',
    modes: [{ id: 'feed', title: 'Feeding Frenzy', art: 'giraffe', desc: 'Serve each dish to the animal whose body is built to eat it.', mod: 'feeding' }], boss: zb('savanna') },
  { id: 'volcano', title: 'Fake-Bot', art: 'robot', learn: 'Final revision boss: true or false, fill in the blanks, data analysis.',
    modes: [{ id: 'boss', title: 'Fake-Bot Showdown', art: 'robot', desc: 'Fake-Bot is spreading fake facts. Bust them, fix them and blast him!', mod: 'boss', reward: 'volcano', isBoss: true }] },
];
const ALL_MODES = ZONES.flatMap((z) => [...z.modes, ...(z.boss ? [z.boss] : [])].map((m) => ({ ...m, zone: z.id })));
const MAX_STARS = ALL_MODES.length * 3;

const stage = document.getElementById('stage');
const overlay = document.getElementById('overlay');
let world = null;
let hubEl = null;
let zoneCard = null;
let busy = false;

// ---------- boot ----------
preload(['heart', 'star', 'worldmap', 'trophy', 'feather', 'milk', 'lizard', 'frog', 'tropicalfish', 'ant', 'gift', store.equipped('costume') || 'c-scientist']);
setMusic(store.setting('music') !== false); setSfx(store.setting('sfx') !== false);

const NO3D = /[?&]no3d/.test(location.search);
(NO3D ? Promise.reject(new Error('3D disabled')) : import('./world.js')).then(({ createWorld }) => {
  try {
    world = createWorld(document.getElementById('world'), { onPick: (id) => openZone(id) });
    ZONES.forEach((z) => world.addZone(z.id, z.title, zoneStars(z), zoneMax(z)));
    refreshWorld();
    document.fonts && document.fonts.ready.then(() => refreshLabels());
  } catch (e) { console.warn('3D world unavailable', e); document.getElementById('world').style.background = 'linear-gradient(#8ED8F8,#27B5D0)'; }
}).catch((e) => { console.info(e.message); document.getElementById('world').style.background = 'linear-gradient(#8ED8F8,#27B5D0)'; });

const zoneModes = (z) => [...z.modes, ...(z.boss ? [z.boss] : [])];
function zoneStars(z) { return zoneModes(z).reduce((a, m) => a + store.stars(m.id), 0); }
const zoneMax = (z) => zoneModes(z).length * 3;
const bossOpen = (z) => z.modes.every((m) => store.stars(m.id) >= 1);
function refreshLabels() { if (world) ZONES.forEach((z) => world.updateZone(z.id, zoneStars(z), zoneMax(z), z.boss ? store.bossWins(z.id) > 0 : store.bossWins('volcano') > 0)); }
function refreshWorld() {
  if (!world) return;
  world.setDecor(store.decor());
  world.setAvatar(store.equipped('costume') || 'c-scientist', store.equipped('pet') ? ALL_ITEMS[store.equipped('pet')]?.art : null);
  ZONES.forEach((z) => { if (z.boss) world.setBoss(z.id, { art: z.boss.art, beaten: store.bossWins(z.id) > 0, open: bossOpen(z) }); });
  refreshLabels();
}
const ectx = () => ({ sfx, music: (n) => playMusic(n), toast: (t) => toastFn(overlay, t, { ms: 1800 }), onDecor: refreshWorld, onChange: () => { refreshWorld(); if (hubEl) showHub(); } });

titleScreen();

function titleScreen() {
  const cast = h('div', { class: 'title-cast' }, ['frog', 'penguin', 'bat', 'cactus', 'bee'].map((a) => art(a)));
  const el = h('div', { class: 'title-screen' },
    h('div', {}, cast,
      h('div', { class: 'logo' }, h('span', { class: 'l1' }, 'Joycelyn'), h('span', { class: 'l2' }, 'Biodiversity Island')),
      h('div', {}, h('button', { class: 'btn go start', onclick: start }, 'Tap to explore'))),
    h('div', { class: 'credit' }, 'Wild Quest · P6 Science Unit 1'));
  stage.append(el);
  function start() {
    initAudio(); sfx.fanfare();
    setTimeout(() => playMusic('island'), 900);
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400 }).onfinish = () => el.remove();
    world && world.overview(2200);
    setTimeout(() => { showHub(); toastFn(overlay, 'Welcome to Joycelyn Biodiversity Island! Tap a place to start.', { artId: 'desertisland', ms: 3200 }); }, 500);
  }
}

// ---------- hub ----------
function showHub() {
  hubEl?.remove();
  const musicBtn = h('button', { class: `iconbtn ${store.setting('music') === false ? 'off' : ''}`, 'aria-label': 'Music on/off', onclick: () => { const on = store.setting('music') === false; store.setting('music', on); setMusic(on); musicBtn.classList.toggle('off', !on); } }, art('notes'));
  const sfxBtn = h('button', { class: `iconbtn ${store.setting('sfx') === false ? 'off' : ''}`, 'aria-label': 'Sound effects on/off', onclick: () => { const on = store.setting('sfx') === false; store.setting('sfx', on); setSfx(on); sfxBtn.classList.toggle('off', !on); sfx.tap(); } }, art('speaker'));
  const gifts = claimableRoad(); const nr = nextRoad();
  hubEl = h('div', {},
    h('div', { class: 'hub-top' },
      h('button', { class: 'me-badge', 'aria-label': 'Change your outfit', onclick: () => { sfx.tap(); openShop(overlay, ectx(), 'costume'); } }, avatarEl(52), h('div', {}, h('b', {}, 'Joycelyn'), h('small', {}, `${store.totalStars()} / ${MAX_STARS} ★ on the island`))),
      h('div', { class: 'pill pouch', title: 'Stars you can spend' }, art('star'), h('b', {}, store.pouch()), h('small', {}, 'to spend')),
      h('div', { class: 'spacer' }),
      h('button', { class: 'pill', onclick: () => { sfx.tap(); openShop(overlay, ectx()); } }, art('shop'), h('span', { class: 'pl' }, 'Shop')),
      h('button', { class: `pill ${gifts ? 'glow' : ''}`, onclick: () => { sfx.tap(); openRoad(overlay, ectx()); } }, art('gift'), h('span', { class: 'pl' }, gifts ? `${gifts} gift${gifts > 1 ? 's' : ''}!` : nr ? `Gift at ${nr.at}★` : 'Star Road')),
      h('button', { class: 'pill', onclick: () => { sfx.tap(); openGuide(overlay, sfx); } }, art('books'), h('span', { class: 'pl' }, `${store.cardCount()}/${TOTAL_CARDS}`)),
      h('button', { class: 'pill', onclick: () => { sfx.tap(); openOops(overlay, sfx, showHub); } }, art('memo'), h('span', { class: 'pl' }, `Oops ${store.get().mistakes.length}`)),
      h('button', { class: 'iconbtn', 'aria-label': 'For grown-ups', onclick: () => openParents(overlay) }, art('bulb')),
      musicBtn, sfxBtn),
    h('div', { class: 'zone-chips' }, ZONES.map((z) => h('button', { class: `zone-chip ${z.boss && store.bossWins(z.id) ? 'beaten' : ''}`, onclick: () => openZone(z.id) }, art(z.art), h('span', {}, z.title), h('span', { class: 'st' }, `★${zoneStars(z)}`)))));
  stage.append(hubEl);
  refreshLabels();
}

async function openZone(id) {
  if (busy) return;
  const z = ZONES.find((x) => x.id === id); if (!z) return;
  sfx.whoosh();
  zoneCard?.remove();
  world && world.focus(id);
  const starRow = (s) => h('span', { class: 'stars' }, [0, 1, 2].map((i) => h('span', { class: i < s ? '' : 'no' }, '★')));
  let bossRow = null;
  if (z.boss) {
    const open = bossOpen(z), wins = store.bossWins(z.id), b = z.boss;
    const need = z.modes.filter((m) => store.stars(m.id) < 1).length;
    const prize = ALL_ITEMS[BOSS_PRIZES[z.id]];
    bossRow = h('button', { class: `mode-btn boss-btn ${open ? '' : 'locked'} ${wins ? 'beaten' : ''}`, onclick: () => { if (open) launch(b.id); else { sfx.bad(); toastFn(overlay, `Get at least 1 ★ in every game here to wake up ${b.title}.`, { ms: 2200, artId: 'lock' }); } } },
      h('div', { class: 'boss-face' }, art(b.art, { fx: b.fx || '' }), open ? null : art('lock', { cls: 'boss-lock' })),
      h('div', { class: 'mt' }, h('b', {}, `Boss: ${b.title}`),
        h('small', {}, wins ? `Beaten ×${wins}. Rematch for more stars!` : open ? `Ready to fight! First win: ${prize.name}.` : `Locked — ${need} game${need > 1 ? 's still need' : ' still needs'} a star.`)),
      starRow(store.stars(b.id)));
  }
  zoneCard = h('div', { class: 'zone-card' },
    h('button', { class: 'iconbtn close', 'aria-label': 'Close', onclick: closeZone }, art('cross')),
    h('div', { class: 'zc-head' }, art(z.art), h('h2', {}, z.title)),
    h('p', { class: 'learn' }, z.learn),
    h('div', { class: 'modes' }, z.modes.map((m) => h('button', { class: `mode-btn ${m.isBoss ? 'boss-btn' : ''}`, onclick: () => launch(m.id) }, art(m.art), h('div', { class: 'mt' }, h('b', {}, m.title), h('small', {}, m.desc)), starRow(store.stars(m.id)))), bossRow));
  stage.append(zoneCard);
}
function closeZone() { sfx.tap(); zoneCard?.remove(); zoneCard = null; world && world.overview(); }

// ---------- game runner ----------
async function launch(modeId) {
  const m = ALL_MODES.find((x) => x.id === modeId); if (!m || busy) return;
  busy = true;
  initAudio(); sfx.pop();
  zoneCard?.remove(); zoneCard = null; hubEl?.remove(); hubEl = null;
  let mod;
  try { mod = await MODS[m.mod](); } catch (e) { console.error(e); busy = false; showHub(); return; }
  world && world.setPaused(true);
  stage.querySelectorAll('.game').forEach((g) => g.remove());
  setDanger(false); setIntensity(0);

  const misses = []; const newCards = [];
  const api = { alive: true, mode: m, sfx, slow: 1, power: {} };
  const frame = gameFrame({ title: m.title, hearts: 0, progress: mod.PROGRESS !== false, onExit: () => { sfx.tap(); quit(); } });
  stage.append(frame.root);
  let maxHearts = 0, shield = false, lastIntensity = 0;
  Object.assign(api, {
    frame, body: frame.body, root: frame.root,
    music: (n) => playMusic(n), fever: setFever,
    intensity(n) { if (n !== lastIntensity) { lastIntensity = n; setIntensity(n); } },
    wait: (ms) => new Promise((r) => setTimeout(() => api.alive && r(), ms)),
    loop(fn) { let last = performance.now(); const step = (t) => { if (!api.alive) return; const dt = Math.min((t - last) / 1000, .05); last = t; if (fn(dt, t) !== false) requestAnimationFrame(step); }; requestAnimationFrame(step); },
    learn(id) { if (!id || !(CREATURES[id] || PLANTS[id])) return; if (store.unlock(id)) newCards.push(id); },
    miss(x) { misses.push(x); store.mistake({ ...x, game: m.title }); },
    toast: (t, o) => toastFn(frame.root, t, o),
    // hearts: the game asks for its usual number; power-ups may add one
    hearts(n) { maxHearts = n + (api.power.heart ? 1 : 0); frame.setHearts(maxHearts, maxHearts); return maxHearts; },
    // returns the new number of hearts (a Lucky Shield can save the first one)
    loseHeart(cur) {
      if (shield) { shield = false; toastFn(frame.root, 'Lucky shield! No heart lost.', { artId: 'shield', ms: 1500 }); sfx.dodge(); return cur; }
      const n = Math.max(0, cur - 1); frame.setHearts(n, maxHearts); setDanger(n === 1 && maxHearts > 1); return n;
    },
    intro: (o) => new Promise((r) => {
      const tray = powerTray({ hearts: !!mod.HEARTS, timed: !!mod.TIMED }, { sfx });
      introModal(frame.root, { ...o, extra: tray.el }).then(() => {
        api.power = tray.take(); api.slow = api.power.slow ? 1.25 : 1; shield = !!api.power.shield;
        const on = Object.keys(api.power).map((k) => ({ heart: 'Extra heart', slow: 'Slow-mo', shield: 'Lucky shield', clover: 'Lucky clover' }[k]));
        if (on.length) toastFn(frame.root, `Power-up on: ${on.join(', ')}`, { artId: 'zap', ms: 1800 });
        api.alive && r();
      });
    }),
    ask: (o) => new Promise((r) => askFn(frame.root, { sfx, ...o }).then((v) => api.alive && r(v))),
    finish: (res) => finish(res),
  });
  busy = false;

  function calm() { setFever(false); setIntensity(0); setDanger(false); }
  function quit() {
    api.alive = false; calm();
    frame.root.remove();
    world && world.setPaused(false);
    playMusic('island');
    showHub();
    world && world.overview();
  }

  function finish({ score = 0, correct = 0, total = 0, stars = null, won = true, headline } = {}) {
    if (!api.alive) return;
    calm();
    const acc = total ? correct / total : 0;
    const st = stars ?? (won ? (acc >= .9 ? 3 : acc >= .7 ? 2 : 1) : (acc >= .6 ? 1 : 0));
    const prevBest = store.stars(m.id);
    store.record(m.id, st, score);
    // stars into the pouch: every play counts; clover doubles a 3-star run; boss wins add a bonus
    const firstBossWin = !!(m.reward && won && store.bossWins(m.reward) === 0);
    let earned = st; if (api.power.clover && st === 3) earned *= 2;
    const bossBonus = m.reward && won ? (firstBossWin ? 5 : 2) : 0;
    const roadBefore = claimableRoad();
    store.earn(earned + bossBonus);
    if (m.reward && won) store.bossWin(m.reward);
    playMusic(st >= 2 ? 'victory' : 'island');
    const starEls = [0, 1, 2].map(() => art('star'));
    const title = headline || (st === 3 ? 'Brilliant!' : st === 2 ? 'Great job!' : st === 1 ? 'Nice try!' : 'Keep training!');
    const z = ZONES.find((zz) => zz.id === m.zone);
    const next = (() => { const i = z.modes.findIndex((x) => x.id === m.id); if (i >= 0 && z.modes[i + 1]) return z.modes[i + 1]; if (i >= 0 && z.boss && bossOpen(z) && !store.bossWins(z.id)) return z.boss; return null; })();
    const nr = nextRoad(); const newGifts = claimableRoad() > roadBefore;
    const md = modal(frame.root,
      h('div', { class: 'bigstars' }, starEls),
      h('h2', {}, title),
      h('div', { class: 'result-score' }, `Score ${score}`),
      total ? h('p', {}, `${correct} of ${total} correct`) : null,
      st > prevBest && prevBest > 0 ? h('p', { class: 'learnline' }, 'New best!') : null,
      earned + bossBonus > 0 ? h('div', { class: 'pouch-gain' }, art('star', { size: 34 }), h('b', {}, `+${earned + bossBonus}`), h('span', {}, ` to your pouch${api.power.clover && st === 3 ? ' (clover doubled it!)' : ''}${bossBonus ? ` · boss bonus +${bossBonus}` : ''} · you have ${store.pouch()}`)) : null,
      newGifts ? h('p', { class: 'gift-line' }, art('gift', { size: 30 }), 'A Star Road gift is waiting for you!') : nr ? h('p', { class: 'learnline' }, `Star Road: ${nr.at - store.lifetime()} more stars to the next gift.`) : null,
      newCards.length ? h('div', {}, h('p', { style: { fontWeight: 700, marginTop: '10px' } }, `New Field Guide cards: ${newCards.length}`), h('div', { style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px' } }, newCards.slice(0, 12).map((id) => creatureArt(id, { size: 56 })))) : null,
      misses.length ? h('div', { class: 'review' }, h('b', {}, 'Remember:'), misses.slice(0, 4).map((x) => h('div', { class: 'ri' }, h('div', {}, x.q), h('div', {}, h('b', {}, '✔ '), x.ans)))) : null,
      h('div', { class: 'actions' },
        h('button', { class: 'btn ghost', onclick: () => { md.close(); quit(); } }, 'Island'),
        h('button', { class: 'btn', onclick: () => { md.close(); api.alive = false; frame.root.remove(); launch(m.id); } }, m.isBoss && !won ? 'Try again' : 'Play again'),
        newGifts ? h('button', { class: 'btn hot', onclick: () => { md.close(); quit(); openRoad(overlay, ectx()); } }, 'Open gift') : null,
        next ? h('button', { class: `btn go ${next.isBoss ? 'bossy' : ''}`, onclick: () => { md.close(); api.alive = false; frame.root.remove(); launch(next.id); } }, next.isBoss ? `Fight ${next.title}!` : `Next: ${next.title}`) : null));
    st >= 2 ? sfx.win() : sfx.lose();
    if (st >= 2) confetti(st === 3 ? 160 : 70);
    starEls.forEach((s, i) => { if (i < st) setTimeout(() => { s.classList.add('on'); sfx.star(); burstAt(s, { n: 14, kind: 'star', colors: ['#FFB627', '#FFE066', '#FFFFFF'] }); }, 450 + i * 380); });
    // first boss win: a prize box on top of the results
    if (firstBossWin) setTimeout(() => { if (api.alive) openGift(frame.root, { item: BOSS_PRIZES[m.reward] }, ectx(), { title: 'Boss prize!', sub: `${m.title} dropped a gift.` }); }, 1700);
  }

  try { await mod.default(api); } catch (e) { console.error(e); api.toast('Something went wrong in this game. Tap the map to go back.', { kind: 'bad', ms: 0 }); }
}

// expose for testing
window.__wq = { launch, ZONES, store, DATA, openZone, BOSSES, ITEMS: { COSTUMES, PETS, DECOR, POWERUPS, ROAD, BOSS_PRIZES } };
