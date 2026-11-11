// =============================================================
//  Maths Island · the 8 Mental papers, question by question
//  Every page of the P6 "Mental Practice" papers has the same 12 slots (Q1–Q8, 9a, 9b, 10a, 10b).
//  Each slot below is a generator that makes a NEW question with the SAME structure and the SAME
//  size of numbers as that question on the paper — so it can be answered in the head, the way the
//  interview asks it. Nothing is copied from the papers (they are copyright); only the style is kept.
//
//  A generator returns { html, kind:'num'|'choice'|'order'|'time', ans | choices+correct | items+dir | t+fmt,
//                        form:'any'|'frac'|'dec'|'dpN', unit, pre, hints:[2], steps:[..] }
// =============================================================
import {
  ri, pick, chance, shuffle, gcd, R, D, qa, qs, qm, qd, qcmp, qval, qint, MX, isTerm, dpOf, decStr, roundR,
  fH, frH, impH, t24, t12, BL, V, n$, PI314, PI227, retry, angleSVG,
} from './mathlib.js';

/* ---------- small helpers ---------- */
const VARS = ['x', 'y', 'A', 'B', 'D', 'K', 'm', 'n', 'p', 'a'];
const PEOPLE = [['Kate', 'she', 'her'], ['Tom', 'he', 'his'], ['Mia', 'she', 'her'], ['Leo', 'he', 'his'], ['Amy', 'she', 'her'], ['Ben', 'he', 'his'], ['Chloe', 'she', 'her'], ['Ethan', 'he', 'his'], ['Joy', 'she', 'her'], ['Sam', 'he', 'his']];
const an = (w) => (/^[aeiou]/i.test(w) ? 'an' : 'a');
const PRISM = { 3: 'triangular', 4: 'square', 5: 'pentagonal', 6: 'hexagonal', 7: 'heptagonal', 8: 'octagonal', 9: 'nonagonal', 10: 'decagonal' };
/* random decimal in [lo, hi] with exactly dp decimal places (last digit not 0 when nz) */
function dec(lo, hi, dp, nz = true) {
  const p = 10 ** dp;
  return retry(() => { const n = ri(Math.round(lo * p), Math.round(hi * p)); return nz && n % 10 === 0 ? null : R(n, p); });
}
/* a choice question: shuffles the options and finds the right one */
function choice(html, right, wrong, hints, steps, extra = {}) {
  const choices = shuffle([right, ...wrong]);
  return { kind: 'choice', html, choices, correct: choices.indexOf(right), hints, steps, ...extra };
}
const frac = (n, d) => fH(n, d);
const mixed = (w, n, d) => frH(MX(w, n, d));
const wt = (list) => { const tot = list.reduce((a, x) => a + x[0], 0); let r = Math.random() * tot; for (const [w, v] of list) { if ((r -= w) < 0) return v; } return list[list.length - 1][1]; };
const pct = (p) => `${n$(p)}%`;
const say = (n, d) => `${n} over ${d}`;
const timeWords = (s) => (s >= 60 ? `${Math.floor(s / 60)} minute${s >= 120 ? 's' : ''}${s % 60 ? ` and ${s % 60} seconds` : ''}` : `${s} seconds`);

/* ---------- shared generators (the same skill shows up on more than one page) ---------- */
function prismQ(ns, what) {
  const n = pick(ns), name = PRISM[n];
  const ans = what === 'edges' ? 3 * n : what === 'vertices' ? 2 * n : n + 2;
  const how = what === 'edges' ? [`${n} edges on the top + ${n} on the bottom + ${n} going up the sides.`, `${n} + ${n} + ${n} = <b>${ans}</b>`]
    : what === 'vertices' ? [`${n} corners on the top + ${n} on the bottom.`, `${n} + ${n} = <b>${ans}</b>`]
      : [`2 bases + ${n} side faces.`, `2 + ${n} = <b>${ans}</b>`];
  return { html: `How many ${what} are there in ${an(name)} ${name} prism?`, ans: R(ans),
    hints: [`${an(name)[0].toUpperCase() + an(name).slice(1)} ${name} prism has two ${n}-sided bases (top and bottom).`, what === 'edges' ? 'Count the top, the bottom and the sides.' : what === 'vertices' ? 'Count the corners of the top and the bottom.' : 'Count the 2 bases and the side faces.'], steps: how };
}
const TIME_FACTS = [
  ['1 hour', 'seconds', 3600, ['1 hour = 60 minutes, 1 minute = 60 seconds.', '60 × 60'], '60 × 60 = <b>3600</b>'],
  ['2 hours', 'seconds', 7200, ['1 hour = 3600 seconds.', '2 × 3600'], '2 × 3600 = <b>7200</b>'],
  ['half an hour', 'seconds', 1800, ['Half an hour = 30 minutes.', '30 × 60'], '30 × 60 = <b>1800</b>'],
  ['1 day', 'minutes', 1440, ['1 day = 24 hours.', '24 × 60'], '24 × 60 = <b>1440</b>'],
  ['3 hours', 'minutes', 180, ['1 hour = 60 minutes.', '3 × 60'], '3 × 60 = <b>180</b>'],
  ['5 minutes', 'seconds', 300, ['1 minute = 60 seconds.', '5 × 60'], '5 × 60 = <b>300</b>'],
  ['2 days', 'hours', 48, ['1 day = 24 hours.', '2 × 24'], '2 × 24 = <b>48</b>'],
];
function timeFact(style) {
  const [a, unit, v, hints, step] = pick(TIME_FACTS);
  const html = style === 'express' ? `Express ${a} in ${unit}.` : `${a[0].toUpperCase() + a.slice(1)} = ${BL} ${unit}`;
  return { html, ans: R(v), unit, hints, steps: [step] };
}
function angleTypeQ(weights) {
  const all = ['acute angle', 'right angle', 'obtuse angle', 'straight angle', 'reflex angle', 'round angle'];
  const [what, right, why] = wt(weights);
  return choice(`What type of angle can be formed by ${what}?`, right, shuffle(all.filter((x) => x !== right)).slice(0, 3),
    ['Right angle = 90°, straight angle = 180°, round angle = 360°.', 'Add the sizes, then see which range the total falls in.'], [why, `→ <b>${right}</b>`]);
}
const ANGLE_COMBOS = {
  strObt: [3, ['one straight angle and one obtuse angle', 'reflex angle', '180° + (between 90° and 180°) = between 270° and 360°']],
  strAcu: [2, ['one straight angle and one acute angle', 'reflex angle', '180° + (less than 90°) = between 180° and 270°']],
  twoStr: [3, ['2 straight angles', 'round angle', '180° + 180° = 360°']],
  twoRight: [2, ['2 right angles', 'straight angle', '90° + 90° = 180°']],
  fourRight: [1, ['4 right angles', 'round angle', '4 × 90° = 360°']],
  threeRight: [1, ['3 right angles', 'reflex angle', '3 × 90° = 270°']],
  rightAcu: [1, ['one right angle and one acute angle', 'obtuse angle', '90° + (less than 90°) = between 90° and 180°']],
};
/* w n/d %  →  fraction (A/B % where A is a "nice" number) */
function pctMixedToFrac(As, Bs) {
  return retry(() => {
    const A = pick(As), B = pick(Bs);
    if (A <= B || gcd(A, B) !== 1) return null;
    const p = R(A, B), ans = R(A, 100 * B);
    return { html: `Change ${frH(p)}% to a fraction in its simplest form.`, ans, form: 'frac',
      hints: [`First change ${frH(p)} into an improper fraction: ${impH(p)}.`, `${impH(p)}% means ${impH(p)} ÷ 100.`],
      steps: [`${frH(p)}% = ${impH(p)}%`, `= ${impH(p)} × ${frac(1, 100)} = ${frac(A, 100 * B)}`, `= <b>${frH(ans)}</b>`] };
  });
}

/* =========================================================
   The pages. Each slot: { lab, skill, tip, f }
   ========================================================= */
const PAPERS = [];
const page = (n, name, when, level, about, slots) => PAPERS.push({ n, id: `p${n}`, name, when, level, about, slots });

/* ---------------- Page 1 · Mental Practice ---------------- */
page(1, 'Mental Practice', '', 'core', 'Order of operations, decimals, × ÷ 0.01 and 0.1, simple equations, prisms, cubes, units and changing fractions ↔ decimals.', [
  { lab: 'Q1', skill: 'a + b × c', tip: '× before +. Never add first!', f() {
    return retry(() => {
      const c = ri(2, 6), b = chance(.6) ? 5 * ri(3, 19) : ri(11, 30), a = 5 * ri(2, 19);
      if (b * c > 400 || (b % 5 && c > 4)) return null;
      const p = b * c, ans = a + p;
      return { html: `${a} + ${b} × ${c}`, ans: R(ans), hints: ['× comes before +.', `Work out ${b} × ${c} first.`], steps: [`× first: ${b} × ${c} = ${p}`, `${a} + ${p} = <b>${ans}</b>`] };
    });
  } },
  { lab: 'Q2', skill: 'Add decimals (1 d.p. + 2 d.p.)', tip: 'Line up the decimal points. 36.5 is 36.50.', f() {
    const a = dec(10.1, 98.9, 1), b = dec(1.01, 9.99, 2), ans = qa(a, b);
    return { html: `${n$(a)} + ${n$(b)}`, ans, hints: ['Line up the decimal points.', `${n$(a)} = ${decStr(a, 2)}`], steps: [`${decStr(a, 2)} + ${n$(b)} = <b>${n$(ans)}</b>`] };
  } },
  { lab: 'Q3', skill: '× 0.01 / × 0.1', tip: '× 0.01 moves the decimal point 2 places left; × 0.1 moves it 1 place left.', f() {
    const a = dec(10.01, 99.99, 2), m = chance(.7) ? '0.01' : '0.1', ans = qm(a, m), k = m === '0.01' ? 2 : 1;
    return { html: `${n$(a)} × ${m}`, ans, hints: [`× ${m} makes the number smaller.`, `Move the decimal point ${k} place${k > 1 ? 's' : ''} to the left.`], steps: [`× ${m} → move the point ${k} place${k > 1 ? 's' : ''} left`, `${n$(a)} × ${m} = <b>${n$(ans)}</b>`] };
  } },
  { lab: 'Q4', skill: '÷ 0.1 / ÷ 0.01', tip: '÷ 0.1 is the same as × 10; ÷ 0.01 is the same as × 100.', f() {
    const a = dec(10.1, 99.9, 1), m = chance(.7) ? '0.1' : '0.01', ans = qd(a, m), k = m === '0.1' ? 10 : 100;
    return { html: `${n$(a)} ÷ ${m}`, ans, hints: [`÷ ${m} makes the number bigger.`, `÷ ${m} is the same as × ${k}.`], steps: [`÷ ${m} = × ${k}`, `${n$(a)} × ${k} = <b>${n$(ans)}</b>`] };
  } },
  { lab: 'Q5', skill: 'Solve ay + b = c', tip: 'Undo the + or − first, then divide.', f() {
    const v = pick(VARS), a = ri(2, 9), x = ri(2, 9), b = ri(1, 9), minus = chance(.25) && a * x > b;
    const c = minus ? a * x - b : a * x + b;
    return { html: `Solve ${a}${V(v)} ${minus ? '−' : '+'} ${b} = ${c}`, ans: R(x),
      hints: [minus ? `Add ${b} to both sides.` : `Take away ${b} from both sides.`, `${a}${v} = ${a * x}`],
      steps: [`${a}${V(v)} = ${c} ${minus ? '+' : '−'} ${b} = ${a * x}`, `${V(v)} = ${a * x} ÷ ${a} = <b>${x}</b>`] };
  } },
  { lab: 'Q6', skill: 'Solve (1/n)y − b = c', tip: 'Undo the − b first. Then (1/4)y = 12 means y = 12 × 4.', f() {
    return retry(() => {
      const v = pick(VARS), n = ri(2, 5), b = ri(2, 9), c = ri(5, 20), plus = chance(.25);
      if (plus && c <= b) return null;
      const k = plus ? c - b : c + b, y = n * k;
      if (y > 120) return null;
      return { html: `Solve ${frac(1, n)}${V(v)} ${plus ? '+' : '−'} ${b} = ${c}`, ans: R(y),
        hints: [plus ? `Take away ${b} from both sides.` : `Add ${b} to both sides.`, `${frac(1, n)} of ${v} is ${k}, so ${v} = ${k} × ${n}.`],
        steps: [`${frac(1, n)}${V(v)} = ${c} ${plus ? '−' : '+'} ${b} = ${k}`, `${V(v)} = ${k} × ${n} = <b>${y}</b>`] };
    });
  } },
  { lab: 'Q7', skill: 'Edges of a prism', tip: 'A prism with n-sided ends has 3n edges, 2n vertices and n + 2 faces.', f() { return prismQ([3, 5, 6, 8], 'edges'); } },
  { lab: 'Q8', skill: 'Volume of a cube', tip: 'Volume of a cube = side × side × side.', f() {
    const k = pick([2, 4, 5, 6, 10]), ans = k ** 3;
    return { html: `Find the volume of a ${k}-cm cube.`, ans: R(ans), unit: 'cm³', hints: ['A cube has all sides the same.', `${k} × ${k} × ${k}`], steps: [`${k} × ${k} × ${k} = <b>${ans}</b> cm³`] };
  } },
  { lab: 'Q9a', skill: 'Time units', tip: '1 hour = 60 min, 1 min = 60 s, 1 day = 24 h.', f() { return timeFact('express'); } },
  { lab: 'Q9b', skill: 'm² ↔ cm²', tip: '1 m² = 100 cm × 100 cm = 10 000 cm².', f() {
    const k = ri(2, 9);
    if (chance(.7)) return { html: `Express ${k} m² in cm².`, ans: R(k * 10000), unit: 'cm²', hints: ['1 m = 100 cm, so 1 m² = 100 × 100 cm².', '1 m² = 10 000 cm².'], steps: [`1 m² = 10 000 cm²`, `${k} × 10 000 = <b>${decStr(R(k * 10000))}</b> cm²`] };
    return { html: `Express ${decStr(R(k * 10000))} cm² in m².`, ans: R(k), unit: 'm²', hints: ['1 m² = 10 000 cm².', 'Divide by 10 000.'], steps: [`${decStr(R(k * 10000))} ÷ 10 000 = <b>${k}</b> m²`] };
  } },
  { lab: 'Q10a', skill: 'Decimal → fraction', tip: '0.5 = 1/2, 0.25 = 1/4, 0.75 = 3/4, 0.2 = 1/5. Simplify!', f() {
    const w = ri(1, 12), part = pick(['0.5', '0.5', '0.25', '0.75', '0.2', '0.4', '0.6', '0.8']), x = qa(w, part);
    return { html: `Change ${n$(x)} to a fraction.`, ans: x, form: 'frac', hints: [`The whole number ${w} stays.`, `${part} = ${frH(D(part))}`], steps: [`${part} = ${frH(D(part))}`, `${n$(x)} = <b>${frH(x)}</b>`] };
  } },
  { lab: 'Q10b', skill: 'Fraction → decimal', tip: 'Make the bottom 10 or 100: 4/5 = 8/10 = 0.8.', f() {
    return retry(() => {
      const d = pick([2, 4, 5, 5, 10, 20, 25]), n = ri(1, d - 1);
      if (gcd(n, d) !== 1) return null;
      const ans = R(n, d), m = (d === 2 || d === 5) ? 10 / d : 100 / d;
      return { html: `Change ${frac(n, d)} to a decimal.`, ans, form: 'dec', hints: [`Make the bottom number ${d === 2 || d === 5 ? 10 : 100}.`, `× ${m} on top and bottom.`], steps: [`${frac(n, d)} = ${frac(n * m, d * m)} = <b>${n$(ans)}</b>`] };
    });
  } },
]);

