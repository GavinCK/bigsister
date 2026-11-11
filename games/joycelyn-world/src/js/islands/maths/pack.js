// =============================================================
//  Maths Island — P6 Mental Maths for the secondary-school interview. Everything is in English.
//  Zones group the 19 topics; each topic = Practice (stars) + Test (medal + Maths Pal).
//  Each zone ends with a Zone Test boss; Interview Hall runs the mock interviews.
// =============================================================
import { h, modal } from '../../core/ui.js';
import { art, registerCreatures } from '../../core/art.js';
import { store } from '../../core/store.js';
import { bookShell } from '../../core/books.js';
import { TOPIC, TOPICS, GEN, makeQ, checkAnswer, ansEntry } from './mathlib.js';
import { MZONES, MZONE, tstat, gstat, palId, hasPal, medalOf, ms, settings } from './data.js';
import { buildMaths } from './island.js';

// Maths Pals are collectable cards (like the Field Guide); register them so any book can draw them
registerCreatures(Object.fromEntries(TOPICS.map((t) => [palId(t.id), { name: t.pal[1], art: t.pal[0] }])));

const topicMode = (t) => ({ id: `m-${t.id}`, title: t.en, art: t.pal[0], desc: `${t.gens.length} skills · ${t.lv === 'pro' ? 'Challenge (Pages 6–8)' : 'Core (Pages 1–5)'} · Practice + Test`, mod: 'maths', topic: t.id });
const ZONES = MZONES.map((z) => {
  const out = { id: z.id, title: z.title, art: z.art, learn: z.learn };
  if (z.id === 'hall') out.modes = [
    { id: 'miv-core', title: 'Mock Interview · Core', art: 'crown', desc: '12 questions like Pages 1–5 · read aloud · timed · no hints', mod: 'maths', interview: 'core' },
    { id: 'miv-full', title: 'Mock Interview · Full', art: 'trophy', desc: '12 harder questions from Pages 1–8', mod: 'maths', interview: 'full' },
    { id: 'm-fix', title: 'Fix my mistakes', art: 'memo', desc: 'New questions like the ones in your Oops Book', mod: 'maths', fix: true, hidden: true },
  ];
  else out.modes = z.topics.map((tid) => topicMode(TOPIC[tid]));
  if (z.boss) out.boss = { id: `mz-${z.id}`, title: z.boss.title, art: z.boss.art, mod: 'maths', zoneTest: z.id, isBoss: true, reward: `m-${z.id}`, label: 'Zone Test', lockText: `Get at least 1 ★ in Practice for every topic in ${z.title} to wake up ${z.boss.title}.` };
  return out;
});

const testStars = (tid) => store.stars(`m-${tid}-t`);
const allPals = () => TOPICS.filter((t) => hasPal(t.id));

// ---------- Maths Pals book ----------
function openPals(parent, ctx, done) {
  const { body, root } = bookShell(parent, 'Maths Pals', done, `${allPals().length} / ${TOPICS.length} pals`);
  body.append(h('p', { class: 'shop-note' }, 'Score 80% or more in a topic Test to win its Maths Pal. Your pals come and live on Maths Island!'));
  const grid = h('div', { class: 'cards' });
  [['Core · Pages 1–5', TOPICS.filter((t) => t.lv === 'core')], ['Challenge · Pages 6–8', TOPICS.filter((t) => t.lv === 'pro')]].forEach(([title, list]) => {
    grid.append(h('h3', { style: { gridColumn: '1 / -1', margin: '10px 0 0' } }, title));
    list.forEach((t) => {
      const got = hasPal(t.id);
      grid.append(h('button', { class: `card ${got ? '' : 'locked'}`, style: { '--gc': t.color }, onclick: () => {
        ctx.sfx.tap();
        const md = modal(root, art(t.pal[0], { cls: 'hero-art', fx: got ? '' : 'brightness(0) opacity(.25)' }), h('h2', {}, got ? t.pal[1] : 'Not won yet'),
          h('p', {}, got ? `Your pal for ${t.en}. Best test: ${tstat(t.id).pb}%.` : `Score 80% or more in the ${t.en} Test to win this pal.`),
          h('div', { class: 'actions' }, h('button', { class: 'btn small ghost', onclick: () => md.close() }, 'Close'),
            h('button', { class: 'btn small go', onclick: () => { md.close(); root.remove(); ctx.launch(`m-${t.id}`); } }, `Go to ${t.en}`)));
      } }, art(t.pal[0], { fx: got ? '' : 'brightness(0) opacity(.22)' }), h('b', {}, got ? t.pal[1] : '???'), h('small', {}, t.en)));
    });
  });
  body.append(grid);
}

