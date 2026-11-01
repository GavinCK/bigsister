// GAME · Feeding Frenzy — serve each dish to the animal built to eat it
import { FEEDERS, CREATURES } from '../data.js';
import { h, shuffle, sample } from '../ui.js';
import { art, creatureArt } from '../art.js';
import { burstAt, floatAt, shake } from '../fx.js';

export const HEARTS = 4;

function pickSet(n, used) {
  const pool = shuffle(FEEDERS.filter((f) => !used.has(f.id)).concat(FEEDERS.filter((f) => used.has(f.id))));
  const out = []; const foods = new Set();
  for (const f of pool) { if (out.length >= n) break; if (foods.has(f.foodArt)) continue; foods.add(f.foodArt); out.push(f); }
  return out;
}

export default async function play(api) {
  api.music('jungle');
  await api.intro({
    title: 'Feeding Frenzy', artId: 'meat',
    how: [['meat', 'A dish slides down the counter'], ['giraffe', 'Tap the animal whose body is built to eat it'], ['stopwatch', 'Serve it before it gets cold!']],
    learn: 'Beaks, necks, teeth, claws and forelegs help animals get their food.',
  });
  let hearts = HEARTS, score = 0, correct = 0, total = 0, streak = 0;
  api.frame.setHearts(hearts);

  const counter = h('div', { class: 'ff-counter' });
  const plate = h('div', { class: 'ff-plate' });
  const patience = h('div', { class: 'ff-patience' }, h('i'));
  counter.append(h('div', { class: 'ff-belt' }), plate, patience);
  const tables = h('div', { class: 'ff-tables' });
  api.body.append(h('div', { class: 'ff' }, counter, tables));

  const used = new Set();
  const SETS = 3;
  for (let s = 0; s < SETS && hearts > 0; s++) {
    const set = pickSet(4, used); set.forEach((f) => used.add(f.id));
    tables.innerHTML = '';
    const tEls = set.map((f) => {
      const t = h('button', { class: 'ff-table', dataset: { id: f.id } }, creatureArt(f.id), h('b', {}, CREATURES[f.id].name), h('span', { class: 'ff-feat' }, f.feature), h('div', { class: 'ff-say' }));
      tables.append(t); return t;
    });
    tables.animate([{ transform: 'translateY(40px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 350 });
    for (const f of shuffle(set)) {
      if (hearts <= 0) break;
      api.frame.setProgress((s * 4 + set.indexOf(f)) / (SETS * 4));
      plate.innerHTML = ''; plate.append(art(f.foodArt), h('span', { class: 'ff-food' }, f.food));
      plate.className = 'ff-plate in';
      api.sfx.whoosh();
      const T = Math.max(5, 9 - s * 1.5);
      const t0 = performance.now();
      const res = await new Promise((resolve) => {
        let done = false;
        const click = (e) => {
          if (done) return;
          const id = e.currentTarget.dataset.id;
          if (id === f.id) { done = true; off(); resolve(id); }
          else {
            // wrong animal: it refuses, keep the dish
            const tt = e.currentTarget; const wf = FEEDERS.find((x) => x.id === id);
            tt.querySelector('.ff-say').textContent = 'Not for me!'; tt.classList.add('no'); setTimeout(() => { tt.classList.remove('no'); tt.querySelector('.ff-say').textContent = ''; }, 900);
            api.sfx.bad(); streak = 0; api.frame.setCombo(0); total++;
            api.miss({ key: `feed:${f.id}`, q: `Who eats ${f.food}?`, you: CREATURES[id].name, ans: `${CREATURES[f.id].name} — ${f.feature.toLowerCase()} ${f.does}`, why: `${CREATURES[id].name}: ${wf.feature.toLowerCase()} ${wf.does}.` });
            score = Math.max(0, score - 30); api.frame.setScore(score);
          }
        };
        tEls.forEach((t) => t.addEventListener('click', click));
        function off() { tEls.forEach((t) => t.removeEventListener('click', click)); }
        api.loop(() => {
          if (done) return false;
          const k = (performance.now() - t0) / (T * 1000);
          patience.firstChild.style.width = `${Math.max(0, 1 - k) * 100}%`;
          if (k >= 1) { done = true; off(); resolve('late'); return false; }
          return true;
        });
      });
      if (!api.alive) return;
      const table = tEls.find((t) => t.dataset.id === f.id);
      if (res === 'late') {
        hearts--; api.frame.setHearts(hearts); streak = 0; api.frame.setCombo(0); total++;
        api.sfx.lose(); plate.classList.add('cold'); table.classList.add('hint');
        api.toast(h('span', {}, h('b', {}, `${CREATURES[f.id].name}! `), `Its ${f.feature.toLowerCase()} ${f.does}.`), { kind: 'bad', artId: 'bulb', ms: 2600 });
        api.miss({ key: `feed:${f.id}`, q: `Who eats ${f.food}?`, you: 'too slow', ans: `${CREATURES[f.id].name} — ${f.feature.toLowerCase()}`, why: `Its ${f.feature.toLowerCase()} ${f.does}.` });
        await api.wait(2400); table.classList.remove('hint');
      } else {
        correct++; total++; streak++;
        const pts = 100 + Math.round((1 - (performance.now() - t0) / (T * 1000)) * 100) + streak * 10;
        score += pts; api.frame.setScore(score); api.frame.setCombo(streak);
        const pr = plate.getBoundingClientRect(), tr = table.getBoundingClientRect();
        plate.animate([{ transform: 'none' }, { transform: `translate(${tr.left + tr.width / 2 - (pr.left + pr.width / 2)}px, ${tr.top - pr.top}px) scale(.3)`, opacity: .3 }], { duration: 380, easing: 'ease-in', fill: 'forwards' });
        await api.wait(360);
        api.sfx.munch(); table.classList.add('yum'); burstAt(table, { n: 16 }); floatAt(table, `+${pts}`);
        table.querySelector('.ff-say').textContent = `My ${f.feature.toLowerCase()} ${f.does}!`;
        api.learn(f.id);
        await api.wait(1500);
        table.classList.remove('yum'); table.querySelector('.ff-say').textContent = '';
      }
      plate.className = 'ff-plate'; plate.getAnimations().forEach((a) => a.cancel());
    }
    // chef's quiz
    if (hearts > 0) {
      const q = set[(Math.random() * set.length) | 0];
      const others = sample(FEEDERS.filter((x) => x.feature !== q.feature), 3).map((x) => ({ id: x.id, text: x.feature }));
      const r = await api.ask({ prompt: `Chef's quiz: what helps the ${CREATURES[q.id].name.toLowerCase()} get ${q.food}?`, artEl: creatureArt(q.id, { cls: 'hero-art' }),
        options: shuffle([{ id: q.id, text: q.feature }, ...others]), correct: q.id, explain: `Its ${q.feature.toLowerCase()} ${q.does}.` });
      total++; if (r.ok) { correct++; score += 150; api.frame.setScore(score); } else api.miss({ key: `feedq:${q.id}`, q: `What helps the ${CREATURES[q.id].name.toLowerCase()} get ${q.food}?`, you: FEEDERS.find((x) => x.id === r.choice)?.feature, ans: q.feature, why: `It ${q.does}.` });
    }
  }
  api.frame.setProgress(1);
  api.finish({ score: score + hearts * 100, correct, total, won: hearts > 0 });
}
