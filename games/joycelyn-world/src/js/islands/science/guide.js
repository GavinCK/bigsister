// Biodiversity Island: Field Guide (collectible animal and plant cards)
import { h, modal } from '../../core/ui.js';
import { art, creatureArt } from '../../core/art.js';
import { CREATURES, PLANTS, GROUPS, BIOMES, DEFENSES } from './data.js';
import { bookShell } from '../../core/books.js';
import { store } from '../../core/store.js';

const GROUP_LABEL = { ...Object.fromEntries(Object.entries(GROUPS).map(([k, v]) => [k, v.name])), invertebrate: 'No backbone (not insects)' };
const GROUP_COLOR = { ...Object.fromEntries(Object.entries(GROUPS).map(([k, v]) => [k, v.color])), invertebrate: '#8A7A6A', plant: '#3E9B4A' };

export function allCards() {
  const a = Object.entries(CREATURES).map(([id, c]) => ({ id, ...c, kind: 'animal' }));
  const p = Object.entries(PLANTS).map(([id, c]) => ({ id, ...c, kind: 'plant', group: 'plant' }));
  return [...a, ...p];
}
export const TOTAL_CARDS = allCards().length;
export const scienceCardCount = () => allCards().filter((c) => store.has(c.id)).length;

export function openGuide(parent, sfx, onClose) {
  const cards = allCards();
  const got = scienceCardCount();
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