/* ---------------- Page 2 · Mental 1 ---------------- */
const PAIR01 = [['0.25', '0.4'], ['0.5', '0.2'], ['0.4', '0.25'], ['0.2', '0.5']];
const PAIR02 = [['0.25', '0.8'], ['0.4', '0.5'], ['0.5', '0.4']];
const PAIR03 = [['0.5', '0.6'], ['0.75', '0.4'], ['0.6', '0.5']];
page(2, 'Mental 1', 'Oct 2023', 'core', 'Decimal tricks (0.25 × 0.4), equations with halves, mixed number ÷ 2, ÷ 0.03, letter puzzles, ordering, circle words, rounding, prisms and litres.', [
  { lab: 'Q1', skill: 'w − a × b (decimals)', tip: '× first! 0.25 × 0.8 = 0.2 because 25 × 8 = 200.', f() {
    const [a, b] = pick([...PAIR01, ...PAIR01, ...PAIR02, ...PAIR03]), w = ri(2, 12), p = qm(a, b), ans = qs(w, p);
    return { html: `${w} − ${a} × ${b}`, ans, hints: ['× comes before −.', `${a} × ${b}: think ${a.slice(2)} × ${b.slice(2)} = ${+a.slice(2) * +b.slice(2)}, then count the decimal places.`],
      steps: [`× first: ${a} × ${b} = ${n$(p)}`, `${w} − ${n$(p)} = <b>${n$(ans)}</b>`] };
  } },
  { lab: 'Q2', skill: 'Solve kD − a½ = b½', tip: 'Move the mixed number across: 3D = 8½ + 3½ = 12.', f() {
    return retry(() => {
      const v = pick(VARS), k = ri(2, 5), x = ri(3, 9), S = k * x, plus = chance(.25);
      if (S > 30) return null;
      const [f1, f2] = pick([[[1, 2], [1, 2]], [[1, 2], [1, 2]], [[1, 4], [3, 4]], [[3, 4], [1, 4]]]);
      if (plus) {
        const a = ri(1, 6), c = S + a; // kD + a f = c f
        return { html: `Solve ${k}${V(v)} + ${mixed(a, ...f1)} = ${mixed(c, ...f1)}`, ans: R(x),
          hints: [`Take away ${mixed(a, ...f1)} from both sides.`, `${k}${v} = ${S}`], steps: [`${k}${V(v)} = ${mixed(c, ...f1)} − ${mixed(a, ...f1)} = ${S}`, `${V(v)} = ${S} ÷ ${k} = <b>${x}</b>`] };
      }
      const a = ri(1, S - 2), b = S - 1 - a;
      if (b < 1) return null;
      return { html: `Solve ${k}${V(v)} − ${mixed(a, ...f1)} = ${mixed(b, ...f2)}`, ans: R(x),
        hints: [`Add ${mixed(a, ...f1)} to both sides.`, `${mixed(b, ...f2)} + ${mixed(a, ...f1)} = ${S}`],
        steps: [`${k}${V(v)} = ${mixed(b, ...f2)} + ${mixed(a, ...f1)} = ${S}`, `${V(v)} = ${S} ÷ ${k} = <b>${x}</b>`] };
    });
  } },
  { lab: 'Q3', skill: 'Mixed number ÷ 2', tip: 'Split it: 6 ÷ 2 = 3 and 4/7 ÷ 2 = 2/7.', f() {
    return retry(() => {
      const k = chance(.75) ? 2 : 3, d = ri(3, 9), nk = ri(1, Math.floor((d - 1) / k)), n = nk * k, wk = ri(1, 4), w = wk * k;
      if (n >= d || gcd(n, d) !== 1 || gcd(nk, d) !== 1) return null;
      const ans = R(wk * d + nk, d);
      return { html: `${mixed(w, n, d)} ÷ ${k}`, ans, form: 'frac', hints: ['Divide the whole number and the fraction separately.', `${w} ÷ ${k} = ${wk} and ${frac(n, d)} ÷ ${k} = ${frac(nk, d)}.`],
        steps: [`${w} ÷ ${k} = ${wk},&ensp; ${frac(n, d)} ÷ ${k} = ${frac(nk, d)}`, `= <b>${frH(ans)}</b>`] };
    });
  } },
  { lab: 'Q4', skill: 'Whole number ÷ 0.03', tip: 'Make the divisor whole: 80 ÷ 0.04 = 8000 ÷ 4.', f() {
    return retry(() => {
      const k = ri(2, 9), m = pick([5, 10, 20, 30, 4, 6, 8, 10, 20]), a = k * m, small = chance(.75), dv = small ? `0.0${k}` : `0.${k}`;
      if (a < 10 || a > 99) return null;
      const ans = qd(a, dv), sc = small ? 100 : 10;
      return { html: `${a} ÷ ${dv}`, ans, hints: [`× ${sc} on both numbers so you divide by ${k}.`, `${a} ÷ ${dv} = ${a * sc} ÷ ${k}`], steps: [`${a} ÷ ${dv} = ${a * sc} ÷ ${k}`, `= <b>${n$(ans)}</b>`] };
    });
  } },
  { lab: 'Q5', skill: 'a ÷ 0.01 × 0.1', tip: 'Left to right. ÷ 0.01 = × 100, then × 0.1 = ÷ 10.', f() {
    const a = pick(['0.5', '0.3', '0.7', '0.4', '0.6', '0.8', '0.2', '1.5', '2.5', '0.9']);
    const [d1, m2] = pick([['0.01', '0.1'], ['0.01', '0.1'], ['0.1', '0.01'], ['0.1', '0.1'], ['0.01', '0.01']]);
    const mid = qd(a, d1), ans = qm(mid, m2);
    return { html: `${a} ÷ ${d1} × ${m2}`, ans, hints: ['÷ and × are the same level: work from left to right.', `${a} ÷ ${d1} = ${n$(mid)}`], steps: [`${a} ÷ ${d1} = ${n$(mid)}`, `${n$(mid)} × ${m2} = <b>${n$(ans)}</b>`] };
  } },
  { lab: 'Q6', skill: '(A + B) letter puzzle', tip: 'Replace every (A + B) with its value, then find the leftover letter.', f() {
    const k = ri(2, 4), s = ri(5, 12), A = ri(1, s - 1), B = s - A, endA = chance(.7);
    const T = k * s + (endA ? A : B), ask = endA ? 'B' : 'A', ans = endA ? B : A, last = endA ? 'A' : 'B';
    const lhs = Array(k).fill(`(${V('A')} + ${V('B')})`).join(' + ') + ` + ${V(last)}`;
    return { html: `Given that ${lhs} = ${T}.<br>If ${V('A')} + ${V('B')} = ${s}, then ${V(ask)} = ?`, ans: R(ans),
      hints: [`(A + B) appears ${k} times: ${k} × ${s} = ${k * s}.`, `So ${last} = ${T} − ${k * s}.`],
      steps: [`${k} × ${s} + ${last} = ${T} → ${last} = ${T - k * s}`, `${ask} = ${s} − ${T - k * s} = <b>${ans}</b>`] };
  } },
  { lab: 'Q7', skill: 'Order a fraction, a decimal and ½', tip: 'Change everything to decimals. Ascending = smallest first with “<”.', f() {
    return retry(() => {
      const [un, ud] = wt([[6, [1, 2]], [1, [1, 4]], [1, [3, 4]], [1, [2, 5]], [1, [3, 5]]]), u = R(un, ud);
      const dd = qa(u, R(pick([-4, -3, -2, -1, 1, 2, 3, 4]), 100));
      const b = pick([30, 20, 40, 15, 12, 25, 9]), a = ri(1, b - 1);
      if (gcd(a, b) !== 1) return null;
      const f2 = R(a, b);
      if (Math.abs(qval(f2) - qval(u)) < .12 || Math.abs(qval(f2) - qval(dd)) < .12) return null;
      const items = shuffle([{ html: frac(a, b), txt: `${a}/${b}`, v: f2 }, { html: n$(dd), txt: n$(dd), v: dd }, { html: frac(un, ud), txt: `${un}/${ud}`, v: u }]);
      const dir = chance(.8) ? 'asc' : 'desc';
      const show = (it) => `${it.html} ${isTerm(it.v) && dpOf(it.v) <= 3 ? '= ' + n$(it.v) : '≈ ' + decStr(roundR(it.v, 2), 2)}`;
      return { kind: 'order', items, dir, html: `Arrange ${items.map((i) => i.html).join(' , ')} in ${dir === 'asc' ? 'ascending' : 'descending'} order with proper signs.`,
        hints: ['Change each one into a decimal.', dir === 'asc' ? 'Ascending: smallest first, use “<”.' : 'Descending: largest first, use “>”.'],
        steps: [items.map(show).join(',&ensp; ')] };
    });
  } },
  { lab: 'Q8', skill: 'Parts of a circle', tip: 'Sector = a “pizza slice” (arc + 2 radii). Arc = part of the circumference.', f() {
    const Q = wt([
      [4, ['The area enclosed by an arc and two radii is called a', 'sector', 'Like a slice of pizza: two radii and an arc.']],
      [1, ['A straight line from the centre of a circle to the circle is called a', 'radius', 'Centre → edge = radius.']],
      [1, ['A straight line that passes through the centre and joins two points on the circle is called a', 'diameter', 'Edge → centre → edge = diameter.']],
      [1, ['The distance around a circle is called its', 'circumference', 'All the way round = circumference.']],
      [1, ['A part of the circumference of a circle is called an', 'arc', 'A curved piece of the circle = arc.']],
    ]);
    const [stem, right, why] = Q;
    return choice(`${stem} <span class="blank wide">?</span>.`, right, shuffle(['sector', 'radius', 'diameter', 'circumference', 'arc'].filter((x) => x !== right)).slice(0, 3),
      ['Picture a pizza: the slice, the crust, the cut from the middle.', why], [`<b>${right}</b> — ${why}`]);
  } },
  { lab: 'Q9a', skill: 'Mixed number → decimal (eighths, fifths…)', tip: '1/8 = 0.125, 3/8 = 0.375, 5/8 = 0.625, 7/8 = 0.875.', f() {
    return retry(() => {
      const d = wt([[5, 8], [1, 4], [1, 5], [1, 20], [1, 25]]), n = ri(1, d - 1), w = ri(1, 9);
      if (gcd(n, d) !== 1) return null;
      const ans = MX(w, n, d);
      return { html: `Change ${mixed(w, n, d)} to a decimal.`, ans, form: 'dec', hints: [`Keep the ${w}; change ${frac(n, d)} to a decimal.`, d === 8 ? '1/8 = 0.125' : `Make the bottom ${d === 4 || d === 20 || d === 25 ? 100 : 10}.`],
        steps: [`${frac(n, d)} = ${n$(R(n, d))}`, `${mixed(w, n, d)} = <b>${n$(ans)}</b>`] };
    });
  } },
  { lab: 'Q9b', skill: 'Round to the nearest tenth', tip: 'Look at the hundredths digit: 5 or more → round up. 2.981 → 3.0 (keep the 0!).', f() {
    const carry = chance(.5), w = ri(1, 9), t = carry ? 9 : ri(0, 8), h = carry ? ri(5, 9) : ri(0, 9), u = ri(1, 9);
    const x = R(w * 1000 + t * 100 + h * 10 + u, 1000), ans = roundR(x, 1);
    return { html: `Round off ${n$(x)} to the nearest tenths place.`, ans, form: 'dp1', hints: ['The tenths digit is the first one after the point.', `Look at the next digit (${h}). ${h >= 5 ? 'It is 5 or more → round up.' : 'It is less than 5 → keep the tenths.'}`],
      steps: [`hundredths digit = ${h} → ${h >= 5 ? 'round up' : 'round down'}`, `${n$(x)} ≈ <b>${decStr(ans, 1)}</b>${carry ? ' (keep the 0 — it shows the tenths place)' : ''}`] };
  } },
  { lab: 'Q10a', skill: 'Vertices of a prism', tip: 'An n-sided prism has 2n vertices (corners).', f() { return prismQ([3, 4, 5, 6, 8], 'vertices'); } },
  { lab: 'Q10b', skill: 'L ↔ cm³', tip: '1 L = 1000 mL = 1000 cm³.', f() {
    const L = pick(['0.2', '0.3', '0.4', '0.6', '0.8', '0.5', '1.5', '2.5', '0.25', '0.75']), c = qm(L, 1000);
    if (chance(.7)) return { html: `${L} L = ${BL} cm³`, ans: c, unit: 'cm³', hints: ['1 L = 1000 cm³.', `${L} × 1000`], steps: [`${L} × 1000 = <b>${n$(c)}</b> cm³`] };
    return { html: `${n$(c)} cm³ = ${BL} L`, ans: D(L), unit: 'L', hints: ['1000 cm³ = 1 L.', `${n$(c)} ÷ 1000`], steps: [`${n$(c)} ÷ 1000 = <b>${L}</b> L`] };
  } },
]);

