// =============================================================
//  Maths Island · question library
//  Exact fraction arithmetic (no floating-point errors), number formatting (stacked fractions),
//  answer parsing + checking, spoken-answer parsing, and every topic with its question generators.
//  All content is English (the interview is in English).
//  Topics follow Gavin's 8 P6 Mental papers: Pages 1–5 = core, Pages 6–8 = challenge (pro).
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
  return (q.pre || "") + core + (q.unit ? NB + q.unit : "");
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

/* =========================================================
   TOPICS · Core (worksheet pages 1–5)
   Every generator returns a fresh question with new numbers:
   { html, kind:'num'|'choice'|'order'|'time', ans|choices+correct|items|t,
     form:'any'|'frac'|'dec'|'dpN', unit, pre, hints:[..], steps:[..] }
   ========================================================= */
const BL = '<span class="blank">?</span>';
const V = v => `<i class="var">${v}</i>`;
const n$ = x => decStr(D(x));                 // decimal -> display string
const VARS = ["x", "y", "A", "D", "a", "B", "m", "n", "K", "p"];
const PI314 = `(<i>π</i> = 3.14)`, PI227 = () => `(<i>π</i> = ${fH(22, 7, "22 over 7")})`;
function retry(fn, tries = 200) { for (let i = 0; i < tries; i++) { const r = fn(); if (r) return r; } throw new Error("generator gave up"); }

const T_CORE = [];

/* ---------- 1. Order of operations ---------- */
T_CORE.push({
  id: "ops", lv: "core", pal: ["owl", "Ollie the Order Owl"], en: "Order of Operations", zh: "運算次序與巧算", color: "#FFC93C",
  src: "P1 Q1 · P2 Q1, Q5 · P3 Q3, Q5, Q10a",
  notes: [
    "<b>Brackets first</b>, then <b>× and ÷</b>, then <b>+ and −</b>.",
    "× and ÷ are the same level → work <b>left to right</b>. Same for + and −.",
    "Trap: in 0.5 ÷ 0.01 × 0.1 do the ÷ first (left to right), <u>not</u> 0.01 × 0.1.",
    "Friendly pairs: 125 × 8 = 1000 · 25 × 4 = 100 · 0.25 × 0.4 = 0.1 · 2.5 × 4 = 10. Swap the order to use them."
  ],
  ex: { q: "35 + 55 × 4", steps: ["× first: 55 × 4 = 220", "35 + 220 = <b>255</b>"] },
  gens: [
    { k: "addmul", label: "+ − with × ÷", f() {
      const v = ri(0, 3);
      if (v === 0) { const a = ri(12, 99), b = ri(11, 99), c = ri(2, 9), p = b * c;
        return { html: `${a} + ${b} × ${c}`, ans: R(a + p), hints: ["× and ÷ come before + and −.", `Do ${b} × ${c} first.`], steps: [`× first: ${b} × ${c} = ${p}`, `${a} + ${p} = <b>${a + p}</b>`] }; }
      if (v === 1) { const b = ri(3, 9), c = ri(11, 40), p = b * c, a = p + ri(5, 150);
        return { html: `${a} − ${b} × ${c}`, ans: R(a - p), hints: ["× before −.", `Work out ${b} × ${c} first.`], steps: [`× first: ${b} × ${c} = ${p}`, `${a} − ${p} = <b>${a - p}</b>`] }; }
      if (v === 2) { const c = ri(2, 9), q = ri(4, 30), b = q * c, a = ri(10, 99);
        return { html: `${a} + ${b} ÷ ${c}`, ans: R(a + q), hints: ["÷ before +.", `Work out ${b} ÷ ${c} first.`], steps: [`÷ first: ${b} ÷ ${c} = ${q}`, `${a} + ${q} = <b>${a + q}</b>`] }; }
      const a = ri(3, 9), b = ri(12, 30), c = ri(2, 9), d = ri(2, 9), p = a * b, q = c * d, base = p + ri(5, 60), ans = base - p + q;
      return { html: `${base} − ${a} × ${b} + ${c} × ${d}`, ans: R(ans), hints: ["Do both × first.", `Work out ${a} × ${b} and ${c} × ${d}, then − and + from left to right.`], steps: [`× first: ${a} × ${b} = ${p},  ${c} × ${d} = ${q}`, `${base} − ${p} + ${q} = <b>${ans}</b>`] };
    } },
    { k: "decmul", label: "a − b × c (decimals)", f() {
      const pairs = [[0.25, 0.4], [0.5, 0.2], [0.25, 0.8], [0.125, 0.8], [1.25, 0.8], [2.5, 0.4], [0.25, 4], [0.75, 0.4], [0.5, 0.6], [0.4, 0.5], [0.04, 25]];
      const [b, c] = pick(pairs), p = qm(b, c);
      const a = chance(0.6) ? D(ri(2, 12)) : D(ri(21, 99) / 10);
      const plus = chance(0.35) || qcmp(a, p) <= 0;
      const ans = plus ? qa(a, p) : qs(a, p), op = plus ? "+" : "−";
      return { html: `${n$(a)} ${op} ${n$(b)} × ${n$(c)}`, ans, hints: [`× comes before ${op}.`, `${n$(b)} × ${n$(c)} is a friendly pair!`], steps: [`× first: ${n$(b)} × ${n$(c)} = ${n$(p)}`, `${n$(a)} ${op} ${n$(p)} = <b>${n$(ans)}</b>`] };
    } },
    { k: "divmul", label: "a ÷ b × c (left to right)", f() {
      return retry(() => {
        const a = D(pick([0.5, 0.2, 0.3, 0.4, 0.6, 0.8, 1.2, 1.5, 2.4, 0.05, 3, 6, 0.9])), b = D(pick([0.1, 0.01, 0.5, 0.2, 0.25, 0.05])), c = D(pick([0.1, 0.01, 10, 2, 4, 0.5]));
        const s1 = qd(a, b), ans = qm(s1, c);
        if (dpOf(ans) > 3 || qval(ans) > 5000 || qval(ans) < 0.01) return null;
        return { html: `${n$(a)} ÷ ${n$(b)} × ${n$(c)}`, ans, hints: ["× and ÷ are the same level — go from LEFT to RIGHT.", `Do ${n$(a)} ÷ ${n$(b)} first (don't start with ${n$(b)} × ${n$(c)}!).`],
          steps: [`Left to right: ${n$(a)} ÷ ${n$(b)} = ${n$(s1)}`, `${n$(s1)} × ${n$(c)} = <b>${n$(ans)}</b>`] };
      });
    } },
    { k: "bracket", label: "a ÷ (b × c)", f() {
      const pairs = [[0.25, 0.4], [0.5, 0.2], [0.125, 0.8], [0.25, 0.04], [0.05, 0.2], [2.5, 0.4], [1.25, 0.8], [0.25, 0.8], [0.5, 0.4], [0.25, 2], [0.125, 4]];
      const [b, c] = pick(pairs), p = qm(b, c), a = ri(2, 99), ans = qd(a, p);
      return { html: `${a} ÷ (${n$(b)} × ${n$(c)})`, ans, hints: ["Brackets first!", `${n$(b)} × ${n$(c)} = ${n$(p)}. Then ${a} ÷ ${n$(p)}.`], steps: [`Brackets: ${n$(b)} × ${n$(c)} = ${n$(p)}`, `${a} ÷ ${n$(p)} = <b>${n$(ans)}</b>`] };
    } },
    { k: "addsub", label: "a − b + c (decimals)", f() {
      const B = ri(101, 899), C = ri(101, 899);
      let A;
      if (chance(0.6)) { const T = ri(Math.ceil(C / 100) + 1, 12) * 100; A = T + B - C; } else A = B + ri(50, 600);
      if (A <= B) A = B + ri(50, 300);
      const s1 = A - B, ans = R(s1 + C, 100);
      return { html: `${n$(R(A, 100))} − ${n$(R(B, 100))} + ${n$(R(C, 100))}`, ans, hints: ["Only + and −: go from left to right.", "Line up the decimal points when you subtract."],
        steps: [`${n$(R(A, 100))} − ${n$(R(B, 100))} = ${n$(R(s1, 100))}`, `${n$(R(s1, 100))} + ${n$(R(C, 100))} = <b>${n$(ans)}</b>`] };
    } },
    { k: "smart", label: "Friendly pairs (125 × k × 8)", f() {
      const pairs = [[125, 8], [25, 4], [5, 20], [50, 2], [2.5, 4], [0.25, 4], [0.125, 8], [4, 25], [8, 125], [20, 5]];
      const [a, b] = pick(pairs), p = qm(a, b); let k; do { k = ri(3, 19); } while (k % 10 === 0);
      const ans = qm(p, k);
      return { html: `${n$(a)} × ${k} × ${n$(b)}`, ans, hints: ["You can multiply in any order!", `Swap: ${n$(a)} × ${n$(b)} = ${n$(p)} first.`], steps: [`${n$(a)} × ${n$(b)} = ${n$(p)}`, `${n$(p)} × ${k} = <b>${n$(ans)}</b>`] };
    } }
  ]
});

/* ---------- 2. Decimals × ÷ ---------- */
T_CORE.push({
  id: "dec", lv: "core", pal: ["dolphin", "Dot the Decimal Dolphin"], en: "Decimals × ÷ 0.1 & 0.01", zh: "小數乘除", color: "#5BC8FF",
  src: "P1 Q2–Q4 · P2 Q4 · P3 Q2, Q6",
  notes: [
    "<b>+ / −</b>: line up the decimal points (48.5 = 48.50).",
    "<b>× 0.1</b> → point moves 1 place <b>left</b>. <b>× 0.01</b> → 2 places left.",
    "<b>÷ 0.1</b> → point moves 1 place <b>right</b> (same as × 10). <b>÷ 0.01</b> = × 100.",
    "Dividing by 0.03? Make the divisor whole: multiply <u>both</u> numbers by 100. 60 ÷ 0.03 = 6000 ÷ 3 = 2000."
  ],
  ex: { q: "89.4 ÷ 0.1", steps: ["÷ 0.1 is the same as × 10", "89.4 × 10 = <b>894</b>"] },
  gens: [
    { k: "addalign", label: "Add / subtract decimals", f() {
      const a = R(ri(101, 999), 10), b = R(ri(101, 999), 100);
      const minus = chance(0.4) && qcmp(a, b) > 0, ans = minus ? qs(a, b) : qa(a, b), op = minus ? "−" : "+";
      return { html: `${n$(a)} ${op} ${n$(b)}`, ans, hints: ["Line up the decimal points.", `Write ${n$(a)} as ${decStr(a, 2)}.`], steps: [`${decStr(a, 2)} ${op} ${n$(b)}`, `= <b>${n$(ans)}</b>`] };
    } },
    { k: "mulpow", label: "× 0.1 / 0.01 / 0.001", f() {
      const x = R(ri(1001, 9999), pick([10, 100])), k = pick([1, 2, 2, 3]), m = R(1, Math.pow(10, k)), ans = qm(x, m);
      return { html: `${n$(x)} × ${n$(m)}`, ans, hints: [`× ${n$(m)} is the same as ÷ ${Math.pow(10, k)}.`, `Move the decimal point ${k} place${k > 1 ? "s" : ""} to the LEFT.`], steps: [`× ${n$(m)} → point moves ${k} place${k > 1 ? "s" : ""} left`, `${n$(x)} → <b>${n$(ans)}</b>`] };
    } },
    { k: "divpow", label: "÷ 0.1 / 0.01 / 0.001", f() {
      const x = R(ri(11, 999), pick([10, 100])), k = pick([1, 1, 2, 3]), m = R(1, Math.pow(10, k)), ans = qd(x, m);
      return { html: `${n$(x)} ÷ ${n$(m)}`, ans, hints: [`÷ ${n$(m)} is the same as × ${Math.pow(10, k)}.`, `Move the decimal point ${k} place${k > 1 ? "s" : ""} to the RIGHT.`], steps: [`÷ ${n$(m)} = × ${Math.pow(10, k)} → point moves ${k} right`, `${n$(x)} → <b>${n$(ans)}</b>`] };
    } },
    { k: "divsmall", label: "÷ 0.03 type", f() {
      const k = ri(2, 9), places = pick([1, 2, 2, 3]), d = R(k, Math.pow(10, places)), m = ri(2, 30) * pick([1, 1, 10]), nn = k * m, ans = qd(nn, d);
      const P = Math.pow(10, places);
      return { html: `${nn} ÷ ${n$(d)}`, ans, hints: ["Make the divisor a whole number.", `Multiply both numbers by ${P}: ${nn * P} ÷ ${k}.`], steps: [`× ${P} on both: ${nn} ÷ ${n$(d)} = ${grp(String(nn * P))} ÷ ${k}`, `= <b>${n$(ans)}</b>`] };
    } },
    { k: "missing", label: "Missing divisor", f() {
      if (chance(0.5)) { // 63.63 ÷ ? = 2121 pattern
        const k = pick([2, 3, 4]); let p; do { p = k * ri(Math.ceil(10 / 1), 33); } while (p < 10 * k || p > 99 || p % k);
        const X = D(`${p}.${String(p).padStart(2, "0")}`), Y = R((p / k) * 101), ans = qd(X, Y);
        return { html: `${n$(X)} ÷ ${BL} = ${n$(Y)}`, ans, hints: [`If ${n$(X)} ÷ ? = ${n$(Y)}, then ? = ${n$(X)} ÷ ${n$(Y)}.`, `Look at the digits: ${p} ÷ ${p / k} = ${k}. Now fix the decimal point.`], steps: [`? = ${n$(X)} ÷ ${n$(Y)}`, `${p} ÷ ${p / k} = ${k}, and ${n$(X)} is much smaller than ${n$(Y)}`, `? = <b>${n$(ans)}</b>  (check: ${n$(X)} ÷ ${n$(ans)} = ${n$(Y)})`] };
      }
      const d = D(pick([0.02, 0.03, 0.04, 0.05, 0.3, 0.2, 0.004, 0.06, 0.5])), Y = ri(12, 900), X = qm(Y, d);
      if (chance(0.5)) return { html: `${n$(X)} ÷ ${BL} = ${Y}`, ans: d, hints: [`? = ${n$(X)} ÷ ${Y}.`, "The answer is smaller than 1."], steps: [`? = ${n$(X)} ÷ ${Y}`, `= <b>${n$(d)}</b>  (check: ${n$(X)} ÷ ${n$(d)} = ${Y})`] };
      return { html: `${BL} ÷ ${n$(d)} = ${Y}`, ans: X, hints: ["Undo the ÷ by multiplying.", `? = ${Y} × ${n$(d)}.`], steps: [`? = ${Y} × ${n$(d)}`, `= <b>${n$(X)}</b>`] };
    } },
    { k: "ratio", label: "0.7/7 = ?/0.7", f() {
      const x = D(pick([0.7, 0.3, 0.9, 0.4, 0.6, 0.8, 0.5, 0.2])), v = ri(0, 2);
      let b, ans, why;
      if (v === 0) { b = qm(x, 10); ans = qd(x, 10); why = `The left side is ${n$(x)} ÷ ${n$(b)} = 0.1, so ? = 0.1 × ${n$(x)}`; }
      else if (v === 1) { b = qd(x, 10); ans = qm(x, 10); why = `The left side is ${n$(x)} ÷ ${n$(b)} = 10, so ? = 10 × ${n$(x)}`; }
      else { b = qm(x, 100); ans = qd(x, 100); why = `The left side is ${n$(x)} ÷ ${n$(b)} = 0.01, so ? = 0.01 × ${n$(x)}`; }
      return { html: `${fH(n$(x), n$(b), n$(x) + " over " + n$(b))} = ${fH(BL, n$(x), "what over " + n$(x))}`, ans, hints: ["Work out the left fraction as a number first.", "The right fraction must be equal to it."], steps: [why, `? = <b>${n$(ans)}</b>`] };
    } }
  ]
});

