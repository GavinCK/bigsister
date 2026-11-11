// =============================================================
//  Maths Island — P6 Mental Maths for the secondary-school interview. Everything is in English.
//  One zone per page of the 8 Mental papers. Each page: Practice paper (12 questions with hints)
//  + Interview (12 questions read aloud, timed, no hints). 10/12 in a page's Interview wins its pet.
//  Every question has the same structure and size of numbers as that question on the paper.
// =============================================================
import { h } from '../../core/ui.js';
import { art } from '../../core/art.js';
import { store } from '../../core/store.js';
import { ALL_ITEMS, BOSS_PRIZES } from '../../core/items.js';
import { PAPERS, PAGE, GEN, makeQ, paperQs } from './papers.js';
import { checkAnswer, ansEntry } from './mathlib.js';
import { ms, settings, pstat, gstat, medalOf, prizeKey, pageWon, pageSub, PAGE_ART, WIN_SCORE } from './data.js';
import { buildMaths } from './island.js';

const ZONES = PAPERS.map((P) => {
  const n = P.n, prize = ALL_ITEMS[BOSS_PRIZES[prizeKey(n)]];
  const z = {
    id: P.id, title: `Page ${n}`, art: PAGE_ART[n],
    learn: `${pageSub(P)} · ${P.level === 'core' ? 'Core paper' : 'Challenge paper (harder)'}. ${P.about}`,
    modes: [
      { id: `mp-${n}`, title: `Practice · Page ${n}`, art: 'memo', desc: `Q1–Q10b like the paper · hints 💡 · drill one type`, mod: 'maths', page: n, kind: 'practice' },
      { id: `mi-${n}`, title: `Interview · Page ${n}`, art: 'crown', desc: `Read aloud · timed · no hints${prize ? ` · ${WIN_SCORE}/12 wins the ${prize.name}` : ''}`, mod: 'maths', page: n, kind: 'interview', reward: prizeKey(n) },
    ],
  };
  if (n === 1) z.modes.push({ id: 'm-fix', title: 'Fix my mistakes', art: 'memo', desc: 'New questions like the ones in your Oops Book', mod: 'maths', fix: true, hidden: true },
    { id: 'm-drill', title: 'Drill', art: 'memo', desc: 'One question type, 5 times', mod: 'maths', hidden: true });
  return z;
});