// ---------- grown-ups section (English, like the island) ----------
function parents(ctx) {
  const S = settings(), wrap = h('div', {});
  const P = ms();
  const pct = (s) => (s.n ? `${Math.round(s.c / s.n * 100)}%` : '—');
  const seg = (k, opts) => h('span', { class: 'seg' }, opts.map(([v, l]) => h('button', { class: `btn small ${S[k] === v ? 'go' : 'ghost'}`, onclick: () => { S[k] = v; store.save(); wrap.replaceWith(parents(ctx)); } }, l)));
  const weak = Object.entries(P.gens).filter(([, g]) => g.n >= 3).map(([id, g]) => [id, g.c / g.n, g.n]).sort((a, b) => a[1] - b[1]).slice(0, 6);
  wrap.append(
    h('p', {}, 'Mental maths for the secondary-school interview, built from 8 P6 Mental papers: Pages 1–5 are the core (most important), Pages 6–8 are the challenge topics. Every question is generated with new numbers in the same style as the papers — nothing is copied. Everything on this island is in English, because the interview is in English.'),
    h('ul', {},
      h('li', {}, 'Each topic: Practice first (hints, scratch paper, step-by-step method, a new similar question after two wrong tries), then the Test (8 questions, no hints, marked at the end). 80% in the Test wins that topic\'s Maths Pal.'),
      h('li', {}, 'Each zone has a Zone Test boss (10 mixed questions, 80% to win). It wakes up when every topic in the zone has at least 1 ★ in Practice. The first win gives a pet.'),
      h('li', {}, 'Interview Hall: a 12-question mock interview in the format of the papers (Q1–Q10 with 9a/b, 10a/b), read aloud, timed per question, no hints and no paper. "Say it out loud" mode lets a grown-up play the interviewer and mark each answer.'),
      h('li', {}, 'Answers: on-screen keypad (fraction and mixed-number boxes), Apple Pencil handwriting in the boxes, the iPad keyboard\'s dictation key, or the 🎤 button where the browser supports it.'),
      h('li', {}, 'Marking follows school rules: fractions in simplest form, the asked-for form (decimal / fraction), rounding keeps the trailing 0 (2.0), proper < / > signs, a.m./p.m.')),
    h('div', { class: 'parent-set' },
      h('div', {}, h('b', {}, 'Answer with: '), seg('input', [['pad', 'Keypad'], ['kbd', 'iPad keyboard']])),
      h('div', {}, h('b', {}, 'Interview time per question: '), seg('itime', [[30, '30 s'], [45, '45 s'], [60, '60 s'], [90, '90 s'], [0, 'Off']])),
      h('div', {}, h('b', {}, 'Read interview questions aloud: '), seg('speak', [[true, 'On'], [false, 'Off']])),
      h('div', {}, h('b', {}, 'Scratch paper in Tests: '), seg('scratchTest', [[true, 'On'], [false, 'Off']]))),
    h('div', { class: 'tablewrap' }, h('table', {},
      h('tr', {}, ['Topic', 'Level', 'From the papers', 'Practice', 'Test best', 'Accuracy', 'Last practised'].map((x) => h('th', {}, x))),
      TOPICS.map((t) => { const s = tstat(t.id); return h('tr', {},
        h('td', {}, h('b', {}, t.en), hasPal(t.id) ? ' ✓pal' : ''), h('td', {}, t.lv === 'core' ? 'Core' : 'Challenge'), h('td', {}, t.src),
        h('td', {}, '★'.repeat(s.ps) + '☆'.repeat(3 - s.ps)), h('td', {}, s.pb >= 0 ? `${s.pb}%${medalOf(s.pb) ? ' ' + medalOf(s.pb)[1] : ''}` : '—'), h('td', {}, pct(s)),
        h('td', {}, s.last ? new Date(s.last).toLocaleDateString('en-GB') : '—')); }))),
    h('h4', {}, 'Weakest skills'),
    weak.length ? h('ul', {}, weak.map(([id, a, n]) => h('li', {}, `${TOPIC[GEN[id].topic].en} → ${GEN[id].label}: ${Math.round(a * 100)}% (${n} questions)`))) : h('p', {}, 'Not enough answers yet.'),
    h('h4', {}, 'Mock interviews'),
    P.interviews.length ? h('div', { class: 'tablewrap' }, h('table', {}, h('tr', {}, ['When', 'Type', 'Score', 'Avg per question', '⚡ under 10 s'].map((x) => h('th', {}, x))),
      P.interviews.slice(-12).reverse().map((v) => h('tr', {}, h('td', {}, new Date(v.t).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })), h('td', {}, `${v.kind === 'core' ? 'Core' : 'Full'}${v.oral ? ' (spoken)' : ''}`), h('td', {}, h('b', {}, `${v.score} / ${v.total}`)), h('td', {}, v.avg ? `${v.avg} s` : '—'), h('td', {}, v.fast || 0))))) : h('p', {}, 'No mock interviews yet.'));
  return wrap;
}

