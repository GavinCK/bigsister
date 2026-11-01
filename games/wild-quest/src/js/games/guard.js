// GAME · Garden Guard — use each plant's own defence before the herbivore bites
import { PLANT_DEFENSES, PLANTS, HERBIVORES, CREATURES } from '../data.js';
import { h, shuffle, pick, sample } from '../ui.js';
import { art, creatureArt } from '../art.js';
import { burstAt, floatAt, shake } from '../fx.js';

export const TIMED = true;
export const HEARTS = 3;

export default async function play(api) {
  api.music('jungle');
  await api.intro({
    title: 'Garden Guard', artId: 'shield',
    how: [['goat', 'A hungry animal walks towards a plant'], ['joystick', 'Tap THAT plant\'s defence card'], ['heart', 'Too slow or wrong = a bite!']],
    learn: 'Plants cannot move, but some protect themselves: poison, looking like stones, spikes, closing leaves.',
  });
  let hearts = api.hearts(HEARTS), score = 0, correct = 0, total = 0;
  api.frame.setHearts(hearts);

  const field = h('div', { class: 'gg-field' });
  const beds = h('div', { class: 'gg-beds' });
  const lane = h('div', { class: 'gg-lane' });
  const cards = h('div', { class: 'gg-cards' });
  field.append(beds, lane);
  api.body.append(h('div', { class: 'gg' }, field, cards));

  const defs = PLANT_DEFENSES;
  const cardEls = shuffle(defs).map((d) => {
    const b = h('button', { class: 'gg-card', dataset: { def: d.defense } }, h('span', {}, d.text));
    cards.append(b); return b;
  });

  let bedPlants = sample(defs, 3);
  function drawBeds() {
    beds.innerHTML = '';
    bedPlants.forEach((d, i) => beds.append(h('div', { class: 'gg-bed', dataset: { i } }, creatureArt(d.plant, { cls: 'gg-plant' }), h('div', { class: 'gg-name' }, PLANTS[d.plant].name))));
  }
  drawBeds();

  const ROUNDS = 10;
  for (let r = 0; r < ROUNDS && hearts > 0; r++) {
    api.frame.setProgress(r / ROUNDS);
    if (r > 0 && r % 3 === 0) { bedPlants = sample(defs, 3); drawBeds(); api.sfx.grow(); api.toast('New plants in the garden!', { artId: 'seedling', ms: 1300 }); await api.wait(900); }
    const bi = (Math.random() * 3) | 0; const target = bedPlants[bi];
    const bedEl = beds.children[bi]; bedEl.classList.add('target');
    const herb = pick(HERBIVORES);
    const critter = h('div', { class: 'gg-critter' }, creatureArt(herb), h('div', { class: 'gg-bubble' }, 'Yum?'));
    lane.append(critter);
    const laneR = lane.getBoundingClientRect(), bedR = bedEl.getBoundingClientRect();
    const startX = laneR.width + 20, endX = bedR.right - laneR.left + 4;
    const y = bedR.top - laneR.top + bedR.height * .25;
    critter.style.top = `${y}px`;
    const dur = Math.max(3.2, 6.2 - r * .3) * api.slow;
    const t0 = performance.now();
    let answered = null;
    const anim = critter.animate([{ transform: `translateX(${startX}px)` }, { transform: `translateX(${endX}px)` }], { duration: dur * 1000, fill: 'forwards', easing: 'linear' });
    api.sfx.whoosh();
    const res = await new Promise((resolve) => {
      const onCard = (e) => { if (answered) return; answered = e.currentTarget.dataset.def; cleanup(); resolve(answered); };
      cardEls.forEach((c) => c.addEventListener('click', onCard));
      anim.onfinish = () => { if (answered) return; answered = 'late'; cleanup(); resolve('late'); };
      function cleanup() { cardEls.forEach((c) => c.removeEventListener('click', onCard)); }
    });
    if (!api.alive) return;
    anim.pause();
    const cardEl = cardEls.find((c) => c.dataset.def === res);
    total++;
    const bubble = critter.querySelector('.gg-bubble');
    if (res === target.defense) {
      correct++;
      const left = 1 - (performance.now() - t0) / (dur * 1000);
      const pts = 100 + Math.round(left * 100); score += pts; api.frame.setScore(score);
      cardEl.classList.add('right'); setTimeout(() => cardEl.classList.remove('right'), 700);
      api.sfx.good(correct); floatAt(bedEl, `+${pts}`);
      api.learn(target.plant);
      // reaction
      const reaction = target.reaction;
      if (reaction === 'sick') { bubble.textContent = '🤢 Bleh!'; critter.classList.add('sick'); api.sfx.munch(); }
      if (reaction === 'confused') { bubble.textContent = 'Just stones…?'; critter.classList.add('confused'); bedEl.classList.add('stone'); api.sfx.boing(); }
      if (reaction === 'ouch') { bubble.textContent = 'OUCH!'; critter.classList.add('ouch'); api.sfx.ouch(); burstAt(bedEl, { n: 10, colors: ['#FF5D73', '#FFFFFF'] }); }
      if (reaction === 'scared') { bubble.textContent = 'Eek! It moved!'; critter.classList.add('scared'); bedEl.classList.add('fold'); api.sfx.boing(); }
      bubble.classList.add('show');
      api.toast(target.line, { kind: 'good', artId: 'bulb', ms: 2200 });
      await api.wait(1500);
      critter.animate([{ transform: getComputedStyle(critter).transform }, { transform: `translateX(${startX}px) scaleX(-1)` }], { duration: 700, fill: 'forwards', easing: 'ease-in' });
      await api.wait(800);
    } else {
      hearts = api.loseHeart(hearts);
      if (cardEl) { cardEl.classList.add('wrong'); setTimeout(() => cardEl.classList.remove('wrong'), 700); }
      const rightCard = cardEls.find((c) => c.dataset.def === target.defense); rightCard.classList.add('hint');
      anim.play(); await new Promise((r2) => { if (anim.playState === 'finished') r2(); else anim.onfinish = r2; });
      bubble.textContent = 'CHOMP!'; bubble.classList.add('show'); api.sfx.munch(); shake(bedEl); bedEl.classList.add('bitten');
      const name = PLANTS[target.plant].name;
      api.toast(h('span', {}, h('b', {}, `${name}: `), target.line), { kind: 'bad', artId: 'bulb', ms: 2800 });
      api.miss({ key: `guard:${target.plant}`, q: `How does the ${name.toLowerCase()} protect itself?`, you: res === 'late' ? 'Too slow' : defs.find((d) => d.defense === res)?.text, ans: target.text, why: target.line });
      await api.wait(2400);
      rightCard.classList.remove('hint'); bedEl.classList.remove('bitten');
    }
    critter.remove(); bedEl.classList.remove('target', 'stone', 'fold');
  }
  api.frame.setProgress(1);
  const won = hearts > 0;
  api.finish({ score: score + hearts * 100, correct, total: Math.max(total, 1), won });
}