/* ---------- 3. Converting ---------- */
T_CORE.push({
  id: "convert", lv: "core", pal: ["lizard", "Cammy the Chameleon"], en: "Fraction ⇄ Decimal ⇄ %", zh: "分數・小數・百分數互換", color: "#45D08A",
  src: "P1 Q10 · P2 Q9 · P4 Q6, Q10b",
  notes: [
    "Decimal → fraction: read the place value. 0.375 = 375/1000 = 3/8. Always <b>simplify</b>.",
    "Fraction → decimal: make the denominator 10, 100 or 1000 (3/5 = 6/10 = 0.6) or divide.",
    "% → decimal: ÷ 100 (point moves 2 left). 0.5% = 0.005.",
    "% → fraction: put it over 100 and simplify. 2 6/7 % = 20/7 ÷ 100 = 1/35.",
    "Rounding: look at the next digit — 5 or more rounds up. 1.967 to the nearest tenth is <b>2.0</b> (keep the 0!)."
  ],
  ex: { q: "Change 2 1/8 to a decimal.", steps: ["1/8 = 125/1000 = 0.125", "2 1/8 = <b>2.125</b>"] },
  gens: [
    { k: "dec2frac", label: "Decimal → fraction", f() {
      const fr = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [1, 20], [3, 20], [7, 20], [9, 20], [1, 25], [2, 25], [3, 10], [7, 10], [9, 10], [1, 50], [3, 50]]);
      const w = chance(0.5) ? ri(1, 12) : 0, ans = qa(w, F(fr[0], fr[1])), dp = dpOf(ans), P = Math.pow(10, dp);
      const raw = R(fr[0] * P / fr[1], 1).n;
      return { html: `Change ${n$(ans)} to a fraction.`, ans, form: "frac", hints: [`${n$(ans)} has ${dp} decimal place${dp > 1 ? "s" : ""}, so put it over ${P}.`, "Then simplify the fraction."],
        steps: [`${n$(ans)} = ${w ? w + " + " : ""}${fH(raw, P)}`, `= <b>${frH(ans)}</b>${w ? `  (or ${impH(ans)})` : ""}`] };
    } },
    { k: "frac2dec", label: "Fraction → decimal", f() {
      const fr = pick([[3, 5], [7, 20], [5, 8], [9, 25], [3, 4], [7, 8], [1, 8], [11, 20], [13, 25], [1, 4], [2, 5], [3, 8], [1, 16], [17, 50]]);
      const w = chance(0.5) ? ri(1, 9) : 0, f = F(fr[0], fr[1]), ans = qa(w, f);
      const dp = dpOf(f), P = Math.pow(10, dp), top = f.n * P / f.d;
      return { html: `Change ${frH(ans)} to a decimal.`, ans, form: "dec", hints: [`Make the denominator ${P}: multiply top and bottom by ${P / fr[1]}.`, `${fH(fr[0], fr[1])} = ${fH(top, P)}.`],
        steps: [`${fH(fr[0], fr[1])} = ${fH(top, P)} = ${n$(f)}`, `${w ? w + " + " + n$(f) + " = " : ""}<b>${n$(ans)}</b>`] };
    } },
    { k: "pct2dec", label: "% ⇄ decimal", f() {
      if (chance(0.65)) {
        const p = D(pick([0.5, 12.5, 7, 120, 0.25, 3.5, 45, 250, 0.8, 104, 62.5, 2.5, 0.1])), ans = qd(p, 100);
        return { html: `Change ${n$(p)}% to a decimal.`, ans, form: "dec", hints: ["% means “out of 100”, so ÷ 100.", "Move the decimal point 2 places to the left."], steps: [`${n$(p)}% = ${n$(p)} ÷ 100`, `= <b>${n$(ans)}</b>`] };
      }
      const x = D(pick([0.035, 1.2, 0.07, 0.625, 2.5, 0.008, 0.45, 1.05])), ans = qm(x, 100);
      return { html: `Change ${n$(x)} to a percentage.`, ans, unit: "%", hints: ["To make a percentage, × 100.", "Move the decimal point 2 places to the right."], steps: [`${n$(x)} × 100% = <b>${n$(ans)}%</b>`] };
    } },
    { k: "pct2frac", label: "% → fraction (simplest)", f() {
      if (chance(0.25)) {
        const [p, a, b] = pick([[45, 9, 20], [64, 16, 25], [15, 3, 20], [125, 5, 4], [36, 9, 25], [85, 17, 20], [8, 2, 25], [175, 7, 4]]), ans = F(a, b);
        return { html: `Change ${p}% to a fraction in its simplest form.`, ans, form: "frac", hints: [`${p}% = ${fH(p, 100)}.`, "Divide top and bottom by the same number until you can't any more."], steps: [`${p}% = ${fH(p, 100)}`, `= <b>${frH(ans)}</b>`] };
      }
      const [a, b] = pick([[1, 35], [1, 3], [2, 3], [1, 6], [1, 8], [3, 8], [1, 12], [1, 16], [1, 15], [1, 30], [3, 40], [1, 40], [5, 6], [7, 8], [1, 24], [5, 8]]);
      const ans = F(a, b), p = qm(ans, 100);
      return { html: `Change ${frH(p)}% to a fraction in its simplest form.`, ans, form: "frac", hints: [`First change ${frH(p)} into an improper fraction: ${impH(p)}.`, `${frH(p)}% = ${impH(p)} ÷ 100 = ${impH(p)} × ${fH(1, 100)}.`],
        steps: [`${frH(p)}% = ${impH(p)} ÷ 100`, `= ${impH(p)} × ${fH(1, 100)} = ${fH(p.n, p.d * 100)}`, `= <b>${frH(ans)}</b>`] };
    } },
    { k: "round", label: "Rounding off", f() {
      const k = pick([0, 1, 1, 2]), w = ri(0, 20);
      const digs = [ri(0, 9), ri(0, 9), ri(0, 9)];
      if (chance(0.5)) { if (k === 0) digs[0] = ri(5, 9); if (k === 1) { digs[0] = 9; digs[1] = ri(5, 9); } if (k === 2) { digs[1] = 9; digs[2] = ri(5, 9); } }
      if (digs.every(d => d === 0)) digs[2] = 4;
      const x = D(`${w}.${digs.join("")}`), ans = roundR(x, k);
      const what = ["the nearest whole number", "the nearest tenth", "the nearest hundredth"][k], alt = ["the nearest whole number", "1 decimal place", "2 decimal places"][k];
      const nxt = digs[k], up = nxt >= 5;
      return { html: chance(0.5) ? `Round off ${n$(x)} to ${what}.` : `Correct ${n$(x)} to ${alt}.`, ans, form: "dp" + k,
        hints: [`Look at the digit just after the ${["ones", "tenths", "hundredths"][k]} place.`, "5 or more → round up. 4 or less → keep it. Keep any 0 at the end!"],
        steps: [`The next digit is ${nxt} → ${up ? "5 or more, round UP" : "4 or less, keep"}`, `${n$(x)} ≈ <b>${decStr(ans, k)}</b>`] };
    } }
  ]
});

/* ---------- 4. Compare & order ---------- */
T_CORE.push({
  id: "compare", lv: "core", pal: ["crocodile", "Chomp the Greedy Croc"], en: "Compare & Order", zh: "比較大小與排序", color: "#FF7EB3",
  src: "P2 Q7 · P4 Q1, Q7",
  notes: [
    "To compare fractions, decimals and %, change them <b>all into decimals</b>.",
    "Ascending = smallest → largest, written with <b>&lt;</b>. Descending = largest → smallest, with <b>&gt;</b>.",
    "Watch the close ones: 0.52 vs 1/2 = 0.50.",
    "Fraction of a group: part ÷ whole, then simplify."
  ],
  ex: { q: "Arrange 7/30, 0.52, 1/2 in ascending order.", steps: ["7/30 ≈ 0.23,  1/2 = 0.5,  0.52", "<b>7/30 &lt; 1/2 &lt; 0.52</b>"] },
  gens: [
    { k: "order3", label: "Arrange with signs", f() {
      return retry(() => {
        const dens = [3, 4, 5, 6, 7, 8, 9, 12, 15, 20, 25, 30];
        const b1 = pick(dens), a1 = ri(1, b1 - 1); if (gcd(a1, b1) !== 1) return null;
        const b2 = pick(dens), a2 = ri(1, b2 - 1); if (gcd(a2, b2) !== 1 || b2 === b1) return null;
        const f1 = F(a1, b1), f2 = F(a2, b2);
        const dv = qa(f2, R(pick([-4, -3, -2, -1, 1, 2, 3, 4]), 100)); const dd = roundR(dv, 2);
        if (qval(dd) <= 0.05 || qval(dd) >= 0.98) return null;
        const vals = [f1, f2, dd];
        for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (Math.abs(qval(vals[i]) - qval(vals[j])) < 0.004) return null;
        if (Math.abs(qval(f1) - qval(f2)) > 0.35) return null;
        const usePct = chance(0.3);
        const items = shuffle([
          { html: fH(a1, b1), txt: `${a1}/${b1}`, v: f1 },
          usePct ? { html: `${n$(qm(dd, 100))}%`, txt: `${n$(qm(dd, 100))}%`, v: dd } : { html: n$(dd), txt: n$(dd), v: dd },
          { html: fH(a2, b2), txt: `${a2}/${b2}`, v: f2 }]);
        const dir = chance(0.8) ? "asc" : "desc";
        return { kind: "order", items, dir, html: `Arrange ${items.map(i => i.html).join(" , ")} in ${dir === "asc" ? "ascending" : "descending"} order with proper signs.`,
          hints: ["Change every number into a decimal.", dir === "asc" ? "Ascending: smallest first, use “<”." : "Descending: largest first, use “>”."],
          steps: [items.map(i => `${i.html} = ${isTerm(i.v) && dpOf(i.v) <= 3 ? n$(i.v) : "≈ " + decStr(roundR(i.v, 3), 3)}`).join(",  "), "<b>" + ansHTML({ kind: "order", items, dir }) + "</b>"] };
      });
    } },
    { k: "largest", label: "Which is largest / smallest?", f() {
      return retry(() => {
        const w = ri(1, 3), a = ri(1, 9), b = ri(10, 95), d = pick([12, 8, 6, 9, 7, 11]), c = ri(1, d - 1);
        if (gcd(c, d) !== 1) return null;
        const v1 = R(10 * w + a, 10), v2 = R(100 * w + b, 100), v3 = MX(w, c, d);
        const vs = [v1, v2, v3].map(qval);
        for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (Math.abs(vs[i] - vs[j]) < 0.006) return null;
        if (Math.max(...vs) - Math.min(...vs) > 0.4) return null;
        const big = chance(0.75);
        const opts = shuffle([{ h: fH(10 * w + a, 10), v: vs[0], s: n$(v1) }, { h: `${100 * w + b}%`, v: vs[1], s: n$(v2) }, { h: frH(v3), v: vs[2], s: "≈ " + decStr(roundR(v3, 3), 3) }]);
        const target = big ? Math.max(...vs) : Math.min(...vs), correct = opts.findIndex(o => o.v === target);
        return { kind: "choice", html: `Which is the ${big ? "largest" : "smallest"}?&ensp; ${opts.map(o => o.h).join(" ,&ensp; ")}`, choices: opts.map(o => o.h), correct,
          hints: ["Change all three into decimals.", "Compare the tenths first, then the hundredths."], steps: [opts.map(o => `${o.h} = ${o.s}`).join(",  "), `The ${big ? "largest" : "smallest"} is <b>${opts[correct].h}</b>`] };
      });
    } },
    { k: "fracof", label: "Fraction of a group", f() {
      const sets = [["rulers", "pencils", "erasers", "a box", "stationery"], ["red balls", "blue balls", "green balls", "a bag", "balls"], ["apples", "oranges", "pears", "a basket", "fruit"], ["cats", "dogs", "rabbits", "a pet shop", "animals"]];
      const [x, y, z, where, what] = pick(sets);
      return retry(() => {
        const g = pick([2, 3, 4, 5]), cs = [ri(1, 8), ri(1, 8), ri(1, 8)].map(v => v * g);
        if (new Set(cs).size < 3) return null;
        const tot = cs[0] + cs[1] + cs[2], i = ri(0, 2), not = chance(0.25), part = not ? tot - cs[i] : cs[i];
        const ans = F(part, tot); if (ans.d === tot) return null;
        const nm = [x, y, z][i], word = what === "fruit" || what === "stationery" ? what : "the " + what;
        return { html: `There were ${cs[0]} ${x}, ${cs[1]} ${y} and ${cs[2]} ${z} in ${where}. What fraction of ${word} ${not ? "were <b>not</b>" : "were"} ${nm}?`, ans, form: "frac",
          hints: [`Total = ${cs[0]} + ${cs[1]} + ${cs[2]} = ${tot}.`, `Fraction = ${not ? "(not " + nm + ")" : nm} ÷ total, then simplify.`],
          steps: [`Total = ${tot}${not ? `,  not ${nm} = ${tot} − ${cs[i]} = ${part}` : ""}`, `${fH(part, tot)} = <b>${frH(ans)}</b>`] };
      });
    } }
  ]
});