export default {
  id: 'maths', title: 'Maths Island', short: 'Maths', subject: 'Mental Maths · P6 interview', art: 'owl', color: '#5BC8FF', lang: 'en',
  at: { x: 84, z: -34 }, radius: 24, labelY: 22,
  build: buildMaths,
  zones: ZONES,
  mods: { maths: () => import('./engine.js') },
  music: 'island', unitName: 'topic',
  welcome: 'Maths Island — everything here is in English, just like your interview!',
  isCard: (id) => id.startsWith('pal-'),
  zoneStars(z) {
    const zd = MZONE[z.id];
    if (z.id === 'hall') return store.stars('miv-core') + store.stars('miv-full');
    return zd.topics.reduce((a, t) => a + store.stars(`m-${t}`) + testStars(t), 0) + (z.boss ? store.stars(z.boss.id) : 0);
  },
  zoneMax(z) { const zd = MZONE[z.id]; return z.id === 'hall' ? 6 : zd.topics.length * 6 + (z.boss ? 3 : 0); },
  modeExtra(m) {
    if (!m.topic) return null;
    const pb = tstat(m.topic).pb, md = pb >= 0 ? medalOf(pb) : null;
    return h('span', { class: 'mode-medal', title: 'Best test score' }, hasPal(m.topic) ? art(TOPIC[m.topic].pal[0], { size: 30 }) : null, md ? art(md[0], { size: 28 }) : null, pb >= 0 ? h('small', {}, `${pb}%`) : h('small', {}, 'Test —'));
  },
  books: [{ id: 'pals', art: 'owl', label: () => `${allPals().length}/${TOPICS.length} Pals`, open: openPals }],
  oopsHeader(ctx, root) {
    if (!store.mistakesFor('maths').some((x) => x.gen)) return null;
    return h('div', { class: 'oops-head' }, h('button', { class: 'btn go', onclick: () => { root.remove(); ctx.launch('m-fix'); } }, '🩹 Fix my maths mistakes (new numbers)'));
  },
  oopsAction(m, ctx, root) { return m.gen && GEN[m.gen] ? h('button', { class: 'btn small', onclick: () => { root.remove(); ctx.launch('m-fix', { gens: [m.gen] }); } }, 'Practise it') : null; },
  refreshIsland(api) { if (api && api.setPals) api.setPals(allPals().map((t) => t.id)); },
  parents,
  debug: { GEN, TOPICS, makeQ, checkAnswer, ansEntry },
};