/* ---------------- Page 3 · Mental 2 ---------------- */
page(3, 'Mental 2', 'Oct 2023', 'core', 'Number patterns, decimal place-value puzzles, ÷ (0.25 × 0.4), D − ⅓D, adding and subtracting decimals, averages, cuboids, units and clever multiplying.', [
  { lab: 'Q1', skill: 'Number pattern', tip: 'Look at the gaps between the numbers. Do they go up by the same amount, or by 1 more each time?', f() {
    const type = wt([[4, 'tri'], [2, 'sq'], [2, 'ap'], [1, 'dbl'], [1, 'even']]);
    let seq, why;
    if (type === 'tri') { const s = ri(1, 4), d0 = ri(1, 3); seq = [s]; for (let i = 0; i < 5; i++) seq.push(seq[i] + d0 + i); why = `The gaps go up by 1 each time: +${d0}, +${d0 + 1}, +${d0 + 2}, …`; }
    else if (type === 'sq') { const k = ri(1, 3); seq = Array.from({ length: 6 }, (_, i) => (k + i) ** 2); why = `Square numbers: ${k}², ${k + 1}², ${k + 2}², …`; }
    else if (type === 'ap') { const s = ri(2, 12), d = ri(3, 9); seq = Array.from({ length: 6 }, (_, i) => s + d * i); why = `Add ${d} each time.`; }
    else if (type === 'dbl') { const s = ri(1, 5); seq = Array.from({ length: 6 }, (_, i) => s * 2 ** i); why = 'Double each time (× 2).'; }
    else { const s = ri(1, 5); seq = [s]; for (let i = 0; i < 5; i++) seq.push(seq[i] + 2 * (i + 1)); why = 'The gaps go up by 2 each time: +2, +4, +6, …'; }
    const miss = wt([[3, 3], [1, 2], [1, 4]]);
    return { html: seq.map((x, i) => (i === miss ? BL : x)).join('&ensp;&ensp;'), ans: R(seq[miss]), hints: ['Find the gap between each pair of numbers.', why], steps: [why, `The missing number is <b>${seq[miss]}</b>`] };
  } },
  { lab: 'Q2', skill: 'abab ÷ ? = abab (place value)', tip: 'Same digits, different place value → the missing number is something like 0.02.', f() {
    return retry(() => {
      const a = ri(1, 4), b = ri(1, 4), k = ri(2, 4);
      if (a === b || k * a > 9 || k * b > 9) return null;
      const N = (10 * a + b) * 101, sc = wt([[6, 100], [2, 10], [2, 1000]]), X = R(k * N, sc), ans = R(k, sc);
      return { html: `${n$(X)} ÷ ${BL} = ${N}`, ans, form: 'dec', hints: [`${k * N} ÷ ${k} = ${N}.`, `But it is ${n$(X)}, not ${k * N} — move the decimal point.`],
        steps: [`${k * N} ÷ ${k} = ${N}`, `${n$(X)} is ${k * N} ÷ ${sc}, so the number is ${k} ÷ ${sc} = <b>${n$(ans)}</b>`] };
    });
  } },
  { lab: 'Q3', skill: 'n ÷ (decimal × decimal)', tip: 'Bracket first: 0.5 × 0.2 = 0.1. ÷ 0.1 = × 10.', f() {
    const one = chance(.7), [a, b] = pick(one ? PAIR01 : PAIR02), p = qm(a, b), n = one ? ri(11, 49) : 2 * ri(6, 24), ans = qd(n, p);
    return { html: `${n} ÷ (${a} × ${b})`, ans, hints: ['Brackets first.', `${a} × ${b} = ${n$(p)}`], steps: [`${a} × ${b} = ${n$(p)}`, `${n} ÷ ${n$(p)} = <b>${n$(ans)}</b>`] };
  } },
  { lab: 'Q4', skill: 'Solve D − (1/n)D = c', tip: 'D − ¼D = ¾D. Then ¾D = 9 → D = 9 ÷ 3 × 4 = 12.', f() {
    const v = pick(VARS), n = ri(2, 5), m = ri(1, 5), plus = chance(.25), c = (plus ? n + 1 : n - 1) * m, x = n * m, co = R(plus ? n + 1 : n - 1, n);
    return { html: `Solve ${V(v)} ${plus ? '+' : '−'} ${frac(1, n)}${V(v)} = ${c}`, ans: R(x),
      hints: [`${v} ${plus ? '+' : '−'} ${frac(1, n)}${v} = ${frH(co)}${v}`, `${frH(co)}${v} = ${c}, so ${frac(1, n)} of ${v} is ${m}.`],
      steps: [`${V(v)} ${plus ? '+' : '−'} ${frac(1, n)}${V(v)} = ${frH(co)}${V(v)} = ${c}`, `${frac(1, n)}${V(v)} = ${c} ÷ ${plus ? n + 1 : n - 1} = ${m}`, `${V(v)} = ${m} × ${n} = <b>${x}</b>`] };
  } },
  { lab: 'Q5', skill: 'a − b + c (2 d.p.)', tip: 'Look for decimals that cancel: 5.38 + 2.91 = 8.29, then − 4.29.', f() {
    return retry(() => {
      const T = ri(3, 9), b = dec(1.01, 4.99, 2), c = dec(1.01, 3.99, 2), a = qs(qa(T, b), c);
      if (qval(a) < 2.01 || qval(a) > 9.99 || dpOf(a) !== 2) return null;
      return { html: `${n$(a)} − ${n$(b)} + ${n$(c)}`, ans: R(T), hints: ['+ and − are the same level: you can add the + number first.', `${n$(a)} + ${n$(c)} = ${n$(qa(a, c))}`],
        steps: [`${n$(a)} + ${n$(c)} = ${n$(qa(a, c))}`, `${n$(qa(a, c))} − ${n$(b)} = <b>${T}</b>`] };
    });
  } },
  { lab: 'Q6', skill: 'Equal fractions with decimals', tip: 'What happened to the bottom? Do the same to the top.', f() {
    const a = ri(2, 9), m = chance(.5) ? a : ri(2, 9), top = R(a, 10), down = chance(.6);
    const nd = down ? R(m, 10) : R(10 * m), ans = down ? R(a, 100) : R(a);
    const L = fH(n$(top), m, say(n$(top), m)), Rt = fH(BL, n$(nd), `what over ${n$(nd)}`);
    return { html: `${L} = ${Rt}`, ans, hints: [`The bottom went from ${m} to ${n$(nd)}: that is ${down ? '÷ 10' : '× 10'}.`, `Do the same to the top: ${n$(top)} ${down ? '÷' : '×'} 10.`],
      steps: [`${m} ${down ? '÷' : '×'} 10 = ${n$(nd)}`, `${n$(top)} ${down ? '÷' : '×'} 10 = <b>${n$(ans)}</b>`] };
  } },
  { lab: 'Q7', skill: 'Average of evenly spaced decimals', tip: 'Numbers that go up evenly: the average is the middle value.', f() {
    return retry(() => {
      const n = wt([[3, 4], [1, 3], [1, 5]]), st = n === 4 ? pick(['0.2', '0.4', '0.6']) : pick(['0.2', '0.3', '0.4', '0.5']), s = dec(1.0, 5.0, 1, false);
      const xs = Array.from({ length: n }, (_, i) => qa(s, qm(st, i))), sum = xs.reduce((p, x) => qa(p, x), R(0)), ans = qd(sum, n);
      if (dpOf(ans) > 1) return null;
      return { html: `Find the average of ${xs.map(n$).join(', ')}.`, ans, hints: ['Average = total ÷ how many numbers.', `There are ${n} numbers; the total is ${n$(sum)}.`],
        steps: [`${xs.map(n$).join(' + ')} = ${n$(sum)}`, `${n$(sum)} ÷ ${n} = <b>${n$(ans)}</b>`] };
    });
  } },
  { lab: 'Q8', skill: 'Cuboid: volume ÷ base area', tip: 'Volume = base area × height, so height = volume ÷ base area.', f() {
    const base = pick([12, 14, 15, 16, 18, 21, 24, 25]), hgt = ri(6, 19), V0 = base * hgt;
    if (chance(.75)) return { html: `If the volume of a cuboid is ${V0} cm³ and its base area is ${base} cm², what is the height of this cuboid?`, ans: R(hgt), unit: 'cm', hints: ['Volume = base area × height.', `Height = ${V0} ÷ ${base}.`], steps: [`${V0} ÷ ${base} = <b>${hgt}</b> cm`] };
    return { html: `If the volume of a cuboid is ${V0} cm³ and its height is ${hgt} cm, what is its base area?`, ans: R(base), unit: 'cm²', hints: ['Volume = base area × height.', `Base area = ${V0} ÷ ${hgt}.`], steps: [`${V0} ÷ ${hgt} = <b>${base}</b> cm²`] };
  } },
  { lab: 'Q9a', skill: 'Fraction of a kg / L / km', tip: '1 kg = 1000 g, 1 L = 1000 mL, 1 km = 1000 m.', f() {
    const [n, d] = pick([[1, 4], [3, 4], [1, 5], [2, 5], [1, 2], [1, 8], [3, 5], [1, 10]]), [big, small] = pick([['kg', 'g'], ['kg', 'g'], ['L', 'mL'], ['km', 'm']]), ans = R(1000 * n, d);
    return { html: `${frac(n, d)} ${big} = ${BL} ${small}`, ans, unit: small, hints: [`1 ${big} = 1000 ${small}.`, `${frac(n, d)} of 1000 = 1000 ÷ ${d} × ${n}.`], steps: [`1000 ÷ ${d} = ${1000 / d}`, `${1000 / d} × ${n} = <b>${n$(ans)}</b> ${small}`] };
  } },
  { lab: 'Q9b', skill: 'cm³ ↔ m³', tip: '1 m³ = 100 × 100 × 100 cm³ = 1 000 000 cm³.', f() {
    const v = wt([[3, 'big'], [2, 'm3'], [1, 'half']]);
    if (v === 'big') { const k = ri(1, 5); return { html: `${decStr(R(k * 1e6))} cm³ = ${BL} m³`, ans: R(k), unit: 'm³', hints: ['1 m³ = 1 000 000 cm³.', 'Count the zeros: 6 of them.'], steps: [`${decStr(R(k * 1e6))} ÷ 1 000 000 = <b>${k}</b> m³`] }; }
    if (v === 'm3') { const k = pick([2, 3, 4, 5]); return { html: `${k} m³ = ${BL} cm³`, ans: R(k * 1e6), unit: 'cm³', hints: ['1 m³ = 1 000 000 cm³.', `${k} × 1 000 000`], steps: [`${k} × 1 000 000 = <b>${decStr(R(k * 1e6))}</b> cm³`] }; }
    return { html: `500 000 cm³ = ${BL} m³`, ans: D('0.5'), unit: 'm³', hints: ['1 m³ = 1 000 000 cm³.', '500 000 is half of 1 000 000.'], steps: ['500 000 ÷ 1 000 000 = <b>0.5</b> m³'] };
  } },
  { lab: 'Q10a', skill: 'Clever multiplying (125 × 8 = 1000)', tip: 'Find the friendly pair: 125 × 8 = 1000, 25 × 4 = 100, 5 × 2 = 10.', f() {
    const [a, b, p] = pick([[125, 8, 1000], [125, 8, 1000], [25, 4, 100], [25, 4, 100], [4, 25, 100], [8, 125, 1000], [50, 2, 100], [20, 5, 100]]), k = chance(.7) ? ri(3, 9) : ri(11, 19), ans = p * k;
    return { html: `${a} × ${k} × ${b}`, ans: R(ans), hints: [`Look for two numbers that make ${p}.`, `${a} × ${b} = ${p} — do that first!`], steps: [`${a} × ${b} = ${p}`, `${p} × ${k} = <b>${ans}</b>`] };
  } },
  { lab: 'Q10b', skill: '3-D shape by number of faces', tip: 'Sphere: 1 face. Cone: 2. Cylinder: 3. Cube: 6 squares.', f() {
    const [stem, right, why] = wt([[4, ['3 faces only', 'cylinder', '2 flat circles + 1 curved face = 3 faces']], [2, ['2 faces only', 'cone', '1 flat circle + 1 curved face = 2 faces']], [2, ['1 face only', 'sphere', 'just 1 curved face']], [1, ['6 faces, all of them squares', 'cube', '6 square faces']]]);
    return choice(`Name a 3-D shape that has ${stem}.`, right, ['cylinder', 'cone', 'sphere', 'cube'].filter((x) => x !== right), ['Think of a can, an ice-cream cone and a ball.', 'Count flat faces AND curved faces.'], [`${why} → <b>${right}</b>`]);
  } },
]);