/* ---------- 5. Fraction mix ---------- */
T_CORE.push({
  id: "fracmix", lv: "core", pal: ["octopus", "Octo the Fraction Mixer"], en: "Fraction Mix", zh: "分數混合計算", color: "#B49CFF",
  src: "P2 Q3 · P4 Q3, Q4",
  notes: [
    "Mixed number → improper fraction first: 4 2/5 = 22/5.",
    "÷ a whole number = × its reciprocal: 22/5 ÷ 2 = 22/5 × 1/2 = 11/5 = 2 1/5.",
    "Mixing fractions and decimals? Change the fraction into a decimal (3/4 = 0.75, 1/5 = 0.2).",
    "Brackets first — they often add up to a nice whole number!"
  ],
  ex: { q: "(0.2 + 1.6 + 1/5) × 3/4", steps: ["Brackets: 0.2 + 1.6 + 0.2 = 2", "2 × 3/4 = 6/4 = <b>1.5</b>"] },
  gens: [
    { k: "mixdiv", label: "Mixed number ÷ whole", f() {
      return retry(() => {
        const k = pick([2, 3, 4, 5]), d = pick([3, 4, 5, 7, 8, 9]), a = ri(1, 5), b = ri(1, d - 1);
        if (gcd(b, d) !== 1) return null;
        const ans = MX(a, b, d), big = qm(ans, k); if (qint(big) || big.n % big.d === 0) return null;
        if (Math.floor(big.n / big.d) < 1) return null;
        return { html: `${frH(big)} ÷ ${k}`, ans, disp: "frac", hints: [`Change ${frH(big)} into an improper fraction: ${impH(big)}.`, `÷ ${k} is the same as × ${fH(1, k)}.`],
          steps: [`${frH(big)} = ${impH(big)}`, `${impH(big)} × ${fH(1, k)} = ${impH(ans)}`, `= <b>${frH(ans)}</b>`] };
      });
    } },
    { k: "subfracdec", label: "(whole − fraction) × decimal", f() {
      const w = pick([1, 2, 3]), [a, b] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [3, 8], [5, 8]]);
      const x = D(pick([0.08, 0.04, 0.12, 0.4, 0.8, 0.24, 1.6, 0.16, 0.2, 0.6])), s = qs(w, F(a, b)), ans = qm(s, x);
      return { html: `(${w} − ${fH(a, b)}) × ${n$(x)}`, ans, hints: ["Brackets first.", `${fH(a, b)} = ${n$(F(a, b))} as a decimal.`], steps: [`${w} − ${fH(a, b)} = ${frH(s)} = ${n$(s)}`, `${n$(s)} × ${n$(x)} = <b>${n$(ans)}</b>`] };
    } },
    { k: "sumfrac", label: "(a + b + fraction) × fraction", f() {
      return retry(() => {
        const T = pick([1, 2, 2, 3, 4]), [fa, fb] = pick([[1, 5], [2, 5], [1, 4], [3, 4], [1, 2], [1, 10], [3, 10], [3, 5]]), f = F(fa, fb);
        const rest = qs(T, f); if (qval(rest) <= 0.2) return null;
        const step = dpOf(rest) <= 1 ? 10 : 100, restU = Math.round(qval(rest) * step);
        const aU = ri(1, restU - 1), bU = restU - aU; if (bU <= 0) return null;
        const a = R(aU, step), b = R(bU, step), [ma, mb] = pick([[3, 4], [1, 2], [2, 5], [3, 5], [5, 8], [1, 4], [3, 8]]), ans = qm(T, F(ma, mb));
        return { html: `(${n$(a)} + ${n$(b)} + ${fH(fa, fb)}) × ${fH(ma, mb)}`, ans, hints: ["Brackets first — change the fraction into a decimal.", `${n$(a)} + ${n$(b)} + ${n$(f)} adds up to a whole number!`],
          steps: [`${n$(a)} + ${n$(b)} + ${n$(f)} = ${T}`, `${T} × ${fH(ma, mb)} = <b>${nH(ans)}</b>`] };
      });
    } },
    { k: "mixmul", label: "Mixed number × whole", f() {
      const d = pick([3, 4, 5, 6, 8]), a = ri(1, 6), b = ri(1, d - 1), k = chance(0.6) ? d * ri(1, 2) : ri(2, 7);
      if (gcd(b, d) !== 1) return this.f();
      const ans = qm(MX(a, b, d), k), bk = qm(F(b, d), k);
      return { html: `${frH(MX(a, b, d))} × ${k}`, ans, disp: "frac", hints: [`Split it: ${a} × ${k} and ${fH(b, d)} × ${k}.`, "Add the two parts together."], steps: [`${a} × ${k} = ${a * k}`, `${fH(b, d)} × ${k} = ${frH(bk)}`, `${a * k} + ${frH(bk)} = <b>${nH(ans)}</b>`] };
    } }
  ]
});

/* ---------- 6. Equations ---------- */
T_CORE.push({
  id: "eq", lv: "core", pal: ["flamingo", "Flora the Balance Flamingo"], en: "Solve Equations", zh: "解方程", color: "#FF9F68",
  src: "P1 Q5, Q6 · P2 Q2, Q6 · P3 Q4 · P4 Q2, Q10a · P5 Q1, Q2",
  notes: [
    "An equation is a balance: do the <b>same thing to both sides</b>.",
    "Undo in reverse: undo + / − first, then undo × / ÷.",
    "4y + 2 = 10 → 4y = 8 → y = 2.",
    "Like terms: D − 1/3 D = 2/3 D.",
    "Puzzle trick: if 1/2 M = 1/6 K, let both = 1. Then M = 2 and K = 6, so K is bigger."
  ],
  ex: { q: "Solve 1/3 y − 5 = 15", steps: ["+5 both sides: 1/3 y = 20", "×3 both sides: <b>y = 60</b>"] },
  gens: [
    { k: "axb", label: "ax + b = c", f() {
      const v = pick(VARS), x = ri(2, 15), a = ri(2, 9), b = ri(1, 20), plus = chance(0.6), c = plus ? a * x + b : a * x - b;
      if (c <= 0) return this.f();
      return { html: `Solve ${a}${V(v)} ${plus ? "+" : "−"} ${b} = ${c}`, ans: R(x), pre: `${V(v)} = `, hints: [`Undo the ${plus ? "+ " + b : "− " + b} first: ${plus ? "take " + b + " away from" : "add " + b + " to"} both sides.`, `Then divide both sides by ${a}.`],
        steps: [`${a}${V(v)} = ${c} ${plus ? "−" : "+"} ${b} = ${a * x}`, `${V(v)} = ${a * x} ÷ ${a} = <b>${x}</b>`] };
    } },
    { k: "fracx", label: "1/n · y − b = c", f() {
      const v = pick(VARS), nn = pick([2, 3, 4, 5]), y = nn * ri(2, 20), b = ri(1, 15), plus = chance(0.4), c = plus ? y / nn + b : y / nn - b;
      if (c <= 0) return this.f();
      return { html: `Solve ${fH(1, nn)}${V(v)} ${plus ? "+" : "−"} ${b} = ${c}`, ans: R(y), pre: `${V(v)} = `, hints: [`First ${plus ? "subtract " + b + " from" : "add " + b + " to"} both sides.`, `${fH(1, nn)}${V(v)} means ${V(v)} ÷ ${nn}, so multiply by ${nn}.`],
        steps: [`${fH(1, nn)}${V(v)} = ${c} ${plus ? "−" : "+"} ${b} = ${y / nn}`, `${V(v)} = ${y / nn} × ${nn} = <b>${y}</b>`] };
    } },
    { k: "mixedeq", label: "aD − mixed = mixed", f() {
      return retry(() => {
        const v = pick(VARS), Dv = ri(2, 12), a = ri(2, 5), [fn, fd] = pick([[1, 2], [1, 2], [1, 4], [3, 4], [1, 3], [2, 3]]);
        const p = MX(ri(1, 8), fn, fd), q = qs(a * Dv, p); if (qval(q) <= 1) return null;
        return { html: `Solve ${a}${V(v)} − ${frH(p)} = ${frH(q)}`, ans: R(Dv), pre: `${V(v)} = `, hints: [`Add ${frH(p)} to both sides.`, `${frH(q)} + ${frH(p)} is a whole number!`],
          steps: [`${a}${V(v)} = ${frH(q)} + ${frH(p)} = ${a * Dv}`, `${V(v)} = ${a * Dv} ÷ ${a} = <b>${Dv}</b>`] };
      });
    } },
    { k: "like", label: "D − 1/3 D = c", f() {
      const v = pick(VARS), nn = pick([2, 3, 4, 5]), Dv = nn * ri(1, 10), minus = chance(0.7);
      const coef = minus ? F(nn - 1, nn) : F(nn + 1, nn), c = qm(coef, Dv);
      return { html: `Solve ${V(v)} ${minus ? "−" : "+"} ${fH(1, nn)}${V(v)} = ${nH(c)}`, ans: R(Dv), pre: `${V(v)} = `, hints: [`Combine: ${V(v)} ${minus ? "−" : "+"} ${fH(1, nn)}${V(v)} = ${frH(coef)}${V(v)}.`, `Then ${nH(c)} ÷ ${frH(coef)} = ${nH(c)} × ${impH(R(coef.d, coef.n))}.`],
        steps: [`${V(v)} ${minus ? "−" : "+"} ${fH(1, nn)}${V(v)} = ${frH(coef)}${V(v)} = ${nH(c)}`, `${V(v)} = ${nH(c)} ÷ ${impH(coef)} = <b>${Dv}</b>`] };
    } },
    { k: "deceq", label: "Equations with decimals", f() {
      const v = pick(VARS);
      if (chance(0.55)) {
        const k = pick([10, 10, 3, 4, 5, 2]), y = k === 10 ? R(ri(11, 299), 100) : R(ri(11, 99), 10), b = R(ri(1, 99), 10), c = qa(b, qm(k, y));
        return { html: `Solve ${n$(b)} + ${k}${V(v)} = ${n$(c)}`, ans: y, pre: `${V(v)} = `, hints: [`Subtract ${n$(b)} from both sides.`, `Then divide by ${k}.`],
          steps: [`${k}${V(v)} = ${n$(c)} − ${n$(b)} = ${n$(qm(k, y))}`, `${V(v)} = ${n$(qm(k, y))} ÷ ${k} = <b>${n$(y)}</b>`] };
      }
      return retry(() => {
        const m = D(pick([0.15, 0.25, 0.12, 0.05, 0.4, 1.5, 0.6, 0.35])), a = ri(2, 20), b = R(ri(1, 9), 10), c = qs(qm(m, a), b);
        if (qval(c) <= 0) return null;
        return { html: `Solve ${n$(m)}${V(v)} − ${n$(b)} = ${n$(c)}`, ans: R(a), pre: `${V(v)} = `, hints: [`Add ${n$(b)} to both sides.`, `Then divide by ${n$(m)} (move the decimal points to make it easier).`],
          steps: [`${n$(m)}${V(v)} = ${n$(c)} + ${n$(b)} = ${n$(qm(m, a))}`, `${V(v)} = ${n$(qm(m, a))} ÷ ${n$(m)} = <b>${a}</b>`] };
      });
    } },
    { k: "puzzle", label: "(A + B) puzzles", f() {
      const r = pick([2, 3, 4]), sm = ri(5, 12), A = ri(1, sm - 1), B = sm - A, endA = chance(0.6), tailL = endA ? "A" : "B", tail = endA ? A : B, other = endA ? "B" : "A", tot = r * sm + tail;
      const askL = chance(0.6) ? "B" : "A", ansv = askL === "B" ? B : A;
      const lhs = Array(r).fill("(A + B)").join(" + ") + " + " + tailL;
      const st = [`${r} × ${sm} + ${tailL} = ${tot}  →  ${tailL} = ${tot} − ${r * sm} = ${tail}`];
      if (askL !== tailL) st.push(`${other} = ${sm} − ${tail} = <b>${ansv}</b>`); else st[0] = st[0].replace(/= (\d+)$/, "= <b>$1</b>");
      return { html: `Given that ${lhs} = ${tot}. If A + B = ${sm}, then ${askL} = ?`, ans: R(ansv), hints: [`Each (A + B) is ${sm}, and there are ${r} of them.`, `So ${r} × ${sm} + ${tailL} = ${tot}.`], steps: st };
    } },
    { k: "bigger", label: "Which is bigger, M or K?", f() {
      return retry(() => {
        let a, b, c, d;
        if (chance(0.6)) { a = 1; c = 1; b = pick([2, 3, 4, 5, 6, 8]); d = pick([2, 3, 4, 5, 6, 8]); if (b === d) return null; }
        else { [a, b] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 8]]); [c, d] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 8]]); if (a * d === b * c) return null; }
        const M = F(b, a), K = F(d, c), mBig = qcmp(M, K) > 0;
        return { kind: "choice", html: `${fH(a, b)}${V("M")} = ${fH(c, d)}${V("K")}. Which is bigger, M or K?`, choices: ["M", "K", "They are equal"], correct: mBig ? 0 : 1,
          hints: ["Pretend both sides are equal to 1.", `Then ${fH(a, b)}M = 1 and ${fH(c, d)}K = 1.`],
          steps: [`If both sides = 1: M = ${nH(M)}, K = ${nH(K)}`, `So <b>${mBig ? "M" : "K"}</b> is bigger. (The one multiplied by the smaller fraction must be bigger.)`] };
      });
    } }
  ]
});

