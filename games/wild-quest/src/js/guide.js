// Field guide (collectible cards), Oops book (mistakes), Grown-ups page
import { h, modal } from './ui.js';
import { art, creatureArt } from './art.js';
import { CREATURES, PLANTS, GROUPS, BIOMES, DEFENSES, COVERAGE } from './data.js';
import { store } from './store.js';

const GROUP_LABEL = { ...Object.fromEntries(Object.entries(GROUPS).map(([k, v]) => [k, v.name])), invertebrate: 'No backbone (not insects)' };
const GROUP_COLOR = { ...Object.fromEntries(Object.entries(GROUPS).map(([k, v]) => [k, v.color])), invertebrate: '#8A7A6A', plant: '#3E9B4A' };

export function allCards() {
  const a = Object.entries(CREATURES).map(([id, c]) => ({ id, ...c, kind: 'animal' }));
  const p = Object.entries(PLANTS).map(([id, c]) => ({ id, ...c, kind: 'plant', group: 'plant' }));
  return [...a, ...p];
}
export const TOTAL_CARDS = allCards().length;

function bookShell(parent, title, onClose, countText) {
  const body = h('div', { class: 'book-body' });
  const tabs = h('div', { class: 'book-tabs' });
  const root = h('div', { class: 'book' },
    h('div', { class: 'book-head' }, h('button', { class: 'iconbtn', 'aria-label': 'Close', onclick: () => { root.remove(); onClose && onClose(); } }, art('worldmap')), h('h2', {}, title), countText ? h('span', { class: 'count' }, countText) : null),
    tabs, body);
  parent.append(root);
  return { root, body, tabs };
}

export function openGuide(parent, sfx, onClose) {
  const cards = allCards();
  const got = cards.filter((c) => store.has(c.id)).length;
  const { body, tabs, root } = bookShell(parent, 'Field Guide', onClose, `${got} / ${cards.length} cards`);
  const filters = [['all', 'All'], ...Object.keys(GROUPS).map((g) => [g, GROUPS[g].name]), ['invertebrate', 'Other no-backbone'], ['plant', 'Plants']];
  let cur = 'all';
  const tabBtns = filters.map(([id, label]) => h('button', { class: id === cur ? 'on' : '', onclick: () => { cur = id; tabBtns.forEach((b, i) => b.classList.toggle('on', filters[i][0] === id)); render(); } }, label));
  tabs.append(...tabBtns);
  function render() {
    body.innerHTML = '';
    const list = cards.filter((c) => cur === 'all' || c.group === cur);
    body.append(h('div', { class: 'cards' }, list.map((c) => {
      const on = store.has(c.id);
      return h('button', { class: `card ${on ? '' : 'locked'}`, style: { '--gc': GROUP_COLOR[c.group] }, onclick: () => { sfx.tap(); on ? showCard(root, c) : lockedHint(root, c); } },
        creatureArt(c.id), h('b', {}, on ? c.name : '???'), h('small', {}, on ? c.zh : GROUP_LABEL[c.group] || 'Plant'));
    })));
  }
  render();
}

function lockedHint(parent, c) {
  const m = modal(parent, creatureArt(c.id, { cls: 'hero-art', fx: 'brightness(0) opacity(.25)' }), h('h2', {}, 'Not found yet'),
    h('p', {}, c.kind === 'plant' ? 'Grow, sort or defend plants in the Greenhouse to collect this card.' : 'Answer a question about this creature correctly in any game to collect its card.'),
    h('div', { class: 'actions' }, h('button', { class: 'btn small', onclick: () => m.close() }, 'OK')));
}

