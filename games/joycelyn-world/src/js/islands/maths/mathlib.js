// =============================================================
//  Maths Island · shared maths helpers
//  Exact fraction arithmetic (no floating-point errors), number formatting (stacked fractions),
//  answer parsing + checking, spoken-answer parsing and small SVG figures.
//  The questions themselves live in papers.js (one generator per question on each page).
//  All content is English (the interview is in English).
// =============================================================
/* =========================================================
   Mental Maths Workshop · core helpers
   - exact rational arithmetic (no floating-point surprises)
   - number formatting (stacked fractions, HK-style digit groups)
   - answer parsing & checking
   ========================================================= */

/* ---------- random ---------- */
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- rationals ---------- */
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
function R(n, d = 1) {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error("bad rational " + n + "/" + d);
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d); return { n: n / g, d: d / g };
}
/* D(x): number or decimal string -> exact rational (x must be a terminating decimal) */
function D(x) {
  if (x && typeof x === "object") return x;
  let s = typeof x === "number" ? x.toFixed(9) : String(x).trim();
  let neg = false; if (s[0] === "-") { neg = true; s = s.slice(1); }
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  const [a, b = ""] = s.split(".");
  const n = parseInt((a || "0") + b, 10), d = Math.pow(10, b.length);
  return R(neg ? -n : n, d);
}
const qa = (a, b) => { a = D(a); b = D(b); return R(a.n * b.d + b.n * a.d, a.d * b.d); };
const qs = (a, b) => { a = D(a); b = D(b); return R(a.n * b.d - b.n * a.d, a.d * b.d); };
const qm = (a, b) => { a = D(a); b = D(b); return R(a.n * b.n, a.d * b.d); };
const qd = (a, b) => { a = D(a); b = D(b); return R(a.n * b.d, a.d * b.n); };
const qeq = (a, b) => { a = D(a); b = D(b); return a.n === b.n && a.d === b.d; };
const qcmp = (a, b) => { a = D(a); b = D(b); return a.n * b.d - b.n * a.d; };
const qval = a => { a = D(a); return a.n / a.d; };
const qint = a => { a = D(a); return a.d === 1; };
const F = (n, d) => R(n, d);                    // fraction n/d as a rational
const MX = (w, n, d) => R(w * d + n, d);        // mixed number w n/d
const pctR = p => qd(D(p), 100);               // p% as a rational

function isTerm(r) { r = D(r); let d = r.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; }
function dpOf(r) { r = D(r); if (!isTerm(r)) return Infinity; let k = 0, d = r.d; while (k < 12 && Math.pow(10, k) % d !== 0) k++; return k; }

/* ---------- formatting ---------- */
const NB = " ";
function grp(intStr) { // HK style: 10 000 and above get spaces
  if (intStr.length < 5) return intStr;
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
}
/* exact decimal string; fixed = exact number of dp (pads zeros) */
function decStr(r, fixed) {
  r = D(r);
  const neg = r.n < 0, n = Math.abs(r.n);
  let k = dpOf(r);
  if (k === Infinity) { // not terminating: round to 6 dp (only used in explanations)
    const v = (n / r.d).toFixed(fixed != null ? fixed : 6); return (neg ? "-" : "") + v;
  }
  if (fixed != null && fixed > k) k = fixed;
  const scaled = BigInt(n) * BigInt(Math.pow(10, k)) / BigInt(r.d);
  let s = scaled.toString().padStart(k + 1, "0");
  let ip = k ? s.slice(0, -k) : s, fp = k ? s.slice(-k) : "";
  if (fixed == null) fp = fp.replace(/0+$/, "");
  return (neg ? "-" : "") + grp(ip) + (fp ? "." + fp : "");
}
/* round r to k dp, returns rational */
function roundR(r, k) {
  r = D(r); const p = Math.pow(10, k);
  const v = r.n * p / r.d; // r small enough here
  const sign = v < 0 ? -1 : 1, a = Math.abs(v);
  // exact half-up using integer arithmetic
  const num = Math.abs(r.n) * p, den = r.d;
  let q = Math.floor(num / den); const rem = num - q * den;
  if (rem * 2 >= den) q += 1;
  return R(sign * q, p);
}

