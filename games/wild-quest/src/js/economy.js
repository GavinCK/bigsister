// Star Shop, Star Road, gift boxes, avatar badge and the power-up tray
import { h, modal } from './ui.js';
import { art } from './art.js';
import { store } from './store.js';
import { burstAt, confetti, floatAt } from './fx.js';
import { COSTUMES, PETS, DECOR, POWERUPS, ALL_ITEMS, ROAD } from './items.js';
import { CREATURES } from './data.js';

// ---------- helpers ----------
export const costumeArt = () => store.equipped('costume') || 'c-scientist';
export const petArt = () => { const p = store.equipped('pet'); return p ? ALL_ITEMS[p]?.art : null; };
export function avatarEl(size = 64, withPet = true) {
  const pet = withPet && petArt();
  return h('div', { class: 'avatar', style: { '--s': `${size}px` } }, art(costumeArt(), { cls: 'av-body' }), pet ? art(pet, { cls: 'av-pet' }) : null);
}
export const claimableRoad = () => ROAD.filter((r) => store.lifetime() >= r.at && !store.roadClaimed(r.at)).length;
export const nextRoad = () => ROAD.find((r) => store.lifetime() < r.at);

function giftLabel(g) {
  if (g.item) return ALL_ITEMS[g.item].name;
  if (g.power) return `${POWERUPS.find((p) => p.id === g.power).name} ×${g.n}`;
  if (g.stars) return `${g.stars} stars`;
  return 'Gift';
}
function giftArt(g) {
  if (g.item) return ALL_ITEMS[g.item].art;
  if (g.power) return POWERUPS.find((p) => p.id === g.power).art;
  return 'star';
}

// Give a gift: items you already own turn into stars
export function grant(g, ctx) {
  if (g.item) {
    const it = ALL_ITEMS[g.item];
    if (store.owns(it.id)) { const n = Math.max(3, it.price || 5); store.refund(n); return { note: `You already had it — here are ${n} stars instead!` }; }
    store.own(it.id);
    if (it.type === 'decor') { store.addDecor(it.id); ctx.onDecor && ctx.onDecor(); }
    return { item: it };
  }
  if (g.power) { store.addPower(g.power, g.n || 1); return {}; }
  if (g.stars) { store.refund(g.stars); return {}; }
  return {};
}

// Gift box: wobble → tap → burst → reveal
export function openGift(parent, g, ctx, { title = 'A gift for you!', sub = '' } = {}) {
  return new Promise((resolve) => {
    const box = h('button', { class: 'giftbox', 'aria-label': 'Open the gift' }, art('gift'));
    const reveal = h('div', { class: 'gift-reveal' });
    const actions = h('div', { class: 'actions' });
    const m = modal(parent, h('h2', {}, title), sub ? h('p', { class: 'learnline' }, sub) : null, box, reveal, h('p', { class: 'learnline gift-hint' }, 'Tap the box!'), actions);
    ctx.sfx.boing();
    box.onclick = () => {
      if (box.dataset.open) return; box.dataset.open = 1;
      box.classList.add('open'); ctx.sfx.chest(); burstAt(box, { n: 40, kind: 'star', speed: 10, colors: ['#FFB627', '#FFE066', '#FF5D73', '#FFFFFF'] }); confetti(80);
      m.box.querySelector('.gift-hint')?.remove();
      const res = grant(g, ctx);
      setTimeout(() => {
        box.remove();
        reveal.append(art(giftArt(g), { cls: 'gift-item' }), h('b', {}, giftLabel(g)));
        if (res.note) reveal.append(h('p', {}, res.note));
        const it = res.item;
        if (it && (it.type === 'costume' || it.type === 'pet')) actions.append(h('button', { class: 'btn go', onclick: () => { store.equip(it.type, it.id); ctx.sfx.equip(); ctx.onChange && ctx.onChange(); m.close(); resolve(); } }, it.type === 'costume' ? 'Wear it now' : 'Take it along'));
        if (it && it.type === 'decor') reveal.append(h('p', { class: 'learnline' }, 'It is now on your island!'));
        actions.append(h('button', { class: 'btn ghost', onclick: () => { m.close(); ctx.onChange && ctx.onChange(); resolve(); } }, 'Great!'));
      }, 450);
    };
  });
}