// ---------- grown-ups section (English, like the island) ----------
function parents() {
  const S = settings(), wrap = h('div', {});
  const P = ms();
  const pct = (s) => (s.n ? `${Math.round(s.c / s.n * 100)}%` : '—');
  const seg = (k, opts) => h('span', { class: 'seg' }, opts.map(([v, l]) => h('button', { class: `btn small ${S[k] === v ? 'go' : 'ghost'}`, onclick: () => { S[k] = v; store.save(); wrap.replaceWith(parents()); } }, l)));
  const weak = Object.entries(P.gens).filter(([id, g]) => GEN[id] && g.n >= 3).map(([id, g]) => [id, g.c / g.n, g.n]).sort((a, b) => a[1] - b[1]).slice(0, 8);
  const ivs = P.interviews.filter((v) => v.page);
  wrap.append(
    h('p', {}, 'Mental maths for the secondary-school interview, built page by page from the 8 P6 Mental papers. Pages 1–5 are the core papers (most important); Pages 6–8 are harder. Every page has the same 12 questions as the paper (Q1–Q8, 9a, 9b, 10a, 10b): each one is generated with new numbers but the same structure and the same size of numbers, so it can be answered in the head. Nothing is copied from the papers. Everything on this island is in English, because the interview is in English.'),
    h('ul', {},
      h('li', {}, 'Practice paper: the 12 questions of the page in order, with 2 hints and the full method for each. Two wrong tries show the method and add a new question of the same kind at the end. “Drill” practises one question type 5 times.'),
      h('li', {}, `Interview: the 12 questions read aloud, timed per question, no hints and no paper. “Say it out loud” lets a grown-up play the interviewer and mark each answer. ${WIN_SCORE}/12 or more the first time wins that page's pet.`),
      h('li', {}, 'Answers: on-screen keypad (fraction and mixed-number boxes), Apple Pencil handwriting in the boxes, the iPad keyboard\'s dictation key, or the 🎤 button where the browser supports it.'),
      h('li', {}, 'Marking follows school rules: fractions in simplest form, the asked-for form (decimal / fraction), rounding keeps the trailing 0 (2.0), proper < / > signs, a.m./p.m.')),
    h('div', { class: 'parent-set' },
      h('div', {}, h('b', {}, 'Answer with: '), seg('input', [['pad', 'Keypad'], ['kbd', 'iPad keyboard']])),
      h('div', {}, h('b', {}, 'Interview time per question: '), seg('itime', [[30, '30 s'], [45, '45 s'], [60, '60 s'], [90, '90 s'], [0, 'Off']])),
      h('div', {}, h('b', {}, 'Read interview questions aloud: '), seg('speak', [[true, 'On'], [false, 'Off']]))),
    h('div', { class: 'tablewrap' }, h('table', {},
      h('tr', {}, ['Page', 'Paper', 'Practice', 'Best interview', 'Prize', 'Accuracy', 'Last practised'].map((x) => h('th', {}, x))),
      PAPERS.map((p) => { const s = pstat(p.n), md = s.ib >= 0 ? medalOf(s.ib) : null; return h('tr', {},
        h('td', {}, h('b', {}, `Page ${p.n}`)), h('td', {}, `${pageSub(p)} (${p.level === 'core' ? 'core' : 'harder'})`),
        h('td', {}, '★'.repeat(s.ps) + '☆'.repeat(3 - s.ps)), h('td', {}, s.ib >= 0 ? `${s.ib} / 12${md ? ' ' + md[1] : ''}` : '—'), h('td', {}, pageWon(p.n) ? '✓' : '—'), h('td', {}, pct(s)),
        h('td', {}, s.last ? new Date(s.last).toLocaleDateString('en-GB') : '—')); }))),
    h('h4', {}, 'Weakest question types'),
    weak.length ? h('ul', {}, weak.map(([id, a, n]) => h('li', {}, `Page ${GEN[id].page} ${GEN[id].lab} · ${GEN[id].skill}: ${Math.round(a * 100)}% (${n} answers)`))) : h('p', {}, 'Not enough answers yet.'),
    h('h4', {}, 'Interviews'),
    ivs.length ? h('div', { class: 'tablewrap' }, h('table', {}, h('tr', {}, ['When', 'Page', 'Score', 'Avg per question', '⚡ under 10 s'].map((x) => h('th', {}, x))),
      ivs.slice(-12).reverse().map((v) => h('tr', {}, h('td', {}, new Date(v.t).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })), h('td', {}, `Page ${v.page}${v.oral ? ' (spoken)' : ''}`), h('td', {}, h('b', {}, `${v.score} / ${v.total}`)), h('td', {}, v.avg ? `${v.avg} s` : '—'), h('td', {}, v.fast || 0))))) : h('p', {}, 'No interviews yet.'));
  return wrap;
}

export default {
  id: 'maths', title: 'Maths Island', short: 'Maths', subject: 'Mental Maths · P6 interview', art: 'owl', color: '#5BC8FF', lang: 'en',
  at: { x: 84, z: -34 }, radius: 24, labelY: 22,
  build: buildMaths,
  zones: ZONES,
  mods: { maths: () => import('./engine.js') },
  music: 'island', unitName: 'mode',
  welcome: 'Maths Island — one zone for each page of your Mental papers. Everything here is in English, just like your interview!',
  zoneStars(z) { const n = +z.id.slice(1); return store.stars(`mp-${n}`) + store.stars(`mi-${n}`); },
  zoneMax() { return 6; },
  modeExtra(m) {
    if (m.kind !== 'interview') return null;
    const ib = pstat(m.page).ib, md = ib >= 0 ? medalOf(ib) : null, prize = ALL_ITEMS[BOSS_PRIZES[m.reward]];
    return h('span', { class: 'mode-medal', title: 'Best interview score' }, pageWon(m.page) && prize ? art(prize.art, { size: 30 }) : null, md ? art(md[0], { size: 28 }) : null, h('small', {}, ib >= 0 ? `${ib}/12` : 'Best —'));
  },
  onBoot() {
    // Questions from the first version of Maths Island (topic generators) no longer exist: drop their Oops entries once.
    const p = ms();
    if (!p.v2) { p.v2 = 1; store.get().mistakes.filter((x) => x.pack === 'maths' && !GEN[x.gen]).forEach((x) => store.clearMistake(x.key)); store.save(); }
  },
  oopsHeader(ctx, root) {
    if (!store.mistakesFor('maths').some((x) => GEN[x.gen])) return null;
    return h('div', { class: 'oops-head' }, h('button', { class: 'btn go', onclick: () => { root.remove(); ctx.launch('m-fix'); } }, '🩹 Fix my maths mistakes (new numbers)'));
  },
  oopsAction(m, ctx, root) { return m.gen && GEN[m.gen] ? h('button', { class: 'btn small', onclick: () => { root.remove(); ctx.launch('m-fix', { gens: [m.gen] }); } }, 'Practise it') : null; },
  parents,
  debug: { GEN, PAPERS, PAGE, makeQ, paperQs, checkAnswer, ansEntry },
};
