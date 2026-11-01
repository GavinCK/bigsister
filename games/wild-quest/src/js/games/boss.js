// GAME · Fake-Bot Showdown — bust fake facts, fix them, fill blanks, judge claims
import { STATEMENTS, BLANKS, WHO_RIGHT } from '../data.js';
import { h, sample, shuffle } from '../ui.js';
import { art } from '../art.js';
import { burstAt, floatAt, shake, confetti } from '../fx.js';
import { avatarEl } from '../economy.js';

export const HEARTS = 5;

export default async function play(api) {
  api.music('boss');
  await api.intro({
    title: 'Fake-Bot Showdown', artId: 'robot',
    how: [['robot', 'Fake-Bot broadcasts science "facts"'], ['check', 'Bust the fakes and FIX the wrong words'], ['rocket', 'Blast the right word into the blanks']],
    learn: 'Final revision: true or false with corrections, fill in the blanks, and data analysis — all of Unit 1.',
    start: 'Fight!',
  });
  let hearts = api.hearts(HEARTS), correct = 0, total = 0, score = 0;
  api.frame.setHearts(hearts);

  const stmts = [...sample(STATEMENTS.filter((s) => s.ok), 3), ...sample(STATEMENTS.filter((s) => !s.ok), 5)];
  const phase1 = shuffle(stmts);
  const phase2 = sample(BLANKS, 7);
  const phase3 = sample(WHO_RIGHT, 3);
  const weights = phase1.reduce((a, s) => a + (s.ok ? 1 : 2), 0) + phase2.length + phase3.length * 1.5;
  let hp = weights;

  // ----- arena -----
  const botEl = h('div', { class: 'fb-bot' }, art('robot'));
  const hpBar = h('div', { class: 'fb-hp' }, h('span', {}, 'FAKE-BOT'), h('div', {}, h('i')));
  const hero = h('div', { class: 'fb-hero' }, avatarEl(150));
  const card = h('div', { class: 'fb-card' });
  const zone = h('div', { class: 'fb-zone' });
  const arena = h('div', { class: 'fb-arena' }, h('div', { class: 'fb-lava' }), hpBar, botEl, hero, card, zone);
  api.body.append(h('div', { class: 'fbs' }, arena));
  setHP();

  // ===== Phase 1 · Fact or Fake =====
  await phaseBanner('Round 1', 'Fact or Fake?');
  for (let i = 0; i < phase1.length && hearts > 0; i++) {
    const st = phase1[i];
    api.frame.setProgress(i / (phase1.length + phase2.length + phase3.length));
    const plain = st.s.replace(/\[|\]/g, '');
    card.innerHTML = '';
    card.append(h('div', { class: 'fb-tag' }, art('speaker', { size: 30 }), 'FAKE-BOT BROADCAST'), h('div', { class: 'fb-say' }, plain));
    botEl.classList.add('talk'); setTimeout(() => botEl.classList.remove('talk'), 700);
    const pickFF = await buttons([{ id: 'fact', text: 'FACT', cls: 'go', art: 'check' }, { id: 'fake', text: 'FAKE', cls: 'hot', art: 'cross' }]);
    total++;
    const isFake = !st.ok;
    if ((pickFF === 'fake') !== isFake) {
      await hurt(isFake ? `It was FAKE. Correct version: ${st.s.replace(/\[(.+?)\]/, st.fix)}` : 'That one was a real FACT!');
      api.miss({ key: `ff:${plain}`, q: `Fact or fake? "${plain}"`, you: pickFF.toUpperCase(), ans: isFake ? `FAKE → "${st.s.replace(/\[(.+?)\]/, st.fix)}"` : 'FACT', why: '' });
      continue;
    }
    if (!isFake) { correct++; await zap(1, 'Fact confirmed!'); continue; }
    // Fix-it
    correct++; api.sfx.good(1);
    const fixed = await fixIt(st);
    total++;
    if (fixed) { correct++; await zap(2, 'Fake busted & fixed!'); }
    else { await zap(1, 'Fake busted!'); }
  }

  // ===== Phase 2 · Word Blaster =====
  if (hearts > 0) await phaseBanner('Round 2', 'Word Blaster');
  for (let i = 0; i < phase2.length && hearts > 0; i++) {
    const b = phase2[i];
    api.frame.setProgress((phase1.length + i) / (phase1.length + phase2.length + phase3.length));
    card.innerHTML = '';
    const [pre, post] = b.s.split('___');
    card.append(h('div', { class: 'fb-tag' }, art('rocket', { size: 30 }), 'FILL THE BLANK'), h('div', { class: 'fb-say' }, pre, h('span', { class: 'fb-blank' }, '?'), post));
    const words = shuffle([b.a, ...b.d]);
    zone.innerHTML = '';
    const res = await new Promise((resolve) => {
      let done = false;
      words.forEach((w, wi) => {
        const bub = h('button', { class: 'fb-bubble', style: { left: `${8 + wi * 23}%`, animationDelay: `${-wi * 1.3}s` } }, w);
        bub.onclick = () => {
          if (done) return;
          if (w === b.a) { done = true; laser(bub); bub.classList.add('pop'); resolve(true); }
          else { bub.classList.add('nope'); api.sfx.bad(); setTimeout(() => bub.classList.remove('nope'), 500); done = true; resolve(w); }
        };
        zone.append(bub);
      });
    });
    total++;
    card.querySelector('.fb-blank').textContent = b.a; card.querySelector('.fb-blank').classList.add('filled');
    if (res === true) { correct++; await zap(1, b.a); }
    else { await hurt(`The missing word is "${b.a}".`); api.miss({ key: `blank:${b.s}`, q: b.s, you: res, ans: b.a, why: '' }); }
    zone.innerHTML = '';
  }

  // ===== Phase 3 · Who's right? =====
  if (hearts > 0) await phaseBanner('Round 3', "Who's right?");
  for (let i = 0; i < phase3.length && hearts > 0; i++) {
    const w = phase3[i];
    api.frame.setProgress((phase1.length + phase2.length + i) / (phase1.length + phase2.length + phase3.length));
    card.innerHTML = '';
    card.append(h('div', { class: 'fb-tag' }, art('memo', { size: 30 }), 'DATA ANALYSIS · Animal X'), h('div', { class: 'fb-data' }, w.data.map((d) => h('span', {}, d))));
    zone.innerHTML = '';
    const pick = await new Promise((resolve) => {
      const kidA = h('button', { class: 'fb-kid' }, art('detective', { size: 60 }), h('div', {}, h('b', {}, 'Kai says'), h('span', {}, `"${w.a}"`)));
      const kidB = h('button', { class: 'fb-kid' }, art('scientist', { size: 60 }), h('div', {}, h('b', {}, 'Mia says'), h('span', {}, `"${w.b}"`)));
      kidA.onclick = () => resolve('a'); kidB.onclick = () => resolve('b');
      zone.append(h('div', { class: 'fb-kids' }, kidA, kidB));
    });
    total++;
    if (pick === w.right) { correct++; api.toast(w.why, { kind: 'good', artId: 'bulb', ms: 2600 }); await zap(1.5, 'Correct analysis!'); await api.wait(900); }
    else { await hurt(w.why); api.miss({ key: `who:${w.data.join()}`, q: `${w.data.join(', ')} — who is right?`, you: pick === 'a' ? w.a : w.b, ans: w.right === 'a' ? w.a : w.b, why: w.why }); }
    zone.innerHTML = '';
  }

  api.frame.setProgress(1);
  card.innerHTML = ''; zone.innerHTML = '';
  const won = hearts > 0;
  if (won) {
    botEl.classList.add('dead'); api.sfx.boom(); burstAt(botEl, { n: 50, colors: ['#FFB627', '#FF5D73', '#FFFFFF', '#7A5CFA'], speed: 12 }); confetti(140);
    card.append(h('div', { class: 'fb-say big' }, 'Fake-Bot is offline! Science wins.'));
    await api.wait(1800);
  } else {
    botEl.classList.add('laugh'); card.append(h('div', { class: 'fb-say big' }, 'Fake-Bot escaped… train more and come back!'));
    await api.wait(1600);
  }
  api.finish({ score: score + hearts * 150, correct, total, won, headline: won ? 'Fake-Bot defeated!' : 'Fake-Bot escaped!' });

  // ----- helpers -----
  function setHP() { hpBar.querySelector('i').style.width = `${Math.max(0, hp / weights) * 100}%`; }
  async function phaseBanner(a, b) {
    const el = h('div', { class: 'wave-banner' }, h('div', {}, b), h('small', {}, a));
    arena.append(el); api.sfx.whoosh(); await api.wait(1700); el.remove();
  }
  function buttons(list) {
    zone.innerHTML = '';
    return new Promise((resolve) => {
      const row = h('div', { class: 'fb-btns' }, list.map((b) => h('button', { class: `btn ${b.cls || ''}`, onclick: () => { zone.innerHTML = ''; resolve(b.id); } }, b.art ? art(b.art) : null, b.text)));
      zone.append(row);
    });
  }
  async function fixIt(st) {
    const m = st.s.match(/^(.*)\[(.+?)\](.*)$/);
    const tokens = [];
    m[1].split(' ').filter(Boolean).forEach((w) => tokens.push({ w, bad: false }));
    tokens.push({ w: m[2], bad: true });
    m[3].split(' ').filter(Boolean).forEach((w) => tokens.push({ w, bad: false }));
    card.innerHTML = '';
    card.append(h('div', { class: 'fb-tag' }, art('magnifier', { size: 30 }), 'Tap the WRONG word'));
    const sent = h('div', { class: 'fb-say fb-tokens' });
    card.append(sent);
    let tries = 0;
    const chosen = await new Promise((resolve) => {
      tokens.forEach((t) => {
        if (/^[.,!?]$/.test(t.w)) { sent.append(t.w); return; }
        const b = h('button', { class: 'fb-tok' }, t.w);
        b.onclick = () => {
          if (b.disabled) return;
          if (t.bad) { b.classList.add('found'); api.sfx.pop(); resolve(true); }
          else { tries++; b.classList.add('ok'); b.disabled = true; api.sfx.boing(); if (tries >= 2) { sent.querySelectorAll('.fb-tok').forEach((x) => { if (x.textContent === m[2]) x.classList.add('found'); }); resolve(false); } else api.toast('That part is correct — look again!', { ms: 1400 }); }
        };
        sent.append(b, ' ');
      });
    });
    if (!chosen) {
      api.toast(`The wrong part was "${m[2]}". It should be "${st.fix}".`, { kind: 'bad', artId: 'bulb', ms: 2600 });
      api.miss({ key: `fix:${st.s}`, q: `Find the mistake: "${st.s.replace(/\[|\]/g, '')}"`, you: 'missed it', ans: `"${m[2]}" → "${st.fix}"`, why: '' });
      await api.wait(2400); return false;
    }
    zone.innerHTML = '';
    const opts = shuffle([st.fix, ...st.alts]);
    const pickFix = await new Promise((resolve) => {
      zone.append(h('div', { class: 'fb-fixes' }, h('div', { class: 'fb-fixq' }, `"${m[2]}" should be…`), opts.map((o) => h('button', { class: 'choice', onclick: () => resolve(o) }, o))));
    });
    zone.innerHTML = '';
    const ok = pickFix === st.fix;
    const fixedSentence = `${m[1]}${st.fix}${m[3]}`;
    sent.innerHTML = ''; sent.append(m[1], h('span', { class: ok ? 'fb-fixed' : 'fb-fixed bad' }, st.fix), m[3]);
    if (!ok) { api.sfx.bad(); api.toast(`Close! The right word is "${st.fix}".`, { kind: 'bad', artId: 'bulb', ms: 2400 }); api.miss({ key: `fix:${st.s}`, q: `Correct the mistake: "${st.s.replace(/\[|\]/g, '')}"`, you: pickFix, ans: fixedSentence, why: '' }); await api.wait(2000); }
    return ok;
  }
  function laser(target) {
    const hr = hero.getBoundingClientRect(), tr = target.getBoundingClientRect(), ar = arena.getBoundingClientRect();
    const x1 = hr.left + hr.width * .7 - ar.left, y1 = hr.top + hr.height * .4 - ar.top, x2 = tr.left + tr.width / 2 - ar.left, y2 = tr.top + tr.height / 2 - ar.top;
    const len = Math.hypot(x2 - x1, y2 - y1), ang = Math.atan2(y2 - y1, x2 - x1);
    const beam = h('div', { class: 'fb-beam', style: { left: `${x1}px`, top: `${y1}px`, width: `${len}px`, transform: `rotate(${ang}rad)` } });
    arena.append(beam); api.sfx.laser(); setTimeout(() => beam.remove(), 300);
  }
  async function zap(w, label) {
    laser(botEl);
    hp -= w; setHP();
    const dmg = Math.round(w * 100); score += dmg; api.frame.setScore(score);
    await api.wait(180);
    botEl.classList.add('hit'); api.sfx.good(correct); shake(botEl); floatAt(botEl, `-${dmg}`, '#FFE066');
    burstAt(botEl, { n: 14, colors: ['#FFE066', '#FFFFFF', '#7FF6FF'] });
    api.toast(label, { kind: 'good', artId: 'zap', ms: 1000 });
    await api.wait(700); botEl.classList.remove('hit');
  }
  async function hurt(msg) {
    hearts = api.loseHeart(hearts);
    botEl.classList.add('attack'); api.sfx.zap();
    await api.wait(250);
    hero.classList.add('hurt'); api.sfx.bad(); shake(arena);
    api.toast(msg, { kind: 'bad', artId: 'bulb', ms: 3000 });
    await api.wait(2800);
    botEl.classList.remove('attack'); hero.classList.remove('hurt');
  }
}