const DEN_WORD = { 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["quarter", "quarters"], 5: ["fifth", "fifths"], 6: ["sixth", "sixths"], 7: ["seventh", "sevenths"], 8: ["eighth", "eighths"], 9: ["ninth", "ninths"], 10: ["tenth", "tenths"], 12: ["twelfth", "twelfths"], 20: ["twentieth", "twentieths"], 100: ["hundredth", "hundredths"] };
function fracSay(n, d) { const w = DEN_WORD[d]; return w ? n + " " + (n === 1 ? w[0] : w[1]) : n + " over " + d; }
/* stacked fraction HTML */
function fH(n, d, say) {
  return `<span class="fr" data-say="${say || fracSay(n, d)}"><span class="fn">${n}</span><span class="fd">${d}</span></span>`;
}
/* rational -> fraction / mixed-number HTML */
function frH(r) {
  r = D(r);
  if (r.d === 1) return String(r.n);
  const neg = r.n < 0, n = Math.abs(r.n), w = Math.floor(n / r.d), m = n % r.d;
  const fr = fH(m, r.d, (w ? w + " and " : "") + fracSay(m, r.d));
  return (neg ? "−" : "") + (w ? `<span class="mx">${w}${fr}</span>` : fr);
}
/* improper fraction HTML (19/2) */
function impH(r) { r = D(r); return r.d === 1 ? String(r.n) : fH(r.n, r.d); }
/* best display: decimal if short, otherwise fraction */
function nH(r, pref) {
  r = D(r);
  if (pref === "frac") return frH(r);
  if (isTerm(r) && (pref === "dec" || dpOf(r) <= 6)) return decStr(r);
  return frH(r);
}
const money = r => { r = D(r); return "$" + (qint(r) ? decStr(r) : decStr(r, 2)); };
const plainNum = r => { r = D(r); return isTerm(r) ? decStr(r).replace(/ /g, " ") : (Math.floor(Math.abs(r.n) / r.d) ? Math.floor(r.n / r.d) + " " + (Math.abs(r.n) % r.d) + "/" + r.d : r.n + "/" + r.d); };

/* ---------- time helpers ---------- */
const two = n => String(n).padStart(2, "0");
function t24(mins) { mins = ((mins % 1440) + 1440) % 1440; return two(Math.floor(mins / 60)) + ":" + two(mins % 60); }
function t12(mins) {
  mins = ((mins % 1440) + 1440) % 1440; const h = Math.floor(mins / 60), m = mins % 60;
  const ap = h < 12 ? "a.m." : "p.m."; let hh = h % 12; if (hh === 0) hh = 12;
  return hh + ":" + two(m) + " " + ap;
}

/* ---------- answer entry parsing ----------
   entry from the widget: {mode:'n', s} | {mode:'f', n, d} | {mode:'m', w, n, d}
   returns {r, repr:'int'|'dec'|'frac'|'mixed', dp, simplest} or null */
