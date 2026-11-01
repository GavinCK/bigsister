// Shared "falling sorter" engine: things drop from the sky, tap the right door.
import { h, shuffle } from '../ui.js';
import { art, creatureArt } from '../art.js';
import { burstAt, floatAt, shake } from '../fx.js';

// state = { score, hearts, combo, maxCombo, correct, total }
export function makeArena(api, { bins, sky = 'sky-storm' }) {
  const area = h('div', { class: `fall-area ${sky}` });
  const binRow = h('div', { class: 'bins', style: { gridTemplateColumns: `repeat(${bins.length}, minmax(0,1fr))` } });
  const binEls = {};
  bins.forEach((b) => {
    const el = h('button', { class: 'bin', style: { '--bc': b.color || '#FFB627' }, 'aria-label': b.label, dataset: { id: b.id } },
      h('div', { class: 'bin-door' }, b.artEl || art(b.art)), h('div', { class: 'bin-label' }, b.label));
    binEls[b.id] = el; binRow.append(el);
  });
  const wrap = h('div', { class: 'faller' }, area, binRow);
  api.body.append(wrap);
  return { wrap, area, binRow, binEls };
}

export function banner(api, text, sub = '') {
  const b = h('div', { class: 'wave-banner' }, h('div', {}, text), sub ? h('small', {}, sub) : null);
  api.body.append(b);
  api.sfx.whoosh();
  return api.wait(1700).then(() => b.remove());
}

function itemNode(it) {
  if (it.text) return h('div', { class: `fall-item card-item ${it.kind || ''}` }, it.icon ? art(it.icon, { size: 40 }) : null, h('div', {}, it.text));
  const a = it.cid ? creatureArt(it.cid) : art(it.art);
  return h('div', { class: 'fall-item' }, it.chute ? h('div', { class: 'chute' }) : null, a, it.label ? h('div', { class: 'tag-name' }, it.label) : null);
}

// Runs a list of items through the arena. Resolves when done or out of hearts.
export function runItems(api, arena, items, state, opts = {}) {
  const { fallTime = 7.5, onResult, explainMs = 2300, feverAt = 6 } = opts;
  return new Promise((resolve) => {
    let idx = -1, cur = null, y = 0, x = 0, sway = 0, falling = false, t0 = 0, locked = false;
    const area = arena.area;
    const binClick = (e) => { const id = e.currentTarget.dataset.id; choose(id, e.currentTarget); };
    Object.values(arena.binEls).forEach((b) => b.addEventListener('click', binClick));
    const cleanup = () => Object.values(arena.binEls).forEach((b) => b.removeEventListener('click', binClick));

    function next() {
      cur?.el.remove();
      idx++;
      if (idx >= items.length || state.hearts <= 0) { cleanup(); resolve(state); return; }
      const it = items[idx];
      const el = itemNode(it);
      area.append(el);
      const W = area.clientWidth;
      x = W * (.25 + Math.random() * .5); y = -el.offsetHeight - 10; sway = Math.random() * 6;
      cur = { it, el }; falling = true; locked = false; t0 = performance.now();
      place();
      api.frame.setProgress(state.total / (state.goal || items.length));
    }
    function place() { cur.el.style.transform = `translate(${x - cur.el.offsetWidth / 2}px, ${y}px) rotate(${Math.sin(sway) * 6}deg)`; }

    api.loop((dt) => {
      if (!cur || !falling) return true;
      const H = area.clientHeight;
      const speedMul = (opts.speed || 1) * (1 + Math.min(state.combo, 10) * .025);
      y += (H / (fallTime * api.slow)) * speedMul * dt; sway += dt * 2.2;
      place();
      if (y + cur.el.offsetHeight > H - 4) { falling = false; miss(null); }
      return idx < items.length && state.hearts > 0;
    });

    function correctIds(it) { return Array.isArray(it.answer) ? it.answer : [it.answer]; }

    function choose(id, binEl) {
      if (!cur || locked) return;
      locked = true; falling = false;
      const it = cur.it; const ok = correctIds(it).includes(id);
      const br = binEl.getBoundingClientRect(), ar = area.getBoundingClientRect();
      const tx = br.left - ar.left + br.width / 2 - cur.el.offsetWidth / 2, ty = ar.height - cur.el.offsetHeight * .6;
      cur.el.animate([{ transform: cur.el.style.transform }, { transform: `translate(${tx}px, ${ty}px) scale(.45)`, opacity: ok ? .2 : 1 }], { duration: 260, easing: 'ease-in', fill: 'forwards' });
      setTimeout(() => (ok ? hit(binEl) : miss(id, binEl)), 260);
    }

    function hit(binEl) {
      const it = cur.it;
      state.combo++; state.maxCombo = Math.max(state.maxCombo, state.combo); state.correct++; state.total++;
      const fever = state.combo >= feverAt;
      const pts = 100 * (1 + Math.min(Math.floor(state.combo / 3), 4)) * (fever ? 2 : 1);
      state.score += pts;
      api.frame.setScore(state.score); api.frame.setCombo(state.combo);
      api.sfx.good(state.combo);
      binEl.classList.add('gulp'); setTimeout(() => binEl.classList.remove('gulp'), 400);
      burstAt(binEl, { n: fever ? 26 : 14 }); floatAt(binEl, `+${pts}`, fever ? '#FFE066' : '#fff');
      if (fever !== state.fever) { state.fever = fever; api.fever(fever); arena.wrap.classList.toggle('fever', fever); if (fever) api.toast('FEVER! Double points!', { artId: 'heartfire', ms: 1400 }); }
      it.learn && api.learn(it.learn);
      onResult && onResult(true, it);
      if (it.tip) api.toast(it.tip, { kind: 'good', artId: it.cid ? undefined : 'bulb', ms: 2000 });
      api.wait(it.tip ? 700 : 280).then(next);
    }

    function miss(id, binEl) {
      const it = cur.it;
      state.combo = 0; state.total++; state.hearts = api.loseHeart(state.hearts);
      if (state.fever) { state.fever = false; api.fever(false); arena.wrap.classList.remove('fever'); }
      api.frame.setCombo(0); api.frame.setHearts(state.hearts);
      api.sfx.bad(); shake(arena.wrap);
      binEl && binEl.classList.add('nope');
      const right = correctIds(it).map((cid) => arena.binEls[cid]).filter(Boolean);
      right.forEach((r) => r.classList.add('hint'));
      const youLabel = id ? arena.binEls[id]?.getAttribute('aria-label') : 'Too slow';
      const rightLabel = right.map((r) => r.getAttribute('aria-label')).join(' / ');
      api.miss({ key: `${api.mode.id}:${it.key}`, q: it.q || `${it.label || it.text} → ?`, you: youLabel, ans: rightLabel, why: it.why || '' });
      onResult && onResult(false, it);
      api.toast(h('span', {}, h('b', {}, `${it.label || 'That one'} → ${rightLabel}. `), it.why || ''), { kind: 'bad', ms: explainMs, artId: 'bulb' });
      cur.el.classList.add('splat');
      api.wait(explainMs).then(() => { binEl && binEl.classList.remove('nope'); right.forEach((r) => r.classList.remove('hint')); next(); });
    }

    next();
  });
}

export { shuffle };
