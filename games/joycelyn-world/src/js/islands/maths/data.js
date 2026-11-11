// Maths Island · saved progress and page prizes (shared by pack.js, engine.js and island.js)
// One zone per page of the P6 Mental papers: p1 … p8.
import { store } from '../../core/store.js';
import { PAPERS } from './papers.js';

// First Interview score of 10/12 or more on a page wins its pet (paid through the shared BOSS_PRIZES table in core/items.js)
export const PAGE_ART = { 1: 'hundred', 2: 'cake', 3: 'key', 4: 'gem', 5: 'stopwatch', 6: 'bullseye', 7: 'moneybag', 8: 'snowmountain' };
export const WIN_SCORE = 10;
export const prizeKey = (n) => `m-p${n}`;
export const pageTitle = (n) => `Page ${n}`;
export const pageSub = (p) => `${p.name}${p.when ? ` · ${p.when}` : ''}`;

const DEF_SETTINGS = { input: 'pad', speak: true, itime: 45 };
export function ms() {
  const p = store.pack('maths', { settings: {}, pages: {}, gens: {}, interviews: [] });
  if (!p.settings) p.settings = {};
  if (!p.pages) p.pages = {};
  if (!p.gens) p.gens = {};
  if (!p.interviews) p.interviews = [];
  for (const k in DEF_SETTINGS) if (p.settings[k] === undefined) p.settings[k] = DEF_SETTINGS[k];
  return p;
}
export const settings = () => ms().settings;
// ps = best Practice stars, ib = best Interview score (out of 12, -1 = never), n/c = answers / correct, last = last played
export const pstat = (n) => { const t = ms().pages; return t[n] || (t[n] = { ps: 0, ib: -1, n: 0, c: 0, last: 0 }); };
export const gstat = (id) => { const g = ms().gens; return g[id] || (g[id] = { n: 0, c: 0 }); };
export const medalOf = (score) => (score >= 12 ? ['trophy', 'Gold', 3] : score >= 10 ? ['medal', 'Silver', 2] : score >= 8 ? ['star', 'Bronze', 1] : null);
export const ivStars = (score) => (score >= 11 ? 3 : score >= 9 ? 2 : score >= 6 ? 1 : 0);
export const pageWon = (n) => store.bossWins(prizeKey(n)) > 0;
export const PAGES = PAPERS;