function parseNumText(s) {
  s = String(s || "").trim().replace(/[−–]/g, "-").replace(/\s+/g, " ");
  if (!s) return null;
  let m;
  if ((m = s.match(/^(\d+)\s+(?:and\s+)?(\d+)\s*\/\s*(\d+)$/))) return mk("m", +m[1], +m[2], +m[3]);
  if ((m = s.match(/^(\d+)\s*\/\s*(\d+)$/))) return mk("f", 0, +m[1], +m[2]);
  const t = s.replace(/[ , ]/g, "");
  if (/^-?\d+$/.test(t)) return { r: R(parseInt(t, 10)), repr: "int", dp: 0, simplest: true, raw: t };
  if (/^-?\d*\.\d+$/.test(t)) { const dp = t.split(".")[1].length; return { r: D(t), repr: "dec", dp, simplest: true, raw: t }; }
  return null;
  function mk(kind, w, n, d) {
    if (!d) return null;
    const r = R(w * d + n, d);
    const simplest = gcd(n, d) === 1 && (kind === "f" || n < d) && n !== 0;
    return { r, repr: kind === "m" ? "mixed" : "frac", dp: 0, simplest, raw: s };
  }
}
function parseEntry(e) {
  if (!e) return null;
  if (e.mode === "n") return parseNumText(e.s);
  const n = String(e.n || "").trim(), d = String(e.d || "").trim(), w = String(e.w || "").trim();
  if (!n || !d) { if (e.mode === "m" && w && !n && !d) return parseNumText(w); return null; }
  if (!/^\d+$/.test(n) || !/^\d+$/.test(d) || (w && !/^\d+$/.test(w))) return null;
  return parseNumText((e.mode === "m" && w ? w + " " : "") + n + "/" + d);
}
/* human readable entry (for the mistake book) */
function entryText(q, e) {
  if (!e) return "—";
  if (q.kind === "choice") return e.idx == null ? "—" : stripTags(q.choices[e.idx]);
  if (q.kind === "time") return e.h === "" && e.m === "" ? "—" : (e.h || "?") + ":" + two(e.m || 0) + (e.ap ? " " + e.ap : "");
  if (q.kind === "order") return e.order && e.order.length ? e.order.map((k, i) => stripTags(q.items[k].txt) + (i < e.order.length - 1 ? " " + (e.signs[i] || "?") + " " : "")).join("") : "—";
  if (q.kind === "self") return e.self ? "✓ (said it)" : "✗";
  const p = parseEntry(e); if (!p) return (e.s || [e.w, e.n && e.d ? e.n + "/" + e.d : ""].join(" ")).trim() || "—";
  return p.raw;
}
function stripTags(h) {
  return String(h).replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<span class="blank[^"]*">\?<\/span>/g, "?")
    .replace(/<span class="fr"[^>]*><span class="fn">(.*?)<\/span><span class="fd">(.*?)<\/span><\/span>/g, (m, a, b) => " " + a.replace(/<[^>]+>/g, "") + "/" + b.replace(/<[^>]+>/g, ""))
    .replace(/<[^>]+>/g, "").replace(/&ensp;|&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

/* ---------- checking ----------
   returns {ok, empty?, form?}  form = reason when value is right but written in the wrong form */
function checkAnswer(q, e) {
  if (q.kind === "self") return { ok: !!(e && e.self) };
  if (q.kind === "choice") { if (!e || e.idx == null) return { ok: false, empty: true }; return { ok: e.idx === q.correct }; }
  if (q.kind === "order") {
    if (!e || !e.order || e.order.length < q.items.length) return { ok: false, empty: true };
    const vals = e.order.map(k => q.items[k].v);
    const want = q.dir === "desc" ? ">" : "<";
    for (let i = 0; i < vals.length - 1; i++) {
      const c = qcmp(vals[i], vals[i + 1]);
      if (q.dir === "desc" ? c <= 0 : c >= 0) return { ok: false };
    }
    if (e.signs.some(s => s !== want)) return { ok: false, form: "sign" };
    return { ok: true };
  }
  if (q.kind === "time") {
    if (!e || e.h === "" || e.m === "" || e.h == null || e.m == null) return { ok: false, empty: true };
    let h = parseInt(e.h, 10), m = parseInt(e.m, 10);
    if (isNaN(h) || isNaN(m) || m > 59 || h > 23) return { ok: false };
    let mins;
    if (e.ap) { if (h < 1 || h > 12) return { ok: false }; mins = (h % 12) * 60 + m + (e.ap === "p.m." ? 720 : 0); }
    else mins = h * 60 + m;
    const want = ((q.t % 1440) + 1440) % 1440;
    if (mins === want) return { ok: true };
    if (!e.ap && h <= 12 && q.fmt === "12" && ((h % 12) * 60 + m + 720 === want || (h % 12) * 60 + m === want)) return { ok: false, form: "ampm" };
    return { ok: false };
  }
  // numeric
  const p = parseEntry(e);
  if (!p) return { ok: false, empty: !e || !(e.s || e.n || e.d || e.w) };
  if (!qeq(p.r, q.ans)) return { ok: false };
  if ((p.repr === "frac" || p.repr === "mixed") && !p.simplest) return { ok: false, form: "simplify" };
  const f = q.form || "any";
  if (f === "dec" && (p.repr === "frac" || p.repr === "mixed")) return { ok: false, form: "dec" };
  if (f === "frac" && p.repr === "dec") return { ok: false, form: "frac" };
  if (/^dp\d$/.test(f)) {
    const k = +f[2];
    if (p.repr === "frac" || p.repr === "mixed") return { ok: false, form: "dp" };
    if (p.dp !== k) return { ok: false, form: "dp" };
  }
  return { ok: true };
}
const FORM_MSG = {
  simplify: "Right value — but give the fraction in its simplest form.",
  dec: "Right value — but the question asks for a decimal.",
  frac: "Right value — but the question asks for a fraction.",
  dp: "Right value — but check how many decimal places the question wants (keep any ending 0).",
  sign: "Right order — but use the proper sign. Ascending = smallest first, with “<”.",
  ampm: "Right numbers — don't forget a.m. or p.m.!"
};

/* correct answer as display HTML */
function ansHTML(q) {
  if (q.kind === "choice") return q.choices[q.correct];
  if (q.kind === "time") return q.fmt === "12" ? t12(q.t) : t24(q.t);
  if (q.kind === "order") {
    const idx = q.items.map((_, i) => i).sort((a, b) => q.dir === "desc" ? qcmp(q.items[b].v, q.items[a].v) : qcmp(q.items[a].v, q.items[b].v));
    return idx.map(i => q.items[i].html).join(` <b>${q.dir === "desc" ? "&gt;" : "&lt;"}</b> `);
  }
  if (q.kind === "self") return q.say || "";
  let core;
  const f = q.form || "any";
  if (/^dp\d$/.test(f)) core = decStr(q.ans, +f[2]);
  else if (f === "frac" || q.disp === "frac") core = frH(q.ans);
  else if (f === "dec") core = decStr(q.ans);
  else core = nH(q.ans);
  return (q.pre || "") + core + (q.unit ? (q.unit === "°" || q.unit === "%" ? "" : NB) + q.unit : "");
}
/* the keypad sequence for a correct answer (used by the test hook and "show me") */
function ansEntry(q) {
  if (q.kind === "choice") return { idx: q.correct };
  if (q.kind === "time") { const t = ((q.t % 1440) + 1440) % 1440, h = Math.floor(t / 60), m = t % 60; return q.fmt === "12" ? { h: String(h % 12 || 12), m: two(m), ap: h < 12 ? "a.m." : "p.m." } : { h: two(h), m: two(m), ap: "" }; }
  if (q.kind === "order") {
    const idx = q.items.map((_, i) => i).sort((a, b) => q.dir === "desc" ? qcmp(q.items[b].v, q.items[a].v) : qcmp(q.items[a].v, q.items[b].v));
    return { order: idx, signs: idx.slice(1).map(() => q.dir === "desc" ? ">" : "<") };
  }
  const f = q.form || "any", r = q.ans;
  if (/^dp\d$/.test(f)) return { mode: "n", s: decStr(r, +f[2]).replace(/ /g, "") };
  if (f !== "frac" && q.disp !== "frac" && isTerm(r) && (f === "dec" || dpOf(r) <= 6)) return { mode: "n", s: decStr(r).replace(/ /g, "") };
  if (r.d === 1) return { mode: "n", s: String(r.n) };
  const w = Math.floor(r.n / r.d), m = r.n % r.d;
  return w ? { mode: "m", w: String(w), n: String(m), d: String(r.d) } : { mode: "f", n: String(m), d: String(r.d) };
}

/* ---------- speech text from question HTML ---------- */
function speakify(html) {
  const div = document.createElement("div"); div.innerHTML = html;
  div.querySelectorAll(".fr").forEach(f => f.replaceWith(" " + (f.dataset.say || "") + " "));
  div.querySelectorAll(".mx").forEach(f => f.replaceWith(" " + f.textContent + " "));
  div.querySelectorAll("svg,.nosay").forEach(f => f.remove());
  let t = div.textContent;
  const rep = [
    [/cm³/g, " cubic centimetres"], [/m³/g, " cubic metres"], [/cm²/g, " square centimetres"], [/m²/g, " square metres"],
    [/km\/h/g, " kilometres per hour"], [/m\/s/g, " metres per second"], [/m\/min/g, " metres per minute"],
    [/(\d)²/g, "$1 squared"], [/×/g, " times "], [/÷/g, " divided by "], [/[−–]/g, " minus "], [/\+/g, " plus "], [/=/g, " equals "],
    [/_{2,}|\?/g, " what "], [/%/g, " percent "], [/π/g, " pi "], [/∠/g, " angle "], [/°/g, " degrees "], [/\$/g, " dollars "],
    [/</g, " less than "], [/>/g, " greater than "], [/\s+/g, " "]
  ];
  rep.forEach(([a, b]) => t = t.replace(a, b));
  return t.trim();
}

/* ---------- spoken answer -> entry ---------- */
const NUMW = { zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, a: 1, an: 1 };
const DENW = { half: 2, halves: 2, third: 3, thirds: 3, quarter: 4, quarters: 4, fourth: 4, fourths: 4, fifth: 5, fifths: 5, sixth: 6, sixths: 6, seventh: 7, sevenths: 7, eighth: 8, eighths: 8, ninth: 9, ninths: 9, tenth: 10, tenths: 10, eleventh: 11, elevenths: 11, twelfth: 12, twelfths: 12, fifteenth: 15, fifteenths: 15, sixteenth: 16, sixteenths: 16, twentieth: 20, twentieths: 20, hundredth: 100, hundredths: 100 };
function wordsToDigits(t) {
  // turn runs of number words into digits: "two thousand five hundred" -> 2500, "point one two five" -> .125
  const toks = t.split(/\s+/); const out = []; let i = 0;
  while (i < toks.length) {
    let w = toks[i];
    if (w === "point" || w === "dot") {
      let ds = ""; i++;
      while (i < toks.length && (NUMW[toks[i]] != null && NUMW[toks[i]] < 10 && toks[i] !== "a" && toks[i] !== "an" || /^\d+$/.test(toks[i]))) { ds += /^\d+$/.test(toks[i]) ? toks[i] : NUMW[toks[i]]; i++; }
      if (out.length && /^\d+$/.test(out[out.length - 1])) out[out.length - 1] += "." + ds; else out.push("0." + ds);
      continue;
    }
    if (NUMW[w] != null && !((w === "a" || w === "an") && !(DENW[toks[i + 1]] || toks[i + 1] === "hundred" || toks[i + 1] === "thousand"))) {
      let total = 0, cur = 0, used = false;
      while (i < toks.length) {
        w = toks[i];
        if (NUMW[w] != null && !(used && (w === "a" || w === "an"))) { cur += NUMW[w]; used = true; i++; }
        else if (w === "hundred" && used) { cur *= 100; i++; }
        else if (w === "thousand" && used) { total += cur * 1000; cur = 0; i++; }
        else if (w === "million" && used) { total += cur * 1000000; cur = 0; i++; }
        else if (w === "and" && used && toks[i + 1] && NUMW[toks[i + 1]] != null && NUMW[toks[i + 1]] < 100 && !DENW[toks[i + 2]] && toks[i - 1] === "hundred") { i++; }
        else break;
      }
      out.push(String(total + cur)); continue;
    }
    out.push(w); i++;
  }
  return out.join(" ");
}
function parseSpoken(text, q) {
  let t = " " + String(text || "").toLowerCase().replace(/[,]/g, "").replace(/-/g, " ") + " ";
  if (q.kind === "choice") {
    const opts = q.choices.map(c => stripTags(c).toLowerCase());
    for (let i = 0; i < opts.length; i++) { const key = opts[i].replace(/^(a|an|the)\s+/, ""); if (key && t.includes(" " + key.split(" ")[0])) return { idx: i, heard: text }; }
    for (let i = 0; i < opts.length; i++) if (opts[i].length <= 2 && t.includes(" " + opts[i] + " ")) return { idx: i, heard: text };
    return null;
  }
  t = wordsToDigits(t.trim());
  if (q.kind === "time") {
    const m = t.match(/(\d{1,2})(?::|\s|\.)?\s*(\d{2})?\s*(a\.?\s?m\.?|p\.?\s?m\.?)?/);
    if (!m) return null;
    let h = m[1], mm = m[2] || "00"; let ap = m[3] ? (m[3][0] === "a" ? "a.m." : "p.m.") : "";
    if (q.fmt === "12" && !ap && t.includes("afternoon")) ap = "p.m.";
    return { h, m: mm, ap, heard: text };
  }
  // numbers / fractions
  t = t.replace(/\b(percent|per cent|dollars?|cm|centimetres?|centimeters?|metres?|meters?|m|cubic|square|grams?|g|kg|kilograms?|litres?|liters?|ml|seconds?|minutes?|mins?|hours?|degrees?|km|per|h|s|is|it's|the|answer|equals)\b/g, " ");
  t = t.replace(/(\d+)\s+(?:over|out of|divided by)\s+(\d+)/g, "$1/$2");
  t = t.replace(/(\d+)\s+(halves|half|thirds?|quarters?|fourths?|fifths?|sixths?|sevenths?|eighths?|ninths?|tenths?|elevenths?|twelfths?|fifteenths?|sixteenths?|twentieths?|hundredths?)\b/g, (_, n, w) => n + "/" + DENW[w]);
  t = t.replace(/\b(a|an)\s+(half|third|quarter|fourth|fifth|sixth|seventh|eighth|ninth|tenth|twelfth)\b/g, (_, a, w) => "1/" + DENW[w]);
  t = t.replace(/\s+/g, " ").trim();
  let m = t.match(/(\d+)\s+(?:and\s+)?(\d+\/\d+)/) || null;
  if (m) { const [a, b] = m[2].split("/"); return { mode: "m", w: m[1], n: a, d: b, heard: text }; }
  m = t.match(/(\d+)\/(\d+)/); if (m) return { mode: "f", n: m[1], d: m[2], heard: text };
  m = t.match(/\d*\.\d+|\d+/); if (m) return { mode: "n", s: m[0], heard: text };
  return null;
}

/* ---------- shared bits for question generators ---------- */
const BL = '<span class="blank">?</span>';
const V = v => `<i class="var">${v}</i>`;
const n$ = x => decStr(D(x));                 // decimal -> display string
const VARS = ["x", "y", "A", "D", "a", "B", "m", "n", "K", "p"];
const PI314 = `(<i>π</i> = 3.14)`, PI227 = () => `(<i>π</i> = ${fH(22, 7, "22 over 7")})`;
function retry(fn, tries = 200) { for (let i = 0; i < tries; i++) { const r = fn(); if (r) return r; } throw new Error("generator gave up"); }

/* ---------- figures ---------- */
function angleSVG(th) {
  const a = th * Math.PI / 180, L = 150, cx = th > 90 ? Math.ceil(L * Math.abs(Math.cos(a))) + 26 : 30, cy = 164, W = cx + 205;
  const x = cx + L * Math.cos(a), y = cy - L * Math.sin(a), ax = cx + 26 * Math.cos(a), ay = cy - 26 * Math.sin(a);
  const lx = cx + 50 * Math.cos(a / 2), ly = cy - 50 * Math.sin(a / 2) + 6;
  return `<svg class="qfig" viewBox="0 0 ${W} 190" aria-hidden="true"><g fill="none" stroke="#2B2140" stroke-width="3" stroke-linecap="round">
<line x1="${cx}" y1="${cy}" x2="${cx + 175}" y2="${cy}"/><line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>
<path d="M${cx + 26} ${cy} A26 26 0 0 0 ${ax.toFixed(1)} ${ay.toFixed(1)}" stroke="#E8443A"/></g>
<text x="${(lx - (th > 120 ? 14 : 0)).toFixed(0)}" y="${ly.toFixed(0)}" font-size="17" font-weight="800" fill="#E8443A">${th}°</text>
<text x="${cx - 6}" y="${cy + 22}" font-size="16" font-weight="800" fill="#2B2140">B</text><text x="${cx + 180}" y="${cy + 6}" font-size="16" font-weight="800" fill="#2B2140">A</text>
<text x="${(x + (th > 90 ? -16 : 6)).toFixed(0)}" y="${(y + 4).toFixed(0)}" font-size="16" font-weight="800" fill="#2B2140">C</text></svg>`;
}
function clockSVG(h) {
  const ticks = Array.from({ length: 12 }, (_, i) => { const a = i * 30 * Math.PI / 180; return `<line x1="${60 + 44 * Math.sin(a)}" y1="${60 - 44 * Math.cos(a)}" x2="${60 + 50 * Math.sin(a)}" y2="${60 - 50 * Math.cos(a)}"/>`; }).join("");
  const ha = h * 30 * Math.PI / 180;
  return `<svg class="qfig" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="#fff" stroke="#2B2140" stroke-width="4"/><g stroke="#2B2140" stroke-width="3" stroke-linecap="round">${ticks}
<line x1="60" y1="60" x2="60" y2="16" stroke-width="3.5"/><line x1="60" y1="60" x2="${(60 + 30 * Math.sin(ha)).toFixed(1)}" y2="${(60 - 30 * Math.cos(ha)).toFixed(1)}" stroke-width="5.5"/></g><circle cx="60" cy="60" r="4" fill="#E8443A"/></svg>`;
}
function polySVG(kind) {
  const reg = (n, rot = -90) => Array.from({ length: n }, (_, i) => { const a = (rot + i * 360 / n) * Math.PI / 180; return [60 + 46 * Math.cos(a), 62 + 46 * Math.sin(a)]; });
  const P = { "equilateral triangle": reg(3), square: reg(4, -45), "regular pentagon": reg(5), "regular hexagon": reg(6), "regular octagon": reg(8, -67.5), rectangle: [[14, 34], [106, 34], [106, 90], [14, 90]], "isosceles triangle": [[60, 14], [92, 104], [28, 104]], rhombus: [[60, 10], [100, 62], [60, 114], [20, 62]], parallelogram: [[34, 30], [110, 30], [86, 94], [10, 94]], kite: [[60, 10], [92, 46], [60, 112], [28, 46]] }[kind];
  return `<svg class="qfig" viewBox="0 0 120 120" aria-hidden="true"><polygon points="${P.map(p => p.map(v => v.toFixed(1)).join(",")).join(" ")}" fill="#FFF6D6" stroke="#2B2140" stroke-width="4" stroke-linejoin="round"/></svg>`;
}

export {
  ri, pick, chance, shuffle, esc, gcd, R, D, qa, qs, qm, qd, qeq, qcmp, qval, qint, F, MX, pctR, isTerm, dpOf, decStr, roundR,
  fH, frH, impH, nH, money, plainNum, t24, t12, two, NB,
  parseNumText, parseEntry, entryText, stripTags, checkAnswer, FORM_MSG, ansHTML, ansEntry, speakify, parseSpoken,
  BL, V, n$, PI314, PI227, retry, angleSVG, clockSVG, polySVG,
};
