// GAME · Predator Panic — pick the defence before the predator pounces
import { PANIC_ROUNDS, CREATURES, DEFENSES } from '../data.js';
import { h, sample, shuffle } from '../ui.js';
import { art, creatureArt } from '../art.js';
import { burstAt, floatAt, shake } from '../fx.js';

export const TIMED = true;
export const HEARTS = 4;
const SEA = ['sardine', 'seadragon', 'flatfish'];
const SNOW = ['harpseal', 'arctichare'];
const MORPH = { stickinsect: 'svg:twig', seadragon: 'svg:kelp', flatfish: 'svg:pebble', oakleaf: 'fallenleaf' };

export default async function play(api) {
  api.music('arcade');
  await api.intro({
    title: 'Predator Panic', artId: 'scream',
    how: [['shark', 'A predator charges at the animal'], ['shield', 'Tap the defence this animal uses'], ['stopwatch', 'Faster each round!']],
    learn: 'Four ways animals protect themselves: protective colouration, mimicry, warning, living in groups.',
  });
  let hearts = api.hearts(HEARTS), score = 0, correct = 0, total = 0, streak = 0;
  api.frame.setHearts(hearts);

  const stageEl = h('div', { class: 'pp-stage' });
  const prey = h('div', { class: 'pp-prey' });
  const pred = h('div', { class: 'pp-pred' });
  const name = h('div', { class: 'pp-name' });
  stageEl.append(name, prey, pred);
  const btnRow = h('div', { class: 'pp-btns' });
  const btns = Object.values(DEFENSES).map((d) => { const b = h('button', { class: 'pp-btn', dataset: { id: d.id } }, art(d.icon), h('span', {}, d.name)); btnRow.append(b); return b; });
  api.body.append(h('div', { class: 'pp' }, stageEl, btnRow));

  const rounds = sample(PANIC_ROUNDS, 10);
  for (let k = 0; k < rounds.length && hearts > 0; k++) {
    const R = rounds[k]; const c = CREATURES[R.prey];
    api.frame.setProgress(k / rounds.length);
    stageEl.className = `pp-stage ${SEA.includes(R.prey) ? 'pp-sea' : SNOW.includes(R.prey) ? 'pp-snow' : 'pp-land'}`;
    prey.className = 'pp-prey'; prey.innerHTML = ''; prey.append(creatureArt(R.prey));
    pred.className = 'pp-pred'; pred.innerHTML = ''; pred.append(creatureArt(R.predator));
    name.innerHTML = ''; name.append(h('b', {}, c.name), h('span', {}, ` vs ${CREATURES[R.predator].name}`));
    const W = stageEl.clientWidth;
    const dur = Math.max(2.6, 5.2 - k * .25) * api.slow;
    const run = pred.animate([{ transform: `translateX(${W}px)` }, { transform: `translateX(${W * .36}px)` }], { duration: dur * 1000, fill: 'forwards', easing: 'cubic-bezier(.4,0,.9,.6)' });
    api.sfx.whoosh();
    const t0 = performance.now();
    const choice = await new Promise((resolve) => {
      let done = false;
      const pickIt = (e) => { if (done) return; done = true; off(); resolve(e.currentTarget.dataset.id); };
      btns.forEach((b) => b.addEventListener('click', pickIt));
      run.onfinish = () => { if (done) return; done = true; off(); resolve('late'); };
      function off() { btns.forEach((b) => b.removeEventListener('click', pickIt)); }
    });
    if (!api.alive) return;
    run.pause(); total++;
    const btn = btns.find((b) => b.dataset.id === choice);
    if (R.answer.includes(choice)) {
      correct++; streak++;
      const pts = 100 + Math.round((1 - (performance.now() - t0) / (dur * 1000)) * 120) + streak * 10;
      score += pts; api.frame.setScore(score); api.frame.setCombo(streak);
      btn.classList.add('right'); api.sfx.good(streak); floatAt(prey, `+${pts}`);
      await defend(choice, R);
      api.toast(R.line, { kind: 'good', artId: 'bulb', ms: 1900 });
      api.learn(R.prey);
      pred.classList.add('confused');
      pred.animate([{ transform: getComputedStyle(pred).transform }, { transform: `translateX(${W + 200}px)` }], { duration: 900, fill: 'forwards', easing: 'ease-in' });
      await api.wait(1700);
      btn.classList.remove('right');
    } else {
      streak = 0; api.frame.setCombo(0); hearts = api.loseHeart(hearts);
      btn && btn.classList.add('wrong');
      const right = btns.filter((b) => R.answer.includes(b.dataset.id)); right.forEach((b) => b.classList.add('hint'));
      pred.animate([{ transform: getComputedStyle(pred).transform }, { transform: `translateX(${W * .2}px) scale(1.2)` }], { duration: 250, fill: 'forwards' });
      await api.wait(240); api.sfx.boom(); shake(stageEl); prey.classList.add('caught');
      api.toast(h('span', {}, h('b', {}, `${DEFENSES[R.answer[0]].name}! `), R.line), { kind: 'bad', artId: 'bulb', ms: 2600 });
      api.miss({ key: `panic:${R.prey}`, q: `How does the ${c.name.toLowerCase()} protect itself?`, you: choice === 'late' ? 'Too slow' : DEFENSES[choice].name, ans: R.answer.map((a) => DEFENSES[a].name).join(' / '), why: R.line });
      await api.wait(2700);
      btn && btn.classList.remove('wrong'); right.forEach((b) => b.classList.remove('hint'));
    }
  }
  api.frame.setProgress(1);
  api.finish({ score: score + hearts * 100, correct, total, won: hearts > 0 });

  async function defend(kind, R) {
    if (kind === 'colour') { prey.classList.add('blend'); api.sfx.freeze(); }
    if (kind === 'mimicry') { prey.innerHTML = ''; prey.append(art(MORPH[R.prey] || 'herb', { cls: 'morph' })); api.sfx.pop(); burstAt(prey, { n: 12, colors: ['#FFFFFF', '#C9F7DA'] }); }
    if (kind === 'warning') { prey.classList.add('warn'); api.sfx.zap(); burstAt(prey, { n: 20, colors: ['#FF5D73', '#FFB627', '#7A5CFA'] }); }
    if (kind === 'groups') {
      const crowd = h('div', { class: 'pp-crowd' }, Array.from({ length: 11 }, (_, i) => creatureArt(R.prey, { size: 70, cls: 'cr' })));
      prey.innerHTML = ''; prey.append(crowd); api.sfx.whoosh();
    }
    await api.wait(700);
  }
}
