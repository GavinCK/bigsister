// GAME · Zone boss battle — answer fast to attack; wrong answers let the boss strike back
import { BOSSES } from '../bosses.js';
import { h, pick } from '../../../core/ui.js';
import { art, creatureArt } from '../../../core/art.js';
import { burstAt, floatAt, shake } from '../../../core/fx.js';
import { avatarEl } from '../../../core/economy.js';

export const HEARTS = 3;
export const TIMED = true;
export const PROGRESS = false;

const ATTACK_SFX = { ink: 'splash', glitch: 'zap', headbutt: 'boom', frost: 'freeze', fire: 'boom', chomp: 'munch' };

export default async function play(api) {
  const B = BOSSES[api.mode.key];
  api.music('miniboss');
  await api.intro({
    title: B.name, artEl: bossArt(B, 'hero-art'),
    how: [['bullseye', 'Answer before the timer runs out to attack'], ['collision', '3 right in a row = CRITICAL hit'], ['shield', 'Special attack? Tap the shield to dodge!']],
    learn: `“${B.lines.intro}”`, start: 'Fight!',
  });

  let hearts = api.hearts(HEARTS); const maxHearts = hearts;
  let hp = B.hp, combo = 0, round = 0, correct = 0, total = 0, score = 0, enraged = false;
  const used = new Set();

  // ----- arena -----
  const hpFill = h('i');
  const hpBar = h('div', { class: 'bf-hp' }, h('b', {}, B.name), h('div', { class: 'bf-hpbar' }, hpFill));
  const bossEl = h('div', { class: 'bf-boss' }, bossArt(B));
  const say = h('div', { class: 'bf-say' }, B.lines.intro);
  const hero = h('div', { class: 'bf-hero' }, avatarEl(120));
  const qText = h('div', { class: 'bf-q' });
  const qArt = h('div', { class: 'bf-qart' });
  const timer = h('div', { class: 'bf-timer' }, h('i'));
  const opts = h('div', { class: 'bf-opts' });
  const fxLayer = h('div', { class: 'bf-fx' });
  const arena = h('div', { class: `bf ${B.bg}` }, hpBar, bossEl, say, hero, h('div', { class: 'bf-card' }, qArt, qText, timer), opts, fxLayer);
  api.body.append(arena);
  setHP();
  await api.wait(900);

  while (hp > 0 && hearts > 0) {
    round++;
    if (round > 1 && round % 4 === 0) { await dodge(); if (hp <= 0) break; }
    let q; let tries = 0;
    do { q = pick(B.gens)(); tries++; } while (used.has(q.key) && tries < 8);
    used.add(q.key);
    const okIds = Array.isArray(q.correct) ? q.correct : [q.correct];
    qText.textContent = q.prompt;
    qArt.innerHTML = ''; if (q.cid) qArt.append(creatureArt(q.cid)); else if (q.artId) qArt.append(art(q.artId));
    opts.innerHTML = '';
    const btns = q.options.map((o) => h('button', { class: 'bf-opt', dataset: { id: o.id } }, o.cid ? creatureArt(o.cid, { size: 44 }) : o.art ? art(o.art, { size: 40 }) : null, h('span', {}, o.text)));
    btns.forEach((b) => { if (okIds.includes(b.dataset.id)) b.dataset.ok = '1'; }); // used by the automated test
    opts.append(...btns);
    opts.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 220 });
    const T = (enraged ? 7.5 : 10.5) * api.slow;
    const pickId = await new Promise((resolve) => {
      let done = false; const t0 = performance.now(); let lastTick = 0;
      btns.forEach((b) => { b.onclick = () => { if (done) return; done = true; resolve(b.dataset.id); }; });
      api.loop(() => {
        if (done) return false;
        const left = 1 - (performance.now() - t0) / (T * 1000);
        timer.firstChild.style.width = `${Math.max(0, left) * 100}%`;
        timer.classList.toggle('low', left < .3);
        const sec = Math.ceil(left * T);
        if (left < .3 && sec !== lastTick) { lastTick = sec; api.sfx.tick(); }
        if (left <= 0) { done = true; resolve(null); return false; }
        return true;
      });
    });
    if (!api.alive) return;
    total++;
    btns.forEach((b) => { b.disabled = true; if (okIds.includes(b.dataset.id)) b.classList.add('right'); });
    if (pickId && okIds.includes(pickId)) {
      correct++; combo++;
      const crit = combo >= 3; const dmg = crit ? 2 : 1;
      score += 100 * dmg + (enraged ? 50 : 0);
      api.frame.setScore(score); api.frame.setCombo(combo);
      await attack(dmg, crit);
      api.learn(q.cid);
    } else {
      combo = 0; api.frame.setCombo(0);
      const b = btns.find((x) => x.dataset.id === pickId); b && b.classList.add('wrong');
      const youText = pickId ? q.options.find((o) => o.id === pickId)?.text : 'Too slow';
      const ansText = q.options.filter((o) => okIds.includes(o.id)).map((o) => o.text).join(' / ');
      api.miss({ key: `boss:${q.key}`, q: q.prompt, you: youText, ans: ansText, why: q.explain });
      await bossAttack();
      hearts = api.loseHeart(hearts);
      api.toast(h('span', {}, h('b', {}, `${ansText}. `), q.explain), { kind: 'bad', artId: 'bulb', ms: 3000 });
      await api.wait(2400);
    }
    if (!enraged && hp > 0 && hp <= B.hp / 2) await enrage();
  }

  const won = hp <= 0;
  opts.innerHTML = ''; qText.textContent = ''; qArt.innerHTML = ''; timer.firstChild.style.width = '0';
  if (won) {
    bossEl.classList.add('defeated'); api.sfx.boom(); burstAt(bossEl, { n: 50, kind: 'star', speed: 12 });
    say.textContent = 'Nooo… you know too much!';
    await api.wait(1600);
  } else {
    bossEl.classList.add('laugh'); say.textContent = `${B.name} wins this time! Train in the zone games and come back.`;
    await api.wait(1600);
  }
  const lost = maxHearts - hearts;
  api.finish({ score: score + hearts * 150, correct, total, won, stars: won ? (lost === 0 ? 3 : lost === 1 ? 2 : 1) : 0, headline: won ? `${B.name} defeated!` : `${B.name} escaped!` });

  // ----- helpers -----
  function setHP() { hpFill.style.width = `${Math.max(0, hp / B.hp) * 100}%`; }
  function talk(t) { say.textContent = t; say.animate([{ transform: 'scale(.8)' }, { transform: 'scale(1)' }], { duration: 180 }); }
  async function attack(dmg, crit) {
    const star = h('div', { class: 'bf-shot' }, art(crit ? 'glowstar' : 'star'));
    arena.append(star);
    const hr = hero.getBoundingClientRect(), br = bossEl.getBoundingClientRect(), ar = arena.getBoundingClientRect();
    const x0 = hr.left + hr.width * .6 - ar.left, y0 = hr.top + hr.height * .3 - ar.top;
    const x1 = br.left + br.width * .5 - ar.left, y1 = br.top + br.height * .5 - ar.top;
    hero.classList.add('cast'); setTimeout(() => hero.classList.remove('cast'), 400);
    api.sfx.laser();
    await star.animate([{ transform: `translate(${x0}px, ${y0}px) scale(.6) rotate(0)` }, { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 80}px) scale(1.2) rotate(180deg)` }, { transform: `translate(${x1}px, ${y1}px) scale(.9) rotate(360deg)` }], { duration: 420, easing: 'ease-in' }).finished.catch(() => {});
    star.remove();
    hp = Math.max(0, hp - dmg); setHP();
    bossEl.classList.add('hit'); setTimeout(() => bossEl.classList.remove('hit'), 350);
    crit ? api.sfx.crit() : api.sfx.good(combo); shake(bossEl);
    burstAt(bossEl, { n: crit ? 30 : 14, colors: ['#FFE066', '#FFFFFF', '#FF5D73'] });
    floatAt(bossEl, crit ? `CRITICAL -${dmg}` : `-${dmg}`, crit ? '#FFE066' : '#fff');
    talk(pick(B.lines.hit));
    await api.wait(650);
  }
  async function bossAttack() {
    talk(pick(B.lines.miss));
    bossEl.classList.add('strike');
    fxLayer.className = `bf-fx on fx-${B.attack}`;
    api.sfx[ATTACK_SFX[B.attack]]?.(); shake(arena); hero.classList.add('hurt');
    await api.wait(900);
    bossEl.classList.remove('strike'); hero.classList.remove('hurt'); fxLayer.className = 'bf-fx';
  }
  async function enrage() {
    enraged = true; api.sfx.enrage(); api.intensity(1);
    arena.classList.add('enraged'); talk(B.lines.enrage);
    const ban = h('div', { class: 'wave-banner' }, h('div', {}, 'ENRAGED!'), h('small', {}, 'Less time — stay sharp!'));
    arena.append(ban); await api.wait(1600); ban.remove();
  }
  async function dodge() {
    talk('Special attack… incoming!');
    opts.innerHTML = ''; qText.textContent = 'Tap the shield to dodge!'; qArt.innerHTML = '';
    bossEl.classList.add('charge');
    await api.wait(700);
    const r = arena.getBoundingClientRect();
    const btn = h('button', { class: 'bf-dodge', 'aria-label': 'Dodge', style: { left: `${15 + Math.random() * 60}%`, top: `${30 + Math.random() * 45}%` } }, art('shield'));
    arena.append(btn);
    const ok = await new Promise((res) => { let done = false; btn.onclick = () => { if (!done) { done = true; res(true); } }; setTimeout(() => { if (!done) { done = true; res(false); } }, 1500 * api.slow); });
    btn.remove(); bossEl.classList.remove('charge');
    if (!api.alive) return;
    if (ok) { api.sfx.dodge(); floatAt(hero, 'DODGE!', '#7FF6FF'); score += 80; api.frame.setScore(score); await attack(1, false); }
    else { api.sfx.heal(); hp = Math.min(B.hp, hp + 1); setHP(); floatAt(bossEl, '+1 HP', '#2EB872'); talk('Ha! I healed!'); await api.wait(900); }
    void r;
  }
}

export function bossArt(B, cls = '') {
  return h('div', { class: `bf-bossart ${cls}` }, art(B.art, { fx: B.fx || '' }), B.crown ? art('crown', { cls: 'bf-crown' }) : null);
}
