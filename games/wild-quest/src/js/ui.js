// Small DOM toolkit + shared game chrome
import { art } from './art.js';

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; } }
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}
export const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = (a) => a[(Math.random() * a.length) | 0];
export const sample = (a, n) => shuffle(a).slice(0, n);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const starsFor = (acc, finished = true) => !finished ? (acc >= .6 ? 1 : 0) : acc >= .9 ? 3 : acc >= .7 ? 2 : 1;

// ---------- game frame ----------
export function gameFrame({ title, hearts = 0, score = true, progress = true, bg = '', onExit }) {
  const heartsEl = h('div', { class: 'hearts' });
  const heartArr = [];
  for (let i = 0; i < hearts; i++) { const a = art('heart'); heartArr.push(a); heartsEl.append(a); }
  const scoreEl = h('div', { class: 'scorebox' }, '0');
  const comboEl = h('div', { class: 'combo hide' }, 'x2');
  const prog = h('div', { class: 'progress' }, h('i'));
  const exitBtn = h('button', { class: 'iconbtn', 'aria-label': 'Back to the island', onclick: () => onExit && onExit() }, art('worldmap'));
  const hud = h('div', { class: 'game-hud' }, exitBtn, h('div', { class: 'gtitle' }, title), progress ? prog : null, h('div', { class: 'spacer' }), comboEl, hearts ? heartsEl : null, score ? scoreEl : null);
  const body = h('div', { class: 'game-body' });
  const root = h('div', { class: `game ${bg}`.trim() }, hud, body);
  let shownScore = 0, targetScore = 0, raf = 0;
  function tickScore() {
    shownScore += Math.ceil((targetScore - shownScore) / 6);
    scoreEl.textContent = shownScore;
    if (shownScore < targetScore) raf = requestAnimationFrame(tickScore);
  }
  return {
    root, body, hud,
    setHearts(n) { heartArr.forEach((a, i) => a.classList.toggle('lost', i >= n)); },
    setScore(n) { targetScore = n; cancelAnimationFrame(raf); if (n < shownScore) { shownScore = n; scoreEl.textContent = n; } else tickScore(); },
    setCombo(n) { comboEl.classList.toggle('hide', n < 2); comboEl.textContent = `x${n} combo`; if (n >= 2) comboEl.animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 200 }); },
    setProgress(f) { prog.firstChild.style.width = `${clamp(f, 0, 1) * 100}%`; },
    setTitle(t) { hud.querySelector('.gtitle').textContent = t; },
  };
}

// ---------- modals ----------
export function modal(parent, ...content) {
  const box = h('div', { class: 'modal', role: 'dialog' }, ...content);
  const wrap = h('div', { class: 'modal-wrap' }, box);
  parent.append(wrap);
  return { wrap, box, close() { wrap.remove(); } };
}

export function intro(parent, { title, artId, how = [], learn, start = "Let's go!" }) {
  return new Promise((resolve) => {
    const m = modal(parent,
      artId ? art(artId, { cls: 'hero-art' }) : null,
      h('h2', {}, title),
      h('div', { class: 'howto' }, how.map(([a, t]) => h('div', {}, art(a), h('span', {}, t)))),
      learn ? h('p', { class: 'learnline' }, learn) : null,
      h('div', { class: 'actions' }, h('button', { class: 'btn go', onclick: () => { m.close(); resolve(); } }, start)),
    );
    setTimeout(() => m.box.querySelector('.btn')?.focus(), 50);
  });
}

export function toast(parent, text, { kind = '', artId = '', ms = 2200 } = {}) {
  parent.querySelectorAll(':scope > .toast').forEach((t) => t.remove());
  const t = h('div', { class: `toast ${kind}`, role: 'status' }, artId ? art(artId) : null, h('div', {}, text));
  parent.append(t);
  if (ms) setTimeout(() => { t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250 }).onfinish = () => t.remove(); }, ms);
  return t;
}

// Ask a multiple-choice question inside a modal; resolves {ok, choice}
export function ask(parent, { prompt, artId, artEl, options, correct, sfx, explain }) {
  return new Promise((resolve) => {
    let done = false;
    const btns = options.map((o) => h('button', { class: 'choice', onclick: () => choose(o, btns[options.indexOf(o)]) }, o.art ? art(o.art) : null, h('span', {}, o.text)));
    const exp = h('p', { class: 'learnline', style: { minHeight: '1.3em' } });
    const m = modal(parent, artEl || (artId ? art(artId, { cls: 'hero-art' }) : null), h('h2', { style: { fontSize: '30px' } }, prompt), h('div', { class: 'choices', style: { marginTop: '14px' } }, btns), exp);
    function choose(o, b) {
      if (done) return; done = true;
      const ok = Array.isArray(correct) ? correct.includes(o.id) : o.id === correct;
      b.classList.add(ok ? 'right' : 'wrong');
      if (!ok) btns.forEach((x, i) => { const id = options[i].id; if (Array.isArray(correct) ? correct.includes(id) : id === correct) x.classList.add('right'); });
      sfx && (ok ? sfx.good() : sfx.bad());
      if (explain) exp.textContent = explain;
      setTimeout(() => { m.close(); resolve({ ok, choice: o.id }); }, ok ? 900 : 2100);
    }
  });
}