export function showCard(parent, c) {
  const g = GROUPS[c.group];
  const tags = [];
  if (c.kind === 'animal') tags.push(h('span', { class: 'tag', style: { '--gc': GROUP_COLOR[c.group] } }, GROUP_LABEL[c.group]));
  if (c.kind === 'animal') tags.push(h('span', { class: 'tag', style: { '--gc': '#4A5A72' } }, c.group === 'insects' || c.group === 'invertebrate' ? 'No backbone' : 'Has a backbone'));
  if (c.biome) tags.push(h('span', { class: 'tag', style: { '--gc': BIOMES[c.biome].color } }, BIOMES[c.biome].name));
  if (c.defense) tags.push(h('span', { class: 'tag', style: { '--gc': '#7A5CFA' } }, DEFENSES[c.defense].name));
  if (c.kind === 'plant' && c.flowering != null) tags.push(h('span', { class: 'tag', style: { '--gc': '#3E9B4A' } }, c.flowering ? 'Flowering plant' : 'Non-flowering plant'));
  if (c.kind === 'plant' && c.where) tags.push(h('span', { class: 'tag', style: { '--gc': '#27B5D0' } }, c.where === 'water' ? 'Water plant' : 'Land plant'));
  const m = modal(parent, h('div', { class: 'card-detail' },
    h('div', { class: 'cd-top' }, creatureArt(c.id), h('div', {}, h('h2', { style: { textAlign: 'left' } }, c.name), h('div', { style: { fontSize: '20px', color: '#4A5A72' } }, c.zh), h('div', {}, tags))),
    c.fact ? h('p', { style: { fontSize: '19px', marginTop: '12px' } }, c.fact) : null,
    g ? h('div', {}, h('b', {}, `${g.name} (${g.zh}) all share:`), h('ul', { class: 'traits' }, g.traits.map((t) => h('li', {}, t)))) : null,
    h('div', { class: 'actions' }, h('button', { class: 'btn small', onclick: () => m.close() }, 'Close'))));
}

export function openOops(parent, sfx, onClose) {
  const { body } = bookShell(parent, 'Oops Book', onClose, `${store.get().mistakes.length} to review`);
  function render() {
    body.innerHTML = '';
    const ms = store.get().mistakes;
    if (!ms.length) { body.append(h('div', { class: 'empty' }, art('party', { size: 110, cls: '' }), h('p', {}, 'No mistakes to review. Anything you get wrong in a game lands here, with the right answer.'))); return; }
    body.append(h('div', { class: 'oops-list' }, ms.map((m) => h('div', { class: 'oops' },
      h('div', { class: 'q' }, m.q),
      m.you ? h('div', { class: 'you' }, `You said: ${m.you}`) : null,
      h('div', { class: 'ans' }, `Answer: ${m.ans}`),
      m.why ? h('div', { class: 'why' }, m.why) : null,
      h('div', { class: 'meta' }, h('span', {}, m.game || ''), h('button', { class: 'btn small go', onclick: () => { sfx.good(); store.clearMistake(m.key); render(); } }, 'Got it now'))))));
  }
  render();
}

export function openParents(parent, onClose) {
  const { body } = bookShell(parent, 'For grown-ups', onClose);
  body.classList.add('parents');
  body.append(
    h('p', {}, 'Joycelyn Biodiversity Island (Wild Quest) covers P6 General Studies (Science) Unit 1 Biodiversity: classification of living things, plants and environment, animals and environment. Every game is built around play first; the facts are what you need to win.'),
    h('h3', {}, 'Where each exam question type is practised'),
    h('table', {}, h('tr', {}, h('th', {}, 'Question type in the workbook'), h('th', {}, 'Practised in')), COVERAGE.map((c) => h('tr', {}, h('td', {}, c.format), h('td', {}, c.games.join(', '))))),
    h('h3', {}, 'Good to know'),
    h('ul', {},
      h('li', {}, 'Each game gives up to 3 stars. Replaying only ever raises the star count.'),
      h('li', {}, 'Every wrong answer is saved in the Oops Book with the correct answer and the reason — a quick revision list before a test.'),
      h('li', {}, 'Correct answers unlock Field Guide cards. Each card repeats the key fact and the shared characteristics of its animal group.'),
      h('li', {}, 'Answers follow the school notes (e.g. bats and dolphins are mammals; sea turtles are reptiles; only birds and mammals are warm-blooded).'),
      h('li', {}, 'Stars: every game pays its stars into a pouch. Spend them in the Star Shop (outfits, pets, island decorations, power-ups). Best scores and the Star Road never go down when she shops.'),
      h('li', {}, 'Each zone has a boss. It wakes up once every game in that zone has at least 1 star. Boss questions mix the whole zone and are a little harder; the first win gives a prize.'),
      h('li', {}, 'Power-ups (extra heart, slow-mo, lucky shield, lucky clover) are switched on at the start of a game.'),
      h('li', {}, 'Progress is saved in this browser only. Nothing is uploaded.')),
    h('h3', {}, 'Credits'),
    h('p', {}, '3D animal art: Microsoft Fluent Emoji (MIT licence). 3D island: three.js (MIT). Music and sound effects are generated live in the browser.'),
    h('div', { style: { marginTop: '20px' } }, h('button', { class: 'btn small hot', onclick: (e) => {
      if (e.currentTarget.dataset.sure) { store.reset(); location.reload(); } else { e.currentTarget.dataset.sure = '1'; e.currentTarget.textContent = 'Tap again to erase all progress'; }
    } }, 'Reset progress')),
  );
}
