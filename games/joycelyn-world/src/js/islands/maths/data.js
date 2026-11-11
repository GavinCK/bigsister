// Maths Island · zones and saved progress (shared by pack.js and engine.js)
import { store } from '../../core/store.js';
import { TOPIC } from './mathlib.js';

// Zones on the island. Core topics come from Pages 1–5; Challenge Peak holds Pages 6–8.
export const MZONES = [
  { id: 'calc', title: 'Calc Cove', art: 'hundred', topics: ['ops', 'dec', 'fracmix'], learn: 'Order of operations, decimals × ÷ 0.1 and 0.01, and fraction calculations (Pages 1–5).',
    boss: { title: 'Captain Calc', art: 'alien' } },
  { id: 'frac', title: 'Fraction Falls', art: 'cake', topics: ['convert', 'compare'], learn: 'Change between fractions, decimals and percentages; compare and order numbers.',
    boss: { title: 'Squiddy Slice', art: 'squid' } },
  { id: 'eq', title: 'Algebra Bridge', art: 'key', topics: ['eq', 'pattern'], learn: 'Solve equations, algebra puzzles, number patterns and averages.',
    boss: { title: 'King Balance', art: 'gorilla' } },
  { id: 'shape', title: 'Shape Garden', art: 'gem', topics: ['shapes', 'volume', 'circle'], learn: '3-D shapes, circle words, angles, volume and capacity, circumference.',
    boss: { title: 'Mammoth Prism', art: 'mammoth' } },
  { id: 'measure', title: 'Measure Market', art: 'stopwatch', topics: ['units', 'percent', 'speed'], learn: 'Units of time, area and mass; percentages; speed and arrival times.',
    boss: { title: 'Major Metre', art: 'shark' } },
  { id: 'peak', title: 'Challenge Peak', art: 'snowmountain', topics: ['eqpro', 'circlepro', 'pctpro', 'speedpro', 'angles', 'numpro'], challenge: true,
    learn: 'The hard stuff from Pages 6–8: tricky equations, circle areas, discounts, speed, angles and number sense. Come here after the core zones!',
    boss: { title: 'Rex the Riddler', art: 'trex' } },
  { id: 'hall', title: 'Interview Hall', art: 'crown', topics: [], learn: 'Mock interviews: 12 quick questions, read aloud, timed, no hints and no paper — just like the real thing.' },
];
export const MZONE = Object.fromEntries(MZONES.map((z) => [z.id, z]));
export const zoneOfTopic = (tid) => MZONES.find((z) => z.topics.includes(tid));

const DEF_SETTINGS = { input: 'pad', speak: true, itime: 45, scratchTest: true };
export function ms() {
  const p = store.pack('maths', { settings: {}, topics: {}, gens: {}, tests: [], interviews: [] });
  for (const k in DEF_SETTINGS) if (p.settings[k] === undefined) p.settings[k] = DEF_SETTINGS[k];
  return p;
}
export const settings = () => ms().settings;
export const tstat = (id) => { const t = ms().topics; return t[id] || (t[id] = { ps: 0, pb: -1, n: 0, c: 0, last: 0 }); };
export const gstat = (id) => { const g = ms().gens; return g[id] || (g[id] = { n: 0, c: 0 }); };
export const palId = (tid) => `pal-${tid}`;
export const hasPal = (tid) => store.has(palId(tid));
export const medalOf = (p) => (p >= 100 ? ['trophy', 'Gold', 3] : p >= 80 ? ['medal', 'Silver', 2] : p >= 60 ? ['star', 'Bronze', 1] : null);
export const mastered = (tid) => { const t = tstat(tid); return t.ps >= 3 && t.pb >= 100; };
export const topicTitle = (tid) => TOPIC[tid].en;