// ---------- in-page confirm ----------
function confirmBuy(parent, it, price, ctx) {
  return new Promise((resolve) => {
    const m = modal(parent, art(it.art, { cls: 'hero-art' }), h('h2', {}, `Buy ${it.name}?`),
      h('p', {}, h('b', {}, `${price} ★`), ` from your pouch (you have ${store.pouch()}).`),
      h('div', { class: 'actions' }, h('button', { class: 'btn ghost', onclick: () => { m.close(); resolve(false); } }, 'Not now'), h('button', { class: 'btn go', onclick: () => { m.close(); resolve(true); } }, 'Buy')));
  });
}

// ---------- Star Shop ----------
export function openShop(parent, ctx, startTab = 'costume') {
  ctx.music('shop');
  const pouchEl = h('b', {}, store.pouch());
  const body = h('div', { class: 'book-body shop-body' });
  const tabs = [['costume', 'Outfits', 'c-scientist'], ['pet', 'Pets', 'paw'], ['decor', 'Island', 'ferriswheel'], ['power', 'Power-ups', 'zap']];
  let cur = startTab;
  const tabBtns = tabs.map(([id, label, a]) => h('button', { class: id === cur ? 'on' : '', onclick: () => { cur = id; ctx.sfx.tap(); tabBtns.forEach((b, i) => b.classList.toggle('on', tabs[i][0] === id)); render(); } }, art(a, { size: 28 }), label));
  const root = h('div', { class: 'book shop' },
    h('div', { class: 'book-head' },
      h('button', { class: 'iconbtn', 'aria-label': 'Close the shop', onclick: () => { root.remove(); ctx.music('island'); ctx.onChange && ctx.onChange(); } }, art('worldmap')),
      art('shop', { size: 56 }), h('h2', {}, 'Star Shop'), h('div', { class: 'spacer' }),
      h('div', { class: 'pill pouch' }, art('star'), pouchEl, h('small', {}, 'to spend'))),
    h('div', { class: 'shop-hero' }, h('div', { class: 'shop-av' }), h('p', {}, 'Earn stars in any game, then spend them here. Your best scores never go down when you shop.')),
    h('div', { class: 'book-tabs' }, tabBtns), body);
  parent.append(root);
  const avBox = root.querySelector('.shop-av');
  function refresh() { pouchEl.textContent = store.pouch(); avBox.innerHTML = ''; avBox.append(avatarEl(96)); }

  function card(it, type) {
    const owned = type === 'power' ? false : store.owns(it.id);
    const equipped = (type === 'costume' || type === 'pet') && store.equipped(type) === it.id;
    const needsCard = type === 'pet' && it.card && !store.has(it.card);
    let btn;
    if (type === 'power') btn = h('button', { class: 'btn small', disabled: store.pouch() < it.price ? true : null, onclick: () => buy(it, type) }, `${it.price} ★`);
    else if (equipped) btn = h('button', { class: 'btn small cool', onclick: () => { if (type === 'pet') { store.equip('pet', null); ctx.sfx.tap(); refresh(); render(); ctx.onChange && ctx.onChange(); } } }, type === 'pet' ? 'With you ✓' : 'Wearing ✓');
    else if (owned && type !== 'decor') btn = h('button', { class: 'btn small go', onclick: () => { store.equip(type, it.id); ctx.sfx.equip(); refresh(); render(); ctx.onChange && ctx.onChange(); } }, type === 'pet' ? 'Take along' : 'Wear');
    else if (owned) btn = h('span', { class: 'owned' }, 'On your island ✓');
    else if (it.only === 'boss') btn = h('span', { class: 'lockline' }, art('crown', { size: 22 }), `Beat ${it.from}`);
    else if (it.only === 'road') btn = h('span', { class: 'lockline' }, art('gift', { size: 22 }), 'Star Road gift');
    else if (needsCard) btn = h('span', { class: 'lockline' }, art('lock', { size: 22 }), `Find the ${CREATURES[it.card]?.name.toLowerCase()} card first`);
    else btn = h('button', { class: 'btn small', disabled: store.pouch() < it.price ? true : null, onclick: () => buy(it, type) }, `${it.price} ★`);
    return h('div', { class: `shop-card ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}` },
      art(type === 'costume' ? it.id : it.art, { cls: needsCard || it.only ? 'dim' : '' }),
      h('b', {}, it.name),
      type === 'power' ? h('small', {}, it.desc) : null,
      type === 'power' ? h('small', { class: 'have' }, `You have ${store.powerCount(it.id)}`) : null,
      btn);
  }
  async function buy(it, type) {
    if (store.pouch() < it.price) return;
    ctx.sfx.tap();
    const ok = await confirmBuy(root, { ...it, art: type === 'costume' ? it.id : it.art }, it.price, ctx);
    if (!ok || !store.spend(it.price)) return;
    ctx.sfx.buy();
    if (type === 'power') store.addPower(it.id, 1);
    else {
      store.own(it.id);
      if (type === 'decor') { store.addDecor(it.id); ctx.onDecor && ctx.onDecor(); }
      if (type === 'costume' || type === 'pet') store.equip(type, it.id);
    }
    refresh(); render();
    const el = body.querySelector('.shop-card'); el && floatAt(pouchEl, `-${it.price}★`, '#FFE066');
    ctx.onChange && ctx.onChange();
  }
  function render() {
    body.innerHTML = '';
    const list = cur === 'costume' ? COSTUMES : cur === 'pet' ? PETS : cur === 'decor' ? DECOR : POWERUPS;
    if (cur === 'power') body.append(h('p', { class: 'shop-note' }, 'Power-ups wait in your bag. Switch them on at the start of a game.'));
    body.append(h('div', { class: 'shop-grid' }, list.map((it) => card(it, cur))));
  }
  refresh(); render();
  return root;
}

