// GAME · Hide & Seek — find camouflaged animals, then name the trick
import { HIDE_SCENES, CREATURES, DEFENSES } from '../data.js';
import { h, sample, pick } from '../ui.js';
import { art, creatureArt } from '../art.js';
import { burstAt, floatAt, shake } from '../fx.js';

const CAMO = {
  harpseal: 'opacity(.92)', lion: 'sepia(.5) saturate(.8) brightness(1.05)', grasshopper: 'saturate(.9) brightness(.95)',
  stickinsect: '', seadragon: 'saturate(.85)', flatfish: 'opacity(.62) blur(.3px)', oakleaf: '', arctichare: 'opacity(.9)',
};
const DECOY_FX = { snow: 'brightness(1.08)', savanna: 'sepia(.35) saturate(1.1)', meadow: '', twigs: '', kelp: 'hue-rotate(-20deg) saturate(.8)', sand: 'sepia(.4)', leaves: '' };

export default async function play(api) {
  api.music('jungle');
  await api.intro({
    title: 'Hide & Seek', artId: 'magnifier',
    how: [['eyes', 'An animal is hiding somewhere in the picture'], ['magnifier', 'Tap it before the timer runs out'], ['thinking', 'Then say HOW it hides']],
    learn: 'Protective colouration: colours match the surroundings. Mimicry: it looks like something else.',
  });

  const scene = h('div', { class: 'hs-scene' });
  const timer = h('div', { class: 'hs-timer' }, h('i'));
  const hintBtn = h('button', { class: 'btn small ghost hs-hint' }, art('bulb', { size: 30 }), 'Hint');
  const label = h('div', { class: 'hs-label' });
  api.body.append(h('div', { class: 'hs' }, h('div', { class: 'hs-top' }, label, timer, hintBtn), scene));

  const scenes = sample(HIDE_SCENES, 6);
  let score = 0, correct = 0, total = 0, found = 0;
  for (let k = 0; k < scenes.length; k++) {
    const S = scenes[k]; const c = CREATURES[S.target];
    api.frame.setProgress(k / scenes.length);
    scene.className = `hs-scene hsbg-${S.bg}`; scene.innerHTML = '';
    label.innerHTML = ''; label.append(h('b', {}, `${S.title}`), h('span', {}, ` · Find the ${c.name.toLowerCase()}!`));
    // decoys
    const W = scene.clientWidth, H = scene.clientHeight;
    const n = Math.round((W * H) / 15000);
    const spots = [];
    for (let i = 0; i < n; i++) {
      const id = pick(S.decoys);
      const size = 64 + Math.random() * 50;
      const x = Math.random() * 96, y = Math.random() * 92;
      const d = h('div', { class: 'hs-decoy', style: { left: `${x}%`, top: `${y}%`, width: `${size}px`, height: `${size}px`, transform: `translate(-50%,-50%) rotate(${(Math.random() * 80 - 40) | 0}deg)`, zIndex: (Math.random() * 3) | 0 } }, art(id, { sticker: false, fx: DECOY_FX[S.bg] }));
      d.onclick = (e) => { e.stopPropagation(); if (done) return; api.sfx.boing(); timeLeft -= 2; floatAt(d, '-2s', '#FF5D73'); shake(d); };
      scene.append(d); spots.push([x, y]);
    }
    // target
    const tx = 12 + Math.random() * 76, ty = 14 + Math.random() * 70;
    const tsize = Math.min(110, Math.max(80, W / 9));
    const target = h('button', { class: 'hs-target', 'aria-label': 'Hidden animal', style: { left: `${tx}%`, top: `${ty}%`, width: `${tsize}px`, height: `${tsize}px`, transform: `translate(-50%,-50%) rotate(${(Math.random() * 40 - 20) | 0}deg)` } },
      creatureArt(S.target, { sticker: false, fx: CAMO[S.target] }), S.target === 'oakleaf' ? h('div', { class: 'antennae' }) : null);
    if (S.target === 'oakleaf' || S.target === 'stickinsect') target.classList.add('flutter');
    scene.append(target);
    // a few decoys on top of the target edges for some scenes
    if (['savanna', 'meadow', 'kelp'].includes(S.bg)) for (let i = 0; i < 2; i++) scene.append(h('div', { class: 'hs-decoy over', style: { left: `${tx + (i ? 3 : -3)}%`, top: `${ty + 4}%`, width: '70px', height: '70px', transform: `translate(-50%,-50%) rotate(${i ? 20 : -15}deg)`, zIndex: 5, pointerEvents: 'none' } }, art(pick(S.decoys), { sticker: false, fx: DECOY_FX[S.bg] })));

    let done = false, timeLeft = 25, hinted = false;
    const TOTAL = 25;
    hintBtn.disabled = false;
    hintBtn.onclick = () => { if (done || hinted) return; hinted = true; hintBtn.disabled = true; api.sfx.tap(); scene.append(h('div', { class: 'hs-ring', style: { left: `${tx + (Math.random() * 10 - 5)}%`, top: `${ty + (Math.random() * 10 - 5)}%` } })); };
    const res = await new Promise((resolve) => {
      target.onclick = () => { if (done) return; done = true; resolve('found'); };
      api.loop((dt) => {
        if (done) return false;
        timeLeft -= dt; timer.firstChild.style.width = `${Math.max(0, timeLeft / TOTAL) * 100}%`;
        timer.classList.toggle('low', timeLeft < 7);
        if (timeLeft <= 0) { done = true; resolve('timeout'); return false; }
        return true;
      });
    });
    if (!api.alive) return;
    scene.querySelector('.hs-ring')?.remove();
    target.classList.add('caught');
    if (res === 'found') {
      found++; const pts = 100 + Math.round(Math.max(0, timeLeft) * 8) - (hinted ? 50 : 0); score += pts; api.frame.setScore(score);
      api.sfx.good(found); burstAt(target, { n: 22 }); floatAt(target, `Found! +${pts}`);
    } else {
      api.sfx.bad(); api.toast(`Time! The ${c.name.toLowerCase()} was hiding here.`, { kind: 'bad', ms: 2000 });
      api.miss({ key: `hide:${S.target}`, q: `Where was the ${c.name.toLowerCase()} hiding?`, you: 'not found', ans: `In the ${S.title.toLowerCase()} — ${c.fact}`, why: '' });
    }
    await api.wait(1100);
    const ans = await api.ask({
      prompt: `How does the ${c.name.toLowerCase()} hide?`, artEl: creatureArt(S.target, { cls: 'hero-art' }),
      options: [{ id: 'colour', text: `${DEFENSES.colour.name}: ${DEFENSES.colour.desc}`, art: 'eyes' }, { id: 'mimicry', text: `${DEFENSES.mimicry.name}: ${DEFENSES.mimicry.desc}`, art: 'fallenleaf' }],
      correct: S.target === 'oakleaf' ? ['mimicry', 'colour'] : S.answer, explain: c.fact,
    });
    total++;
    if (ans.ok) { correct++; score += 100; api.frame.setScore(score); api.learn(S.target); }
    else api.miss({ key: `hide-how:${S.target}`, q: `How does the ${c.name.toLowerCase()} hide?`, you: DEFENSES[ans.choice].name, ans: DEFENSES[S.answer].name, why: c.fact });
  }
  api.frame.setProgress(1);
  api.finish({ score, correct: correct + found, total: total + scenes.length, won: true });
}
