// GAME · Survival Suit — switch on the right adaptations before the meter runs out
import { SURVIVAL, CREATURES } from '../data.js';
import { h, sample, shuffle } from '../../../core/ui.js';
import { art, creatureArt } from '../../../core/art.js';
import { burstAt, floatAt, shake } from '../../../core/fx.js';

const METER_ICON = { 'Body heat': 'thermometer', Cooling: 'hotface', Water: 'droplet', Energy: 'zap' };

export const TIMED = true;

export default async function play(api) {
  api.music('lab');
  await api.intro({
    title: 'Survival Suit', artId: 'thermometer',
    how: [['snowflake', 'An animal is dropped into a blizzard or a heatwave'], ['joystick', 'Switch on the body features that help it survive'], ['stopwatch', 'Be quick — the meter is falling!']],
    learn: 'The characteristics of animals help them adapt to cold, hot and dry environments.',
  });

  const scene = h('div', { class: 'sv-scene' });
  const hero = h('div', { class: 'sv-hero' });
  const badges = h('div', { class: 'sv-badges' });
  const meter = h('div', { class: 'sv-meter' }, h('div', { class: 'sv-mi' }), h('div', { class: 'sv-bar' }, h('i')), h('b', {}, ''));
  const title = h('div', { class: 'sv-title' });
  scene.append(h('div', { class: 'sv-fx' }), title, hero, badges, meter);
  const panel = h('div', { class: 'sv-panel' });
  api.body.append(h('div', { class: 'sv' }, scene, panel));

  const rounds = sample(SURVIVAL, 6);
  let score = 0, correct = 0, total = 0, saved = 0;
  for (let k = 0; k < rounds.length; k++) {
    const R = rounds[k]; const c = CREATURES[R.id];
    api.frame.setProgress(k / rounds.length);
    scene.className = `sv-scene sv-${R.where}`;
    title.innerHTML = ''; title.append(h('small', {}, `Mission ${k + 1} / ${rounds.length}`), h('b', {}, R.title));
    hero.innerHTML = ''; hero.append(creatureArt(R.id)); hero.className = 'sv-hero shiver';
    badges.innerHTML = '';
    meter.querySelector('.sv-mi').innerHTML = ''; meter.querySelector('.sv-mi').append(art(METER_ICON[R.danger] || 'thermometer', { size: 38 }));
    meter.querySelector('b').textContent = R.danger;
    panel.innerHTML = '';
    panel.append(h('div', { class: 'sv-ask' }, creatureArt(R.id, { size: 56 }), h('div', {}, h('b', {}, `Help the ${c.name.toLowerCase()} survive!`), h('small', {}, 'Choose one feature in each row.'))));
    let level = 100, setCount = 0, over = false;
    const rows = R.traits.map((t, ti) => {
      const opts = shuffle(t.options.map((text, i) => ({ text, i })));
      const row = h('div', { class: 'sv-row' }, h('div', { class: 'sv-label' }, t.label));
      const btns = h('div', { class: 'sv-opts' });
      opts.forEach((o) => {
        const b = h('button', { class: 'sv-opt' }, o.text);
        b.onclick = () => {
          if (over || row.classList.contains('done')) return;
          total++;
          if (o.i === t.ok) {
            correct++; setCount++; row.classList.add('done'); b.classList.add('on');
            score += 100; api.frame.setScore(score); api.sfx.good(setCount);
            floatAt(b, '+100'); burstAt(b, { n: 10 });
            badges.append(h('div', { class: 'sv-badge' }, art('shield', { size: 34 }), h('span', {}, o.text)));
            api.toast(t.why, { kind: 'good', artId: 'bulb', ms: 2000 });
            level = Math.min(100, level + 12);
          } else {
            b.classList.add('nope'); setTimeout(() => b.classList.remove('nope'), 600);
            level -= 18; api.sfx.bad(); shake(hero);
            api.toast(h('span', {}, h('b', {}, 'Not that one! '), t.why), { kind: 'bad', artId: 'bulb', ms: 2600 });
            api.miss({ key: `suit:${R.id}:${ti}`, q: `${c.name} — ${t.label.toLowerCase()}?`, you: o.text, ans: t.options[t.ok], why: t.why });
          }
        };
        btns.append(b);
      });
      row.append(btns); panel.append(row);
      return row;
    });
    setMeter(level);
    await api.wait(600);
    const result = await new Promise((resolve) => {
      api.loop((dt) => {
        if (over) return false;
        const unset = R.traits.length - setCount;
        level -= dt * (unset ? 2.2 + unset * 1.6 : 0) / api.slow; api.intensity(level < 28 && unset ? 1 : 0);
        setMeter(level);
        if (setCount === R.traits.length) { over = true; resolve('win'); return false; }
        if (level <= 0) { over = true; resolve('lose'); return false; }
        return true;
      });
    });
    if (!api.alive) return;
    api.intensity(0);
    if (result === 'win') {
      saved++; const bonus = Math.round(level * 2); score += bonus; api.frame.setScore(score);
      hero.className = 'sv-hero happy'; api.sfx.win(); burstAt(hero, { n: 30 }); floatAt(hero, `SURVIVED! +${bonus}`, '#FFE066');
      api.learn(R.id);
      await api.wait(1800);
    } else {
      hero.className = 'sv-hero faint'; api.sfx.lose();
      rows.forEach((row, ti) => { if (!row.classList.contains('done')) { const t = R.traits[ti]; row.classList.add('reveal'); row.append(h('div', { class: 'sv-right' }, `✔ ${t.options[t.ok]} — ${t.why}`)); api.miss({ key: `suit:${R.id}:${ti}`, q: `${c.name} — ${t.label.toLowerCase()}?`, you: 'ran out of time', ans: t.options[t.ok], why: t.why }); } });
      await new Promise((res) => panel.append(h('button', { class: 'btn small', onclick: res }, 'Next mission')));
    }
  }
  api.frame.setProgress(1);
  api.finish({ score, correct, total, stars: saved === rounds.length && correct >= total - 1 ? 3 : saved >= rounds.length - 2 ? 2 : 1 });

  function setMeter(v) {
    const i = meter.querySelector('i'); i.style.width = `${Math.max(0, v)}%`;
    i.style.background = v > 55 ? 'var(--leaf)' : v > 28 ? 'var(--mango)' : 'var(--coral)';
    meter.classList.toggle('low', v < 28);
  }
}