// ---------- Star Road ----------
export function openRoad(parent, ctx) {
  ctx.music('shop');
  const body = h('div', { class: 'book-body' });
  const root = h('div', { class: 'book road' },
    h('div', { class: 'book-head' },
      h('button', { class: 'iconbtn', 'aria-label': 'Close the Star Road', onclick: () => { root.remove(); ctx.music('island'); ctx.onChange && ctx.onChange(); } }, art('worldmap')),
      art('gift', { size: 56 }), h('h2', {}, 'Star Road'), h('div', { class: 'spacer' }),
      h('div', { class: 'pill' }, art('glowstar'), `${store.lifetime()} stars earned`)),
    body);
  parent.append(root);
  function render() {
    body.innerHTML = '';
    body.append(h('p', { class: 'shop-note' }, 'Every star you earn moves you along the road — spending stars never moves you back. Reach a gift to open it.'));
    const lt = store.lifetime();
    const road = h('div', { class: 'road-track' });
    ROAD.forEach((r, i) => {
      const reached = lt >= r.at, claimed = store.roadClaimed(r.at);
      const prev = i ? ROAD[i - 1].at : 0;
      const fill = Math.max(0, Math.min(1, (lt - prev) / (r.at - prev)));
      road.append(h('div', { class: 'road-seg' }, h('i', { style: { width: `${fill * 100}%` } })));
      const node = h('button', { class: `road-node ${claimed ? 'claimed' : reached ? 'ready' : ''}`, 'aria-label': `Gift at ${r.at} stars`, onclick: async () => {
        if (claimed) return;
        if (!reached) { ctx.sfx.tap(); ctx.toast(`${r.at - lt} more stars to reach this gift.`); return; }
        store.claimRoad(r.at);
        await openGift(root, r.gift, ctx, { title: `${r.at}-star gift!` });
        render();
      } }, art(claimed ? giftArt(r.gift) : 'gift', { cls: claimed ? '' : reached ? 'wiggle' : 'dim' }), h('b', {}, `${r.at}★`), h('small', {}, claimed || reached ? giftLabel(r.gift) : '?'));
      road.append(node);
    });
    body.append(road);
    setTimeout(() => { const n = road.querySelector('.road-node.ready') || road.querySelector('.road-node:not(.claimed)'); n && n.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }, 50);
  }
  render();
}

// ---------- power-up tray for the intro card ----------
// flags: { hearts: bool, timed: bool }. Returns { el, take() } — take() consumes the switched-on items.
export function powerTray(flags, ctx) {
  const on = {};
  const usable = POWERUPS.filter((p) => p.needs === 'any' || flags[p.needs]);
  const owned = usable.filter((p) => store.powerCount(p.id) > 0);
  if (!owned.length) return { el: null, take: () => ({}) };
  const el = h('div', { class: 'power-tray' }, h('b', {}, 'Use a power-up?'),
    h('div', { class: 'pt-row' }, owned.map((p) => {
      const b = h('button', { class: 'pt-btn', 'aria-pressed': 'false', title: p.desc, onclick: () => { on[p.id] = !on[p.id]; b.classList.toggle('on', on[p.id]); b.setAttribute('aria-pressed', on[p.id] ? 'true' : 'false'); ctx.sfx.equip(); } },
        art(p.art, { size: 34 }), h('span', {}, p.name), h('small', {}, `×${store.powerCount(p.id)}`));
      return b;
    })));
  return { el, take() { const used = {}; Object.keys(on).forEach((k) => { if (on[k] && store.powerCount(k) > 0) { store.addPower(k, -1); used[k] = true; } }); return used; } };
}
