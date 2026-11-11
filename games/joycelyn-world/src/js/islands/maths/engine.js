// =============================================================
//  Maths Island · the maths "game": topic page, Practice, Test, Zone Test (boss),
//  Mock Interview and Fix-my-mistakes. Runs inside the shared game frame; all of its
//  screens live in a Shadow DOM (style.js) so they never clash with the island CSS.
//  Results are paid out through api.complete() → shared pouch, Star Road, boss prizes.
// =============================================================
import { store } from '../../core/store.js';
import { art } from '../../core/art.js';
import { confetti } from '../../core/fx.js';
import { playMusic, stopMusic } from '../../core/audio.js';
import * as L from './mathlib.js';
import { CSS } from './style.js';
import { MZONE, settings, tstat, gstat, palId, hasPal, medalOf, mastered, zoneOfTopic } from './data.js';

export const SCORE = false;
const { TOPIC, GEN, BLUEPRINT, makeQ, checkAnswer, ansHTML, ansEntry, entryText, speakify, parseSpoken, parseNumText, FORM_MSG, esc, pick, shuffle, two } = L;

/* ---------- encouragement ---------- */
const MSG = {
  good: ['Brilliant, {n}!', 'Nailed it! 🎯', 'Spot on!', "Yes! That's it.", 'Sharp thinking! 🧠', 'Super — you made that look easy.', 'Correct! Your brain is warming up 🔥', 'Perfect!', 'Exactly right! ✨', 'Great working, {n}!', 'Boom! 💥 Right answer.', "You're a natural!"],
  afterHint: ['Well done — the hint helped and you got there! 👍', 'Got it! Hints are how champions learn.', 'Yes! Next time you might not even need the hint.'],
  again: ["Correct on the second go — that's resilience! 💪", 'Got there! Checking your work pays off.', 'Yes! You fixed it yourself 👏'],
  try: ["Not quite — have another go. You've got this 💪", 'Close! Check your working and try again.', 'Hmm, not yet. Want a hint? 💡', 'Almost — look at it once more 👀'],
  reveal: ["That's a tricky one. Let's see how it works 👇", 'No worries — mistakes help your brain grow 🌱. Here is the method:', "Good effort! Here's the way to crack it:", "This one goes in your Oops Book — you'll beat it next time!"],
  streak: { 3: "3 in a row! You're on a roll 🎳", 5: '5 in a row — unstoppable! 🚀', 8: '8 in a row!! Interview-ready! 🏆', 12: '12 straight — legend mode 🌟', 16: '16 in a row?! Incredible, {n}! 👑' },
  iv: ['Nice. Next question…', 'OK! Here comes the next one.', 'Thank you. Next…', 'Got it. Keep going!', 'Good — stay calm and focused 🧘'],
};
const nm = (s) => s.replace(/\{n\}/g, esc(store.name()));
const msg = (k) => nm(pick(MSG[k]));
function bandMsg(p) {
  if (p >= 100) return nm("PERFECT! {n}, you're a superstar 🌟");
  if (p >= 80) return nm('Fantastic work, {n}! Just a tiny bit more to perfect 🎉');
  if (p >= 60) return "Good job! Check the ones you missed and try again — you'll get them 👍";
  if (p >= 40) return 'Nice try! Every round makes you stronger 💪';
  return "Tough round — that's how we learn! Do a Practice with hints, then come back 🌱";
}

/* ---------- speech ---------- */
let VOICE = null;
function pickVoice() { try { const vs = speechSynthesis.getVoices(); VOICE = vs.find((v) => /en[-_](GB|HK)/i.test(v.lang)) || vs.find((v) => /en[-_](AU|IE|NZ)/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null; } catch (e) { /* none */ } }
if ('speechSynthesis' in window) { pickVoice(); try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) { /* old Safari */ } }
function sayText(t) { try { const ss = window.speechSynthesis; if (!ss) return; ss.cancel(); const u = new SpeechSynthesisUtterance(t); if (VOICE) u.voice = VOICE; u.lang = VOICE ? VOICE.lang : 'en-GB'; u.rate = .9; ss.speak(u); } catch (e) { /* no speech */ } }
const hush = () => { try { speechSynthesis.cancel(); } catch (e) { /* none */ } };
const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

/* ---------- 圈圈 the panda, with a pencil ---------- */
function panda(cls = '') {
  return `<svg class="panda ${cls}" viewBox="0 0 200 212" aria-hidden="true">
<ellipse cx="100" cy="170" rx="50" ry="38" fill="#FFFDF8" stroke="#3A3340" stroke-width="4.5"/><ellipse cx="100" cy="178" rx="26" ry="20" fill="#F4EFE6"/>
<ellipse cx="70" cy="196" rx="20" ry="14" fill="#2F2B36"/><ellipse cx="130" cy="196" rx="20" ry="14" fill="#2F2B36"/><ellipse cx="70" cy="199" rx="9" ry="6.5" fill="#FFB7C5"/><ellipse cx="130" cy="199" rx="9" ry="6.5" fill="#FFB7C5"/>
<ellipse cx="62" cy="170" rx="13" ry="21" fill="#2F2B36" transform="rotate(-22 62 170)"/>
<path d="M62 150 Q100 170 138 150 L139 159 Q100 180 61 159 Z" fill="#5BC8FF" stroke="#3A3340" stroke-width="3.5" stroke-linejoin="round"/>
<ellipse cx="138" cy="168" rx="13" ry="20" fill="#2F2B36" transform="rotate(26 138 168)"/>
<g transform="translate(146 168) rotate(22)"><rect x="-6" y="-66" width="12" height="62" rx="2" fill="#FFC93C" stroke="#3A3340" stroke-width="3.5"/><path d="M-6 -66 L0 -86 L6 -66 Z" fill="#F4D3A6" stroke="#3A3340" stroke-width="3" stroke-linejoin="round"/><path d="M-2 -79 L0 -86 L2 -79 Z" fill="#3A3340"/><rect x="-6" y="-8" width="12" height="9" rx="2" fill="#FF7EB3" stroke="#3A3340" stroke-width="3"/><circle cx="0" cy="2" r="12" fill="#2F2B36"/></g>
<circle cx="48" cy="54" r="22" fill="#2F2B36"/><circle cx="50" cy="57" r="10" fill="#4C4556"/><circle cx="152" cy="54" r="22" fill="#2F2B36"/><circle cx="150" cy="57" r="10" fill="#4C4556"/>
<path d="M100 38 C148 38 170 68 169 102 C168 136 140 154 100 154 C60 154 32 136 31 102 C30 68 52 38 100 38Z" fill="#FFFDF8" stroke="#3A3340" stroke-width="4.5"/>
<ellipse cx="71" cy="106" rx="17" ry="23" fill="#2F2B36" transform="rotate(38 71 106)"/><ellipse cx="129" cy="106" rx="17" ry="23" fill="#2F2B36" transform="rotate(-38 129 106)"/>
<g class="e-n"><circle cx="75" cy="101" r="8.5" fill="#fff"/><circle cx="125" cy="101" r="8.5" fill="#fff"/><circle cx="76" cy="102" r="6" fill="#2F2B36"/><circle cx="124" cy="102" r="6" fill="#2F2B36"/><circle cx="78.4" cy="99.4" r="2.4" fill="#fff"/><circle cx="126.4" cy="99.4" r="2.4" fill="#fff"/></g>
<g class="e-y" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"><path d="M66 106 Q75 95 84 106"/><path d="M116 106 Q125 95 134 106"/></g>
<g class="e-h" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M69 97 L82 104 L69 111"/><path d="M131 97 L118 104 L131 111"/></g>
<ellipse cx="50" cy="126" rx="11" ry="6.5" fill="#FFB7C5" opacity=".85"/><ellipse cx="150" cy="126" rx="11" ry="6.5" fill="#FFB7C5" opacity=".85"/>
<ellipse cx="100" cy="121" rx="7.5" ry="5.2" fill="#2F2B36"/><ellipse cx="98" cy="119.5" rx="2.4" ry="1.4" fill="#fff" opacity=".8"/>
<g class="m-n"><path d="M93 129 Q96.5 134 100 129 Q103.5 134 107 129" fill="none" stroke="#3A3340" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
<g class="m-y"><path d="M91 128 Q100 143 109 128 Z" fill="#FF7E92" stroke="#3A3340" stroke-width="3" stroke-linejoin="round"/></g>
<g class="m-h"><path d="M93 135 Q100 128 107 135" fill="none" stroke="#3A3340" stroke-width="3" stroke-linecap="round"/><path d="M156 84 q5 10 0 14 q-5 -4 0 -14z" fill="#7FD3FF" stroke="#3A3340" stroke-width="2"/></g></svg>`;
}
const artHTML = (id, cls = '') => art(id, { cls }).outerHTML;
const starsHTML = (n, max = 3) => `<span class="stars" aria-label="${n} of ${max} stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(max - n)}</span></span>`;
const medalChip = (pb) => { const md = pb >= 0 ? medalOf(pb) : null; return pb < 0 ? '—' : `<span class="medalchip">${md ? artHTML(md[0]) : ''}${pb}%</span>`; };