/* ---------------- Page 4 · Mental 3 ---------------- */
const THINGS = [['rulers', 'pencils', 'erasers', 'a box', 'stationery', 'pencil'], ['red balls', 'blue balls', 'green balls', 'a bag', 'balls', 'blue'], ['apples', 'oranges', 'pears', 'a basket', 'fruit', 'oranges'], ['cats', 'dogs', 'rabbits', 'a pet shop', 'animals', 'dogs']];
page(4, 'Mental 3', 'Nov 2023', 'core', 'Comparing fractions, decimals and %, equations with 10y, brackets with fractions, averages, % → fraction, fractions of a group, water level, prisms, hours → minutes and M/K puzzles.', [
  { lab: 'Q1', skill: 'Largest of a fraction, a % and a mixed number', tip: 'Change them all to decimals: 34/10 = 3.4, 345% = 3.45.', f() {
    return retry(() => {
      const w = ri(1, 3), a = ri(1, 9), b = ri(10, 95), d = pick([12, 8, 6, 4, 3]), c = ri(1, d - 1);
      if (gcd(c, d) !== 1) return null;
      const v1 = R(10 * w + a, 10), v2 = R(100 * w + b, 100), v3 = MX(w, c, d), vs = [v1, v2, v3].map(qval);
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (Math.abs(vs[i] - vs[j]) < .008) return null;
      if (Math.max(...vs) - Math.min(...vs) > .3) return null;
      const big = chance(.75), o = [{ h: fH(10 * w + a, 10), v: vs[0], s: n$(v1) }, { h: `${100 * w + b}%`, v: vs[1], s: n$(v2) }, { h: frH(v3), v: vs[2], s: isTerm(v3) ? n$(v3) : '≈ ' + decStr(roundR(v3, 3), 3) }];
      const target = big ? Math.max(...vs) : Math.min(...vs), right = o.find((x) => x.v === target);
      return choice(`Which is the ${big ? 'largest' : 'smallest'}?&ensp; ${o.map((x) => x.h).join('&ensp;&ensp;')}`, right.h, o.filter((x) => x !== right).map((x) => x.h),
        ['Change all three into decimals.', 'Compare the tenths first, then the hundredths.'], [o.map((x) => `${x.h} = ${x.s}`).join(',&ensp; '), `The ${big ? 'largest' : 'smallest'} is <b>${right.h}</b>`]);
    });
  } },
  { lab: 'Q2', skill: 'Solve b + 10y = c (decimals)', tip: 'Take away first, then ÷ 10 (move the point 1 place left).', f() {
    return retry(() => {
      const v = pick(VARS), b = dec(1.1, 9.9, 1), y = dec(.11, 2.99, 2), c = qa(b, qm(y, 10));
      if (dpOf(c) !== 1) return null;
      const t = qm(y, 10);
      return { html: `Solve ${n$(b)} + 10${V(v)} = ${n$(c)}`, ans: y, hints: [`Take away ${n$(b)} from both sides.`, `10${v} = ${n$(t)}, so ${v} = ${n$(t)} ÷ 10.`], steps: [`10${V(v)} = ${n$(c)} − ${n$(b)} = ${n$(t)}`, `${V(v)} = ${n$(t)} ÷ 10 = <b>${n$(y)}</b>`] };
    });
  } },
  { lab: 'Q3', skill: '(w − n/d) × decimal', tip: 'Bracket first and make it a decimal: 3 − ¼ = 2.75.', f() {
    return retry(() => {
      const d = wt([[3, 4], [1, 2], [1, 5]]), n = ri(1, d - 1), w = ri(1, 3);
      if (gcd(n, d) !== 1) return null;
      const v = qs(w, R(n, d)), m = pick(d === 4 ? ['0.08', '0.04', '0.4', '0.8', '0.12'] : d === 2 ? ['0.2', '0.4', '0.06', '0.08', '0.6'] : ['0.5', '0.05', '0.25']), ans = qm(v, m);
      if (qval(v) <= 0 || dpOf(ans) > 3) return null;
      return { html: `(${w} − ${frac(n, d)}) × ${m}`, ans, hints: ['Brackets first.', `${w} − ${frac(n, d)} = ${frH(v)} = ${n$(v)}`], steps: [`${w} − ${frac(n, d)} = ${frH(v)} = ${n$(v)}`, `${n$(v)} × ${m} = <b>${n$(ans)}</b>`] };
    });
  } },
  { lab: 'Q4', skill: '(decimals + a fraction) × a fraction', tip: 'The bracket makes a whole number (0.7 + 1.1 + 0.2 = 2). Then × the fraction.', f() {
    return retry(() => {
      const S = ri(1, 4), [un, ud] = pick([[1, 5], [1, 2], [2, 5], [3, 5]]), u = R(un, ud), x = dec(.1, S - .2, 1, false), y = qs(qs(S, u), x);
      if (qval(y) <= 0 || dpOf(y) !== 1 || qval(x) === 0) return null;
      const [fn, fd] = pick([[3, 4], [1, 2], [3, 5], [1, 4], [2, 3], [5, 6]]);
      if (fd === 3 && S !== 3) return null; if (fd === 6 && S !== 3) return null;
      const ans = qm(S, R(fn, fd));
      return { html: `(${n$(x)} + ${n$(y)} + ${frac(un, ud)}) × ${frac(fn, fd)}`, ans, hints: ['Brackets first.', `${frac(un, ud)} = ${n$(u)}, so the bracket is ${n$(x)} + ${n$(y)} + ${n$(u)}.`],
        steps: [`${n$(x)} + ${n$(y)} + ${n$(u)} = ${S}`, `${S} × ${frac(fn, fd)} = <b>${frH(ans)}</b>${isTerm(ans) && !qint(ans) ? ` (= ${n$(ans)})` : ''}`] };
    });
  } },
  { lab: 'Q5', skill: 'New average after adding a number', tip: 'Total first: 3 numbers with average 15 → total 45. Add the new number, ÷ 4.', f() {
    return retry(() => {
      const n = chance(.7) ? 3 : 4, a = ri(10, 20), x = a + pick([-6, -4, -3, -2, 2, 3, 4, 5, 6, 8]), ans = R(n * a + x, n + 1);
      if (dpOf(ans) > 1 || qint(ans) && chance(.5)) return null;
      return { html: `The average of ${n === 3 ? 'three' : 'four'} numbers is ${a}. What is the new average of these ${n === 3 ? 'three' : 'four'} numbers and ${x}?`, ans,
        hints: [`Total of the ${n} numbers = ${n} × ${a} = ${n * a}.`, `Now there are ${n + 1} numbers: (${n * a} + ${x}) ÷ ${n + 1}.`], steps: [`${n} × ${a} = ${n * a}`, `(${n * a} + ${x}) ÷ ${n + 1} = ${n * a + x} ÷ ${n + 1} = <b>${n$(ans)}</b>`] };
    });
  } },
  { lab: 'Q6', skill: 'w n/d % → fraction', tip: '3 1/3 % = 10/3 % = 10/3 ÷ 100 = 1/30.', f() { return pctMixedToFrac([10, 20, 20, 25, 50, 40], [3, 4, 6, 7, 7, 9]); } },
  { lab: 'Q7', skill: 'Fraction of a group', tip: 'Fraction = the part ÷ the total. Then simplify.', f() {
    return retry(() => {
      const [x, y, z, where, what, ask] = pick(THINGS), a = 2 * ri(2, 10), b = 2 * ri(2, 10), c = 2 * ri(1, 6), tot = a + b + c, ans = R(b, tot);
      if (ans.d > 12 || ans.d === tot || a === b || b === c) return null;
      return { html: `There were ${a} ${x}, ${b} ${y} and ${c} ${z} in ${where}. What fraction of the ${what} ${what === 'stationery' ? 'is' : 'are'} ${ask}?`, ans, form: 'frac',
        hints: [`Total = ${a} + ${b} + ${c}.`, `Fraction = ${b} ÷ ${tot}, then simplify.`], steps: [`Total = ${tot}`, `${frac(b, tot)} = <b>${frH(ans)}</b>`] };
    });
  } },
  { lab: 'Q8', skill: 'Water level rise in a cube tank', tip: 'Rise = volume put in ÷ base area. How full the tank is does not matter.', f() {
    const [s, Vs] = wt([[3, [10, [10, 20, 25, 30, 40, 50, 75, 150]]], [1, [20, [40, 80, 100, 200, 400]]], [1, [5, [5, 10, 15, 25, 50]]]]), V0 = pick(Vs), base = s * s, ans = R(V0, base);
    const obj = pick([['metallic ball', ''], ['stone', ''], ['metal cube', '']])[0], fill = pick(['half-filled', 'half-filled', 'a quarter filled']);
    return { html: `A ${s} cm tall cubic tank is ${fill} with water. After a piece of ${V0} cm³ ${obj} is put into the tank, how much will the water level rise?`, ans, unit: 'cm',
      hints: [`Base area = ${s} × ${s} = ${base} cm².`, `Rise = ${V0} ÷ ${base}.`], steps: [`Base area = ${s} × ${s} = ${base} cm²`, `${V0} ÷ ${base} = <b>${n$(ans)}</b> cm`] };
  } },
  { lab: 'Q9a', skill: 'Edges of a prism', tip: 'n-sided prism: 3n edges.', f() { return prismQ([7, 7, 5, 8, 9, 10], 'edges'); } },
  { lab: 'Q9b', skill: 'Mixed number of hours → minutes', tip: '1 h = 60 min. ¾ h = 45 min, ⅓ h = 20 min.', f() {
    return retry(() => {
      const d = pick([2, 3, 4, 4, 5, 6, 10, 12]), n = ri(1, d - 1), w = ri(1, 3);
      if (gcd(n, d) !== 1) return null;
      const ans = 60 * w + 60 * n / d;
      return { html: `${mixed(w, n, d)} h = ${BL} min`, ans: R(ans), unit: 'min', hints: ['1 h = 60 min.', `${frac(n, d)} h = 60 ÷ ${d} × ${n} = ${60 * n / d} min.`], steps: [`${w} h = ${60 * w} min,&ensp; ${frac(n, d)} h = ${60 * n / d} min`, `${60 * w} + ${60 * n / d} = <b>${ans}</b> min`] };
    });
  } },
  { lab: 'Q10a', skill: '(1/p)M = (1/q)K: which is bigger?', tip: 'Try a number: if ⅓M = ¼K = 1, then M = 3 and K = 4.', f() {
    return retry(() => {
      const same = chance(.25), a = same ? ri(2, 3) : 1, p = ri(2, 10), q = ri(2, 10);
      if (p === q || (same && (p <= a || q <= a || gcd(a, p) !== 1 || gcd(a, q) !== 1))) return null;
      const [L1, L2] = chance(.7) ? ['M', 'K'] : ['A', 'B'], bigger = p > q ? L1 : L2;
      return choice(`${frac(a, p)}${V(L1)} = ${frac(a, q)}${V(L2)}. Which is bigger, ${L1} or ${L2}?`, bigger, [bigger === L1 ? L2 : L1],
        [`Pretend both sides equal ${a}.`, `Then ${L1} = ${p} and ${L2} = ${q}.`], [`If both sides = ${a}: ${L1} = ${p}, ${L2} = ${q}`, `<b>${bigger}</b> is bigger (a smaller fraction of it gives the same amount).`]);
    });
  } },
  { lab: 'Q10b', skill: '% → decimal', tip: '% means ÷ 100: move the point 2 places left. 2.5% = 0.025.', f() {
    const p = pick(['0.5', '0.2', '0.4', '0.8', '1.5', '2.5', '3.5', '7.5', '12.5', '0.25']), ans = qd(p, 100);
    return { html: `Change ${p}% to a decimal.`, ans, form: 'dec', hints: ['% means “out of 100”: ÷ 100.', 'Move the decimal point 2 places to the left.'], steps: [`${p} ÷ 100 = <b>${n$(ans)}</b>`] };
  } },
]);