/* ---------- 7. 3-D shapes & angles ---------- */
const PRISM = { 3: "triangular", 5: "pentagonal", 6: "hexagonal", 7: "heptagonal", 8: "octagonal", 9: "nonagonal", 10: "decagonal" };
T_CORE.push({
  id: "shapes", lv: "core", pal: ["bee", "Bea the Prism Bee"], en: "3-D Shapes, Circles & Angles", zh: "立體圖形・圓・角", color: "#FFD95A",
  src: "P1 Q7 · P2 Q8, Q10a · P3 Q10b · P4 Q9a · P5 Q10b",
  notes: [
    "An <b>n-sided prism</b>: faces = n + 2, vertices = 2n, edges = 3n. (Hexagonal: n = 6 → 18 edges.)",
    "Names: tri 3, pent 5, hex 6, hept 7, oct 8, non 9, dec 10.",
    "A <b>cylinder</b> has 3 faces (2 flat + 1 curved).",
    "Circle words: <b>sector</b> = area between an arc and two radii; <b>arc</b> = part of the circumference.",
    "Angles: acute &lt; 90° · right = 90° · obtuse 90°–180° · straight = 180° · reflex 180°–360° · round = 360°."
  ],
  ex: { q: "How many edges are there in a hexagonal prism?", steps: ["Hexagon: n = 6", "Edges = 3 × 6 = <b>18</b>"] },
  gens: [
    { k: "prism", label: "Faces / vertices / edges of a prism", f() {
      const nn = pick([3, 5, 6, 7, 8, 9, 10]), what = pick(["edges", "vertices", "faces"]), ans = { edges: 3 * nn, vertices: 2 * nn, faces: nn + 2 }[what];
      const why = { edges: `${nn} on top + ${nn} on the bottom + ${nn} joining them = 3 × ${nn}`, vertices: `${nn} on top + ${nn} on the bottom = 2 × ${nn}`, faces: `2 ends + ${nn} side faces = ${nn} + 2` }[what];
      return { html: `How many ${what} ${what === "edges" ? "are there in" : "does"} a${PRISM[nn][0] === "o" ? "n" : ""} ${PRISM[nn]} prism${what === "edges" ? "" : " have"}?`, ans: R(ans),
        hints: [`A ${PRISM[nn]} base has ${nn} sides.`, { edges: "Edges = 3 × sides", vertices: "Vertices = 2 × sides", faces: "Faces = sides + 2" }[what] + "."], steps: [why, `= <b>${ans}</b>`] };
    } },
    { k: "prismrev", label: "Prism working backwards", f() {
      const nn = pick([5, 6, 7, 8, 9, 10, 12]), give = pick(["edges", "faces", "vertices"]), ask = pick(["edges", "faces", "vertices"].filter(x => x !== give));
      const val = { edges: 3 * nn, vertices: 2 * nn, faces: nn + 2 };
      return { html: `A prism has ${val[give]} ${give}. How many ${ask} does it have?`, ans: R(val[ask]), hints: [`First find how many sides the base has: ${{ edges: "edges ÷ 3", vertices: "vertices ÷ 2", faces: "faces − 2" }[give]}.`, { edges: "Edges = 3 × sides", vertices: "Vertices = 2 × sides", faces: "Faces = sides + 2" }[ask] + "."],
        steps: [`Base has ${val[give]} ${{ edges: "÷ 3", vertices: "÷ 2", faces: "− 2" }[give]} = ${nn} sides`, `${ask[0].toUpperCase() + ask.slice(1)} = <b>${val[ask]}</b>`] };
    } },
    { k: "faces3", label: "Cylinder facts", f() {
      const v = ri(0, 2);
      if (v === 0) return { kind: "choice", html: "Name a 3-D shape that has 3 faces only.", choices: shuffle(["cylinder", "cone", "sphere", "cube"]), correct: -1, hints: ["Think of a can of soda.", "2 flat circles + 1 curved face."], steps: ["A cylinder has 2 flat faces + 1 curved face = 3 faces → <b>cylinder</b>"], fix: "cylinder" };
      if (v === 1) return { html: "How many faces does a cylinder have?", ans: R(3), hints: ["Count the flat faces and the curved face.", "Top, bottom and the curved side."], steps: ["2 flat faces + 1 curved face = <b>3</b>"] };
      return { kind: "choice", html: "Which 3-D shape has 2 flat faces and 1 curved face?", choices: shuffle(["cylinder", "cone", "triangular prism", "sphere"]), correct: -1, hints: ["The two flat faces are circles.", "Like a can."], steps: ["<b>Cylinder</b>"], fix: "cylinder" };
    } },
    { k: "circlewords", label: "Circle words", f() {
      const [q, a] = pick([
        ["The area enclosed by an arc and two radii is called a ___.", "sector"],
        ["The area enclosed by an arc and two radii is called a ___.", "sector"],
        ["A part of the circumference of a circle is called an ___.", "arc"],
        ["A line segment joining the centre to any point on the circle is called a ___.", "radius"],
        ["A line segment through the centre with both ends on the circle is called a ___.", "diameter"],
        ["Half of a circle is called a ___.", "semicircle"]]);
      const others = shuffle(["sector", "arc", "radius", "diameter", "semicircle"].filter(x => x !== a)).slice(0, 3);
      return { kind: "choice", html: q.replace("___", '<span class="blank wide">?</span>'), choices: shuffle([a, ...others]), correct: -1, fix: a, hints: ["Picture a slice of pizza for “sector”.", "Arc = curved part; radius = centre to edge."], steps: [`<b>${a}</b>`] };
    } },
    { k: "angletype", label: "Types of angles", f() {
      const [d, a] = pick([["one straight angle and one obtuse angle", "reflex angle"], ["one straight angle and one acute angle", "reflex angle"], ["2 straight angles", "round angle"], ["2 right angles", "straight angle"], ["one right angle and one acute angle", "obtuse angle"], ["4 right angles", "round angle"], ["one straight angle and one right angle", "reflex angle"], ["3 right angles", "reflex angle"]]);
      const all = ["acute angle", "right angle", "obtuse angle", "straight angle", "reflex angle", "round angle"];
      return { kind: "choice", html: `What type of angle can be formed by ${d}?`, choices: shuffle([a, ...shuffle(all.filter(x => x !== a)).slice(0, 3)]), correct: -1, fix: a,
        hints: ["Straight = 180°, right = 90°, round = 360°.", "Add them up, then see which range it falls in."], steps: ["Reflex: between 180° and 360°. Round: exactly 360°. Straight: exactly 180°.", `→ <b>${a}</b>`] };
    } }
  ]
});

/* ---------- 8. Volume & capacity ---------- */
T_CORE.push({
  id: "volume", lv: "core", pal: ["hippo", "Hugo the Bath-tank Hippo"], en: "Volume & Capacity", zh: "體積與容量", color: "#7FD3FF",
  src: "P1 Q8 · P2 Q10b · P3 Q8, Q9b · P4 Q8",
  notes: [
    "Cube: V = side × side × side. A 3-cm cube = 27 cm³.",
    "Cuboid: V = base area × height, so height = V ÷ base area.",
    "Water rise = volume of the object ÷ base area of the tank.",
    "1 L = 1000 mL = 1000 cm³.  1 m³ = 1 000 000 cm³ = 1000 L."
  ],
  ex: { q: "A cuboid has volume 336 cm³ and base area 21 cm². Find its height.", steps: ["height = V ÷ base area", "336 ÷ 21 = <b>16 cm</b>"] },
  gens: [
    { k: "cube", label: "Cube & cuboid volume", f() {
      const v = ri(0, 2);
      if (v === 0) { const s = ri(2, 10); return { html: `Find the volume of a ${s}-cm cube.`, ans: R(s ** 3), unit: "cm³", hints: ["A cube's length, width and height are all the same.", `${s} × ${s} × ${s}`], steps: [`${s} × ${s} × ${s} = <b>${s ** 3} cm³</b>`] }; }
      if (v === 1) { const s = ri(2, 10); return { html: `A cube has a volume of ${s ** 3} cm³. How long is each side?`, ans: R(s), unit: "cm", hints: ["Which number × itself × itself gives that?", "Try 4 × 4 × 4 = 64, 5 × 5 × 5 = 125 …"], steps: [`${s} × ${s} × ${s} = ${s ** 3}`, `side = <b>${s} cm</b>`] }; }
      const l = ri(3, 12), w = ri(2, 9), h = ri(2, 10);
      return { html: `A cuboid is ${l} cm long, ${w} cm wide and ${h} cm high. Find its volume.`, ans: R(l * w * h), unit: "cm³", hints: ["V = length × width × height.", `${l} × ${w} × ${h}`], steps: [`${l} × ${w} × ${h} = <b>${l * w * h} cm³</b>`] };
    } },
    { k: "height", label: "Height = volume ÷ base area", f() {
      const A = ri(6, 40), h = ri(3, 20), Vv = A * h;
      if (chance(0.7)) return { html: `If the volume of a cuboid is ${Vv} cm³ and its base area is ${A} cm², what is the height of this cuboid?`, ans: R(h), unit: "cm", hints: ["V = base area × height.", `So height = ${Vv} ÷ ${A}.`], steps: [`height = ${Vv} ÷ ${A} = <b>${h} cm</b>`] };
      return { html: `A cuboid has a volume of ${Vv} cm³ and a height of ${h} cm. What is its base area?`, ans: R(A), unit: "cm²", hints: ["V = base area × height.", `So base area = ${Vv} ÷ ${h}.`], steps: [`base area = ${Vv} ÷ ${h} = <b>${A} cm²</b>`] };
    } },
    { k: "rise", label: "Water level rise", f() {
      const opt = pick([[10, [25, 50, 30, 45, 120, 15, 80, 60]], [20, [100, 200, 600, 1000, 80, 40]], [5, [5, 10, 15, 20, 30]]]), s = opt[0], vol = pick(opt[1]), base = s * s, ans = R(vol, base);
      const obj = pick(["metal ball", "stone", "toy brick", "iron cube"]);
      return { html: `A ${s} cm tall cubic tank is half-filled with water. After a ${vol} cm³ ${obj} is put into the tank, how much will the water level rise?`, ans, unit: "cm",
        hints: ["The water rises by: volume of the object ÷ base area.", `Base area = ${s} × ${s} = ${base} cm².`], steps: [`Base area = ${s} × ${s} = ${base} cm²`, `Rise = ${vol} ÷ ${base} = <b>${n$(ans)} cm</b>`] };
    } },
    { k: "capacity", label: "L, mL, cm³, m³", f() {
      const v = ri(0, 5);
      if (v === 0) { const x = D(pick([0.2, 0.5, 1.5, 2.4, 0.05, 3, 0.75])); return { html: `${n$(x)} L = ${BL} cm³`, ans: qm(x, 1000), unit: "cm³", hints: ["1 L = 1000 cm³.", "Multiply by 1000."], steps: [`${n$(x)} × 1000 = <b>${n$(qm(x, 1000))} cm³</b>`] }; }
      if (v === 1) { const x = D(pick([2.5, 0.3, 1.25, 4, 0.06])); return { html: `${n$(x)} L = ${BL} mL`, ans: qm(x, 1000), unit: "mL", hints: ["1 L = 1000 mL.", "Multiply by 1000."], steps: [`${n$(x)} × 1000 = <b>${n$(qm(x, 1000))} mL</b>`] }; }
      if (v === 2) { const y = pick([250, 750, 1500, 2000, 80, 3200, 600]); return { html: `${grp(String(y))} cm³ = ${BL} L`, ans: R(y, 1000), unit: "L", hints: ["1000 cm³ = 1 L.", "Divide by 1000."], steps: [`${y} ÷ 1000 = <b>${n$(R(y, 1000))} L</b>`] }; }
      if (v === 3) { const y = pick([1000000, 3000000, 500000, 2500000, 200000]); return { html: `${grp(String(y))} cm³ = ${BL} m³`, ans: R(y, 1000000), unit: "m³", hints: ["1 m = 100 cm, so 1 m³ = 100 × 100 × 100 cm³.", "1 m³ = 1 000 000 cm³."], steps: ["1 m³ = 1 000 000 cm³", `${grp(String(y))} ÷ 1 000 000 = <b>${n$(R(y, 1000000))} m³</b>`] }; }
      if (v === 4) { const x = D(pick([0.5, 2, 1.2, 0.03, 4])); return { html: `${n$(x)} m³ = ${BL} cm³`, ans: qm(x, 1000000), unit: "cm³", hints: ["1 m³ = 1 000 000 cm³.", "Multiply by 1 000 000."], steps: [`${n$(x)} × 1 000 000 = <b>${n$(qm(x, 1000000))} cm³</b>`] }; }
      const x = D(pick([0.5, 2, 1.5, 0.08, 3.2])); return { html: `${n$(x)} m³ = ${BL} L`, ans: qm(x, 1000), unit: "L", hints: ["1 m³ = 1000 L.", "Multiply by 1000."], steps: [`${n$(x)} × 1000 = <b>${n$(qm(x, 1000))} L</b>`] };
    } }
  ]
});

/* ---------- 9. Units & time ---------- */
T_CORE.push({
  id: "units", lv: "core", pal: ["kangaroo", "Kip the Unit Kangaroo"], en: "Units & Time", zh: "單位換算", color: "#C3E88D",
  src: "P1 Q9 · P3 Q9a · P4 Q9b · P5 Q9",
  notes: [
    "1 h = 60 min = 3600 s.  1 3/4 h = 60 + 45 = 105 min.",
    "1 m = 100 cm, so <b>1 m² = 10 000 cm²</b> (not 100!).",
    "1 kg = 1000 g. 1/4 kg = 1000 ÷ 4 = 250 g.",
    "Big unit → small unit: ×. Small unit → big unit: ÷."
  ],
  ex: { q: "Express 8 m² in cm².", steps: ["1 m² = 100 × 100 = 10 000 cm²", "8 × 10 000 = <b>80 000 cm²</b>"] },
  gens: [
    { k: "time", label: "h, min, s", f() {
      const v = ri(0, 4);
      if (v === 0) { const x = D(pick([1, 1, 2, 0.5, 1.5, 0.25, 3])); return { html: `Express ${n$(x)} hour${qval(x) === 1 ? "" : "s"} in seconds.`, ans: qm(x, 3600), unit: "s", hints: ["1 h = 60 min, 1 min = 60 s.", "So 1 h = 60 × 60 = 3600 s."], steps: ["1 h = 3600 s", `${n$(x)} × 3600 = <b>${n$(qm(x, 3600))} s</b>`] }; }
      if (v === 1) { const d = pick([2, 3, 4, 5, 6, 10, 12]), a = ri(1, d - 1), w = ri(0, 3); if (gcd(a, d) !== 1) return this.f(); const h = MX(w, a, d), m = qm(h, 60);
        return { html: `${frH(h)} h = ${BL} min`, ans: m, unit: "min", hints: ["1 h = 60 min.", `${fH(a, d)} h = 60 ÷ ${d} × ${a} min.`], steps: [`${fH(a, d)} × 60 = ${60 * a / d} min`, `${w ? w + " × 60 + " + 60 * a / d + " = " : ""}<b>${n$(m)} min</b>`] }; }
      if (v === 2) { const x = D(pick([0.4, 2.5, 0.15, 1.2, 0.75, 0.3])); return { html: `${n$(x)} h = ${BL} min`, ans: qm(x, 60), unit: "min", hints: ["1 h = 60 min.", "Multiply by 60."], steps: [`${n$(x)} × 60 = <b>${n$(qm(x, 60))} min</b>`] }; }
      if (v === 3) { const m = pick([90, 45, 20, 40, 150, 75, 15, 100]), h = R(m, 60); return { html: `${m} min = ${BL} h`, ans: h, unit: "h", hints: ["60 min = 1 h, so ÷ 60.", "You can answer with a fraction."], steps: [`${m} ÷ 60 = ${fH(m, 60)} = <b>${nH(h)} h</b>`] }; }
      const s = pick([180, 150, 90, 300, 420, 45]); return { html: `${s} s = ${BL} min`, ans: R(s, 60), unit: "min", hints: ["60 s = 1 min.", "Divide by 60."], steps: [`${s} ÷ 60 = <b>${nH(R(s, 60))} min</b>`] };
    } },
    { k: "area", label: "m² ⇄ cm²", f() {
      if (chance(0.6)) { const x = chance(0.6) ? D(ri(2, 12)) : D(pick([0.3, 1.5, 0.05, 2.4])); return { html: `Express ${n$(x)} m² in cm².`, ans: qm(x, 10000), unit: "cm²", hints: ["1 m = 100 cm.", "1 m² = 100 cm × 100 cm = 10 000 cm²."], steps: ["1 m² = 10 000 cm²", `${n$(x)} × 10 000 = <b>${n$(qm(x, 10000))} cm²</b>`] }; }
      const y = pick([25000, 6000, 400, 150000, 70000, 5000]); return { html: `${grp(String(y))} cm² = ${BL} m²`, ans: R(y, 10000), unit: "m²", hints: ["10 000 cm² = 1 m².", "Divide by 10 000."], steps: [`${grp(String(y))} ÷ 10 000 = <b>${n$(R(y, 10000))} m²</b>`] };
    } },
    { k: "mass", label: "kg ⇄ g, km ⇄ m", f() {
      const v = ri(0, 2);
      if (v === 0) { const d = pick([2, 4, 5, 8, 10, 20, 25]), a = ri(1, d - 1); if (gcd(a, d) !== 1) return this.f(); const w = chance(0.3) ? ri(1, 3) : 0, x = MX(w, a, d);
        return { html: `${frH(x)} kg = ${BL} g`, ans: qm(x, 1000), unit: "g", hints: ["1 kg = 1000 g.", `${fH(1, d)} kg = 1000 ÷ ${d} = ${1000 / d} g.`], steps: [`${frH(x)} × 1000 = <b>${n$(qm(x, 1000))} g</b>`] }; }
      if (v === 1) { const g = pick([1500, 250, 2750, 600, 80, 3005]); return { html: `${g} g = ${BL} kg`, ans: R(g, 1000), unit: "kg", hints: ["1000 g = 1 kg.", "Divide by 1000."], steps: [`${g} ÷ 1000 = <b>${n$(R(g, 1000))} kg</b>`] }; }
      const [a, d] = pick([[3, 4], [1, 4], [2, 5], [3, 8], [1, 2], [7, 10]]); return { html: `${fH(a, d)} km = ${BL} m`, ans: R(1000 * a, d), unit: "m", hints: ["1 km = 1000 m.", `1000 ÷ ${d} × ${a}`], steps: [`${fH(a, d)} × 1000 = <b>${n$(R(1000 * a, d))} m</b>`] };
    } },
    { k: "pctqty", label: "% of a quantity in another unit", f() {
      return retry(() => {
        const [u1, u2, k] = pick([["kg", "g", 1000], ["h", "min", 60], ["m", "cm", 100], ["L", "mL", 1000], ["min", "s", 60]]);
        const p = pick([10, 20, 25, 40, 50, 75, 5, 30, 60]), q = ri(1, 6), ans = qm(pctR(p), q * k);
        if (!qint(ans)) return null;
        return { html: `${p}% of ${q} ${u1} = ${BL} ${u2}`, ans, unit: u2, hints: [`${q} ${u1} = ${q * k} ${u2}.`, `${p}% = ${frH(pctR(p))}.`], steps: [`${q} ${u1} = ${q * k} ${u2}`, `${p}% × ${q * k} = <b>${n$(ans)} ${u2}</b>`] };
      });
    } }
  ]
});

