// GAME · Build-a-Beast — spin the reels, pull the lever, fill zoo orders
import { GROUPS, LAB_SLOTS, LAB_RULES, LAB_RESULTS, LAB_ORDERS, LAB_EXPLAIN, CREATURES } from '../data.js';
import { h, shuffle, pick, sample } from '../../../core/ui.js';
import { art, creatureArt } from '../../../core/art.js';
import { burstAt, confetti, shake, floatAt } from '../../../core/fx.js';

const ADJ = { feathers: 'Feathery', hair: 'Furry', dryScales: 'Scaly', moist: 'Slimy', wetScales: 'Shiny', exo: 'Crunchy' };
const NOUN = { wings: 'Flapper', four: 'Stomper', none: 'Slitherer', fins: 'Finbeast', six: 'Buggo' };
const BASE = { wings: 'bird', four: 'paw', none: 'worm', fins: 'fish', six: 'ant' };

export default async function play(api) {
  api.music('lab');
  await api.intro({
    title: 'Build-a-Beast', artId: 'dna',
    how: [['memo', 'Read the zoo order'], ['joystick', 'Spin the 5 reels to pick body parts'], ['zap', 'Pull the lever. Wrong parts = MUTANT!']],
    learn: 'Each animal group has its own body covering, breathing, babies, body parts and body temperature.',
  });

  const base = shuffle(LAB_ORDERS.slice(0, 6));
  const specials = sample(LAB_ORDERS.slice(6), 2);
  const orders = [...base.slice(0, 3), specials[0], ...base.slice(3), specials[1]];
  let score = 0, correct = 0, total = 0;

  // --- layout ---
  const ticket = h('div', { class: 'lab-ticket' });
  const tube = h('div', { class: 'lab-tube' }, h('div', { class: 'lab-liquid' }), h('div', { class: 'lab-bubbles' }, Array.from({ length: 8 }, (_, i) => h('i', { style: { left: `${10 + i * 11}%`, animationDelay: `${i * .35}s` } }))));
  const slotOut = h('div', { class: 'lab-out' }, h('div', { class: 'lab-q' }, '?'));
  tube.append(slotOut);
  const lever = h('button', { class: 'lab-lever', 'aria-label': 'Pull the lever' }, h('div', { class: 'stick' }, h('div', { class: 'knob' })), h('div', { class: 'lever-label' }, 'ZAP!'));
  const reelsEl = h('div', { class: 'lab-reels' });
  const feedback = h('div', { class: 'lab-feedback' });
  const wrap = h('div', { class: 'lab' },
    h('div', { class: 'lab-top' }, ticket, h('div', { class: 'lab-machine' }, tube, h('div', { class: 'lab-coils' }, h('i'), h('i'))), feedback),
    h('div', { class: 'lab-panel' }, reelsEl, lever));
  api.body.append(wrap);

  // reels
  const sel = {};
  const reels = LAB_SLOTS.map((slot) => {
    const face = h('div', { class: 'reel-face' });
    const r = h('div', { class: 'reel' },
      h('div', { class: 'reel-label' }, slot.label),
      h('button', { class: 'reel-arrow', 'aria-label': `Previous ${slot.label}`, onclick: () => spin(-1) }, '▲'),
      h('button', { class: 'reel-window', 'aria-label': slot.label, onclick: () => spin(1) }, face),
      h('button', { class: 'reel-arrow', 'aria-label': `Next ${slot.label}`, onclick: () => spin(1) }, '▼'));
    let i = 0;
    function show(dir = 0) {
      const o = slot.options[i]; sel[slot.id] = o.id;
      face.innerHTML = ''; face.append(art(o.art), h('span', {}, o.text));
      if (dir) face.animate([{ transform: `translateY(${dir * -40}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 160, easing: 'ease-out' });
      r.classList.remove('bad', 'good');
    }
    function spin(d) { if (locked) return; i = (i + d + slot.options.length) % slot.options.length; api.sfx.tick(); show(d); }
    function randomize() { i = (Math.random() * slot.options.length) | 0; show(); }
    reelsEl.append(r);
    return { slot, r, randomize, show };
  });

  let locked = false;
  for (let k = 0; k < orders.length; k++) {
    const order = orders[k];
    api.frame.setProgress(k / orders.length);
    const who = order.who; const g = GROUPS[order.group];
    ticket.innerHTML = '';
    ticket.append(h('div', { class: 'ticket-no' }, `Order ${k + 1} / ${orders.length}`), creatureArt(who, { size: 84 }), h('div', { class: 'ticket-say' }, order.say), h('div', { class: 'ticket-group', style: { background: g.color } }, g.name));
    ticket.animate([{ transform: 'translateX(-120%) rotate(-8deg)' }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.3,1.4,.5,1)' });
    reels.forEach((r) => r.randomize());
    slotOut.innerHTML = ''; slotOut.append(h('div', { class: 'lab-q' }, '?'));
    feedback.innerHTML = ''; feedback.append(h('div', { class: 'fb-hint' }, 'Spin the reels, then pull the lever!'));
    locked = false;

    let tries = 0, solved = false;
    while (!solved && tries < 3) {
      await waitLever();
      locked = true; tries++;
      // check
      const rule = LAB_RULES[order.group];
      const bad = LAB_SLOTS.filter((s) => !(order.body && s.id === 'body' ? sel.body === order.body : rule[s.id].includes(sel[s.id])));
      await zapAnim();
      if (!bad.length) {
        solved = true; correct++; total++;
        const resultId = order.body ? who : pick(LAB_RESULTS[order.group][sel.body]);
        const pts = tries === 1 ? 300 : tries === 2 ? 150 : 60; score += pts; api.frame.setScore(score);
        slotOut.innerHTML = ''; const c = creatureArt(resultId, { cls: 'born' }); slotOut.append(c);
        api.sfx.win(); confetti(60); burstAt(c, { n: 24 }); floatAt(c, `+${pts}`, '#FFE066');
        api.learn(resultId); api.learn(who);
        reels.forEach((r) => r.r.classList.add('good'));
        feedback.innerHTML = '';
        feedback.append(h('div', { class: 'fb-title good' }, `It's a ${CREATURES[resultId].name}!`), h('p', {}, CREATURES[resultId].fact), h('ul', { class: 'fb-traits' }, g.traits.slice(0, 5).map((t) => h('li', {}, t))));
        await waitNext('Next order');
      } else {
        total++;
        api.sfx.boom(); shake(wrap);
        const name = `${ADJ[sel.cover]} ${NOUN[sel.body]}`;
        slotOut.innerHTML = '';
        slotOut.append(h('div', { class: 'mutant' }, art(BASE[sel.body], { cls: 'm-base', fx: `hue-rotate(${(Math.random() * 300) | 0}deg) saturate(1.6)` }), art(LAB_SLOTS[0].options.find((o) => o.id === sel.cover).art, { cls: 'm-a' }), art(LAB_SLOTS[1].options.find((o) => o.id === sel.breath).art, { cls: 'm-b' }), h('div', { class: 'm-stamp' }, 'MUTANT!')));
        feedback.innerHTML = '';
        feedback.append(h('div', { class: 'fb-title bad' }, `Oops — a ${name}!`), h('p', {}, `The customer wanted ${g.name.toUpperCase()}. Fix the red reels:`),
          h('ul', { class: 'fb-bad' }, bad.map((s) => h('li', {}, h('b', {}, `${s.label}: `), LAB_EXPLAIN[s.id][sel[s.id]]))));
        bad.forEach((s) => reels.find((r) => r.slot.id === s.id).r.classList.add('bad'));
        bad.forEach((s) => {
          const okIds = order.body && s.id === 'body' ? [order.body] : LAB_RULES[order.group][s.id];
          const okText = okIds.map((id) => s.options.find((o) => o.id === id).text).join(' or ');
          api.miss({ key: `lab:${order.group}:${s.id}`, q: `${g.name}: ${s.label.toLowerCase()}?`, you: s.options.find((o) => o.id === sel[s.id]).text, ans: okText, why: LAB_EXPLAIN[s.id][okIds[0]] });
        });
        if (tries >= 3) {
          // show the right recipe
          feedback.append(h('p', { class: 'fb-recipe' }, h('b', {}, 'Recipe: '), LAB_SLOTS.map((s) => { const ids = order.body && s.id === 'body' ? [order.body] : LAB_RULES[order.group][s.id]; return s.options.find((o) => o.id === ids[0]).text; }).join(' · ')));
          await waitNext('Next order');
        } else {
          locked = false;
          api.toast('Fix the red reels and pull again!', { artId: 'zap', ms: 1600 });
        }
      }
    }
  }
  api.frame.setProgress(1);
  const extra = total - orders.length; // extra lever pulls
  api.finish({ score, correct, total: orders.length, stars: correct === orders.length && extra <= 1 ? 3 : correct >= orders.length - 1 && extra <= 4 ? 2 : 1 });

  function waitLever() {
    return new Promise((res) => {
      const on = () => { lever.removeEventListener('click', on); lever.classList.add('pulled'); api.sfx.lever(); setTimeout(() => lever.classList.remove('pulled'), 500); res(); };
      lever.addEventListener('click', on);
    });
  }
  function waitNext(label) {
    return new Promise((res) => {
      const b = h('button', { class: 'btn go small', onclick: () => { b.remove(); api.sfx.tap(); res(); } }, label);
      feedback.append(b);
    });
  }
  async function zapAnim() {
    api.sfx.hum(); tube.classList.add('zapping');
    slotOut.innerHTML = ''; slotOut.append(h('div', { class: 'lab-q spin' }, '?'));
    await api.wait(500); api.sfx.zap(); await api.wait(500);
    tube.classList.remove('zapping'); burstAt(tube, { n: 20, colors: ['#7FF6FF', '#FFFFFF', '#B6FFF6'] });
  }
}