/* ---------------- Page 5 · Mental 1 (Jan) ---------------- */
const VEH = [['ferry', 'an island'], ['bus', 'a theme park'], ['train', 'the next city'], ['coach', 'a campsite']];
page(5, 'Mental 1', 'Jan 2024', 'core', 'Decimal equations, averages, circles (biggest circle in a rectangle, radius from circumference), percentages, speed, arrival times, units and angle types.', [
  { lab: 'Q1', skill: 'Solve b + aA = c (1 d.p.)', tip: 'Take away first, then divide.', f() {
    return retry(() => {
      const v = pick(VARS), a = ri(2, 5), x = dec(1.1, 3.9, 1), b = dec(.1, 1.9, 1), c = qa(b, qm(a, x));
      if (qval(c) > 20) return null;
      return { html: `Solve ${n$(b)} + ${a}${V(v)} = ${n$(c)}`, ans: x, hints: [`Take away ${n$(b)} from both sides.`, `${a}${v} = ${n$(qm(a, x))}`], steps: [`${a}${V(v)} = ${n$(c)} − ${n$(b)} = ${n$(qm(a, x))}`, `${V(v)} = ${n$(qm(a, x))} ÷ ${a} = <b>${n$(x)}</b>`] };
    });
  } },
  { lab: 'Q2', skill: 'Solve 0.25a − 0.5 = 1.5 (2 d.p. coefficient)', tip: 'Add first: 0.25a = 2. Then 2 ÷ 0.25 = 200 ÷ 25 = 8.', f() {
    return retry(() => {
      const v = pick(VARS), [k, x] = pick([['0.15', 10], ['0.15', 20], ['0.25', 4], ['0.25', 8], ['0.25', 6], ['0.05', 20], ['0.05', 40], ['0.12', 5], ['0.12', 10], ['0.75', 4], ['0.45', 10]]);
      const kx = qm(k, x), b = dec(.1, .9, 1), c = qs(kx, b);
      if (qval(c) <= 0) return null;
      return { html: `Solve ${k}${V(v)} − ${n$(b)} = ${n$(c)}`, ans: R(x), hints: [`Add ${n$(b)} to both sides.`, `${k}${v} = ${n$(kx)}; make both whole: ${n$(qm(kx, 100))} ÷ ${n$(qm(k, 100))}.`], steps: [`${k}${V(v)} = ${n$(c)} + ${n$(b)} = ${n$(kx)}`, `${V(v)} = ${n$(kx)} ÷ ${k} = <b>${x}</b>`] };
    });
  } },
  { lab: 'Q3', skill: 'Average of evenly spaced 2 d.p. numbers', tip: 'Evenly spaced → the average is the middle value.', f() {
    return retry(() => {
      const n = chance(.7) ? 4 : 5, st = n === 4 ? pick(['0.02', '0.04', '0.2']) : pick(['0.02', '0.03', '0.05', '0.01']), s = dec(1.01, 3.0, 2);
      const xs = Array.from({ length: n }, (_, i) => qa(s, qm(st, i))), sum = xs.reduce((p, x) => qa(p, x), R(0)), ans = qd(sum, n);
      if (dpOf(ans) > 2 || xs.some((x) => dpOf(x) !== 2)) return null;
      return { html: `Find the average of ${xs.map(n$).join(', ')}.`, ans, hints: ['Average = total ÷ how many.', 'They go up evenly, so the average is the middle value.'], steps: [`Total = ${n$(sum)}`, `${n$(sum)} ÷ ${n} = <b>${n$(ans)}</b>`] };
    });
  } },
  { lab: 'Q4', skill: 'Biggest circle in a rectangle (π = 22/7)', tip: 'The biggest circle fits the SHORTER side: diameter = shorter side.', f() {
    const W = pick([7, 14, 14, 21, 3.5]), L = W + pick([1, 2, 3, 4, 6]), C = qm(R(22, 7), D(W));
    return { html: `The largest circle is cut from a piece of rectangular paper measuring ${n$(D(L))} cm by ${n$(D(W))} cm. What is the circumference of this circle? ${PI227()}`, ans: C, unit: 'cm',
      hints: ['The circle can only be as wide as the shorter side.', `Diameter = ${n$(D(W))} cm; circumference = π × diameter.`], steps: [`diameter = ${n$(D(W))} cm`, `${frac(22, 7)} × ${n$(D(W))} = <b>${n$(C)}</b> cm`] };
  } },
  { lab: 'Q5', skill: 'Radius from circumference (π = 3.14)', tip: 'Circumference ÷ 3.14 = diameter. Diameter ÷ 2 = radius.', f() {
    const r = pick(['1', '2', '3', '4', '5', '10', '0.5', '5']), C = qm('6.28', r), dia = qm(r, 2), u = pick(['m', 'cm']), askR = chance(.75), thing = u === 'm' ? 'circular garden' : 'circle';
    return { html: `Find the ${askR ? 'radius' : 'diameter'} of a ${thing} if its circumference is ${n$(C)} ${u}. ${PI314}`, ans: askR ? D(r) : dia, unit: u,
      hints: ['Circumference = 3.14 × diameter.', `${n$(C)} ÷ 3.14 = the diameter.`], steps: [`diameter = ${n$(C)} ÷ 3.14 = ${n$(dia)} ${u}`, askR ? `radius = ${n$(dia)} ÷ 2 = <b>${r}</b> ${u}` : `<b>${n$(dia)}</b> ${u}`] };
  } },
  { lab: 'Q6', skill: 'p% of the money = $X → the whole', tip: '20% is $200 → 1% is $10 → 100% is $1000.', f() {
    return retry(() => {
      const p = pick([10, 20, 25, 40, 50, 5]), T = pick([200, 400, 500, 800, 1000, 1200, 2000]), Y = T * p / 100;
      if (!Number.isInteger(Y)) return null;
      const [who, he, his] = pick(PEOPLE), what = pick(['a wallet', 'a book', 'a pair of shoes', 'a toy', 'a bag']);
      return { html: `${who} spent ${p}% of ${his} money on ${what} that cost $${Y}. How much money did ${he} have originally?`, ans: R(T), pre: '$',
        hints: [`${p}% of the money = $${Y}.`, `${p}% → 100%: × ${100 / p}.`], steps: [`${p}% = $${Y}`, `100% = $${Y} × ${100 / p} = <b>$${T}</b>`] };
    });
  } },
  { lab: 'Q7', skill: 'Speed (m and min s → m/s)', tip: 'Change the time to seconds first: 1 min 15 s = 75 s.', f() {
    return retry(() => {
      const t = pick([40, 50, 60, 75, 80, 90, 100, 120]), v = pick(['1.5', '2', '2.5', '3', '4', '5']), d = qm(v, t);
      if (!qint(d) || d.n % 10) return null;
      const [who, , his] = pick(PEOPLE);
      return { html: `${who} runs ${d.n} m in ${timeWords(t)}. What is ${his} average running speed?`, ans: D(v), unit: 'm/s',
        hints: [`${timeWords(t)} = ${t} s.`, `Speed = distance ÷ time = ${d.n} ÷ ${t}.`], steps: [`${timeWords(t)} = ${t} s`, `${d.n} ÷ ${t} = <b>${v}</b> m/s`] };
    });
  } },
  { lab: 'Q8', skill: 'Arrival time (24-hour)', tip: 'Time = distance ÷ speed. 20 km at 80 km/h = ¼ h = 15 min.', f() {
    return retry(() => {
      const [tn, td] = pick([[3, 4], [1, 2], [1, 4], [3, 2], [1, 3], [2, 3], [5, 4]]), v = pick([40, 60, 80, 20, 30, 50, 12]), d = R(v * tn, td);
      if (!qint(d)) return null;
      const mins = 60 * tn / td, st = 60 * ri(7, 17) + (chance(.3) ? 30 : 0), [veh, place] = v <= 20 ? ['cyclist', 'a country park'] : pick(VEH);
      return { kind: 'time', fmt: '24', t: st + mins, html: `A ${veh} left at ${t24(st)} at an average speed of ${v} km/h to reach ${place} ${d.n} km away. When did the ${veh} arrive?`,
        hints: [`Time = ${d.n} ÷ ${v} = ${frH(R(tn, td))} h.`, `${frH(R(tn, td))} h = ${mins} min.`], steps: [`${d.n} ÷ ${v} = ${frH(R(tn, td))} h = ${mins} min`, `${t24(st)} + ${mins} min = <b>${t24(st + mins)}</b>`] };
    });
  } },
  { lab: 'Q9a', skill: 'p% of k kg = ? g', tip: 'Change to the small unit first: 3 kg = 3000 g. Then find the %.', f() {
    return retry(() => {
      const p = pick([10, 20, 25, 50, 75, 40]), k = ri(1, 5), [big, small] = pick([['kg', 'g'], ['kg', 'g'], ['L', 'mL'], ['km', 'm']]), ans = 1000 * k * p / 100;
      if (!Number.isInteger(ans)) return null;
      return { html: `${p}% of ${k} ${big} = ${BL} ${small}`, ans: R(ans), unit: small, hints: [`${k} ${big} = ${1000 * k} ${small}.`, `${p}% of ${1000 * k}.`], steps: [`${k} ${big} = ${1000 * k} ${small}`, `${p}% of ${1000 * k} = <b>${ans}</b> ${small}`] };
    });
  } },
  { lab: 'Q9b', skill: 'Time units', tip: '1 hour = 3600 seconds.', f() { return timeFact('equals'); } },
  { lab: 'Q10a', skill: 'What % of b is a?', tip: 'Make the fraction a/b, then × 100%. 20/60 = 1/3 = 33⅓%.', f() {
    return retry(() => {
      const [fn, fd] = pick([[1, 3], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [1, 8]]), b = fd * pick([5, 6, 8, 10, 12, 15, 20, 25]), a = b / fd * fn, ans = R(100 * fn, fd);
      if (b < 12 || b > 99) return null;
      return { html: `What percentage of ${b} is ${a}?`, ans, unit: '%', hints: [`Write it as a fraction: ${frac(a, b)}.`, `${frac(a, b)} = ${frac(fn, fd)}; × 100%.`], steps: [`${frac(a, b)} = ${frac(fn, fd)}`, `${frac(fn, fd)} × 100% = <b>${frH(ans)}%</b>`] };
    });
  } },
  { lab: 'Q10b', skill: 'Angle type from two angles', tip: 'straight = 180°, round = 360°, reflex = between 180° and 360°.', f() {
    const C = ANGLE_COMBOS; return angleTypeQ([C.strObt, C.strAcu, C.twoRight, C.rightAcu, C.threeRight]);
  } },
]);

