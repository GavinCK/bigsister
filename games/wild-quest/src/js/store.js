// Progress saved in this browser only (localStorage, failure-safe)
const KEY = 'wildquest-bio-p6-v1';
const blank = () => ({ stars: {}, best: {}, cards: {}, mistakes: [], settings: { music: true, sfx: true }, plays: 0 });
let state = blank();

try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = Object.assign(blank(), JSON.parse(raw));
} catch (e) { /* private mode or blocked storage: play without saving */ }

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
    // m = {key, q, you, ans, why, game}
    state.mistakes = state.mistakes.filter((x) => x.key !== m.key);
    state.mistakes.unshift({ ...m, t: Date.now(), n: 1 });
    state.mistakes = state.mistakes.slice(0, 80);
    save();
  },
  clearMistake(key) { state.mistakes = state.mistakes.filter((x) => x.key !== key); save(); },
  setting(k, v) { if (v === undefined) return state.settings[k]; state.settings[k] = v; save(); },
  reset() { state = blank(); save(); },
};
