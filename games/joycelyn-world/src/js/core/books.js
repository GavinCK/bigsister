// Shared books: the frame used by every book, the Oops Book (mistakes from every island) and the grown-ups page
import { h, modal } from './ui.js';
import { art } from './art.js';
import { store } from './store.js';

export function bookShell(parent, title, onClose, countText) {
  const body = h('div', { class: 'book-body' });
  const tabs = h('div', { class: 'book-tabs' });
  const root = h('div', { class: 'book' },
    h('div', { class: 'book-head' }, h('button', { class: 'iconbtn', 'aria-label': 'Close', onclick: () => { root.remove(); onClose && onClose(); } }, art('worldmap')), h('h2', {}, title), countText ? h('span', { class: 'count' }, countText) : null),
    tabs, body);
  parent.append(root);
  return { root, body, tabs };
}
// text, or trusted HTML written by an island (maths questions contain stacked fractions)
const rich = (cls, v, isHtml, prefix = '') => (isHtml ? h('div', { class: cls, html: prefix + v }) : h('div', { class: cls }, prefix + v));

// packs: the islands (each may add `oopsAction(mistake, ctx)` → extra button)
export function openOops(parent, ctx, packs, onClose, startPack = 'all') {
  const { body, tabs, root } = bookShell(parent, 'Oops Book', onClose, `${store.get().mistakes.length} to review`);
  let cur = startPack;
  const filters = [['all', 'All', 'memo'], ...packs.map((p) => [p.id, p.short, p.art])];
  const tabBtns = filters.map(([id, label, a]) => h('button', { class: id === cur ? 'on' : '', onclick: () => { cur = id; tabBtns.forEach((b, i) => b.classList.toggle('on', filters[i][0] === id)); render(); } }, art(a, { size: 24 }), label));
  tabs.append(...tabBtns);
  function render() {
    body.innerHTML = '';
    const ms = store.get().mistakes.filter((m) => cur === 'all' || (m.pack || 'science') === cur);
    const pk = packs.find((p) => p.id === cur);
    if (pk && pk.oopsHeader) { const hd = pk.oopsHeader(ctx, root); if (hd) body.append(hd); }
    if (!ms.length) { body.append(h('div', { class: 'empty' }, art('party', { size: 110, cls: '' }), h('p', {}, 'No mistakes to review. Anything you get wrong lands here, with the right answer.'))); return; }
    body.append(h('div', { class: 'oops-list' }, ms.map((m) => {
      const p = packs.find((x) => x.id === (m.pack || 'science'));
      return h('div', { class: 'oops' },
        rich('q', m.q, m.html),
        m.you ? rich('you', m.you, false, 'You said: ') : null,
        rich('ans', m.ans, m.html, 'Answer: '),
        m.why ? rich('why', m.why, m.html) : null,
        h('div', { class: 'meta' }, h('span', {}, `${p ? p.short + ' · ' : ''}${m.game || ''}`),
          p && p.oopsAction ? p.oopsAction(m, ctx, root) : null,
          h('button', { class: 'btn small go', onclick: () => { ctx.sfx.good(); store.clearMistake(m.key); render(); } }, 'Got it now')));
    })));
  }
  render();
  return root;
}

// grown-ups page: a short overview, then one section per island (pack.parents(ctx) → element)
export function openParents(parent, ctx, packs, onClose) {
  const { body } = bookShell(parent, 'For grown-ups 家長頁', onClose);
  body.classList.add('parents');
  const sk = store.streak();
  body.append(
    h('p', {}, `${store.name()}'s Islands: one page for everything she is revising. Each subject is its own island; stars from every island go into one pouch for the Star Shop and the Star Road. Progress is saved in this browser only — nothing is uploaded.`),
    h('p', { class: 'zh' }, '每科一個島：常識（Biodiversity Island）、數學（Maths Island，全英文）、中文（成語島，即係成語大冒險）。所有島嘅星星都入同一個星星袋，可以喺 Star Shop 買嘢、喺 Star Road 開禮物。進度只存喺呢部機嘅瀏覽器。'),
    h('div', { class: 'parent-stats' },
      h('span', {}, art('star', { size: 26 }), ` ${store.lifetime()} stars earned · ${store.pouch()} in the pouch`),
      h('span', {}, art('fire', { size: 26 }), ` ${sk}-day streak`),
      h('span', {}, art('memo', { size: 26 }), ` ${store.get().mistakes.length} in the Oops Book`)),
    ...packs.map((p) => (p.parents ? h('section', { class: 'parent-pack' }, h('h3', {}, art(p.art, { size: 34 }), ` ${p.title}`), p.parents(ctx, parent)) : null)),
    h('h3', {}, 'Credits'),
    h('p', {}, '3D art: Microsoft Fluent Emoji (MIT licence). 3D islands: three.js (MIT). Music and sound effects are generated live in the browser.'),
    h('div', { style: { marginTop: '20px' } }, h('button', { class: 'btn small hot', onclick: (e) => {
      if (e.currentTarget.dataset.sure) { store.reset(); location.reload(); } else { e.currentTarget.dataset.sure = '1'; e.currentTarget.textContent = 'Tap again to erase all island progress (成語大冒險 keeps its own)'; }
    } }, 'Reset progress')),
  );
}
export { modal };