/* ---------------- Page 6 · Mental 2 (Feb) ---------------- */
page(6, 'Mental 2', 'Feb 2024', 'challenge', 'Percentages of a group, circumference and area of circles, equations (25y − 16y, 3x/4, x on both sides), semicircles, speed, squares, % of decimals and angles.', [
  { lab: 'Q1', skill: 'p% are … → how many are NOT', tip: '40% are → 60% are not. 60% of 50 = 30.', f() {
    return retry(() => {
      const p = pick([25, 20, 10, 50, 75, 40]), N = ri(4, 12) * pick([4, 5, 10]), yes = N * p / 100;
      if (!Number.isInteger(yes) || N < 20 || N > 60) return null;
      const [things, who] = pick([['game booths on Math Fun Day', 'run by P5 students'], ['students in a hall', 'wearing glasses'], ['seats in a bus', 'taken'], ['books on a shelf', 'story books']]);
      const not = chance(.7);
      return { html: `There are ${N} ${things}. If ${p}% of them are ${who}, how many are ${not ? '<b>not</b> ' : ''}${who}?`, ans: R(not ? N - yes : yes),
        hints: [not ? `${p}% are, so ${100 - p}% are not.` : `Find ${p}% of ${N}.`, `${not ? 100 - p : p}% of ${N} = ${N} ÷ 100 × ${not ? 100 - p : p}.`], steps: [`${p}% of ${N} = ${yes}`, not ? `${N} − ${yes} = <b>${N - yes}</b>` : `<b>${yes}</b>`] };
    });
  } },
  { lab: 'Q2', skill: 'Circumference from radius (π = 3.14)', tip: 'Circumference = 2 × 3.14 × radius = 6.28 × radius.', f() {
    const r = pick(['1.5', '0.5', '2.5', '2', '3', '1.5', '5']), C = qm('6.28', r), giveD = chance(.25);
    return { html: `Find the circumference of a circular garden if its ${giveD ? 'diameter' : 'radius'} is ${giveD ? n$(qm(r, 2)) : r} m. ${PI314}`, ans: C, unit: 'm',
      hints: [giveD ? 'Circumference = 3.14 × diameter.' : 'Circumference = 2 × 3.14 × radius.', `Diameter = ${n$(qm(r, 2))} m.`], steps: [`3.14 × ${n$(qm(r, 2))} = <b>${n$(C)}</b> m`] };
  } },
  { lab: 'Q3', skill: 'Solve ay − by = c', tip: '17y − 11y = 6y. Then 6y = 2 → y = 2/6 = 1/3.', f() {
    return retry(() => {
      const v = pick(VARS), k = ri(2, 9), b = ri(11, 30), a = b + k, c = chance(.75) ? ri(1, k - 1) : k * ri(1, 3);
      const ans = R(c, k);
      return { html: `Solve ${a}${V(v)} − ${b}${V(v)} = ${c}`, ans, disp: 'frac', hints: [`${a}${v} − ${b}${v} = ${k}${v}.`, `${k}${v} = ${c}, so ${v} = ${c} ÷ ${k}.`], steps: [`${a}${V(v)} − ${b}${V(v)} = ${k}${V(v)} = ${c}`, `${V(v)} = ${frac(c, k)} = <b>${frH(ans)}</b>`] };
    });
  } },
  { lab: 'Q4', skill: 'Area of a circle from diameter (π = 3.14)', tip: 'Radius = diameter ÷ 2. Area = 3.14 × r × r.', f() {
    const r = pick([1, 2, 3, 5, 10, 10]), ans = qm('3.14', r * r), giveR = chance(.25);
    return { html: `What is the area of a circle if its ${giveR ? 'radius' : 'diameter'} is ${giveR ? r : 2 * r} cm? ${PI314}`, ans, unit: 'cm²',
      hints: [giveR ? 'Area = 3.14 × r × r.' : `Radius = ${2 * r} ÷ 2 = ${r} cm.`, `3.14 × ${r} × ${r}`], steps: [`r = ${r} cm`, `3.14 × ${r} × ${r} = <b>${n$(ans)}</b> cm²`] };
  } },
  { lab: 'Q5', skill: 'Solve ax/b = c', tip: '× the bottom first: 2x/5 = 4 → 2x = 20 → x = 10.', f() {
    return retry(() => {
      const v = pick(VARS), a = ri(2, 5), b = ri(2, 9), x = ri(2, 12);
      if ((a * x) % b || gcd(a, b) !== 1) return null;
      const c = a * x / b;
      return { html: `Solve ${fH(`${a}${V(v)}`, b, `${a} ${v} over ${b}`)} = ${c}`, ans: R(x), hints: [`× ${b} on both sides.`, `${a}${v} = ${c * b}`], steps: [`${a}${V(v)} = ${c} × ${b} = ${a * x}`, `${V(v)} = ${a * x} ÷ ${a} = <b>${x}</b>`] };
    });
  } },
  { lab: 'Q6', skill: 'Perimeter of a semicircle', tip: 'Half the circumference + the straight side (the diameter)!', f() {
    if (chance(.75)) {
      const d = pick([7, 14, 14, 21, 28]), arc = 11 * d / 7, ans = arc + d;
      return { html: `The diameter of a circle is ${d} cm. The circle is divided into two semi-circles. Find the perimeter of one semi-circle. ${PI227()}`, ans: R(ans), unit: 'cm',
        hints: [`Half the circumference = ${frac(22, 7)} × ${d} ÷ 2.`, "Don't forget the straight edge (the diameter)."], steps: [`curved part = ${frac(22, 7)} × ${d} ÷ 2 = ${arc}`, `${arc} + ${d} = <b>${ans}</b> cm`] };
    }
    const d = pick([10, 20, 2]), arc = qm('1.57', d), ans = qa(arc, d);
    return { html: `The diameter of a circle is ${d} cm. The circle is divided into two semi-circles. Find the perimeter of one semi-circle. ${PI314}`, ans, unit: 'cm',
      hints: [`Half the circumference = 3.14 × ${d} ÷ 2.`, "Don't forget the straight edge (the diameter)."], steps: [`curved part = 3.14 × ${d} ÷ 2 = ${n$(arc)}`, `${n$(arc)} + ${d} = <b>${n$(ans)}</b> cm`] };
  } },
  { lab: 'Q7', skill: 'Solve with x on both sides (fractions)', tip: 'Move the x’s together: 1¼x + ¾x = 2x.', f() {
    return retry(() => {
      const v = pick(VARS), b = pick([3, 4, 5]), k = chance(.7) ? 2 : 1, q = ri(1, b - 1), p = k * b - q, x = ri(3, 12), c = k * x;
      if (p <= 0 || p === q || gcd(q, b) !== 1 || gcd(p, b) !== 1) return null;
      return { html: `Solve ${frH(R(p, b))}${V(v)} = ${c} − ${frac(q, b)}${V(v)}`, ans: R(x), hints: [`Add ${frac(q, b)}${v} to both sides.`, `${frH(R(p, b))}${v} + ${frac(q, b)}${v} = ${k}${v}`],
        steps: [`${frH(R(p, b))}${V(v)} + ${frac(q, b)}${V(v)} = ${k === 1 ? '' : k}${V(v)} = ${c}`, `${V(v)} = <b>${x}</b>`] };
    });
  } },
  { lab: 'Q8', skill: 'Speed in km/h', tip: 'In 15 minutes she goes 2 km → in 1 hour, 4 × 2 = 8 km.', f() {
    return retry(() => {
      const [tw, tn, td] = pick([['half an hour', 1, 2], ['half an hour', 1, 2], ['15 minutes', 1, 4], ['45 minutes', 3, 4], ['20 minutes', 1, 3], ['1½ hours', 3, 2], ['30 minutes', 1, 2]]), v = pick([4, 6, 8, 10, 12, 20]), d = R(v * tn, td);
      if (dpOf(d) > 1) return null;
      const [who, , his] = pick(PEOPLE), act = v <= 6 ? pick(['jogged', 'walked']) : pick(['jogged', 'cycled']);
      return { html: `${who} ${act} ${n$(d)} km in ${tw}. What was ${his} average speed?`, ans: R(v), unit: 'km/h',
        hints: [`${tw} = ${frH(R(tn, td))} h.`, `Speed = ${n$(d)} ÷ ${frH(R(tn, td))}.`], steps: [`${tw} = ${frH(R(tn, td))} h`, `${n$(d)} ÷ ${frH(R(tn, td))} = <b>${v}</b> km/h`] };
    });
  } },
  { lab: 'Q9a', skill: 'Square numbers (n²)', tip: 'Know 11² to 20²: 121, 144, 169, 196, 225, 256, 289, 324, 361, 400.', f() {
    const n = pick([11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25]);
    return { html: `${n}² = ?`, ans: R(n * n), hints: [`${n}² means ${n} × ${n}.`, `${n} × ${n} = ${n} × 10 + ${n} × ${n - 10}`], steps: [`${n} × ${n} = <b>${n * n}</b>`] };
  } },
  { lab: 'Q9b', skill: 'p% of a small decimal', tip: '25% = ¼: 25% of 0.36 = 0.36 ÷ 4 = 0.09.', f() {
    return retry(() => {
      const [p, div] = pick([[25, 4], [25, 4], [50, 2], [10, 10], [20, 5], [75, 4]]), x = dec(.04, .96, 2, false), ans = qm(x, R(p, 100));
      if (dpOf(ans) > 3 || x.n % (p === 75 ? 4 : div) !== 0) return null;
      return { html: `${p}% of ${n$(x)} is?`, ans, hints: [`${p}% = ${frH(R(p, 100))}.`, p === 75 ? `Find 25% (÷ 4), then × 3.` : `${n$(x)} ÷ ${div}`], steps: [`${p}% of ${n$(x)} = ${n$(x)} × ${frH(R(p, 100))}`, `= <b>${n$(ans)}</b>`] };
    });
  } },
  { lab: 'Q10a', skill: 'Angle type from two angles', tip: 'straight = 180°, round = 360°.', f() {
    const C = ANGLE_COMBOS; return angleTypeQ([C.twoStr, C.fourRight, C.twoRight, C.strObt, C.threeRight]);
  } },
  { lab: 'Q10b', skill: 'Reflex angle = 360° − angle', tip: 'The reflex angle goes the long way round: 360° − 65° = 295°.', f() {
    const th = retry(() => { const t = ri(20, 160); return t % 90 === 0 || t % 5 && chance(.5) ? null : t; });
    return { html: `What is the size of the reflex ∠ABC?<br>${angleSVG(th)}`, ans: R(360 - th), unit: '°', hints: ['A full turn is 360°.', `Reflex ∠ABC = 360° − ${th}°.`], steps: [`360° − ${th}° = <b>${360 - th}°</b>`] };
  } },
]);