/* ---------- 10. Patterns & averages ---------- */
T_CORE.push({
  id: "pattern", lv: "core", pal: ["ladybug", "Lulu the Pattern Ladybird"], en: "Patterns & Averages", zh: "數型與平均數", color: "#FF8A80",
  src: "P3 Q1, Q7 · P4 Q5 · P5 Q3",
  notes: [
    "Number patterns: look at the <b>differences</b>. 1, 3, 6, 10, 15 → +2, +3, +4, +5.",
    "Average = total ÷ how many.",
    "Numbers going up evenly? The average is the <b>middle</b> one (or the middle of the two middle ones).",
    "New average: find the old total first (average × how many)."
  ],
  ex: { q: "The average of three numbers is 12. What is the new average of these three numbers and 14?", steps: ["Old total = 3 × 12 = 36", "New total = 36 + 14 = 50", "50 ÷ 4 = <b>12.5</b>"] },
  gens: [
    { k: "seq", label: "Missing term in a pattern", f() {
      const type = pick(["tri", "tri", "sq", "ap", "grow", "dbl", "fib"]); let t = [], why;
      if (type === "tri") { const s = ri(1, 3); for (let k = s; k < s + 6; k++) t.push(k * (k + 1) / 2); why = "differences go up by 1 each time"; }
      else if (type === "sq") { const s = ri(1, 4); for (let k = s; k < s + 6; k++) t.push(k * k); why = "square numbers (differences +2 more each time)"; }
      else if (type === "ap") { const a = ri(1, 20), d = ri(3, 12); for (let k = 0; k < 6; k++) t.push(a + d * k); why = `always + ${t[1] - t[0]}`; }
      else if (type === "grow") { let a = ri(1, 10), d = ri(1, 4); const inc = pick([1, 2]); for (let k = 0; k < 6; k++) { t.push(a); a += d; d += inc; } why = `differences go up by ${inc} each time`; }
      else if (type === "dbl") { let a = ri(1, 5); const r = pick([2, 3]); for (let k = 0; k < 5; k++) { t.push(a); a *= r; } why = `× ${t[1] / t[0]} each time`; }
      else { let a = pick([1, 2, 3]), b = a + pick([0, 1]); for (let k = 0; k < 6; k++) { t.push(a); [a, b] = [b, a + b]; } why = "each number = the two before it added together"; }
      const h = ri(2, t.length - 2), ans = t[h], diffs = t.slice(1).map((x, i) => x - t[i]);
      return { html: t.map((x, i) => i === h ? BL : x).join("&ensp; "), ans: R(ans), hints: ["Look at the differences between neighbours.", `The rule: ${why}.`],
        steps: [type === "dbl" ? `Each number × ${t[1] / t[0]}: ${t.join(" → ")}` : `Differences: ${diffs.map(x => "+" + x).join(", ")}`, `Rule: ${why} → ? = <b>${ans}</b>`] };
    } },
    { k: "avgspaced", label: "Average of evenly spaced numbers", f() {
      const nn = pick([3, 4, 5]), st = chance(0.6) ? R(ri(11, 49), 10) : R(ri(101, 199), 100), d = D(pick([0.4, 0.2, 0.02, 0.3, 0.05, 1.5, 0.04]));
      const xs = Array.from({ length: nn }, (_, i) => qa(st, qm(d, i))), sum = xs.reduce((a, b) => qa(a, b), R(0)), ans = qd(sum, nn);
      const list = xs.slice(0, -1).map(n$).join(", ") + " and " + n$(xs[nn - 1]);
      return { html: `Find the average of ${list}.`, ans, hints: ["Average = total ÷ how many.", "Shortcut: they go up evenly, so the average is in the middle."],
        steps: [`Total = ${n$(sum)},  ${nn} numbers`, `${n$(sum)} ÷ ${nn} = <b>${n$(ans)}</b>  (the middle value!)`] };
    } },
    { k: "newavg", label: "New average", f() {
      return retry(() => {
        const nn = pick([2, 3, 4, 5, 9]), a = ri(8, 30), x = ri(5, 40), tot = nn * a + x, ans = R(tot, nn + 1);
        if (!isTerm(ans) || dpOf(ans) > 2 || x === a) return null;
        const w = ["", "", "two", "three", "four", "five", "", "", "", "nine"][nn];
        return { html: `The average of ${w} numbers is ${a}. What is the new average of these ${w} numbers and ${x}?`, ans, hints: [`Old total = ${nn} × ${a}.`, `Add ${x}, then divide by ${nn + 1} (one more number!).`],
          steps: [`Old total = ${nn} × ${a} = ${nn * a}`, `New total = ${nn * a} + ${x} = ${tot}`, `${tot} ÷ ${nn + 1} = <b>${n$(ans)}</b>`] };
      });
    } },
    { k: "avg", label: "Average", f() {
      return retry(() => {
        const nn = pick([4, 5]), xs = Array.from({ length: nn }, () => ri(3, 30)), s = xs.reduce((a, b) => a + b, 0);
        if (s % nn) return null;
        return { html: `Find the average of ${xs.slice(0, -1).join(", ")} and ${xs[nn - 1]}.`, ans: R(s / nn), hints: ["Add them all up.", `Then ÷ ${nn}.`], steps: [`Total = ${s}`, `${s} ÷ ${nn} = <b>${s / nn}</b>`] };
      });
    } }
  ]
});

/* ---------- 11. Percentages ---------- */
const NAMES = ["Kate", "Tom", "Mia", "Leo", "Amy", "Ben", "Chloe", "Ethan"];
T_CORE.push({
  id: "percent", lv: "core", pal: ["fox", "Fifi the Percent Fox"], en: "Percentages", zh: "百分數應用", color: "#FFB74D",
  src: "P5 Q6, Q9a, Q10a",
  notes: [
    "% means “out of 100”. 25% = 25/100 = 1/4.",
    "Part → whole: find <b>1%</b> first, then 100%. 20% is $200 → 1% is $10 → 100% is $1000.",
    "What % of 75 is 25? → 25/75 × 100% = 33 1/3%.",
    "p% of a number = p/100 × the number."
  ],
  ex: { q: "Kate spent 20% of her money on a wallet that cost $200. How much did she have?", steps: ["20% → $200", "1% → $10", "100% → <b>$1000</b>"] },
  gens: [
    { k: "original", label: "Find the whole from a %", f() {
      return retry(() => {
        const p = pick([10, 20, 25, 40, 50, 75, 5, 30, 60, 80]), unitP = 100 / gcd(p, 100), tot = unitP * ri(2, 40) * pick([1, 10]), part = tot * p / 100;
        if (tot > 20000) return null;
        const nm = pick(NAMES), it = pick(["wallet", "watch", "book", "pair of shoes", "school bag", "video game", "jacket"]), her = ["Kate", "Mia", "Amy", "Chloe"].includes(nm) ? "her" : "his";
        return { html: `${nm} spent ${p}% of ${her} money on a ${it} that cost $${part}. How much money did ${nm} have originally?`, ans: R(tot), pre: "$", hints: [`${p}% of the money = $${part}.`, `Find 1% first: $${part} ÷ ${p}.`],
          steps: [`${p}% → $${part}`, `1% → $${part} ÷ ${p} = ${money(R(part, p))}`, `100% → <b>$${tot}</b>`] };
      });
    } },
    { k: "whatpct", label: "What % of A is B?", f() {
      const [a, b] = pick([[1, 3], [2, 3], [1, 4], [3, 4], [1, 2], [1, 5], [2, 5], [3, 5], [1, 8], [3, 8], [1, 6], [3, 2], [5, 4], [1, 10], [7, 10]]);
      const A = b * ri(2, 15) * (b <= 3 ? 5 : 1), B = A * a / b, ans = qm(F(a, b), 100);
      if (!Number.isInteger(B)) return this.f();
      return { html: `What percentage of ${A} is ${B}?`, ans, unit: "%", hints: [`Make a fraction: ${B} out of ${A}.`, `Simplify ${fH(B, A)}, then × 100%.`], steps: [`${fH(B, A)} = ${frH(F(a, b))}`, `${frH(F(a, b))} × 100% = <b>${nH(ans)}%</b>`] };
    } },
    { k: "pctof", label: "p% of a number", f() {
      return retry(() => {
        const p = ri(1, 19) * 5, nn = ri(2, 30) * 20, ans = R(p * nn, 100);
        if (!qint(ans)) return null;
        const money = chance(0.4);
        return { html: `Find ${p}% of ${money ? "$" : ""}${nn}.`, ans, pre: money ? "$" : "", hints: [`${p}% = ${fH(p, 100)}.`, `Find 10% or 1% first, then build up to ${p}%.`], steps: [`1% of ${nn} = ${n$(R(nn, 100))}`, `${p}% = ${p} × ${n$(R(nn, 100))} = <b>${money ? "$" : ""}${n$(ans)}</b>`] };
      });
    } }
  ]
});

/* ---------- 12. Speed ---------- */
T_CORE.push({
  id: "speed", lv: "core", pal: ["leopard", "Zoom the Leopard"], en: "Speed", zh: "速率", color: "#F48FB1",
  src: "P5 Q7, Q8",
  notes: [
    "Speed = distance ÷ time.  Time = distance ÷ speed.  Distance = speed × time.",
    "Change the time into ONE unit first: 1 min 20 s = 80 s.",
    "Hours → minutes: 3/4 h = 45 min.",
    "Arrival time = start time + time taken."
  ],
  ex: { q: "A ferry left at 13:00 at 40 km/h to an island 30 km away. When did it arrive?", steps: ["Time = 30 ÷ 40 = 3/4 h = 45 min", "13:00 + 45 min = <b>13:45</b>"] },
  gens: [
    { k: "speedcalc", label: "Speed = distance ÷ time", f() {
      return retry(() => {
        if (chance(0.55)) {
          const sp = D(pick([2.5, 2, 4, 1.5, 5, 3.2, 1.25, 6, 2.4])), t = pick([80, 100, 50, 40, 120, 150, 90, 75, 125]), d = qm(sp, t);
          if (!qint(d)) return null;
          const tm = t >= 60 ? `${Math.floor(t / 60)} minute${t >= 120 ? "s" : ""}${t % 60 ? " and " + (t % 60) + " seconds" : ""}` : t + " seconds";
          const nm = pick(NAMES);
          return { html: `${nm} runs ${n$(d)} m in ${tm}. What is ${["Kate", "Mia", "Amy", "Chloe"].includes(nm) ? "her" : "his"} average running speed in m/s?`, ans: sp, unit: "m/s", hints: [t >= 60 ? `Change ${tm} into seconds first.` : "Speed = distance ÷ time.", `${n$(d)} ÷ ${t}`],
            steps: [t >= 60 ? `${tm} = ${t} s` : `time = ${t} s`, `Speed = ${n$(d)} ÷ ${t} = <b>${n$(sp)} m/s</b>`] };
        }
        const mins = pick([10, 12, 15, 20, 30, 40, 45]), sp = pick([12, 15, 18, 24, 30, 36, 45, 48, 60, 72, 90]), d = R(sp * mins, 60);
        if (dpOf(d) > 1) return null;
        const who = pick(["A cyclist rides", "A bus travels", "A train travels", "A boat sails"]);
        return { html: `${who} ${n$(d)} km in ${mins} minutes. Find the speed in km/h.`, ans: R(sp), unit: "km/h", hints: [`${mins} min = ${frH(R(mins, 60))} h.`, `Speed = ${n$(d)} ÷ ${frH(R(mins, 60))}.`],
          steps: [`${mins} min = ${frH(R(mins, 60))} h`, `${n$(d)} ÷ ${frH(R(mins, 60))} = <b>${sp} km/h</b>`] };
      });
    } },
    { k: "arrival", label: "Arrival time", f() {
      return retry(() => {
        const v = pick([40, 60, 30, 50, 80, 20, 12, 15, 90]), m = pick([15, 20, 30, 40, 45, 50, 75, 90, 105, 120]), d = R(v * m, 60);
        if (!qint(d)) return null;
        const st = ri(7, 18) * 60 + pick([0, 0, 15, 30, 10, 20, 45]), [veh, place] = pick([["ferry", "an island"], ["bus", "a village"], ["coach", "a campsite"], ["train", "a station"]]);
        return { kind: "time", fmt: "24", t: st + m, html: `A ${veh} left at ${t24(st)} at an average speed of ${v} km/h to reach ${place} ${n$(d)} km away. When did the ${veh} arrive?`,
          hints: ["Time = distance ÷ speed.", `${n$(d)} ÷ ${v} = ${frH(R(m, 60))} h. Change it into minutes.`], steps: [`Time = ${n$(d)} ÷ ${v} = ${frH(R(m, 60))} h = ${m} min`, `${t24(st)} + ${m} min = <b>${t24(st + m)}</b>`] };
      });
    } },
    { k: "timetaken", label: "Time taken", f() {
      return retry(() => {
        const v = pick([40, 60, 30, 50, 80, 20, 12, 90]), m = pick([15, 20, 30, 40, 45, 90, 18, 36]), d = R(v * m, 60);
        if (!qint(d)) return null;
        return { html: `How many minutes does it take to travel ${n$(d)} km at ${v} km/h?`, ans: R(m), unit: "min", hints: ["Time = distance ÷ speed (in hours).", "Then × 60 to get minutes."], steps: [`${n$(d)} ÷ ${v} = ${frH(R(m, 60))} h`, `${frH(R(m, 60))} × 60 = <b>${m} min</b>`] };
      });
    } }
  ]
});