export default async function play(api) {
  const m = api.mode, sfx = api.sfx;
  const host = document.createElement('div'); host.className = 'mw-host';
  api.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${CSS}</style><div class="mw" id="mw"><div class="mw-in" id="scr"></div></div><div class="modal" id="modal" hidden><div class="mbox" id="mbox" role="dialog" aria-modal="true"></div></div>`;
  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  const S = settings();
  const save = () => store.save();
  let SES = null, SCR = null, TIMER = null, REC = null, MODAL_YES = null;
  const W = { active: 's' };

  const toast = (t, ms = 2200) => api.toast(t, { ms });
  function modal(html) { $('#mbox').innerHTML = html; $('#modal').hidden = false; }
  function closeModal() { $('#modal').hidden = true; MODAL_YES = null; }
  function askConfirm(title, body, yesTxt, fn, noTxt = 'Cancel') { MODAL_YES = fn; modal(`<h3>${title}</h3><p>${body}</p><div class="row"><button class="btn" data-act="close">${noTxt}</button><button class="btn pri" data-act="yes">${yesTxt}</button></div>`); }
  const setScreen = (html) => { $('#scr').innerHTML = html; $('#mw').scrollTop = 0; };
  function mood(el, md) { if (!el) return; const p = el.querySelector('.panda'); if (!p) return; p.classList.remove('happy', 'hurt'); el.classList.remove('jump', 'shake'); void el.offsetWidth; if (md) { p.classList.add(md); el.classList.add(md === 'happy' ? 'jump' : 'shake'); } }

  /* =========================================================
     ENTRY SCREENS
     ========================================================= */
  function topicScreen(tid) {
    const t = TOPIC[tid], st = tstat(tid), got = hasPal(tid);
    api.frame.setTitle(t.en); api.frame.setProgress(0);
    const gl = t.gens.map((g) => { const s = gstat(g.id); return `<li><span>${g.label}</span><small>${s.n ? Math.round(s.c / s.n * 100) + '% of ' + s.n : 'new'}</small></li>`; }).join('');
    setScreen(`
    <div class="thead" style="--c:${t.color}"><span class="ic ${got ? '' : 'locked'}" title="${got ? t.pal[1] : 'Locked Maths Pal'}">${artHTML(t.pal[0])}</span>
      <div><h2>${t.en}</h2><div class="src">${t.lv === 'core' ? 'Core · Pages 1–5' : 'Challenge · Pages 6–8 (hard!)'} · from ${t.src}</div>
      <div style="margin-top:6px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-weight:800">Practice best ${starsHTML(st.ps)} <span>Test best: ${medalChip(st.pb)}</span>${mastered(tid) ? ' <span>👑 Mastered!</span>' : ''}</div>
      <div class="palrow">${got ? `${artHTML(t.pal[0])} You have won ${t.pal[1]}!` : `🎁 Score 80%+ in the Test to win <b>${t.pal[1]}</b> for your Maths Pals book!`}</div></div></div>
    <div class="cols">
      <div class="panel"><h3>📘 Key ideas</h3><ul class="notes">${t.notes.map((n) => `<li>${n}</li>`).join('')}</ul>
        <div class="ex"><div class="exq">Example: ${t.ex.q}</div><ol class="steps" style="margin:6px 0 0;padding-left:20px">${t.ex.steps.map((s) => `<li>${s}</li>`).join('')}</ol></div></div>
      <div>
        <div class="modebtns">
          <button class="modebtn" data-act="practice" style="--c:#E3FBEF"><span class="ic">✏️</span><span><b>Practice</b><span>8 questions · hints 💡 · scratch paper · learn as you go</span></span></button>
          <button class="modebtn" data-act="testintro" style="--c:#FFF6D6"><span class="ic">📝</span><span><b>Test</b><span>8 questions · no hints · marked at the end · win a Maths Pal</span></span></button>
        </div>
        <div class="panel" style="margin-top:16px"><h3>🧩 Skills</h3><ul class="skills">${gl}</ul></div>
        <button class="btn sm ghost" data-act="settings">⚙️ Maths settings</button>
      </div>
    </div>`);
  }
  function testIntro(tid) {
    const t = TOPIC[tid];
    modal(`<h3>📝 ${t.en} — Test</h3><p><b>8 questions. No hints, no notes.</b> You'll see your marks at the end. Score <b>80%+</b> to win <b>${t.pal[1]}</b>!</p><p>Tip: check each answer before you tap Next. Fractions in simplest form!</p><div class="row"><button class="btn" data-act="close">Not yet</button><button class="btn go" data-act="starttest">Start ▶</button></div>`);
  }
  function zoneIntro(zid) {
    const z = MZONE[zid], names = z.topics.map((x) => TOPIC[x].en).join(', ');
    api.frame.setTitle(`Zone Test · ${z.title}`);
    setScreen(`<div class="thead bosshead" style="--c:#2B2140"><span class="ic">${artHTML(z.boss.art)}</span><div><h2>${z.boss.title}</h2><div class="src" style="color:#fff0">.</div>
      <div style="font-weight:800">challenges you to the <b>${z.title} Zone Test</b>!</div></div></div>
      <div class="panel"><h3>The rules</h3><ul class="introtips"><li><b>10 questions</b> mixed from: ${names}.</li><li>No hints, no notes — just like an exam. Marks at the end.</li><li>Score <b>80% or more</b> to beat ${z.boss.title}. The first win gives you a prize!</li></ul>
      <div class="btnrow"><button class="btn go" data-act="startzone">Fight! ▶</button><button class="btn" data-act="exit">Back to the island</button></div></div>`);
  }
  function interviewIntro(kind) {
    api.frame.setTitle(kind === 'core' ? 'Mock Interview · Core' : 'Mock Interview · Full');
    setScreen(`<div class="thead" style="--c:var(--sun)"><span class="ic">🎤</span><div><h2>${kind === 'core' ? 'Mock Interview · Core (Pages 1–5)' : 'Mock Interview · Full (Pages 1–8)'}</h2>
      <div style="font-weight:800;margin-top:4px">12 quick questions, just like the Mental papers (Q1–Q10 with 9a/9b and 10a/10b).</div></div></div>
      <div class="cols"><div class="panel"><h3>Interview tips</h3><ul class="introtips">
        <li>${S.speak ? 'Each question is read aloud. ' : ''}${S.itime ? `You have <b>${S.itime} seconds</b> per question.` : 'No time limit.'} No hints, no paper.</li>
        <li>Listen to the whole question first. Work it out in your head.</li>
        <li>Say the <b>unit</b> (cm³, m/s, %…). Fractions in simplest form.</li>
        <li>Stuck? Say what you know — or Pass and move on. Marks at the end.</li></ul></div>
      <div class="modebtns">
        <button class="modebtn" data-act="startiv" data-arg="type" style="--c:#E3FBEF"><span class="ic">✍️</span><span><b>Type or write</b><span>Keypad, Apple Pencil or 🎤 voice</span></span></button>
        <button class="modebtn" data-act="startiv" data-arg="oral" style="--c:#FFE7F2"><span class="ic">🗣️</span><span><b>Say it out loud</b><span>A grown-up plays the interviewer and marks you</span></span></button>
        <button class="btn sm ghost" data-act="settings">⚙️ Interview settings</button></div></div>`);
  }
  function settingsHTML() {
    const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${S[k] === v ? 'on' : ''}" data-act="set" data-arg="${k}:${v}">${l}</button>`).join('')}</div>`;
    return `<h3>⚙️ Maths settings</h3>
    <div class="setrow"><span><b>Answer with</b><br><small>Keypad: on-screen buttons (Apple Pencil can also write in the boxes). iPad keyboard: the system keyboard, with its 🎤 dictation key.</small></span>${seg('input', [['pad', 'Keypad'], ['kbd', 'iPad keyboard']])}</div>
    <div class="setrow"><b>Interview time per question</b>${seg('itime', [[30, '30 s'], [45, '45 s'], [60, '60 s'], [90, '90 s'], [0, 'Off']])}</div>
    <div class="setrow"><b>Read interview questions aloud</b>${seg('speak', [[true, 'On'], [false, 'Off']])}</div>
    <div class="setrow"><b>Scratch paper in Tests</b>${seg('scratchTest', [[true, 'On'], [false, 'Off']])}</div>
    <div class="row"><button class="btn pri" data-act="close">Done</button></div>`;
  }

  /* =========================================================
     SESSION ENGINE
     ========================================================= */
  function newEntry(q) {
    if (q.kind === 'choice') return { idx: null };
    if (q.kind === 'time') return { h: '', m: '', ap: '' };
    if (q.kind === 'order') return { order: [], signs: Array(q.items.length - 1).fill('?') };
    return { mode: 'n', s: '', w: '', n: '', d: '' };
  }
  const mkItem = (q, extra = {}) => Object.assign({ q, entry: newEntry(q), tries: 0, hints: 0, ok: null, first: null, done: false, revealed: false, shownSteps: false, ms: 0, fb: null, retry: false }, extra);
  function genList(ids, n) { const out = []; let pool = []; while (out.length < n) { if (!pool.length) pool = shuffle(ids); let k = pool.findIndex((g) => g !== out[out.length - 1]); if (k < 0) k = 0; out.push(pool.splice(k, 1)[0]); } return out; }
  function start(kind, arg, oral = false) {
    let items = [], title = m.title, topic = null;
    if (kind === 'practice' || kind === 'test') { topic = arg; title = (kind === 'practice' ? 'Practice · ' : 'Test · ') + TOPIC[arg].en; items = genList(TOPIC[arg].gens.map((g) => g.id), 8).map((id) => mkItem(makeQ(id))); }
    else if (kind === 'zone') { const z = MZONE[arg]; title = `Zone Test · ${z.title}`; items = genList(z.topics.flatMap((t) => TOPIC[t].gens.map((g) => g.id)), 10).map((id) => mkItem(makeQ(id))); }
    else if (kind === 'fix') { title = 'Fix my mistakes'; const gens = arg.filter((g) => GEN[g]).slice(0, 8); items = genList(gens, Math.max(4, Math.min(8, gens.length * 2))).map((id) => mkItem(makeQ(id))); }
    else if (kind === 'interview') { title = arg === 'core' ? 'Mock Interview · Core' : 'Mock Interview · Full'; items = BLUEPRINT[arg].map(([lab, tids]) => mkItem(makeQ(pick(TOPIC[pick(tids)].gens).id), { lab })); }
    SES = { kind, arg, topic, title, items, i: 0, combo: 0, best: 0, t0: Date.now(), qT0: Date.now(), oral, retries: 0, fixed: 0 };
    api.frame.setTitle(title);
    if (kind === 'interview') stopMusic(); else playMusic(kind === 'practice' || kind === 'fix' ? 'lab' : 'garden');
    renderPlay(); onItemShown();
  }
  const cur = () => SES && SES.items[SES.i];
  const isTestLike = () => SES && (SES.kind === 'test' || SES.kind === 'interview' || SES.kind === 'zone');
  const isPractice = () => SES && (SES.kind === 'practice' || SES.kind === 'fix');

  function stopTimer() { clearInterval(TIMER); TIMER = null; }
  function startTimer() {
    stopTimer();
    TIMER = setInterval(() => {
      if (!api.alive || !SES) return stopTimer();
      const el = $('#tmr'); if (!el) return;
      if (SES.kind === 'interview' && S.itime > 0) {
        const it = cur(); if (it.done || it.revealed) return;
        const left = Math.max(0, S.itime - Math.floor((Date.now() - SES.qT0) / 1000));
        el.textContent = `⏱ ${left}s`; el.classList.toggle('warn', left <= 5);
        if (left <= 5 && left > 0 && el.dataset.last != left) { el.dataset.last = left; sfx.tick(); }
        if (left <= 0) { if (SES.oral) { it.revealed = true; it.ms = S.itime * 1000; toast("⏰ Time's up! Did you say it in time?"); $('#ansArea').innerHTML = answerHTML(it); } else interviewSubmit(true); }
      } else { const s = Math.floor((Date.now() - SES.t0) / 1000); el.textContent = `⏱ ${Math.floor(s / 60)}:${two(s % 60)}`; }
    }, 250);
  }
  function onItemShown() {
    SES.qT0 = Date.now(); W.active = firstField(cur().q, cur().entry);
    api.frame.setProgress(SES.i / SES.items.length);
    if (SES.kind === 'interview' && S.speak) setTimeout(() => { if (api.alive && cur()) sayText(speakify(cur().q.html)); }, 250);
  }

  /* ---------- play screen ---------- */
  function renderPlay() {
    if (!SES) return;
    const it = cur(), q = it.q, k = SES.kind;
    const showScratch = isPractice() || ((k === 'test' || k === 'zone') && S.scratchTest);
    const dots = SES.items.map((x, i) => {
      let c = i === SES.i ? 'cur' : '';
      if (!isTestLike()) { if (x.done) c += x.first ? ' ok' : ' no'; } else if (x.done || ((k === 'test' || k === 'zone') && hasEntry(x))) c += ' done';
      return `<button class="dot ${c}" ${k === 'test' || k === 'zone' ? `data-act="jump" data-arg="${i}"` : "tabindex='-1'"} aria-label="Question ${i + 1}">${x.lab ? x.lab.replace('Q', '') : i + 1}</button>`;
    }).join('');
    const needPad = !SES.oral && (q.kind === 'num' || q.kind === 'time');
    setScreen(`<div class="play">
      <div class="phead"><span class="chip">${{ practice: '✏️ Practice', test: '📝 Test', zone: '⚔️ Zone Test', interview: SES.oral ? '🗣️ Interview (say it)' : '🎤 Interview', fix: '🩹 Fix' }[k]}</span>
        <div class="dots">${dots}</div>
        ${isPractice() ? `<span class="chip combo" id="combo">🔥 ${SES.combo}</span>` : ''}
        <span class="chip timer" id="tmr">⏱</span>
        ${k === 'test' || k === 'zone' ? '<button class="btn sm pri" data-act="finishtest">Finish ✓</button>' : ''}</div>
      <div class="qcard"><div class="qnum">${it.lab || 'Question ' + (SES.i + 1)}${it.retry ? " · <span style='color:var(--octo)'>try a new one like this</span>" : ''}</div>
        <div class="qtext">${q.html}</div><button class="say" data-act="say" aria-label="Read the question aloud">🔊</button></div>
      <div class="answer" id="ansArea">${answerHTML(it)}</div>
      <div class="act" id="actArea">${actHTML(it)}</div>
      <div class="work">${showScratch ? scratchHTML() : `<div class="nopaper"><div><div class="big">🧠</div>${k === 'interview' ? 'No paper in an interview —<br>work it out in your head!' : 'Scratch paper is off for tests.'}</div></div>`}</div>
      <div class="side">${needPad ? keypadHTML(q) : ''}<div class="mascot" id="mascot"><div>${panda()}</div><div class="bubble" id="bubble">${bubbleText(it)}</div></div></div>
    </div>`);
    if (showScratch) initScratch();
    refreshBoxes(); startTimer();
    if (!SES.oral && (q.kind === 'num' || q.kind === 'time') && !it.done && matchMedia('(pointer:fine)').matches) { const b = $(`.abox[data-f="${W.active}"]`); if (b) b.focus({ preventScroll: true }); }
  }
  function bubbleText(it) {
    const k = SES.kind;
    if (k === 'interview') return SES.oral ? 'Say your answer out loud, then tap <b>Show answer</b>.' : "Think in your head, then answer. Don't forget the unit!";
    if (k === 'test' || k === 'zone') return 'No hints in a test — you can do it! Check your answer before moving on.';
    if (it.tries) return 'Read the hint, check your working, and try again!';
    return pick(['Write your working on the scratch paper ✏️', 'Stuck? Tap 💡 Hint.', 'Take your time — accuracy first, speed later.', 'Use 📘 Notes if you forget the method.']);
  }
  function hasEntry(it) { const e = it.entry; if (!e) return false; if (it.q.kind === 'choice') return e.idx != null; if (it.q.kind === 'order') return e.order.length > 0; if (it.q.kind === 'time') return !!(e.h || e.m); return !!(e.s || e.n || e.d || e.w); }
  function firstField(q, e) { if (q.kind === 'time') return 'h'; if (q.kind !== 'num') return ''; return e.mode === 'n' ? 's' : e.mode === 'f' ? 'n' : 'w'; }
  function fieldsOf(q, e) { if (q.kind === 'time') return ['h', 'm']; return e.mode === 'n' ? ['s'] : e.mode === 'f' ? ['n', 'd'] : ['w', 'n', 'd']; }

  /* ---------- answer widget ---------- */
  const box = (f, val, cls = '', dis = false) => `<input class="abox ${cls}" data-f="${f}" value="${esc(val || '')}" inputmode="${S.input === 'kbd' ? 'decimal' : 'none'}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" aria-label="answer ${f}"${dis ? ' disabled' : ''}>`;
  function answerHTML(it) {
    const q = it.q, e = it.entry, lock = it.done;
    if (SES.oral) {
      if (!it.revealed) return '<span class="lbl">🗣️ Say your answer out loud…</span><span style="flex:1"></span><button class="btn pri" data-act="reveal">Show answer</button>';
      if (!it.done) return `<span class="lbl">Answer:</span><span class="aw">${ansHTML(q)}</span><span style="flex:1"></span><button class="btn go" data-act="self" data-arg="1">✅ Got it</button><button class="btn pink" data-act="self" data-arg="0">❌ Not this time</button>`;
      return `<span class="lbl">Answer:</span><span class="aw">${ansHTML(q)}</span>`;
    }
    const mic = SR && !lock && q.kind !== 'order' ? '<button class="mic" data-act="mic" aria-label="Say your answer">🎤</button>' : '';
    if (q.kind === 'choice') {
      const showRes = it.done && !isTestLike();
      return `<div class="choices">${q.choices.map((c, i) => `<button class="choice ${e.idx === i ? 'on' : ''} ${showRes && i === q.correct ? 'right' : ''} ${showRes && e.idx === i && i !== q.correct ? 'wrong' : ''}" data-act="choose" data-arg="${i}"${lock ? ' disabled' : ''}>${c}</button>`).join('')}</div>${mic}<div class="heard" id="heard"></div>`;
    }
    if (q.kind === 'order') {
      const used = new Set(e.order), sym = q.dir === 'desc' ? '&gt;' : '&lt;';
      const slots = q.items.map((_, k) => {
        const filled = e.order[k] != null;
        const sl = `<button class="oslot ${filled ? 'full' : ''}" data-act="ounpick" data-arg="${k}"${lock ? ' disabled' : ''}>${filled ? q.items[e.order[k]].html : '&nbsp;'}</button>`;
        return sl + (k < q.items.length - 1 ? `<button class="osign" data-act="osign" data-arg="${k}"${lock ? ' disabled' : ''}>${e.signs[k] === '?' ? '?' : e.signs[k] === '<' ? '&lt;' : '&gt;'}</button>` : '');
      }).join('');
      return `<div class="ord"><div class="ordpool"><span class="lbl">Tap in order →</span>${q.items.map((x, i) => `<button class="ochip ${used.has(i) ? 'used' : ''}" data-act="opick" data-arg="${i}"${lock ? ' disabled' : ''}>${x.html}</button>`).join('')}</div>
        <div class="ordslots">${slots}<button class="btn sm ghost" data-act="oclear"${lock ? ' disabled' : ''}>Clear</button></div><small class="lbl">Tap a sign to change it (${sym}). Tap a box to take a number out.</small></div>`;
    }
    if (q.kind === 'time') {
      return `<span class="lbl">Answer:</span><div class="timebox">${box('h', e.h, 'sm', lock)}<span>:</span>${box('m', e.m, 'sm', lock)}
        ${q.fmt === '12' ? `<span class="ap"><button class="mbtn ${e.ap === 'a.m.' ? 'on' : ''}" data-act="ap" data-arg="a.m."${lock ? ' disabled' : ''}>a.m.</button><button class="mbtn ${e.ap === 'p.m.' ? 'on' : ''}" data-act="ap" data-arg="p.m."${lock ? ' disabled' : ''}>p.m.</button></span>` : '<small class="lbl">(24-hour)</small>'}</div>${mic}<div class="heard" id="heard"></div>`;
    }
    let core;
    if (e.mode === 'n') core = box('s', e.s, 'wide', lock);
    else if (e.mode === 'f') core = `<span class="afr">${box('n', e.n, 'sm', lock)}<span class="bar"></span>${box('d', e.d, 'sm', lock)}</span>`;
    else core = `${box('w', e.w, 'sm', lock)}<span class="afr">${box('n', e.n, 'sm', lock)}<span class="bar"></span>${box('d', e.d, 'sm', lock)}</span>`;
    return `<span class="lbl">Answer:</span><div class="aw">${q.pre ? `<span class="pre">${q.pre}</span>` : ''}${core}${q.unit ? `<span class="unit">${q.unit}</span>` : ''}</div>
      <div class="modes">${[['n', '123'], ['f', 'a/b'], ['m', 'a b/c']].map(([md, l]) => `<button class="mbtn ${e.mode === md ? 'on' : ''}" data-act="mode" data-arg="${md}"${lock ? ' disabled' : ''} aria-label="${{ n: 'whole number or decimal', f: 'fraction', m: 'mixed number' }[md]}">${l}</button>`).join('')}</div>${mic}<div class="heard" id="heard"></div>`;
  }
  function keypadHTML(q) {
    const K = (k, l = k, c = '') => `<button class="key ${c}" data-act="key" data-arg="${k}" aria-label="${l}">${l}</button>`;
    const top = `${K('7')}${K('8')}${K('9')}${K('del', '⌫', 'del')}${K('4')}${K('5')}${K('6')}${K('clr', 'C', 'del')}${K('1')}${K('2')}${K('3')}`;
    if (q.kind === 'time') return `<div class="keypad">${top}${K('next', ':', 'fn')}${K('0')}<span></span><span></span>${K('next', '▶', 'fn')}</div>`;
    return `<div class="keypad">${top}${K('f', 'a/b', 'fn')}${K('0')}${K('.')}${K('next', '▶', 'fn')}${K('m', 'a b/c', 'fn')}</div>`;
  }
  function refreshBoxes() {
    const it = cur(); if (!it) return;
    $$('.abox').forEach((b) => { const f = b.dataset.f; if (root.activeElement !== b || b.value !== (it.entry[f] || '')) b.value = it.entry[f] || ''; b.classList.toggle('on', f === W.active && !it.done); });
  }
  function setMode(md) {
    const it = cur(), e = it.entry; if (it.done || e.mode === md) return;
    const keepW = md === 'm' && e.mode === 'n' && /^\d+$/.test(e.s) ? e.s : '';
    Object.assign(e, { mode: md, s: '', w: keepW, n: '', d: '' });
    W.active = md === 'm' && keepW ? 'n' : firstField(it.q, e);
    $('#ansArea').innerHTML = answerHTML(it); refreshBoxes();
  }
  function keyPress(k) {
    const it = cur(); if (!it || it.done || SES.oral) return;
    const q = it.q, e = it.entry;
    if (k === 'f' || k === 'm' || k === 'n') { setMode(k); sfx.tap(); return; }
    const fs = fieldsOf(q, e); let f = fs.includes(W.active) ? W.active : fs[0];
    if (k === 'next') W.active = fs[(fs.indexOf(f) + 1) % fs.length];
    else if (k === 'del') e[f] = (e[f] || '').slice(0, -1);
    else if (k === 'clr') { fs.forEach((x) => { e[x] = ''; }); W.active = fs[0]; }
    else {
      if (k === '.' && (f !== 's' || (e[f] || '').includes('.'))) return;
      const lim = q.kind === 'time' ? 2 : 9;
      if ((e[f] || '').length >= lim) { if (q.kind === 'time' && f === 'h') { W.active = 'm'; f = 'm'; if ((e.m || '').length >= 2) return; } else return; }
      e[f] = (e[f] || '') + k;
      if (q.kind === 'time' && f === 'h' && e.h.length >= 2) W.active = 'm';
    }
    sfx.tap(); refreshBoxes(); clearFb();
  }
  function clearFb() { const it = cur(); if (it && it.fb && it.fb.type === 'bad' && !it.done) { it.fb = null; const a = $('#actArea'); if (a) a.innerHTML = actHTML(it); } }
  function cleanTyped(v, f) { v = String(v).replace(/[Oo]/g, '0').replace(/[lI|]/g, '1').replace(/[，,]/g, '').replace(/[^\d./ ]/g, ''); if (f !== 's') v = v.replace(/[^\d]/g, ''); return v.slice(0, 14); }

  /* ---------- actions ---------- */
  function actHTML(it) {
    const k = SES.kind, q = it.q;
    if (SES.oral) return it.done ? `<span class="grow"></span><button class="btn go" data-act="next">${SES.i === SES.items.length - 1 ? 'See results 🏁' : 'Next question ▶'}</button>` : '';
    if (k === 'interview') return '<button class="btn" data-act="pass">Pass</button><span class="grow"></span><button class="btn go" data-act="ivsubmit">Answer ✓</button>';
    if (k === 'test' || k === 'zone') return `<button class="btn" data-act="prev"${SES.i === 0 ? ' disabled' : ''}>◀ Back</button><span class="grow"></span>${SES.i < SES.items.length - 1 ? '<button class="btn go" data-act="tnext">Next ▶</button>' : '<button class="btn go" data-act="finishtest">Finish ✓</button>'}`;
    let hh = '';
    if (it.hints && !it.done) hh += `<div class="hintbox">${q.hints.slice(0, it.hints).map((x, i) => `<p>💡 ${i + 1}. ${x}</p>`).join('')}${it.shownSteps ? `<p>👣 Method:</p><ol class="steps" style="margin:0;padding-left:22px">${q.steps.map((s) => `<li>${s}</li>`).join('')}</ol>` : ''}</div>`;
    if (it.fb) hh += fbHTML(it);
    if (it.done) return hh + `<span class="grow"></span><button class="btn go" data-act="next">${SES.i === SES.items.length - 1 ? 'See results 🏁' : 'Next ▶'}</button>`;
    const hb = it.hints < q.hints.length ? `💡 Hint${it.hints ? ' ' + (it.hints + 1) : ''}` : it.shownSteps ? '' : '👣 Show method';
    return hh + `${hb ? `<button class="btn" data-act="hint">${hb}</button>` : ''}<button class="btn" data-act="notes">📘 Notes</button><span class="grow"></span><button class="btn go" data-act="check">Check ✓</button>`;
  }
  function fbHTML(it) {
    const f = it.fb, q = it.q, steps = `<ol class="steps">${q.steps.map((s) => `<li>${s}</li>`).join('')}</ol>`;
    if (f.type === 'good') return `<div class="fb good"><h4>${f.msg}</h4>${f.extra ? `<div style="font-weight:800">${f.extra}</div>` : ''}<details${it.tries ? ' open' : ''}><summary style="font-weight:900;cursor:pointer;color:#2E7DFF">See the method</summary>${steps}</details></div>`;
    if (f.type === 'bad') return `<div class="fb bad"><h4>${f.msg}</h4>${f.extra ? `<div style="font-weight:800">${f.extra}</div>` : ''}</div>`;
    return `<div class="fb info"><h4>${f.msg}</h4><div class="ansline">Answer: ${ansHTML(q)}</div>${steps}</div>`;
  }
  function noteStats(q, ok) { const g = gstat(q.gen); g.n++; if (ok) g.c++; const t = tstat(q.topic); t.n++; if (ok) t.c++; t.last = Date.now(); }
  function logMistake(it) {
    const q = it.q;
    store.mistake({ pack: 'maths', key: `m-${q.uid}`, html: true, q: q.html, you: entryText(q, it.entry), ans: ansHTML(q), why: q.steps.join('<br>'), game: TOPIC[q.topic].en, gen: q.gen });
  }
  function practiceCheck() {
    const it = cur(); if (!it || it.done) return;
    const r = checkAnswer(it.q, it.entry);
    if (r.empty) { toast('✏️ Write your answer first'); return; }
    if (it.tries === 0) noteStats(it.q, r.ok && !it.hints);
    if (r.ok) {
      it.done = true; it.ok = true; it.first = it.tries === 0 && it.hints === 0;
      SES.combo++; SES.best = Math.max(SES.best, SES.combo);
      const sm = MSG.streak[SES.combo];
      it.fb = { type: 'good', msg: it.first ? msg('good') : it.hints ? msg('afterHint') : msg('again'), extra: sm ? nm(sm) : '' };
      if (SES.kind === 'fix' && it.first) {
        const before = store.get().mistakes.length;
        store.get().mistakes.filter((x) => x.pack === 'maths' && x.gen === it.q.gen).forEach((x) => store.clearMistake(x.key));
        if (store.get().mistakes.length < before) { SES.fixed++; it.fb.extra = (it.fb.extra ? it.fb.extra + ' ' : '') + '🩹 Fixed — removed from your Oops Book!'; }
      }
      sfx.good(); if (sm) { sfx.star(); if (SES.combo >= 5) confetti(70); }
      mood($('#mascot'), 'happy'); $('#bubble').innerHTML = it.fb.msg;
    } else {
      it.tries++; SES.combo = 0; sfx.bad(); mood($('#mascot'), 'hurt');
      if (it.tries === 1) {
        it.fb = { type: 'bad', msg: r.form ? 'So close!' : msg('try'), extra: r.form ? FORM_MSG[r.form] : (it.hints < it.q.hints.length ? "Tap 💡 Hint if you'd like a clue." : '') };
        $('#bubble').innerHTML = r.form ? 'Nearly! Just fix how you wrote it.' : 'Try once more — you can do it!';
      } else {
        it.done = true; it.ok = false; it.first = false; it.revealed = true;
        it.fb = { type: 'info', msg: msg('reveal') };
        logMistake(it);
        if (SES.retries < 4) { SES.items.push(mkItem(makeQ(it.q.gen), { retry: true })); SES.retries++; }
        $('#bubble').innerHTML = "A new one like this is coming up later — you'll get it!";
      }
    }
    save();
    $('#ansArea').innerHTML = answerHTML(it); refreshBoxes();
    $('#actArea').innerHTML = actHTML(it);
    updateDots(); const c = $('#combo'); if (c) c.textContent = `🔥 ${SES.combo}`;
  }
  function updateDots() {
    $$('.dots .dot').forEach((d, i) => { const x = SES.items[i]; if (x && !isTestLike() && x.done) d.classList.add(x.first ? 'ok' : 'no'); });
    const dots = $('.dots'); if (dots && dots.children.length !== SES.items.length) renderPlay();
  }
  function showHint() { const it = cur(); if (!it || it.done) return; if (it.hints < it.q.hints.length) it.hints++; else it.shownSteps = true; sfx.pop(); $('#actArea').innerHTML = actHTML(it); }
  function nextItem() { if (SES.i >= SES.items.length - 1) return finishSession(); SES.i++; sfx.whoosh(); onItemShown(); renderPlay(); }
  function interviewSubmit(timeUp = false, passed = false) {
    const it = cur(); if (!it || it.done) return;
    if (!timeUp && !passed && !hasEntry(it)) { toast('Not sure? Tap Pass and keep going 🙂'); return; }
    it.done = true; it.ms = Date.now() - SES.qT0;
    const r = checkAnswer(it.q, it.entry); it.ok = r.ok; it.first = r.ok;
    hush(); sfx.whoosh(); toast(passed ? 'Passed — no worries, next one!' : timeUp ? "⏰ Time's up!" : pick(MSG.iv), 1300);
    setTimeout(() => { if (api.alive && SES && cur() === it) nextItem(); }, timeUp ? 700 : 350);
  }
  function selfMark(ok) {
    const it = cur(); if (!it || it.done) return;
    it.done = true; it.ok = ok; it.first = ok; it.entry = { self: ok }; if (!it.ms) it.ms = Date.now() - SES.qT0;
    ok ? sfx.good() : sfx.bad(); mood($('#mascot'), ok ? 'happy' : 'hurt');
    $('#ansArea').innerHTML = answerHTML(it); $('#actArea').innerHTML = actHTML(it);
  }
  function finishTest(force) {
    const blanks = SES.items.filter((x) => !hasEntry(x)).length;
    if (blanks && !force) return askConfirm('Finish the test?', `You have ${blanks} question${blanks > 1 ? 's' : ''} with no answer.`, 'Finish anyway', () => finishTest(true), 'Keep going');
    closeModal(); finishSession();
  }

  /* ---------- results ---------- */
  function finishSession() {
    stopTimer(); hush(); api.frame.setProgress(1);
    const k = SES.kind, items = SES.items, res = { kind: k, arg: SES.arg, topic: SES.topic, items, oral: SES.oral, lines: [] };
    const secs = Math.round((Date.now() - SES.t0) / 1000);
    let pay;
    if (k === 'practice' || k === 'fix') {
      const base = items.filter((x) => !x.retry), first = base.filter((x) => x.first).length, n = base.length;
      res.score = first; res.total = n; res.pct = Math.round(first / n * 100);
      res.stars = first >= n - 1 ? 3 : first >= Math.ceil(n * .6) ? 2 : first >= Math.ceil(n * .35) ? 1 : 0;
      if (k === 'practice') { const t = tstat(SES.topic); if (res.stars > t.ps) t.ps = res.stars; pay = api.complete({ stars: res.stars, score: res.pct }); }
      else pay = api.complete({ stars: Math.min(3, SES.fixed), score: SES.fixed, recordAs: 'm-fix' });
      res.head = res.stars ? 'Practice complete!' : 'Practice done — keep going!';
      res.line = `${first} / ${n} right first time · best streak ${SES.best} 🔥`;
      if (SES.fixed) res.lines.push(`🩹 ${SES.fixed} mistake type${SES.fixed > 1 ? 's' : ''} fixed`);
    } else {
      let correct = 0;
      items.forEach((x) => { if (!SES.oral) { const r = checkAnswer(x.q, x.entry); x.ok = r.ok; x.form = r.form; } if (x.ok) correct++; noteStats(x.q, x.ok); if (!x.ok) logMistake(x); });
      res.score = correct; res.total = items.length; res.pct = Math.round(correct / items.length * 100);
      if (k === 'test') {
        const t = tstat(SES.topic), md = medalOf(res.pct);
        res.medal = md; res.stars = md ? md[2] : 0;
        if (res.pct > t.pb) { if (t.pb >= 0) res.lines.push('📈 New best score!'); t.pb = res.pct; }
        if (res.pct >= 80 && store.unlock(palId(SES.topic))) res.newPal = SES.topic;
        store.pack('maths').tests.push({ t: Date.now(), topic: SES.topic, score: correct, total: items.length }); store.pack('maths').tests = store.pack('maths').tests.slice(-100);
        pay = api.complete({ stars: res.stars, score: res.pct, recordAs: `${m.id}-t` });
        res.head = md ? `${md[1]} medal!` : 'Test finished'; res.line = `${correct} / ${items.length} correct · ${Math.floor(secs / 60)} min ${secs % 60} s`;
      } else if (k === 'zone') {
        const won = res.pct >= 80; res.stars = res.pct >= 100 ? 3 : res.pct >= 90 ? 2 : won ? 1 : 0; res.won = won;
        pay = api.complete({ stars: res.stars, score: res.pct, won });
        const z = MZONE[SES.arg];
        res.head = won ? `You beat ${z.boss.title}!` : `${z.boss.title} wins this time`; res.line = `${correct} / ${items.length} correct · you need 8 to win`;
      } else {
        const answered = items.filter((x) => x.ms), avg = answered.length ? Math.round(answered.reduce((a, x) => a + x.ms, 0) / answered.length / 1000) : 0;
        const fast = items.filter((x) => x.ok && x.ms && x.ms < 10000).length;
        res.stars = correct >= 11 ? 3 : correct >= 9 ? 2 : correct >= 6 ? 1 : 0;
        store.pack('maths').interviews.push({ t: Date.now(), kind: SES.arg, score: correct, total: items.length, avg, fast, oral: SES.oral }); store.pack('maths').interviews = store.pack('maths').interviews.slice(-60);
        pay = api.complete({ stars: res.stars, score: correct });
        res.head = correct >= 11 ? 'Interview star! 🌟' : correct >= 9 ? 'Great interview!' : correct >= 6 ? 'Good effort!' : 'Interview practice done';
        res.line = `${correct} / ${items.length} correct · about ${avg} s per question${fast ? ` · ⚡ ${fast} lightning answers` : ''}`;
        if (fast) res.lines.push(`⚡ ${fast} answer${fast > 1 ? 's' : ''} under 10 s`);
      }
    }
    save(); res.pay = pay; SES = null;
    renderResult(res);
    playMusic(res.pct >= 60 ? 'victory' : 'island');
    if (res.pct >= 80 || res.newPal || (pay && pay.firstBossWin)) { sfx.win(); confetti(140); } else if (res.pct >= 50) sfx.star(); else sfx.lose();
    if (res.newPal) setTimeout(() => { if (!api.alive) return; const t = TOPIC[res.newPal]; modal(`<div style="text-align:center"><div class="medal" style="display:inline-block;width:120px;height:120px">${artHTML(t.pal[0])}</div><h3>New Maths Pal: ${t.pal[1]}!</h3><p>You scored 80%+ in ${t.en}. ${t.pal[1].split(' ')[0]} now lives on Maths Island and in your Maths Pals book.</p></div><div class="row" style="justify-content:center"><button class="btn pri" data-act="close">Yay! 🎉</button></div>`); confetti(); }, 900);
    if (pay && pay.firstBossWin && pay.prize) setTimeout(() => { if (api.alive) api.openGift(pay.prize.id, { sub: `${MZONE[res.arg].boss.title} dropped a gift.` }); }, 1500);
  }
  function renderResult(res) {
    const k = res.kind, p = res.pay || {};
    const big = k === 'test' ? (res.medal ? `<span class="medal" style="display:inline-block;width:74px;height:74px">${artHTML(res.medal[0])}</span> <span class="score">${res.pct}%</span>` : `<span class="score">${res.pct}%</span>`)
      : k === 'interview' ? `<span class="score">${res.score} / ${res.total}</span>` : k === 'zone' ? `<span class="score">${res.score} / ${res.total}</span>` : '';
    const stars = `<div class="bigstars">${[0, 1, 2].map((i) => `<span class="${i < res.stars ? '' : 'off'}" style="animation-delay:${.2 + i * .25}s">⭐</span>`).join('')}</div>`;
    const rewards = [];
    if (p.earned + p.bossBonus > 0) rewards.push(`<span class="reward">${artHTML('star')}+${p.earned + p.bossBonus} to your pouch${p.bossBonus ? ` (boss bonus +${p.bossBonus})` : ''} · you have ${p.pouch}</span>`);
    if (p.newBest) rewards.push('<span class="reward">📈 New best!</span>');
    res.lines.forEach((l) => rewards.push(`<span class="reward">${l}</span>`));
    if (res.newPal) rewards.push(`<span class="reward">${artHTML(TOPIC[res.newPal].pal[0])}New Maths Pal!</span>`);
    if (p.newGifts) rewards.push('<button class="reward giftbtn" data-act="road">🎁 A Star Road gift is waiting — open it</button>');
    else if (p.nextRoad) rewards.push(`<span class="reward">${artHTML('gift')}Star Road: ${p.nextRoad.at - p.lifetime} more stars to the next gift</span>`);
    const rev = res.items.map((x) => `<li><span class="mk ${x.ok ? 'ok' : 'no'}">${x.ok ? '✓' : x.retry ? '↺' : '✗'}</span><div>
       <div class="rq">${x.lab ? `<small class="src">${x.lab}</small> ` : ''}${x.q.html}</div>
       <div class="ra">${res.oral ? '' : `You: <b>${esc(entryText(x.q, x.entry))}</b>${x.ms ? ` <small>(${Math.round(x.ms / 1000)} s)</small>` : ''} · `}Answer: <b>${ansHTML(x.q)}</b>${x.form ? ` <small>— ${FORM_MSG[x.form]}</small>` : ''}</div>
       <details${x.ok ? '' : ' open'}><summary>How to do it</summary><ol class="steps">${x.q.steps.map((s) => `<li>${s}</li>`).join('')}</ol></details></div></li>`).join('');
    const again = k === 'interview' ? `<button class="btn go" data-act="again">🎤 Another interview</button>` : k === 'zone' ? `<button class="btn go" data-act="again">${res.won ? '⚔️ Rematch' : '⚔️ Try again'}</button>` : k === 'fix' ? '' : '<button class="btn go" data-act="again">↻ Again</button>';
    const other = k === 'practice' ? '<button class="btn pri" data-act="testintro">📝 Take the Test</button>' : k === 'test' && res.pct < 80 ? '<button class="btn pri" data-act="practice">✏️ Practise with hints</button>' : '';
    setScreen(`
    <div class="rhead"><div class="${res.pct >= 60 ? 'jump' : ''}">${panda(res.pct >= 50 ? 'happy' : '')}</div><div>
      <h2>${res.head}</h2><div style="margin:8px 0">${big}${stars}</div><div style="font-weight:900;font-size:18px">${res.line}</div>
      <p style="font-weight:800;margin:8px 0 0">${bandMsg(res.pct)}</p>
      <div class="rewardrow">${rewards.join('')}</div></div></div>
    <div class="btnrow">${again}${other}${res.topic ? '<button class="btn" data-act="topic">Topic page</button>' : ''}<button class="btn" data-act="exit">🏝️ Back to the island</button></div>
    <div class="panel"><h3>Review</h3><ul class="review">${rev}</ul></div>`);
    LAST = res;
  }
  let LAST = null;

  /* ---------- scratch pad (finger or Apple Pencil) ---------- */
  function scratchHTML() {
    return `<div class="scratch" id="scratch"><span class="slabel">Scratch paper ✏️</span><canvas id="scv"></canvas>
      <div class="stools"><button data-act="pen" data-arg="#2B2140" class="on" aria-label="Pen">✏️</button><button data-act="pen" data-arg="#E8443A" aria-label="Red pen">🖍️</button><button data-act="pen" data-arg="erase" aria-label="Eraser">🧽</button><button data-act="sclear" aria-label="Clear">🗑️</button></div></div>`;
  }
  function initScratch() {
    const wrap = $('#scratch'), cv = $('#scv'); if (!wrap || !cv) return;
    const same = SCR && SCR.uid === cur().q.uid, keep = same ? SCR.img : null;
    SCR = { uid: cur().q.uid, color: same ? SCR.color : '#2B2140', pen: same ? SCR.pen : false, img: keep };
    const ctx = cv.getContext('2d'); let first = true;
    function size() {
      const r = wrap.getBoundingClientRect(), dpr = Math.min(2.5, window.devicePixelRatio || 1);
      const old = first ? keep : cv.toDataURL(); first = false;
      cv.width = Math.max(10, r.width * dpr); cv.height = Math.max(10, r.height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = ctx.lineJoin = 'round';
      if (old) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, r.width, r.height); im.src = old; }
    }
    size(); SCR.resize = size;
    let drawing = null;
    cv.onpointerdown = (e) => { if (e.pointerType === 'pen') SCR.pen = true; if (SCR.pen && e.pointerType === 'touch') return; cv.setPointerCapture(e.pointerId); const r = cv.getBoundingClientRect(); drawing = { id: e.pointerId, x: e.clientX - r.left, y: e.clientY - r.top }; e.preventDefault(); };
    cv.onpointermove = (e) => {
      if (!drawing || e.pointerId !== drawing.id) return;
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, er = SCR.color === 'erase';
      ctx.globalCompositeOperation = er ? 'destination-out' : 'source-over'; ctx.strokeStyle = er ? '#000' : SCR.color;
      ctx.lineWidth = er ? 26 : (e.pointerType === 'pen' ? 1.6 + 3 * (e.pressure || .5) : 3.2);
      ctx.beginPath(); ctx.moveTo(drawing.x, drawing.y); ctx.lineTo(x, y); ctx.stroke(); drawing.x = x; drawing.y = y; e.preventDefault();
    };
    cv.onpointerup = cv.onpointercancel = () => { drawing = null; try { SCR.img = cv.toDataURL(); } catch (e) { /* tainted? */ } };
    $$('#scratch .stools [data-act=pen]').forEach((b) => b.classList.toggle('on', b.dataset.arg === SCR.color));
  }
  const onResize = () => { if (!api.alive) return removeEventListener('resize', onResize); if (SCR && SCR.resize && $('#scv')) SCR.resize(); };
  addEventListener('resize', onResize);

  /* ---------- voice answers ---------- */
  function listen() {
    const it = cur(); if (!SR || !it || it.done) return;
    const btn = $('.mic'), heard = $('#heard');
    if (REC) { try { REC.stop(); } catch (e) { /* stopped */ } REC = null; if (btn) btn.classList.remove('live'); return; }
    try {
      REC = new SR(); REC.lang = 'en-GB'; REC.interimResults = false; REC.maxAlternatives = 3;
      REC.onresult = (ev) => {
        const alts = [...ev.results[0]].map((a) => a.transcript); let got = null;
        for (const a of alts) { got = parseSpoken(a, it.q); if (got) break; }
        if (heard) heard.textContent = `I heard: “${alts[0]}”`;
        if (!got) { toast("I didn't catch a number — try again or use the keypad"); return; }
        if (it.q.kind === 'choice') it.entry.idx = got.idx;
        else if (it.q.kind === 'time') Object.assign(it.entry, { h: got.h, m: got.m, ap: got.ap || it.entry.ap });
        else Object.assign(it.entry, { mode: got.mode, s: got.s || '', w: got.w || '', n: got.n || '', d: got.d || '' });
        $('#ansArea').innerHTML = answerHTML(it); refreshBoxes();
        const h2 = $('#heard'); if (h2) h2.textContent = `I heard: “${alts[0]}” — check it, then tap ${SES.kind === 'interview' ? 'Answer' : isTestLike() ? 'Next' : 'Check'}.`;
      };
      REC.onerror = (ev) => { toast(ev.error === 'not-allowed' ? 'Microphone is blocked — allow it in Safari settings' : "Couldn't hear that — try again"); };
      REC.onend = () => { REC = null; const b = $('.mic'); if (b) b.classList.remove('live'); };
      REC.start(); if (btn) btn.classList.add('live'); if (heard) heard.textContent = 'Listening… say your answer';
    } catch (e) { REC = null; toast("Voice input isn't available here"); }
  }

  /* =========================================================
     EVENTS
     ========================================================= */
  const ACT = {
    close: closeModal, yes() { const f = MODAL_YES; closeModal(); if (f) f(); },
    exit() { stopTimer(); hush(); api.exit(); },
    settings() { modal(settingsHTML()); },
    set(a) { const [kk, v] = a.split(':'); S[kk] = v === 'true' ? true : v === 'false' ? false : /^\d+$/.test(v) ? +v : v; save(); modal(settingsHTML()); if (SES) renderPlay(); else if (m.interview) interviewIntro(m.interview); },
    practice() { closeModal(); start('practice', m.topic); },
    testintro() { testIntro(m.topic); },
    starttest() { closeModal(); start('test', m.topic); },
    startzone() { start('zone', m.zoneTest); },
    startiv(a) { start('interview', m.interview, a === 'oral'); },
    again() { if (!LAST) return; if (LAST.kind === 'interview') interviewIntro(m.interview); else if (LAST.kind === 'zone') start('zone', m.zoneTest); else start(LAST.kind, LAST.topic); },
    topic() { topicScreen(m.topic); },
    road() { api.openRoad(); },
    say() { const it = cur(); if (it) sayText(speakify(it.q.html)); },
    key: (a) => keyPress(a), mode: (a) => { setMode(a); sfx.tap(); },
    choose(a) { const it = cur(); if (!it || it.done) return; it.entry.idx = +a; sfx.tap(); $('#ansArea').innerHTML = answerHTML(it); clearFb(); },
    opick(a) { const it = cur(); if (!it || it.done) return; const e = it.entry; if (e.order.length >= it.q.items.length || e.order.includes(+a)) return; e.order.push(+a); sfx.tap(); $('#ansArea').innerHTML = answerHTML(it); clearFb(); },
    ounpick(a) { const it = cur(); if (!it || it.done) return; const e = it.entry; if (e.order[+a] == null) return; e.order.splice(+a, 1); sfx.tap(); $('#ansArea').innerHTML = answerHTML(it); clearFb(); },
    osign(a) { const it = cur(); if (!it || it.done) return; const e = it.entry, kk = +a; e.signs[kk] = e.signs[kk] === '<' ? '>' : '<'; sfx.tap(); $('#ansArea').innerHTML = answerHTML(it); clearFb(); },
    oclear() { const it = cur(); if (!it || it.done) return; it.entry = newEntry(it.q); $('#ansArea').innerHTML = answerHTML(it); },
    ap(a) { const it = cur(); if (!it || it.done) return; it.entry.ap = a; sfx.tap(); $('#ansArea').innerHTML = answerHTML(it); refreshBoxes(); clearFb(); },
    check: practiceCheck, hint: showHint, next: nextItem,
    notes() { const t = TOPIC[cur().q.topic]; modal(`<h3>📘 ${t.en}</h3><ul class="notes">${t.notes.map((n) => `<li>${n}</li>`).join('')}</ul><div class="ex"><div class="exq">Example: ${t.ex.q}</div><ol class="steps" style="margin:6px 0 0;padding-left:20px">${t.ex.steps.map((s) => `<li>${s}</li>`).join('')}</ol></div><div class="row"><button class="btn pri" data-act="close">Got it</button></div>`); },
    tnext() { if (SES.i < SES.items.length - 1) { SES.i++; sfx.whoosh(); onItemShown(); renderPlay(); } },
    prev() { if (SES.i > 0) { SES.i--; onItemShown(); renderPlay(); } },
    jump(a) { SES.i = +a; onItemShown(); renderPlay(); },
    finishtest: () => finishTest(false),
    ivsubmit: () => interviewSubmit(false),
    pass() { const it = cur(); if (!it || it.done) return; it.entry = newEntry(it.q); interviewSubmit(false, true); },
    reveal() { const it = cur(); if (!it) return; it.revealed = true; it.ms = Date.now() - SES.qT0; $('#ansArea').innerHTML = answerHTML(it); },
    self: (a) => selfMark(a === '1'),
    mic: listen,
    pen(a) { if (!SCR) return; SCR.color = a; $$('#scratch .stools [data-act=pen]').forEach((b) => b.classList.toggle('on', b.dataset.arg === a)); },
    sclear() { const cv = $('#scv'); if (!cv) return; cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); if (SCR) SCR.img = null; },
  };
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const f = ACT[b.dataset.act]; if (f) { e.preventDefault(); f(b.dataset.arg); }
  });
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  root.addEventListener('input', (e) => {
    const b = e.target.closest('.abox'); if (!b) return; const it = cur(); if (!it || it.done) return;
    const f = b.dataset.f, v = cleanTyped(b.value, f);
    if (it.q.kind === 'num' && f === 's' && v.includes('/')) { const p = parseNumText(v); const mm = v.trim().match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/); if (p && mm && (p.repr === 'frac' || p.repr === 'mixed')) { Object.assign(it.entry, { mode: mm[1] ? 'm' : 'f', w: mm[1] || '', n: mm[2], d: mm[3], s: '' }); W.active = 'd'; $('#ansArea').innerHTML = answerHTML(it); refreshBoxes(); return; } }
    it.entry[f] = v; if (b.value !== v) b.value = v; clearFb();
  });
  root.addEventListener('focusin', (e) => { const b = e.target.closest && e.target.closest('.abox'); if (b) { W.active = b.dataset.f; refreshBoxes(); } });
  const onKey = (e) => {
    if (!api.alive) return document.removeEventListener('keydown', onKey);
    if (!$('#modal').hidden) { if (e.key === 'Escape') closeModal(); return; }
    if (!SES) return; const it = cur(); if (!it) return;
    if (e.key === 'Enter') { e.preventDefault(); if (SES.oral) return; if (SES.kind === 'interview') return interviewSubmit(false); if (SES.kind === 'test' || SES.kind === 'zone') return SES.i < SES.items.length - 1 ? ACT.tnext() : finishTest(false); return it.done ? nextItem() : practiceCheck(); }
    const inBox = e.composedPath && e.composedPath().some((n) => n.classList && n.classList.contains('abox'));
    if (inBox) return;
    if (/^[0-9.]$/.test(e.key)) { keyPress(e.key); e.preventDefault(); } else if (e.key === 'Backspace') { keyPress('del'); e.preventDefault(); } else if (e.key === '/') keyPress('f');
  };
  document.addEventListener('keydown', onKey);

  // test hook (tools/smoke_world.py)
  window.__mw = {
    get SES() { return SES; }, cur, ACT, root,
    solve() { const it = cur(); it.entry = Object.assign(newEntry(it.q), ansEntry(it.q)); if (it.q.kind === 'num') W.active = fieldsOf(it.q, it.entry)[0]; $('#ansArea').innerHTML = answerHTML(it); refreshBoxes(); },
    wrong() { const it = cur(), q = it.q; if (q.kind === 'num') it.entry = Object.assign(newEntry(q), { mode: 'n', s: String(L.qint(q.ans) ? q.ans.n + 1 : 999) }); else if (q.kind === 'choice') it.entry = { idx: (q.correct + 1) % q.choices.length }; else if (q.kind === 'time') it.entry = { h: '01', m: '01', ap: q.fmt === '12' ? 'a.m.' : '' }; else { const e = ansEntry(q); e.order.reverse(); it.entry = e; } $('#ansArea').innerHTML = answerHTML(it); },
  };

  /* ---------- go ---------- */
  playMusic('lab');
  if (m.topic) topicScreen(m.topic);
  else if (m.interview) interviewIntro(m.interview);
  else if (m.zoneTest) zoneIntro(m.zoneTest);
  else if (m.fix) { const gens = (api.opts && api.opts.gens) || [...new Set(store.mistakesFor('maths').map((x) => x.gen))]; if (!gens.length) { setScreen('<div class="panel"><h3>Nothing to fix 🎉</h3><p>Your maths Oops Book is empty.</p><button class="btn" data-act="exit">Back to the island</button></div>'); } else start('fix', gens); }
  void zoneOfTopic;
}