/* ---------------- Page 7 · Mental 3 (Mar) ---------------- */
page(7, 'Mental 3', 'Mar 2024', 'challenge', 'Equations with %, brackets and D at the bottom, averages with 0, speed in m/min, circles (biggest circle in a square, radius from area), discounts, % → fraction and clock angles.', [
  { lab: 'Q1', skill: 'Solve p%A − a¼ = b¾', tip: 'Move the mixed number across (¼ + ¾ = 1). Then ÷ the %.', f() {
    return retry(() => {
      const v = pick(VARS), p = pick([20, 25, 40, 40, 50, 80]), s = ri(2, 8), x = R(100 * s, p);
      if (dpOf(x) > 1) return null;
      const [f1, f2] = pick([[[1, 4], [3, 4]], [[3, 4], [1, 4]], [[1, 2], [1, 2]]]), a = ri(1, s - 2), b = s - 1 - a;
      if (b < 1) return null;
      return { html: `Solve ${p}%${V(v)} − ${mixed(a, ...f1)} = ${mixed(b, ...f2)}`, ans: x, hints: [`Add ${mixed(a, ...f1)} to both sides: ${p}%${v} = ${s}.`, `${p}% = ${frH(R(p, 100))}, so ${v} = ${s} ÷ ${frH(R(p, 100))}.`],
        steps: [`${p}%${V(v)} = ${mixed(b, ...f2)} + ${mixed(a, ...f1)} = ${s}`, `${V(v)} = ${s} ÷ ${frH(R(p, 100))} = <b>${n$(x)}</b>`] };
    });
  } },
  { lab: 'Q2', skill: 'Solve a(B + b) = c', tip: 'Divide first: 5(B + 2.4) = 40 → B + 2.4 = 8.', f() {
    const v = pick(VARS), a = ri(2, 9), q = ri(5, 15), b = dec(.1, 2.9, 1), c = a * q, x = qs(q, b);
    return { html: `Solve ${a}(${V(v)} + ${n$(b)}) = ${c}`, ans: x, hints: [`÷ ${a} on both sides first.`, `${v} + ${n$(b)} = ${q}`], steps: [`${V(v)} + ${n$(b)} = ${c} ÷ ${a} = ${q}`, `${V(v)} = ${q} − ${n$(b)} = <b>${n$(x)}</b>`] };
  } },
  { lab: 'Q3', skill: 'Solve a ÷ (kD) = c', tip: '7 ÷ 2D = 21 → 2D = 7 ÷ 21 = ⅓ → D = ⅓ ÷ 2 = 1/6.', f() {
    const v = pick(VARS), k = ri(2, 4), a = retry(() => { const t = ri(2, 12); return gcd(t, k) === 1 ? t : null; }), m = ri(2, 5), c = a * m, ans = R(1, k * m);
    return { html: `Solve ${fH(a, `${k}${V(v)}`, `${a} over ${k} ${v}`)} = ${c}`, ans, disp: 'frac', hints: [`${k}${v} = ${a} ÷ ${c}.`, `${a} ÷ ${c} = ${frac(1, m)}; now ÷ ${k}.`], steps: [`${k}${V(v)} = ${a} ÷ ${c} = ${frac(1, m)}`, `${V(v)} = ${frac(1, m)} ÷ ${k} = <b>${frH(ans)}</b>`] };
  } },
  { lab: 'Q4', skill: 'Average (count the 0!)', tip: '0 is a number too — count it when you divide. Pair up decimals that make whole numbers.', f() {
    return retry(() => {
      const n = pick([5, 6, 6]);
      const groups = n === 6 ? pick([[[2, 3, 5], [4, 6]], [[1, 2, 7], [3, 7]], [[2, 2, 6], [5, 5]], [[1, 4, 5], [2, 8]], [[3, 3, 4], [1, 9]]]) : pick([[[3, 7], [4, 6]], [[2, 8], [5, 5]], [[1, 9], [3, 7]], [[2, 8], [4, 6]]]);
      const tenths = shuffle(groups.flat()), ints = tenths.map(() => ri(1, 7));
      let tot = ints.reduce((x, y) => x + y, 0) + tenths.reduce((x, y) => x + y, 0) / 10;
      const need = (n - (tot % n)) % n; ints[ints.length - 1] += need; tot += need;
      if (ints[ints.length - 1] > 9 || tot / n < 2 || tot / n > 6) return null;
      const all = [R(0), ...ints.map((w, i) => R(10 * w + tenths[i], 10))].sort(qcmp);
      if (new Set(all.map(n$)).size !== n) return null;
      const A = tot / n;
      return { html: `Find the average of ${all.map(n$).join(', ')}.`, ans: R(A), hints: [`There are ${n} numbers (including 0).`, 'Add the decimals that make whole numbers first.'], steps: [`${all.map(n$).join(' + ')} = ${tot}`, `${tot} ÷ ${n} = <b>${A}</b>`] };
    });
  } },
  { lab: 'Q5', skill: 'Speed in m/min', tip: 'Speed = distance ÷ time: 450 m in 5 min = 90 m/min.', f() {
    const t = pick([5, 6, 8, 10, 12]), v = pick([40, 50, 60, 75, 80, 90, 120]), d = v * t, what = pick(['A scooter', 'A bicycle', 'A robot', 'A tortoise-shaped toy car', 'A boy']);
    return { html: `${what} travels ${d} m in ${t} minutes. What is its speed?`.replace('A boy', 'A boy').replace('its speed', what === 'A boy' ? 'his speed' : 'its speed'), ans: R(v), unit: 'm/min',
      hints: ['Speed = distance ÷ time.', `${d} ÷ ${t}`], steps: [`${d} ÷ ${t} = <b>${v}</b> m/min`] };
  } },
  { lab: 'Q6', skill: 'Biggest circle in a square (π = 3.14)', tip: 'Diameter = side of the square. Circumference = 3.14 × diameter.', f() {
    const s = pick([2, 4, 5, 6, 8, 10, 20]), ans = qm('3.14', s);
    return { html: `The largest circle is cut from a square paper of side ${s} cm. What is the circumference of the circle? ${PI314}`, ans, unit: 'cm', hints: ['The diameter is the same as the side of the square.', `3.14 × ${s}`], steps: [`diameter = ${s} cm`, `3.14 × ${s} = <b>${n$(ans)}</b> cm`] };
  } },
  { lab: 'Q7', skill: 'Radius from area', tip: 'Area ÷ π = r × r. 616 ÷ 22/7 = 196 → r = 14.', f() {
    if (chance(.6)) {
      const r = pick(['7', '7', '14', '3.5']), A = qm(R(22, 7), qm(r, r));
      return { html: `The area of a circle is ${n$(A)} cm². What is the radius of the circle? ${PI227()}`, ans: D(r), unit: 'cm', hints: [`r × r = ${n$(A)} ÷ ${frac(22, 7)}.`, `${n$(A)} × ${frac(7, 22)} = ${n$(qm(r, r))}.`], steps: [`r × r = ${n$(A)} × ${frac(7, 22)} = ${n$(qm(r, r))}`, `r = <b>${r}</b> cm`] };
    }
    const r = pick([1, 2, 3, 5, 10]), A = qm('3.14', r * r);
    return { html: `The area of a circle is ${n$(A)} cm². What is the radius of the circle? ${PI314}`, ans: R(r), unit: 'cm', hints: [`r × r = ${n$(A)} ÷ 3.14.`, `= ${r * r}`], steps: [`r × r = ${n$(A)} ÷ 3.14 = ${r * r}`, `r = <b>${r}</b> cm`] };
  } },
  { lab: 'Q8', skill: 'Selling price after a discount', tip: '20% off → you pay 80%.', f() {
    return retry(() => {
      const P = pick([800, 1200, 1500, 2000, 2400, 2500, 3000, 4000, 600]), p = pick([10, 20, 25, 30, 40, 50]), S = P * (100 - p) / 100;
      if (!Number.isInteger(S) || S % 50) return null;
      const what = pick(['handbag', 'bicycle', 'watch', 'sofa', 'camera', 'guitar']);
      return { html: `The original price of a ${what} is $${P}. It is now being sold at a ${p}% discount. What is its selling price?`, ans: R(S), pre: '$',
        hints: [`${p}% off → pay ${100 - p}%.`, `${100 - p}% of $${P}.`], steps: [`${p}% of $${P} = $${P * p / 100}`, `$${P} − $${P * p / 100} = <b>$${S}</b>`] };
    });
  } },
  { lab: 'Q9a', skill: 'Capacity units', tip: '1 L = 1000 mL = 1000 cm³; 1 mL = 1 cm³.', f() {
    const [html, ans, unit, hint] = pick([['1 L = ' + BL + ' cm³', 1000, 'cm³', '1 L = 1000 cm³'], ['2 L = ' + BL + ' cm³', 2000, 'cm³', '1 L = 1000 cm³'], ['1 L = ' + BL + ' mL', 1000, 'mL', '1 L = 1000 mL'], ['1 cm³ = ' + BL + ' mL', 1, 'mL', '1 cm³ = 1 mL'], ['1 m³ = ' + BL + ' L', 1000, 'L', '1 m³ = 1000 L'], ['3 L = ' + BL + ' cm³', 3000, 'cm³', '1 L = 1000 cm³']]);
    return { html, ans: R(ans), unit, hints: [hint, 'A litre is a box 10 cm × 10 cm × 10 cm.'], steps: [`${hint} → <b>${ans}</b> ${unit}`] };
  } },
  { lab: 'Q9b', skill: 'Special % → fraction (like 12½% = ⅛)', tip: 'Learn these: 33⅓% = ⅓, 16⅔% = ⅙, 14 2/7% = 1/7, 12½% = ⅛, 11⅑% = 1/9.', f() { return pctMixedToFrac([100, 100, 100, 50], [3, 6, 7, 8, 9, 12]); } },
  { lab: 'Q10a', skill: 'Angle between clock hands', tip: 'Each hour on the clock = 30°.', f() {
    const acute = chance(.65), h = acute ? pick([1, 2, 10, 11]) : pick([3, 4, 5, 7, 8, 9]), a = 30 * Math.min(h, 12 - h);
    return { html: `What is the size of the ${acute ? 'acute' : 'smaller'} angle between the hour hand and the minute hand at ${h} o'clock?`, ans: R(a), unit: '°',
      hints: ['There are 12 hours round the clock: 360° ÷ 12 = 30° each.', `At ${h} o'clock the hands are ${Math.min(h, 12 - h)} hour${Math.min(h, 12 - h) > 1 ? 's' : ''} apart.`], steps: [`${Math.min(h, 12 - h)} × 30° = <b>${a}°</b>`] };
  } },
  { lab: 'Q10b', skill: 'Discount rate of an offer', tip: 'Buy 3 get 1 free: pay for 3, get 4 → you save 1 out of 4 = 25%.', f() {
    const [offer, ans, why] = wt([[4, ["'buy 1 get 1 free'", R(50), 'Pay for 1, get 2: you save 1 out of 2 = 50%']], [2, ["'buy 3 get 1 free'", R(25), 'Pay for 3, get 4: you save 1 out of 4 = 25%']], [2, ["'buy 2 get 1 free'", R(100, 3), 'Pay for 2, get 3: you save 1 out of 3 = 33⅓%']], [1, ["'buy 4 get 1 free'", R(20), 'Pay for 4, get 5: you save 1 out of 5 = 20%']]]);
    return { html: `What is the discount rate of ${offer}?`, ans, unit: '%', hints: ['How many do you take home? How many do you pay for?', 'Discount = free ones ÷ all the ones you get.'], steps: [`${why} → <b>${frH(ans)}%</b>`] };
  } },
]);