/* ---------- 13. Circles ---------- */
T_CORE.push({
  id: "circle", lv: "core", pal: ["snail", "Shelly the Circle Snail"], en: "Circles", zh: "圓周", color: "#A5D6A7",
  src: "P5 Q4, Q5",
  notes: [
    "Circumference C = π × d = 2 × π × r.",
    "With π = 22/7 the diameter is usually a multiple of 7. With π = 3.14, just multiply.",
    "Largest circle cut from a rectangle: the diameter = the <b>shorter</b> side.",
    "Working backwards: r = C ÷ (2π). 31.4 ÷ 6.28 = 5."
  ],
  ex: { q: "The largest circle is cut from a 10 cm × 7 cm paper. Find its circumference. (π = 22/7)", steps: ["Diameter = shorter side = 7 cm", "C = 22/7 × 7 = <b>22 cm</b>"] },
  gens: [
    { k: "largest", label: "Largest circle from a rectangle / square", f() {
      const use7 = chance(0.5);
      if (chance(0.3)) { const s = use7 ? pick([7, 14, 21]) : pick([10, 4, 6, 8, 20, 5]); const C = use7 ? qm(F(22, 7), s) : qm(3.14, s);
        return { html: `The largest circle is cut from a square paper of side ${s} cm. What is the circumference of the circle? ${use7 ? PI227() : PI314}`, ans: C, unit: "cm", hints: ["The diameter = the side of the square.", "C = π × d."], steps: [`d = ${s} cm`, `C = ${use7 ? "22/7" : "3.14"} × ${s} = <b>${n$(C)} cm</b>`] }; }
      const b = use7 ? pick([7, 14, 21]) : pick([4, 6, 8, 10, 5, 12]), a = b + ri(1, 9), C = use7 ? qm(F(22, 7), b) : qm(3.14, b);
      return { html: `The largest circle is cut from a piece of rectangular paper measuring ${a} cm by ${b} cm. What is the circumference of this circle? ${use7 ? PI227() : PI314}`, ans: C, unit: "cm", hints: ["The circle can't be wider than the SHORTER side.", `So the diameter is ${b} cm. C = π × d.`], steps: [`d = shorter side = ${b} cm`, `C = ${use7 ? "22/7" : "3.14"} × ${b} = <b>${n$(C)} cm</b>`] };
    } },
    { k: "rfromc", label: "Radius from circumference", f() {
      const use7 = chance(0.4), r = use7 ? pick([7, 14, 21, 3.5]) : pick([5, 2, 3, 4, 10, 1.5, 6, 8, 2.5]), C = use7 ? qm(F(44, 7), r) : qm(6.28, r), askD = chance(0.3), ans = askD ? qm(r, 2) : D(r);
      return { html: `Find the ${askD ? "diameter" : "radius"} of a circular garden if its circumference is ${n$(C)} m. ${use7 ? PI227() : PI314}`, ans, unit: "m", hints: [askD ? "C = π × d, so d = C ÷ π." : "C = 2 × π × r, so r = C ÷ (2 × π).", use7 ? "2 × 22/7 = 44/7." : "2 × 3.14 = 6.28."],
        steps: [askD ? `d = ${n$(C)} ÷ ${use7 ? "22/7" : "3.14"}` : `r = ${n$(C)} ÷ ${use7 ? "44/7" : "6.28"}`, `= <b>${n$(ans)} m</b>`] };
    } },
    { k: "circum", label: "Circumference", f() {
      const use7 = chance(0.4), useR = chance(0.5), x = use7 ? pick([7, 14, 21, 3.5, 28]) : pick([1.5, 2, 5, 10, 3, 4, 20, 2.5]), d = useR ? qm(x, 2) : D(x), C = use7 ? qm(F(22, 7), d) : qm(3.14, d);
      return { html: `Find the circumference of a circle if its ${useR ? "radius" : "diameter"} is ${n$(x)} cm. ${use7 ? PI227() : PI314}`, ans: C, unit: "cm", hints: [useR ? "C = 2 × π × r." : "C = π × d.", useR ? `d = 2 × ${n$(x)} = ${n$(d)} cm.` : "Just multiply!"], steps: [useR ? `d = 2 × ${n$(x)} = ${n$(d)}` : `d = ${n$(d)}`, `C = ${use7 ? "22/7" : "3.14"} × ${n$(d)} = <b>${n$(C)} cm</b>`] };
    } }
  ]
});

/* =========================================================
   TOPICS · Challenge (worksheet pages 6–8)
   ========================================================= */
const T_PRO = [];

/* ---------- X1. Tricky equations ---------- */
T_PRO.push({
  id: "eqpro", lv: "pro", pal: ["dragon", "Drake the Equation Dragon"], en: "Tricky Equations", zh: "進階方程", color: "#EF9A9A",
  src: "P6 Q3, Q5, Q7 · P7 Q1, Q2, Q3 · P8 Q2",
  notes: [
    "Collect like terms first: 25y − 16y = 9y.",
    "Letters on both sides? Move them to one side: 1 1/3 x = 16 − 2/3 x → 1 1/3 x + 2/3 x = 16 → 2x = 16.",
    "Brackets: 8(B + 1.3) = 104 → B + 1.3 = 13 (÷ 8 first!).",
    "Letter at the bottom: 11/(3D) = 44 → 3D = 11 ÷ 44 = 1/4.",
    "Percent: 40%A = 0.4A. (1 − 20%)Y = 0.8Y."
  ],
  ex: { q: "Solve 40%A − 1 1/4 = 3 3/4", steps: ["+ 1 1/4 both sides: 40%A = 5", "A = 5 ÷ 0.4 = <b>12.5</b>"] },
  gens: [
    { k: "collect", label: "ay − by = c", f() {
      const v = pick(VARS), a = ri(12, 30), b = ri(5, a - 2), c = ri(1, 9), ans = R(c, a - b);
      return { html: `Solve ${a}${V(v)} − ${b}${V(v)} = ${c}`, ans, pre: `${V(v)} = `, hints: [`${a}${V(v)} − ${b}${V(v)} = ${a - b}${V(v)}.`, `${V(v)} = ${c} ÷ ${a - b} (a fraction is fine).`], disp: isTerm(ans) ? "" : "frac", steps: [`${a - b}${V(v)} = ${c}`, `${V(v)} = ${c} ÷ ${a - b} = <b>${ans.d === a - b && !isTerm(ans) ? frH(ans) : fH(c, a - b) + " = " + nH(ans)}</b>`] };
    } },
    { k: "fraccoef", label: "3x/4 = 3", f() {
      return retry(() => {
        const v = pick(VARS), a = ri(2, 9), b = ri(2, 9), x = ri(2, 20); if (gcd(a, b) !== 1 || (a * x) % b) return null;
        const c = a * x / b;
        return { html: `Solve ${fH(a + V(v), b, `${a} ${v} over ${b}`)} = ${c}`, ans: R(x), pre: `${V(v)} = `, hints: [`Multiply both sides by ${b}.`, `Then divide by ${a}.`], steps: [`${a}${V(v)} = ${c} × ${b} = ${c * b}`, `${V(v)} = ${c * b} ÷ ${a} = <b>${x}</b>`] };
      });
    } },
    { k: "bothsides", label: "Letters on both sides", f() {
      const v = pick(VARS), d = pick([3, 4, 5]), n1 = ri(1, d - 1), n2 = d - n1, w = ri(1, 2), x = ri(2, 12), k = w + 1, c = k * x;
      if (gcd(n1, d) !== 1 || gcd(n2, d) !== 1) return this.f();
      return { html: `Solve ${frH(MX(w, n1, d))}${V(v)} = ${c} − ${fH(n2, d)}${V(v)}`, ans: R(x), pre: `${V(v)} = `, hints: [`Add ${fH(n2, d)}${V(v)} to both sides.`, `${frH(MX(w, n1, d))} + ${fH(n2, d)} = ${k}.`],
        steps: [`${frH(MX(w, n1, d))}${V(v)} + ${fH(n2, d)}${V(v)} = ${c}`, `${k}${V(v)} = ${c} → ${V(v)} = <b>${x}</b>`] };
    } },
    { k: "pcteq", label: "40%A − 1 1/4 = 3 3/4", f() {
      return retry(() => {
        const v = pick(["A", "B", "x", "y"]), p = pick([20, 25, 40, 50, 60, 75, 80]), d = pick([2, 4, 4, 5]), a = ri(1, d - 1); if (gcd(a, d) !== 1) return null;
        const f1 = MX(ri(1, 4), a, d), f2 = MX(ri(1, 6), d - a, d), S = qa(f1, f2), ans = qd(S, pctR(p));
        if (!isTerm(ans) || dpOf(ans) > 2) return null;
        return { html: `Solve ${p}%${V(v)} − ${frH(f1)} = ${frH(f2)}`, ans, pre: `${V(v)} = `, hints: [`Add ${frH(f1)} to both sides.`, `${p}% = ${n$(pctR(p))}. Then divide.`],
          steps: [`${p}%${V(v)} = ${frH(f2)} + ${frH(f1)} = ${n$(S)}`, `${V(v)} = ${n$(S)} ÷ ${n$(pctR(p))} = <b>${n$(ans)}</b>`] };
      });
    } },
    { k: "brackets", label: "k(B + c) = m", f() {
      const v = pick(["B", "A", "y", "m"]), k = ri(2, 9), T = ri(3, 30), c = R(ri(1, 29), 10), B = qs(T, c);
      if (qval(B) <= 0) return this.f();
      return { html: `Solve ${k}(${V(v)} + ${n$(c)}) = ${k * T}`, ans: B, pre: `${V(v)} = `, hints: [`Divide both sides by ${k} first.`, `${V(v)} + ${n$(c)} = ${T}.`], steps: [`${V(v)} + ${n$(c)} = ${k * T} ÷ ${k} = ${T}`, `${V(v)} = ${T} − ${n$(c)} = <b>${n$(B)}</b>`] };
    } },
    { k: "denom", label: "11/(3D) = 44", f() {
      const v = pick(["D", "x", "y"]), a = pick([11, 7, 5, 3, 9, 13]), b = pick([2, 3, 4, 5]), m = ri(2, 6), c = a * m, ans = R(1, b * m);
      return { html: `Solve ${fH(a, b + V(v), `${a} over ${b} ${v}`)} = ${c}`, ans, disp: "frac", pre: `${V(v)} = `, hints: [`${a} ÷ (${b}${V(v)}) = ${c}, so ${b}${V(v)} = ${a} ÷ ${c}.`, `${a} ÷ ${c} = ${fH(1, m)}. Then ÷ ${b}.`],
        steps: [`${b}${V(v)} = ${a} ÷ ${c} = ${fH(1, m)}`, `${V(v)} = ${fH(1, m)} ÷ ${b} = <b>${frH(ans)}</b>`] };
    } },
    { k: "pctboth", label: "(1 − 20%)Y + c = 2Y", f() {
      return retry(() => {
        const v = pick(["Y", "x", "A"]), p = pick([20, 25, 10, 40, 50]), k = D(pick([2, 3, 1.5, 2.5])), Y = D(pick([0.1, 0.2, 0.5, 0.4, 2, 5, 0.3])), coef = qs(1, pctR(p)), diff = qs(k, coef), c = qm(diff, Y);
        if (qval(c) <= 0 || dpOf(c) > 3) return null;
        return { html: `Solve (1 − ${p}%)${V(v)} + ${n$(c)} = ${n$(k)}${V(v)}`, ans: Y, pre: `${V(v)} = `, hints: [`(1 − ${p}%) = ${n$(coef)}.`, `Move the ${V(v)}'s together: ${n$(c)} = ${n$(k)}${V(v)} − ${n$(coef)}${V(v)}.`],
          steps: [`${n$(coef)}${V(v)} + ${n$(c)} = ${n$(k)}${V(v)}`, `${n$(c)} = ${n$(diff)}${V(v)}`, `${V(v)} = ${n$(c)} ÷ ${n$(diff)} = <b>${n$(Y)}</b>`] };
      });
    } }
  ]
});

