// Progress saved in this browser only (localStorage, failure-safe)
// KEY must never change (it would wipe Joycelyn's progress). New fields get defaults in blank()/ensure().
const KEY = 'wildquest-bio-p6-v1';
const blank = () => ({
  stars: {}, best: {}, cards: {}, mistakes: [], settings: { music: true, sfx: true }, plays: 0,
  // v2: star economy
  pouch: 0,          // stars you can spend
  lifetime: 0,       // every star ever earned (Star Road)
  owned: { 'c-scientist': 1 },
  equip: { costume: 'c-scientist', pet: null },
  decor: [],
  bosses: {},        // zone id -> { wins }
  road: {},          // milestone -> claimed time
  power: { heart: 0, slow: 0, shield: 0, clover: 0 },
});
let state = blank();

try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const saved = JSON.parse(raw);
    state = Object.assign(blank(), saved);
    ensure(saved);
  }
} catch (e) { /* private mode or blocked storage: play without saving */ }

function ensure(saved) {
  const b = blank();
  state.owned = Object.assign(b.owned, state.owned || {});
  state.equip = Object.assign(b.equip, state.equip || {});
  state.power = Object.assign(b.power, state.power || {});
  if (!Array.isArray(state.decor)) state.decor = [];
  // players from v1 get their earned stars as a starting pouch
  if (!('pouch' in saved)) { const t = Object.values(state.stars).reduce((a, x) => a + x, 0); state.pouch = t; state.lifetime = t; }
}

function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

export const store = {
  get: () => state,
  stars(mode) { return state.stars[mode] || 0; },
  totalStars() { return Object.values(state.stars).reduce((a, b) => a + b, 0); },
  record(mode, stars, score) {
    state.stars[mode] = Math.max(state.stars[mode] || 0, stars);
    state.best[mode] = Math.max(state.best[mode] || 0, score || 0);
    state.plays++;
    save();
  },
  unlock(id) { if (id && !state.cards[id]) { state.cards[id] = Date.now(); save(); return true; } return false; },
  has(id) { return !!state.cards[id]; },
  cardCount() { return Object.keys(state.cards).length; },
  mistake(m) {
    state.mistakes = state.mistakes.filter((x) => x.key !== m.key);
    state.mistakes.unshift({ ...m, t: Date.now(), n: 1 });
    state.mistakes = state.mistakes.slice(0, 80);
    save();
  },
  clearMistake(key) { state.mistakes = state.mistakes.filter((x) => x.key !== key); save(); },
  setting(k, v) { if (v === undefined) return state.settings[k]; state.settings[k] = v; save(); },
  reset() { state = blank(); save(); },
  // ---- star economy ----
  pouch: () => state.pouch,
  lifetime: () => state.lifetime,
  earn(n) { if (n > 0) { state.pouch += n; state.lifetime += n; save(); } },
  spend(n) { if (state.pouch < n) return false; state.pouch -= n; save(); return true; },
  refund(n) { state.pouch += n; save(); },
  owns: (id) => !!state.owned[id],
  own(id) { state.owned[id] = Date.now(); save(); },
  equipped: (slot) => state.equip[slot],
  equip(slot, id) { state.equip[slot] = id; save(); },
  decor: () => state.decor.slice(),
  addDecor(id) { if (!state.decor.includes(id)) { state.decor.push(id); save(); } },
  powerCount: (id) => state.power[id] || 0,
  addPower(id, n = 1) { state.power[id] = Math.max(0, (state.power[id] || 0) + n); save(); },
  bossWins: (z) => state.bosses[z]?.wins || 0,
  bossWin(z) { state.bosses[z] = { wins: (state.bosses[z]?.wins || 0) + 1, t: Date.now() }; save(); },
  roadClaimed: (at) => !!state.road[at],
  claimRoad(at) { state.road[at] = Date.now(); save(); },
};