/* ---------------- Page 8 · Mental 4 (Apr) ---------------- */
page(8, 'Mental 4', 'Apr 2024', 'challenge', 'Rounding recurring decimals, % equations, discount rate, speed × time, money left, missing number from an average, semicircle area, one turn of a circle, angle sums, ÷ 0.001, symmetry and time.', [
  { lab: 'Q1', skill: 'Mixed number → decimal, rounded', tip: '1/3 = 0.333…, 1/6 = 0.1666…, 1/9 = 0.111…, 1/12 = 0.0833…', f() {
    return retry(() => {
      const d = pick([3, 6, 6, 9, 12]), n = ri(1, d - 1), w = ri(1, 9), k = chance(.7) ? 3 : 2;
      if (gcd(n, d) !== 1) return null;
      const x = MX(w, n, d), ans = roundR(x, k);
      return { html: `Change ${mixed(w, n, d)} to a decimal. (correct it to the nearest ${k === 3 ? 'thousandth' : 'hundredth'})`, ans, form: `dp${k}`,
        hints: [`${frac(n, d)} = ${decStr(R(n, d), 5)}…`, `Look at the digit after the ${k === 3 ? '3rd' : '2nd'} decimal place.`], steps: [`${mixed(w, n, d)} = ${decStr(x, 5)}…`, `≈ <b>${decStr(ans, k)}</b>`] };
    });
  } },
  { lab: 'Q2', skill: 'Solve (1 − p%)Y + c = 2Y', tip: '(1 − 25%)Y = 0.75Y. 2Y − 0.75Y = 1.25Y.', f() {
    return retry(() => {
      const v = pick(['Y', 'Y', 'x', 'A']), p = pick([10, 20, 25, 50, 40]), y = pick(['0.1', '0.2', '0.3', '0.4', '0.5', '0.1', '0.2', '1']), co = R(100 + p, 100), c = qm(co, y);
      if (dpOf(c) > 3) return null;
      const keep = R(100 - p, 100);
      return { html: `Solve (1 − ${p}%)${V(v)} + ${n$(c)} = 2${V(v)}`, ans: D(y), hints: [`(1 − ${p}%)${v} = ${n$(keep)}${v}.`, `${n$(c)} = 2${v} − ${n$(keep)}${v} = ${n$(co)}${v}.`],
        steps: [`${n$(c)} = 2${V(v)} − ${n$(keep)}${V(v)} = ${n$(co)}${V(v)}`, `${V(v)} = ${n$(c)} ÷ ${n$(co)} = <b>${y}</b>`] };
    });
  } },
  { lab: 'Q3', skill: 'Rate of discount', tip: 'Discount = original − selling. Rate = discount ÷ original × 100%.', f() {
    return retry(() => {
      const P = pick([80, 100, 120, 160, 200, 250, 300, 400, 500, 800]), r = pick([10, 20, 25, 30, 40, 50]), S = P * (100 - r) / 100;
      if (!Number.isInteger(S)) return null;
      const what = pick(['vase', 'lamp', 'jacket', 'school bag', 'clock']);
      return { html: `The original price of a ${what} was $${P}. It is now sold at $${S}. What is the rate of discount of the ${what}?`, ans: R(r), unit: '%',
        hints: [`Discount = $${P} − $${S} = $${P - S}.`, `${frac(P - S, P)} × 100%.`], steps: [`$${P} − $${S} = $${P - S}`, `${frac(P - S, P)} × 100% = <b>${r}%</b>`] };
    });
  } },
  { lab: 'Q4', skill: 'Distance = speed × time (m/s and minutes)', tip: 'Change minutes to seconds first: 3 min = 180 s.', f() {
    const v = pick(['1.2', '1.5', '0.8', '2.5', '0.5', '1.2']), t = pick([1, 2, 2, 3, 5]), d = qm(v, 60 * t), what = pick(['toy car', 'robot', 'remote-control boat']);
    return { html: `A ${what} travels at an average speed of ${v} m/s. How far does it travel in ${t} minute${t > 1 ? 's' : ''}?`, ans: d, unit: 'm',
      hints: [`${t} min = ${60 * t} s.`, `Distance = ${v} × ${60 * t}.`], steps: [`${t} min = ${60 * t} s`, `${v} × ${60 * t} = <b>${n$(d)}</b> m`] };
  } },
  { lab: 'Q5', skill: 'Money left after p% and then a fraction', tip: 'Step by step: first the %, then the fraction of what is LEFT.', f() {
    return retry(() => {
      const M = pick([600, 800, 900, 1000, 1200, 1500, 2000]), p = pick([20, 25, 40, 50, 10]), n = pick([2, 3, 4, 5]), r1 = M * (100 - p) / 100;
      if (!Number.isInteger(r1) || r1 % n || (r1 / n) % 50) return null;
      const spent2 = r1 / n, left = r1 - spent2, askLeft = chance(.8);
      return { html: `I had $${M} at first. I spent ${p}% of it on a school bag and ${frac(1, n)} of the remaining amount on a jacket. ${askLeft ? 'How much do I have now?' : 'How much did the jacket cost?'}`, ans: R(askLeft ? left : spent2), pre: '$',
        hints: [`After the bag: ${100 - p}% of $${M} = $${r1}.`, `The jacket is ${frac(1, n)} of $${r1}.`], steps: [`$${M} × ${100 - p}% = $${r1}`, `jacket: $${r1} ÷ ${n} = $${spent2}`, askLeft ? `left: $${r1} − $${spent2} = <b>$${left}</b>` : `<b>$${spent2}</b>`] };
    });
  } },
  { lab: 'Q6', skill: 'Missing number from an average', tip: 'Total = average × how many. Missing = total − the others.', f() {
    return retry(() => {
      const n = chance(.7) ? 5 : 4, A = pick(['3', '2', '4', '2.5', '3.5']), xs = chance(.5) ? (() => { const s = dec(.6, 1.5, 1); return [1, 2, 3, 4].slice(0, n - 1).map((i) => qm(s, i)); })() : Array.from({ length: n - 1 }, () => dec(.5, 6.5, 1));
      const tot = qm(A, n), sum = xs.reduce((p, x) => qa(p, x), R(0)), last = qs(tot, sum);
      if (qval(last) <= 0 || qval(last) > 9.9 || dpOf(last) > 1) return null;
      return { html: `The average of ${['', '', '', '', 'four', 'five'][n]} numbers is ${A}. What is the last number if the other ${['', '', '', 'three', 'four'][n - 1]} numbers are ${xs.map(n$).join(', ')}?`, ans: last,
        hints: [`Total = ${A} × ${n} = ${n$(tot)}.`, `Add the ${n - 1} numbers you know: ${n$(sum)}.`], steps: [`${A} × ${n} = ${n$(tot)}`, `${xs.map(n$).join(' + ')} = ${n$(sum)}`, `${n$(tot)} − ${n$(sum)} = <b>${n$(last)}</b>`] };
    });
  } },
  { lab: 'Q7', skill: 'Area of a semicircle', tip: 'Area of the whole circle (π × r × r), then ÷ 2.', f() {
    if (chance(.7)) {
      const r = pick(['7', '7', '14', '3.5']), A = qd(qm(R(22, 7), qm(r, r)), 2);
      return { html: `Find the area of a semi-circle if its radius is ${r} cm. ${PI227()}`, ans: A, unit: 'cm²', hints: [`Whole circle = ${frac(22, 7)} × ${r} × ${r}.`, 'Then ÷ 2.'], steps: [`${frac(22, 7)} × ${r} × ${r} = ${n$(qm(A, 2))}`, `${n$(qm(A, 2))} ÷ 2 = <b>${n$(A)}</b> cm²`] };
    }
    const r = pick([2, 4, 10, 1]), A = qd(qm('3.14', r * r), 2);
    return { html: `Find the area of a semi-circle if its radius is ${r} cm. ${PI314}`, ans: A, unit: 'cm²', hints: [`Whole circle = 3.14 × ${r} × ${r}.`, 'Then ÷ 2.'], steps: [`3.14 × ${r} × ${r} = ${n$(qm(A, 2))}`, `${n$(qm(A, 2))} ÷ 2 = <b>${n$(A)}</b> cm²`] };
  } },
  { lab: 'Q8', skill: 'One turn of a circle → diameter', tip: 'Distance = speed × time. One turn = the circumference, so diameter = distance ÷ 3.14.', f() {
    return retry(() => {
      const v = pick(['0.314', '0.157', '0.628', '1.57', '3.14']), t = pick([10, 20, 25, 50, 100]), dist = qm(v, t), d = qd(dist, '3.14');
      if (dpOf(d) > 1 || qval(d) < .5 || qval(d) > 100) return null;
      const [who, path] = qval(v) >= 1.5 ? pick([['A runner', 'a circular track'], ['A cyclist', 'a circular track']]) : pick([['A toy train', 'a circular track'], ['A robot', 'a circular path'], ['A hamster', 'the edge of a round table']]);
      return { html: `${who} went round ${path} at an average speed of ${v} m/s for ${t} seconds. It went round exactly 1 time only. What is the diameter of the circle? ${PI314}`, ans: d, unit: 'm',
        hints: [`Distance = ${v} × ${t} = ${n$(dist)} m.`, `1 turn = the circumference = 3.14 × diameter.`], steps: [`${v} × ${t} = ${n$(dist)} m`, `${n$(dist)} ÷ 3.14 = <b>${n$(d)}</b> m`] };
    });
  } },
  { lab: 'Q9a', skill: 'Angle sum of a shape', tip: 'Triangle: 180°. Any 4-sided shape: 360°.', f() {
    const [s, a] = pick([['square', 360], ['square', 360], ['rectangle', 360], ['triangle', 180], ['rhombus', 360], ['parallelogram', 360]]);
    return { html: `What is the angle sum of a ${s}?`, ans: R(a), unit: '°', hints: [a === 360 ? 'It has 4 angles.' : 'It has 3 angles.', a === 360 ? 'A square has 4 right angles.' : 'A triangle makes a straight line when you tear off the corners.'], steps: [a === 360 ? (s === 'square' || s === 'rectangle' ? `4 × 90° = <b>360°</b>` : `Any 4-sided shape: <b>360°</b>`) : `<b>180°</b>`] };
  } },
  { lab: 'Q9b', skill: 'Small decimal ÷ 0.001', tip: '÷ 0.001 = × 1000; ÷ 0.01 = × 100.', f() {
    const dv = chance(.6) ? '0.001' : '0.01', a = pick(dv === '0.001' ? ['0.05', '0.08', '0.3', '0.007', '0.04', '0.6', '0.25', '0.012', '0.09'] : ['0.05', '0.08', '0.3', '0.04', '0.6', '0.25', '0.09', '0.7']), ans = qd(a, dv);
    return { html: `${a} ÷ ${dv}`, ans, hints: [`÷ ${dv} = × ${dv === '0.001' ? 1000 : 100}.`, `Move the decimal point ${dv === '0.001' ? 3 : 2} places to the right.`], steps: [`${a} × ${dv === '0.001' ? 1000 : 100} = <b>${n$(ans)}</b>`] };
  } },
  { lab: 'Q10a', skill: 'Axes of symmetry', tip: 'Regular shapes: as many axes as sides. Rectangle: 2. Isosceles triangle: 1.', f() {
    const [s, a] = pick([['an equilateral triangle', 3], ['an equilateral triangle', 3], ['a square', 4], ['a rectangle', 2], ['an isosceles triangle', 1], ['a regular hexagon', 6], ['a regular pentagon', 5]]);
    return { html: `How many axes of symmetry are there in ${s}?`, ans: R(a), hints: ['An axis of symmetry is a fold line: both halves match.', 'A regular shape has as many axes as it has sides.'], steps: [`<b>${a}</b>`] };
  } },
  { lab: 'Q10b', skill: 'Time after (fraction of an hour)', tip: '1¾ h = 1 h 45 min. 9:00 a.m. + 1 h 45 min = 10:45 a.m.', f() {
    return retry(() => {
      const d = pick([3, 4, 2, 6, 5, 3]), n = ri(1, d - 1), w = chance(.8) ? 1 : 2, before = chance(.2);
      if (gcd(n, d) !== 1) return null;
      const add = 60 * w + 60 * n / d, st = 60 * pick([8, 9, 10, 13, 14, 15, 16, 17]);
      return { kind: 'time', fmt: '12', t: before ? st - add : st + add, html: `What time is ${mixed(w, n, d)} h ${before ? 'before' : 'after'} ${t12(st)}?`,
        hints: [`${mixed(w, n, d)} h = ${w} h ${60 * n / d} min.`, before ? 'Count backwards.' : 'Add the hours, then the minutes.'], steps: [`${mixed(w, n, d)} h = ${w} h ${60 * n / d} min`, `${t12(st)} ${before ? '−' : '+'} ${w} h ${60 * n / d} min = <b>${t12(before ? st - add : st + add)}</b>`] };
    });
  } },
]);

/* ---------- registry ---------- */
const PAGE = Object.fromEntries(PAPERS.map((p) => [p.n, p]));
const GEN = {};
PAPERS.forEach((p) => p.slots.forEach((s, i) => { s.id = `p${p.n}.${s.lab.toLowerCase()}`; s.page = p.n; s.idx = i; GEN[s.id] = s; }));

/* run a generator and tidy the result */
function makeQ(genId) {
  const g = GEN[genId], q = g.f.call(g);
  q.gen = genId; q.page = g.page; q.lab = g.lab; q.kind = q.kind || 'num'; q.form = q.form || 'any';
  if (q.kind === 'num') q.ans = D(q.ans);
  q.uid = Math.random().toString(36).slice(2, 11);
  return q;
}
/* a whole paper with new numbers, in the order of the page */
const paperQs = (n) => PAGE[n].slots.map((s) => makeQ(s.id));

export { PAPERS, PAGE, GEN, makeQ, paperQs };