/* ---------- X2. Circles pro ---------- */
T_PRO.push({
  id: "circlepro", lv: "pro", pal: ["peacock", "Pip the Sector Peacock"], en: "Circles Pro", zh: "圓（面積・半圓）", color: "#80CBC4",
  src: "P6 Q2, Q4, Q6 · P7 Q6, Q7 · P8 Q7, Q8",
  notes: [
    "Area = π × r × r. Careful: use the <b>radius</b> (half the diameter)!",
    "Semicircle perimeter = curved part (π × d ÷ 2) <b>+ the diameter</b>.",
    "Semicircle area = π × r × r ÷ 2.",
    "Area 154 cm² (π = 22/7) → r × r = 154 ÷ 22/7 = 49 → r = 7.",
    "One turn of a wheel = its circumference."
  ],
  ex: { q: "Find the perimeter of a semicircle with diameter 14 cm. (π = 22/7)", steps: ["Curved part = 22/7 × 14 ÷ 2 = 22", "Perimeter = 22 + 14 = <b>36 cm</b>"] },
  gens: [
    { k: "area", label: "Area of a circle", f() {
      if (chance(0.5)) { const d = pick([20, 10, 4, 6, 8, 2, 30, 12]), r = d / 2, A = qm(3.14, r * r);
        return { html: `What is the area of a circle if its diameter is ${d} cm? ${PI314}`, ans: A, unit: "cm²", hints: ["Area uses the RADIUS.", `r = ${d} ÷ 2 = ${r} cm.`], steps: [`r = ${r} cm`, `A = 3.14 × ${r} × ${r} = <b>${n$(A)} cm²</b>`] }; }
      const r = pick([7, 14, 21, 3.5]), A = qm(F(22, 7), qm(r, r));
      return { html: `What is the area of a circle if its radius is ${n$(r)} cm? ${PI227()}`, ans: A, unit: "cm²", hints: ["Area = π × r × r.", "Cancel the 7 first!"], steps: [`A = 22/7 × ${n$(r)} × ${n$(r)}`, `= <b>${n$(A)} cm²</b>`] };
    } },
    { k: "semiperim", label: "Perimeter of a semicircle", f() {
      const use7 = chance(0.6), d = use7 ? pick([14, 7, 21, 28]) : pick([10, 20, 4, 6, 8]), curve = use7 ? qm(F(11, 7), d) : qm(1.57, d), P = qa(curve, d);
      return { html: `The diameter of a circle is ${d} cm. The circle is divided into two semicircles. Find the perimeter of one semicircle. ${use7 ? PI227() : PI314}`, ans: P, unit: "cm",
        hints: ["Perimeter = curved part + straight part.", `The straight part is the diameter (${d} cm). Don't forget it!`], steps: [`Curved part = ${use7 ? "22/7" : "3.14"} × ${d} ÷ 2 = ${n$(curve)}`, `Perimeter = ${n$(curve)} + ${d} = <b>${n$(P)} cm</b>`] };
    } },
    { k: "semiarea", label: "Area of a semicircle", f() {
      const use7 = chance(0.6), r = use7 ? pick([7, 14, 21]) : pick([10, 2, 4, 6, 20]), A = use7 ? qd(qm(F(22, 7), r * r), 2) : qd(qm(3.14, r * r), 2);
      return { html: `Find the area of a semicircle if its radius is ${r} cm. ${use7 ? PI227() : PI314}`, ans: A, unit: "cm²", hints: ["Find the area of the whole circle first.", "Then ÷ 2."], steps: [`Whole circle = ${use7 ? "22/7" : "3.14"} × ${r} × ${r} = ${n$(qm(A, 2))}`, `÷ 2 = <b>${n$(A)} cm²</b>`] };
    } },
    { k: "rfromarea", label: "Radius from area", f() {
      const use7 = chance(0.5), r = use7 ? pick([7, 14, 21]) : pick([10, 5, 2, 3, 4, 6, 8, 9]), A = use7 ? qm(F(22, 7), r * r) : qm(3.14, r * r), askD = chance(0.25);
      return { html: `The area of a circle is ${n$(A)} cm². What is the ${askD ? "diameter" : "radius"} of the circle? ${use7 ? PI227() : PI314}`, ans: R(askD ? 2 * r : r), unit: "cm",
        hints: [`r × r = ${n$(A)} ÷ ${use7 ? "22/7" : "3.14"}.`, "Which number × itself gives that?"], steps: [`r × r = ${n$(A)} ÷ ${use7 ? "22/7" : "3.14"} = ${r * r}`, `r = ${r}${askD ? `, d = 2 × ${r}` : ""} → <b>${askD ? 2 * r : r} cm</b>`] };
    } },
    { k: "wheel", label: "Wheels & turns", f() {
      return retry(() => {
        const d = D(pick([0.2, 0.25, 0.5, 1, 2, 0.4, 0.3])), turns = pick([1, 5, 10, 20, 50, 25]), t = pick([10, 20, 50, 100, 25, 40]), dist = qm(qm(3.14, d), turns), v = qd(dist, t);
        if (dpOf(v) > 4) return null;
        if (chance(0.35)) return { html: `A wheel with a diameter of ${n$(d)} m turns ${turns} times. How far does it travel? ${PI314}`, ans: dist, unit: "m", hints: ["One turn = one circumference = π × d.", `Then × ${turns}.`], steps: [`One turn = 3.14 × ${n$(d)} = ${n$(qm(3.14, d))} m`, `× ${turns} = <b>${n$(dist)} m</b>`] };
        const who = pick(["A hamster ran on a wheel", "A toy car's wheel rolled", "A bicycle wheel rolled"]);
        return { html: `${who} for ${t} seconds at an average speed of ${n$(v)} m/s. If the wheel turned exactly ${turns} time${turns > 1 ? "s" : ""}, what is the diameter of the wheel? ${PI314}`, ans: d, unit: "m",
          hints: ["Distance = speed × time.", `One turn = distance ÷ ${turns} = the circumference. Then d = C ÷ π.`],
          steps: [`Distance = ${n$(v)} × ${t} = ${n$(dist)} m`, turns > 1 ? `One turn = ${n$(dist)} ÷ ${turns} = ${n$(qd(dist, turns))} m` : `One turn = ${n$(dist)} m`, `d = ${n$(qd(dist, turns))} ÷ 3.14 = <b>${n$(d)} m</b>`] };
      });
    } }
  ]
});

/* ---------- X3. Discounts & percentages ---------- */
T_PRO.push({
  id: "pctpro", lv: "pro", pal: ["parrot", "Polly the Bargain Parrot"], en: "Discounts & Percentages", zh: "折扣與百分數", color: "#FFCC80",
  src: "P6 Q1, Q9b · P7 Q8, Q10b · P8 Q3, Q5",
  notes: [
    "Selling price = original price × (100% − discount%).",
    "Discount rate = (original − new) ÷ original × 100%.",
    "Buy 1 get 1 free: you pay for 1 but get 2 → you save 1 out of 2 = 50%.",
    "“Not” questions: 25% are P5 → 75% are not.",
    "“Of the remaining”: work out what is left first, then take the fraction of THAT."
  ],
  ex: { q: "$1000, spend 40% on a bag, then 1/3 of the rest on a jacket. How much is left?", steps: ["After the bag: 60% of $1000 = $600", "Jacket: 1/3 × 600 = $200", "Left: 600 − 200 = <b>$400</b>"] },
  gens: [
    { k: "notpart", label: "The part that is NOT", f() {
      return retry(() => {
        const p = pick([25, 20, 40, 75, 10, 30, 60, 12.5]), tot = ri(2, 40) * 8, part = qm(pctR(p), tot); if (!qint(part)) return null;
        const [thing, who] = pick([["game booths on Math Fun Day", "run by P5 students"], ["students in the hall", "wearing glasses"], ["seats in the bus", "taken"], ["cupcakes on the table", "chocolate"]]);
        return { html: `There are ${tot} ${thing}. If ${n$(p)}% of them are ${who}, how many are <b>not</b> ${who}?`, ans: qs(tot, part), hints: [`${n$(p)}% are, so ${n$(qs(100, p))}% are not.`, `${n$(qs(100, p))}% of ${tot}.`], steps: [`Not: 100% − ${n$(p)}% = ${n$(qs(100, p))}%`, `${n$(qs(100, p))}% × ${tot} = <b>${n$(qs(tot, part))}</b>`] };
      });
    } },
    { k: "pctdec", label: "p% of a decimal", f() {
      const p = pick([25, 50, 20, 10, 75, 40, 5]), x = R(ri(4, 99) * 4, 100), ans = qm(pctR(p), x);
      return { html: `${p}% of ${n$(x)} is ${BL}`, ans, hints: [`${p}% = ${frH(pctR(p))}.`, `${frH(pctR(p))} of ${n$(x)}.`], steps: [`${p}% = ${frH(pctR(p))}`, `${frH(pctR(p))} × ${n$(x)} = <b>${n$(ans)}</b>`] };
    } },
    { k: "sell", label: "Selling price after discount", f() {
      return retry(() => {
        const p = pick([20, 25, 10, 30, 15, 40, 5]), O = ri(2, 50) * pick([20, 50, 100]), S = qm(O, qs(1, pctR(p))); if (!qint(S)) return null;
        const it = pick(["handbag", "bicycle", "watch", "camera", "sofa", "game console"]);
        return { html: `The original price of a ${it} is $${O}. It is now being sold at a ${p}% discount. What is its selling price?`, ans: S, pre: "$", hints: [`It costs ${100 - p}% of the original price.`, `${100 - p}% × $${O}.`], steps: [`100% − ${p}% = ${100 - p}%`, `${100 - p}% × $${O} = <b>$${n$(S)}</b>`] };
      });
    } },
    { k: "rate", label: "Discount rate", f() {
      return retry(() => {
        const p = pick([25, 20, 10, 30, 40, 15, 12.5, 50]), O = ri(2, 40) * pick([8, 20, 40]), S = qm(O, qs(1, pctR(p))); if (!qint(S)) return null;
        const it = pick(["vase", "lamp", "toy robot", "jacket", "pair of shoes"]);
        return { html: `The original price of a ${it} was $${O}. It is now sold at $${n$(S)}. What is the rate of discount?`, ans: D(p), unit: "%", hints: [`Discount = $${O} − $${n$(S)} = $${n$(qs(O, S))}.`, `Rate = discount ÷ original × 100%.`], steps: [`Discount = $${n$(qs(O, S))}`, `${fH(n$(qs(O, S)), O)} × 100% = <b>${n$(p)}%</b>`] };
      });
    } },
    { k: "bogo", label: "“Buy 1 get 1 free”", f() {
      const [d, a] = pick([["buy 1 get 1 free", F(50, 1)], ["buy 2 get 1 free", F(100, 3)], ["buy 3 get 1 free", F(25, 1)], ["buy 4 get 1 free", F(20, 1)], ["buy 1, get the 2nd one at half price", F(25, 1)], ["buy 2 get 2 free", F(50, 1)]]);
      return { html: `What is the discount rate of ‘${d}’?`, ans: a, unit: "%", hints: ["How many do you get? How many do you pay for?", "Discount = what you save ÷ the value of everything you get."], steps: [`Saved ÷ total value = ${nH(a)}%`, `<b>${nH(a)}%</b>`] };
    } },
    { k: "remain", label: "“Of the remaining”", f() {
      return retry(() => {
        const T = pick([1000, 800, 1200, 600, 900, 1500, 2000]), p = pick([40, 20, 25, 50, 10, 30]), [fa, fb] = pick([[1, 3], [1, 4], [1, 2], [2, 3], [3, 4], [1, 5]]);
        const left1 = qm(T, qs(1, pctR(p))), sp2 = qm(left1, F(fa, fb)), left2 = qs(left1, sp2); if (!qint(left2) || !qint(sp2)) return null;
        const [i1, i2] = pick([["a school bag", "a jacket"], ["a book", "a toy"], ["a train ticket", "lunch"], ["a gift", "flowers"]]);
        return { html: `I had $${T} at first. I spent ${p}% of it on ${i1} and ${fH(fa, fb)} of the remaining amount on ${i2}. How much do I have now?`, ans: left2, pre: "$",
          hints: [`After ${i1}: ${100 - p}% of $${T} is left.`, `Then take ${fH(fa, fb)} of THAT amount away.`], steps: [`Left after ${i1}: ${100 - p}% × $${T} = $${n$(left1)}`, `${i2}: ${fH(fa, fb)} × $${n$(left1)} = $${n$(sp2)}`, `Now: $${n$(left1)} − $${n$(sp2)} = <b>$${n$(left2)}</b>`] };
      });
    } }
  ]
});

/* ---------- X4. Speed & time pro ---------- */
T_PRO.push({
  id: "speedpro", lv: "pro", pal: ["rabbit", "Dash the Speedy Rabbit"], en: "Speed & Time Pro", zh: "速率與時間（進階）", color: "#CE93D8",
  src: "P6 Q8 · P7 Q5 · P8 Q4, Q10b",
  notes: [
    "Half an hour = 0.5 h, 20 min = 1/3 h, 15 min = 1/4 h.",
    "Units must match! m/s × seconds, km/h × hours.",
    "2 minutes = 120 seconds. 1.2 m/s × 120 s = 144 m.",
    "1 1/3 h = 1 h 20 min. Crossing 12 o'clock changes a.m. ↔ p.m."
  ],
  ex: { q: "What time is 1 1/3 h after 2:00 p.m.?", steps: ["1 1/3 h = 1 h 20 min", "2:00 p.m. + 1 h 20 min = <b>3:20 p.m.</b>"] },
  gens: [
    { k: "halfhour", label: "km in part of an hour", f() {
      return retry(() => {
        const [tw, h] = pick([["half an hour", F(1, 2)], ["20 minutes", F(1, 3)], ["15 minutes", F(1, 4)], ["45 minutes", F(3, 4)], ["1 1/2 hours", F(3, 2)], ["2 hours", F(2, 1)], ["40 minutes", F(2, 3)]]);
        const sp = pick([6, 8, 9, 12, 15, 18, 24, 30, 45, 60]), d = qm(sp, h); if (!isTerm(d) || dpOf(d) > 1) return null;
        const nm = pick(NAMES), act = pick(["jogged", "cycled", "walked", "skated"]);
        return { html: `${nm} ${act} ${n$(d)} km in ${tw.replace("1 1/2", frH(F(3, 2)))}. What was the average speed?`, ans: R(sp), unit: "km/h", hints: [`${tw} = ${frH(h)} h.`, `Speed = ${n$(d)} ÷ ${frH(h)}.`], steps: [`time = ${frH(h)} h`, `${n$(d)} ÷ ${frH(h)} = <b>${sp} km/h</b>`] };
      });
    } },
    { k: "permin", label: "Speed in m/min", f() {
      const sp = pick([60, 45, 80, 75, 120, 150, 250]), m = pick([10, 4, 6, 8, 12, 5]), d = sp * m;
      return { html: `A scooter travels ${d} m in ${m} minutes. What is its speed?`, ans: R(sp), unit: "m/min", hints: ["Speed = distance ÷ time.", `${d} ÷ ${m}`], steps: [`${d} ÷ ${m} = <b>${sp} m/min</b>`] };
    } },
    { k: "distance", label: "Distance = speed × time", f() {
      if (chance(0.6)) { const v = D(pick([1.2, 0.5, 2.5, 4, 1.5, 0.8])), m = D(pick([2, 3, 5, 1.5, 4])), s = qm(m, 60), d = qm(v, s);
        return { html: `A toy car travels at an average speed of ${n$(v)} m/s. How far does it travel in ${n$(m)} minutes?`, ans: d, unit: "m", hints: [`Change ${n$(m)} minutes into seconds first.`, `${n$(m)} × 60 = ${n$(s)} s.`], steps: [`${n$(m)} min = ${n$(s)} s`, `${n$(v)} × ${n$(s)} = <b>${n$(d)} m</b>`] }; }
      const v = pick([60, 40, 90, 30, 48, 72]), m = pick([15, 20, 30, 45, 40, 10]), d = R(v * m, 60);
      return { html: `A car travels at ${v} km/h. How far does it go in ${m} minutes?`, ans: d, unit: "km", hints: [`${m} min = ${frH(R(m, 60))} h.`, `${v} × ${frH(R(m, 60))}`], steps: [`${m} min = ${frH(R(m, 60))} h`, `${v} × ${frH(R(m, 60))} = <b>${n$(d)} km</b>`] };
    } },
    { k: "timeafter", label: "Time after (a.m./p.m.)", f() {
      const [fs, fm] = pick([[[1, 3], 20], [[2, 3], 40], [[1, 4], 15], [[3, 4], 45], [[1, 2], 30], [[1, 5], 12], [[1, 6], 10], [[5, 6], 50]]), w = ri(0, 3), add = w * 60 + fm;
      const st = ri(7, 17) * 60 + pick([0, 0, 10, 15, 30, 45]), before = chance(0.2) && st - add > 6 * 60;
      const hrs = w ? `${frH(MX(w, fs[0], fs[1]))}` : fH(fs[0], fs[1]);
      return { kind: "time", fmt: "12", t: before ? st - add : st + add, html: `What time is ${hrs} h ${before ? "before" : "after"} ${t12(st)}?`, hints: [`${hrs} h = ${w ? w + " h " : ""}${fm} min.`, before ? "Count backwards." : "Add the hours, then the minutes."],
        steps: [`${hrs} h = ${w ? w + " h " : ""}${fm} min`, `${t12(st)} ${before ? "−" : "+"} ${w ? w + " h " : ""}${fm} min = <b>${t12(before ? st - add : st + add)}</b>`] };
    } }
  ]
});

/* ---------- X5. Angles & symmetry ---------- */
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
T_PRO.push({
  id: "angles", lv: "pro", pal: ["butterfly", "Bella the Symmetry Butterfly"], en: "Angles & Symmetry", zh: "角與對稱", color: "#F8BBD0",
  src: "P6 Q10a, Q10b · P7 Q10a · P8 Q9a, Q10a",
  notes: [
    "Reflex angle = 360° − the angle on the other side.",
    "Clock: each hour mark is 360° ÷ 12 = <b>30°</b>. At 1 o'clock the angle is 30°.",
    "Angle sum: triangle 180°, any quadrilateral (square, rectangle…) 360°.",
    "2 straight angles = 1 round angle = 360°.",
    "Axes of symmetry: equilateral triangle 3, square 4, rectangle 2, regular hexagon 6, parallelogram 0."
  ],
  ex: { q: "∠ABC = 44°. What is the reflex ∠ABC?", steps: ["Reflex = 360° − 44°", "= <b>316°</b>"] },
  gens: [
    { k: "reflex", label: "Reflex angle", f() {
      let th; do { th = ri(15, 170); } while (th === 90);
      return { html: `What is the size of the reflex ∠ABC?<div class="figwrap">${angleSVG(th)}</div>`, ans: R(360 - th), unit: "°", hints: ["A full turn is 360°.", `Reflex ∠ABC goes the long way round: 360° − ${th}°.`], steps: [`360° − ${th}° = <b>${360 - th}°</b>`] };
    } },
    { k: "clock", label: "Clock angles", f() {
      const h = ri(1, 11), small = Math.min(30 * h, 360 - 30 * h), type = small < 90 ? "acute" : small === 90 ? "right" : small === 180 ? "straight" : "obtuse", refl = chance(0.25) && small < 180;
      if (refl) return { html: `What is the size of the reflex angle between the hour hand and the minute hand at ${h} o'clock?<div class="figwrap">${clockSVG(h)}</div>`, ans: R(360 - small), unit: "°", hints: ["Each hour gap = 30°.", `The small angle is ${small}°. The reflex angle is the rest of 360°.`], steps: [`Small angle = ${Math.min(h, 12 - h)} × 30° = ${small}°`, `Reflex = 360° − ${small}° = <b>${360 - small}°</b>`] };
      return { html: `What is the size of the ${type === "straight" ? "" : type + " "}angle between the hour hand and the minute hand at ${h} o'clock?<div class="figwrap">${clockSVG(h)}</div>`, ans: R(small), unit: "°", hints: ["Each hour gap on a clock = 360° ÷ 12 = 30°.", `Count the gaps between the hands: ${Math.min(h, 12 - h)}.`], steps: [`${Math.min(h, 12 - h)} × 30° = <b>${small}°</b>`] };
    } },
    { k: "anglesum", label: "Angle sums", f() {
      const [s, a] = pick([["a square", 360], ["a rectangle", 360], ["a triangle", 180], ["a quadrilateral", 360], ["a rhombus", 360], ["a parallelogram", 360], ["a right-angled triangle", 180], ["a trapezium", 360]]);
      if (chance(0.25)) return { html: "What is the size of a round angle?", ans: R(360), unit: "°", hints: ["A round angle is one full turn.", "It is 2 straight angles."], steps: ["2 × 180° = <b>360°</b>"] };
      return { html: `What is the angle sum of ${s}?`, ans: R(a), unit: "°", hints: [a === 180 ? "All triangles have the same angle sum." : "Any 4-sided shape can be cut into 2 triangles.", a === 180 ? "It makes a straight angle." : "2 × 180°."], steps: [`<b>${a}°</b>`] };
    } },
    { k: "symmetry", label: "Axes of symmetry", f() {
      const [s, a] = pick([["equilateral triangle", 3], ["square", 4], ["rectangle", 2], ["isosceles triangle", 1], ["regular pentagon", 5], ["regular hexagon", 6], ["rhombus", 2], ["parallelogram", 0], ["kite", 1], ["regular octagon", 8]]);
      return { html: `How many axes of symmetry are there in ${/^[aeiou]/.test(s) ? "an" : "a"} ${s}?<div class="figwrap">${polySVG(s)}</div>`, ans: R(a), hints: ["An axis of symmetry folds the shape into two matching halves.", s.startsWith("regular") || s === "equilateral triangle" || s === "square" ? "A regular shape has as many axes as sides." : "Try folding it in your head — corner to corner and side to side."], steps: [`${s[0].toUpperCase() + s.slice(1)}: <b>${a}</b>`] };
    } }
  ]
});

/* ---------- X6. Number sense pro ---------- */
T_PRO.push({
  id: "numpro", lv: "pro", pal: ["unicorn", "Uni the Number Unicorn"], en: "Number Sense Pro", zh: "數感挑戰", color: "#B39DDB",
  src: "P6 Q9a · P7 Q4, Q9a, Q9b · P8 Q1, Q6, Q9b",
  notes: [
    "Learn the squares 11² to 25²: 121, 144, 169, 196, 225, 256, 289, 324, 361, 400, 441, 484, 529, 576, 625.",
    "1/6 = 0.1666… · 1/3 = 0.333… · 1/7 ≈ 0.142857. Round at the end.",
    "Missing number: total = average × how many, then subtract the others.",
    "<b>0 counts</b> when you find an average!",
    "0.05 ÷ 0.001: multiply both by 1000 → 50 ÷ 1 = 50."
  ],
  ex: { q: "Change 3 1/6 to a decimal (nearest thousandth).", steps: ["1/6 = 0.1666…", "3.1666… ≈ <b>3.167</b>"] },
  gens: [
    { k: "square", label: "Squares", f() {
      if (chance(0.7)) { const nn = ri(11, 25); return { html: `${nn}² = ${BL}`, ans: R(nn * nn), hints: [`${nn}² = ${nn} × ${nn}.`, `Split it: ${nn} × 10 + ${nn} × ${nn - 10}.`], steps: [`${nn} × ${nn} = ${nn * 10} + ${nn * (nn - 10)} = <b>${nn * nn}</b>`] }; }
      const x = D(pick([0.3, 1.2, 2.5, 0.9, 1.5, 0.4, 0.12])), ans = qm(x, x);
      return { html: `${n$(x)}² = ${BL}`, ans, hints: [`${n$(x)} × ${n$(x)}.`, "Count the decimal places: twice as many."], steps: [`${n$(x)} × ${n$(x)} = <b>${n$(ans)}</b>`] };
    } },
    { k: "roundfrac", label: "Fraction → rounded decimal", f() {
      const [a, d] = pick([[1, 6], [5, 6], [1, 3], [2, 3], [1, 7], [2, 7], [1, 9], [4, 9], [5, 12], [7, 12], [1, 11], [2, 9]]), w = ri(0, 5), k = pick([1, 2, 3, 3]), x = MX(w, a, d), ans = roundR(x, k);
      const what = ["", "the nearest tenth", "the nearest hundredth", "the nearest thousandth"][k];
      return { html: `Change ${frH(x)} to a decimal. (Correct it to ${what}.)`, ans, form: "dp" + k, hints: [`Work out ${fH(a, d)} to ${k + 1} decimal places first.`, "Then round — look at the next digit."], steps: [`${fH(a, d)} = ${decStr(R(Math.floor(a * 10 ** (k + 2) / d), 10 ** (k + 2)), k + 2)}…`, `${frH(x)} ≈ <b>${decStr(ans, k)}</b>`] };
    } },
    { k: "missingavg", label: "Missing number from the average", f() {
      return retry(() => {
        const nn = pick([4, 5]), avg = ri(2, 8), st = D(pick([1.2, 0.5, 1.1, 0.8, 2.4])), xs = Array.from({ length: nn - 1 }, (_, i) => qm(st, i + 1)), sum = xs.reduce((a, b) => qa(a, b), R(0)), last = qs(avg * nn, sum);
        if (qval(last) <= 0) return null;
        return { html: `The average of ${nn === 4 ? "four" : "five"} numbers is ${avg}. What is the last number if the other ${nn === 4 ? "three" : "four"} numbers are ${xs.slice(0, -1).map(n$).join(", ")} and ${n$(xs[xs.length - 1])}?`, ans: last,
          hints: [`Total of all ${nn} = ${avg} × ${nn} = ${avg * nn}.`, `Subtract the others (they add up to ${n$(sum)}).`], steps: [`Total = ${avg} × ${nn} = ${avg * nn}`, `Others = ${n$(sum)}`, `Last = ${avg * nn} − ${n$(sum)} = <b>${n$(last)}</b>`] };
      });
    } },
    { k: "avgzero", label: "Average with a 0", f() {
      return retry(() => {
        const nn = pick([5, 6]), xs = [0, ...Array.from({ length: nn - 1 }, () => R(ri(5, 90), 10))].sort((a, b) => qcmp(a, b)), sum = xs.reduce((a, b) => qa(a, b), R(0)), avg = qd(sum, nn);
        if (!qint(avg) && dpOf(avg) > 1) return null; if (!isTerm(avg)) return null;
        return { html: `Find the average of ${xs.slice(0, -1).map(n$).join(", ")}, ${n$(xs[nn - 1])}.`, ans: avg, hints: ["Add them all up.", `How many numbers? 0 counts! There are ${nn}.`], steps: [`Total = ${n$(sum)}, ${nn} numbers (including 0)`, `${n$(sum)} ÷ ${nn} = <b>${n$(avg)}</b>`] };
      });
    } },
    { k: "divtiny", label: "÷ 0.001 and friends", f() {
      const b = D(pick([0.001, 0.002, 0.004, 0.005, 0.02, 0.06, 0.003, 0.0005])), ans = ri(2, 200), a = qm(ans, b), P = Math.pow(10, dpOf(b));
      return { html: `${n$(a)} ÷ ${n$(b)}`, ans: R(ans), hints: ["Make the divisor a whole number.", `Multiply both by ${grp(String(P))}.`], steps: [`${n$(qm(a, P))} ÷ ${n$(qm(b, P))}`, `= <b>${ans}</b>`] };
    } },
    { k: "pctfracpro", label: "Tricky % → fraction", f() {
      const [a, b] = pick([[1, 9], [2, 9], [4, 9], [1, 7], [2, 7], [3, 7], [1, 11], [1, 18], [1, 45], [1, 14], [5, 9]]), ans = F(a, b), p = qm(ans, 100);
      return { html: `Change ${frH(p)}% to a fraction in the simplest form.`, ans, form: "frac", hints: [`${frH(p)} = ${impH(p)}.`, `${impH(p)} ÷ 100 — cancel before you multiply.`], steps: [`${frH(p)}% = ${impH(p)} × ${fH(1, 100)} = ${fH(p.n, p.d * 100)}`, `= <b>${frH(ans)}</b>`] };
    } }
  ]
});

const TOPICS = [...T_CORE, ...T_PRO];
const TOPIC = Object.fromEntries(TOPICS.map(t => [t.id, t]));
TOPICS.forEach(t => t.gens.forEach(g => { g.id = t.id + "." + g.k; g.topic = t.id; }));
const GEN = Object.fromEntries(TOPICS.flatMap(t => t.gens.map(g => [g.id, g])));

/* run a generator and tidy the result */
function makeQ(genId) {
  const g = GEN[genId], q = g.f.call(g);
  q.gen = genId; q.topic = g.topic; q.kind = q.kind || "num"; q.form = q.form || "any";
  if (q.kind === "choice" && q.correct === -1) q.correct = q.choices.indexOf(q.fix);
  if (q.kind === "num") q.ans = D(q.ans);
  q.uid = Math.random().toString(36).slice(2, 11);
  return q;
}

/* Mock interview blueprints (mirrors the 10-question papers with 9a/9b, 10a/10b) */
const BLUEPRINT = {
  core: [["Q1", ["ops"]], ["Q2", ["dec"]], ["Q3", ["dec", "fracmix"]], ["Q4", ["ops", "dec", "fracmix"]], ["Q5", ["eq"]], ["Q6", ["eq"]],
    ["Q7", ["compare", "shapes", "percent", "pattern"]], ["Q8", ["volume", "circle", "speed", "percent", "pattern"]],
    ["Q9a", ["units"]], ["Q9b", ["units", "volume", "convert"]], ["Q10a", ["shapes", "compare"]], ["Q10b", ["convert"]]],
  full: [["Q1", ["eqpro", "eq"]], ["Q2", ["eqpro"]], ["Q3", ["eqpro", "fracmix"]], ["Q4", ["numpro", "pattern"]], ["Q5", ["speed", "speedpro"]], ["Q6", ["circle", "circlepro"]],
    ["Q7", ["circlepro"]], ["Q8", ["pctpro", "percent"]], ["Q9a", ["numpro", "units", "volume"]], ["Q9b", ["pctpro", "convert"]], ["Q10a", ["angles"]], ["Q10b", ["speedpro", "pctpro", "angles"]]]
};

export {
  ri, pick, chance, shuffle, esc, R, D, qa, qs, qm, qd, qeq, qcmp, qval, qint, isTerm, dpOf, decStr, roundR, fH, frH, impH, nH, money, plainNum, t24, t12, two,
  parseNumText, parseEntry, entryText, stripTags, checkAnswer, FORM_MSG, ansHTML, ansEntry, speakify, parseSpoken,
  T_CORE, T_PRO, TOPICS, TOPIC, GEN, makeQ, BLUEPRINT,
};
