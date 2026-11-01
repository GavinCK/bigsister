// GAME · Plant Survivor — design roots, stem and leaves; survive 3 wild days
import { PLANT_PARTS, PLANT_LEVELS, PLANT_FAIL, BIOMES } from '../data.js';
import { h } from '../ui.js';
import { art } from '../art.js';
import { burstAt, confetti, shake } from '../fx.js';

const GROUND = 205;

// ---------- plant drawing ----------
function rootsSVG(id) {
  const c = '#8A5A2B';
  if (id === 'deep') return `<g stroke="${c}" fill="none" stroke-linecap="round"><path d="M150 ${GROUND} C152 260 146 300 150 350" stroke-width="9"/><path d="M150 250 q-22 18 -30 40 M151 285 q24 14 28 38 M149 318 q-16 10 -18 24" stroke-width="4"/></g>`;
  if (id === 'shallow') return `<g stroke="${c}" fill="none" stroke-linecap="round" stroke-width="5">${[-1, 1].map((s) => `<path d="M150 ${GROUND + 2} q${s * 50} 10 ${s * 125} 12"/><path d="M150 ${GROUND + 4} q${s * 40} 22 ${s * 95} 30"/><path d="M150 ${GROUND + 2} q${s * 30} 4 ${s * 60} 4"/>`).join('')}<path d="M150 ${GROUND} v26" stroke-width="7"/></g>`;
  if (id === 'buttress') return `<g fill="#7A4B2A"><path d="M132 ${GROUND} L150 120 L120 ${GROUND}Z"/><path d="M168 ${GROUND} L150 120 L188 ${GROUND}Z"/><path d="M140 ${GROUND} L150 140 L104 ${GROUND}Z" opacity=".8"/><path d="M160 ${GROUND} L150 140 L200 ${GROUND}Z" opacity=".8"/></g><g stroke="${c}" stroke-width="5" fill="none"><path d="M120 ${GROUND} q-30 18 -50 22 M188 ${GROUND} q30 16 52 20 M150 ${GROUND} v40"/></g>`;
  if (id === 'aerial') return `<g stroke="${c}" fill="none" stroke-linecap="round"><path d="M150 ${GROUND - 40} q-40 20 -60 ${45}" stroke-width="6"/><path d="M150 ${GROUND - 40} q40 20 60 ${45}" stroke-width="6"/><path d="M150 ${GROUND - 30} q-18 22 -24 ${35}" stroke-width="5"/><path d="M150 ${GROUND - 30} q18 22 24 ${35}" stroke-width="5"/><path d="M90 ${GROUND + 5} q-30 10 -50 10 M210 ${GROUND + 5} q30 10 50 10" stroke-width="4"/></g><g stroke="${c}" stroke-width="5" stroke-linecap="round">${[52, 70, 232, 250, 34, 268].map((x, i) => `<path d="M${x} ${GROUND + 12} v-${26 + (i % 3) * 8}"/>`).join('')}</g>`;
  return `<g stroke="${c}" fill="none" stroke-linecap="round" stroke-width="4"><path d="M150 ${GROUND} v40 M150 ${GROUND + 10} q-22 14 -30 32 M150 ${GROUND + 10} q22 14 30 32 M150 ${GROUND + 25} q-12 14 -14 26 M150 ${GROUND + 25} q12 14 14 26"/></g>`;
}
function stemSVG(id) {
  if (id === 'thick') return { svg: `<g><rect x="114" y="70" width="72" height="${GROUND - 70}" rx="36" fill="#3E9B4A"/><path d="M132 82 V${GROUND} M150 74 V${GROUND} M168 82 V${GROUND}" stroke="#2E7A38" stroke-width="3"/><path d="M186 140 h22 q10 0 10 -10 v-30" stroke="#3E9B4A" stroke-width="22" fill="none" stroke-linecap="round"/></g>`, pts: [[118, 100], [182, 100], [118, 150], [182, 150], [150, 74], [118, 190], [182, 190], [214, 96]] };
  if (id === 'trunk') return { svg: `<path d="M140 ${GROUND} L144 40 L156 40 L160 ${GROUND}Z" fill="#7A4B2A"/><path d="M150 80 L118 52 M150 70 L186 46" stroke="#7A4B2A" stroke-width="7" stroke-linecap="round"/>`, pts: [[110, 44], [150, 30], [190, 40], [130, 60], [172, 58], [96, 60], [204, 56]] };
  if (id === 'climbing') return { svg: `<rect x="196" y="10" width="34" height="${GROUND - 10}" fill="#6B4A30" rx="6"/><path d="M150 ${GROUND} C150 170 230 170 213 140 C196 110 240 100 213 80 C186 60 240 50 213 22" stroke="#4DA845" stroke-width="7" fill="none" stroke-linecap="round"/>`, pts: [[186, 150], [236, 128], [192, 96], [236, 66], [196, 40], [222, 18]] };
  if (id === 'holes') return { svg: `<g><rect x="60" y="${GROUND + 34}" width="180" height="40" rx="20" fill="#E9D3B0" stroke="#B89466" stroke-width="3"/>${[90, 120, 150, 180, 210].map((x) => `<circle cx="${x}" cy="${GROUND + 54}" r="7" fill="#8A6A44"/>`).join('')}<path d="M110 ${GROUND + 36} V120 M190 ${GROUND + 36} V100" stroke="#5DA84A" stroke-width="5"/></g>`, pts: [[110, 120], [190, 100]] };
  return { svg: '', pts: [] };
}
function leavesSVG(id, pts, stem) {
  if (!pts.length) return '';
  if (id === 'needle') return `<g stroke="#F5E6B8" stroke-width="2.4" stroke-linecap="round">${pts.flatMap(([x, y]) => [-1, 1].map((s) => `<path d="M${x} ${y} l${s * 12} -6 M${x} ${y + 12} l${s * 12} 4"/>`)).join('')}</g>`;
  if (id === 'broad') {
    if (stem === 'holes') return pts.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="44" ry="10" fill="#3FAE4F" stroke="#2E8B3E" stroke-width="3"/>`).join('');
    return pts.map(([x, y], i) => `<g transform="rotate(${(i % 2 ? 1 : -1) * 25} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="26" ry="15" fill="#3FAE4F" stroke="#2E8B3E" stroke-width="2.5"/><path d="M${x - 22} ${y} H${x + 22}" stroke="#2E8B3E" stroke-width="2"/></g>`).join('');
  }
  if (id === 'waxy') return pts.map(([x, y], i) => `<g transform="rotate(${(i % 2 ? 1 : -1) * 30} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="20" ry="11" fill="#1F7A3A" stroke="#135A28" stroke-width="2"/><ellipse cx="${x - 6}" cy="${y - 4}" rx="8" ry="3" fill="#fff" opacity=".65"/></g>`).join('');
  return '';
}
const BG = {
  desert: { sky: ['#FFE7B0', '#FFC874'], ground: '#E8B35E', deco: `<path d="M-400 ${GROUND} q120 -40 240 0 q140 -50 300 0 q160 -40 600 0 V${GROUND + 6} H-400Z" fill="#F0C27A"/>` },
  giant: { sky: ['#1F5530', '#4F9A5A'], ground: '#5A3D2A', deco: `<g fill="#173F24" opacity=".7"><rect x="-120" y="-200" width="40" height="${GROUND + 200}"/><rect x="20" y="-200" width="26" height="${GROUND + 200}"/><rect x="250" y="-200" width="34" height="${GROUND + 200}"/><rect x="380" y="-200" width="46" height="${GROUND + 200}"/></g><path d="M150 -300 L40 ${GROUND} H260Z" fill="#FFF7C2" opacity=".12"/>` },
  vine: { sky: ['#1F5530', '#3F8A4C'], ground: '#5A3D2A', deco: `<g fill="#173F24" opacity=".75"><rect x="-140" y="-200" width="50" height="${GROUND + 200}"/><rect x="40" y="-200" width="30" height="${GROUND + 200}"/><rect x="330" y="-200" width="44" height="${GROUND + 200}"/></g><circle cx="230" cy="-120" r="70" fill="#FFF7C2" opacity=".35"/>` },
  mangrove: { sky: ['#BFE7F5', '#E6F7FF'], ground: '#6E5236', deco: `<rect x="-600" y="${GROUND - 26}" width="1500" height="26" fill="#58A6C9" opacity=".55"/>` },
  lotus: { sky: ['#CFEFFF', '#EAF8FF'], ground: '#6E5236', deco: `<rect x="-600" y="96" width="1500" height="${GROUND - 96}" fill="#4FA9CF" opacity=".6"/><path d="M-600 96 H900" stroke="#BDEBFF" stroke-width="4"/>` },
};
function plantSVG(sel, extra = '', lvl = 'desert') {
  const st = stemSVG(sel.stem); const b = BG[lvl];
  const bg = `<defs><linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${b.sky[0]}"/><stop offset="1" stop-color="${b.sky[1]}"/></linearGradient></defs><rect x="-800" y="-600" width="1900" height="${GROUND + 600}" fill="url(#skyg)"/>${b.deco}<rect x="-800" y="${GROUND}" width="1900" height="700" fill="${b.ground}"/><path d="M-800 ${GROUND} H1100" stroke="rgba(0,0,0,.18)" stroke-width="4"/>`;
  return `<svg viewBox="0 0 300 360" preserveAspectRatio="xMidYMid meet" class="plant-svg">${bg}<g class="pl">${rootsSVG(sel.roots)}${st.svg}${leavesSVG(sel.leaves, st.pts, sel.stem)}${extra}</g></svg>`;
}
const FLOWERS = (pts) => `<g class="flowers">${pts.slice(0, 5).map(([x, y]) => `<g><circle cx="${x}" cy="${y - 10}" r="9" fill="#FF8FB1"/><circle cx="${x}" cy="${y - 10}" r="4" fill="#FFD166"/></g>`).join('')}</g>`;

export default async function play(api) {
  api.music('garden');
  await api.intro({
    title: 'Plant Survivor', artId: 'pottedplant',
    how: [['seedling', 'Pick roots, stem and leaves'], ['eyes', 'Watch your plant grow live'], ['tornado', 'Survive 3 wild days in its habitat']],
    learn: 'Different plants have roots, stems and leaves with special features to adapt to their environment.',
  });

  const scene = h('div', { class: 'ps-scene' });
  const plantBox = h('div', { class: 'ps-plant' });
  const weather = h('div', { class: 'ps-weather' });
  const health = h('div', { class: 'ps-health' }, h('span', {}, 'Health'), h('div', { class: 'ps-bar' }, h('i')));
  scene.append(weather, plantBox, health);
  const brief = h('div', { class: 'ps-brief' });
  const pickers = h('div', { class: 'ps-pickers' });
  const growBtn = h('button', { class: 'btn go ps-grow' }, art('sun', { size: 34 }), 'Grow!');
  const side = h('div', { class: 'ps-side' }, brief, pickers, growBtn);
  api.body.append(h('div', { class: 'ps' }, scene, side));

  let score = 0, firstTry = 0, solved = 0;
  for (let li = 0; li < PLANT_LEVELS.length; li++) {
    const L = PLANT_LEVELS[li]; const biomeKey = L.biome === 'wetland' ? 'wetland' : L.biome;
    api.frame.setProgress(li / PLANT_LEVELS.length);
    scene.className = `ps-scene bg-${L.id}`;
    const B = BIOMES[L.biome];
    brief.innerHTML = '';
    brief.append(h('div', { class: 'ps-level' }, `Level ${li + 1} of ${PLANT_LEVELS.length}`), h('h3', {}, L.title), h('p', {}, L.brief));
    const sel = { roots: L.lock?.roots || null, stem: L.lock?.stem || null, leaves: L.lock?.leaves || null };
    const pickEls = {};
    pickers.innerHTML = '';
    for (const part of ['roots', 'stem', 'leaves']) {
      const locked = L.lock?.[part];
      const row = h('div', { class: `ps-row ${locked ? 'locked' : ''}` }, h('div', { class: 'ps-row-t' }, part[0].toUpperCase() + part.slice(1), locked ? h('small', {}, ' (already set)') : null));
      const opts = h('div', { class: 'ps-opts' });
      PLANT_PARTS[part].forEach((o) => {
        if (locked && o.id !== locked) return;
        const b = h('button', { class: `ps-opt ${sel[part] === o.id ? 'on' : ''}`, onclick: () => { if (locked || simulating) return; sel[part] = o.id; api.sfx.tap(); opts.querySelectorAll('.ps-opt').forEach((x) => x.classList.toggle('on', x === b)); row.classList.remove('bad'); draw(); } },
          h('b', {}, o.text), h('small', {}, o.does));
        opts.append(b);
      });
      row.append(opts); pickers.append(row); pickEls[part] = row;
    }
    let simulating = false;
    function draw(extra) { plantBox.innerHTML = plantSVG({ roots: sel.roots || '', stem: sel.stem || '', leaves: sel.leaves || '' }, extra, L.id); }
    draw();
    setHealth(70);

    let tries = 0, ok = false;
    while (!ok && tries < 3) {
      await new Promise((res) => { growBtn.onclick = () => { if (!sel.roots || !sel.stem || !sel.leaves) { api.toast('Pick roots, stem AND leaves first.', { artId: 'seedling', ms: 1600 }); return; } growBtn.onclick = null; res(); }; });
      tries++; simulating = true; growBtn.disabled = true;
      api.sfx.grow();
      const parts = ['roots', 'stem', 'leaves'];
      const verdict = Object.fromEntries(parts.map((p) => [p, L.need[p].includes(sel[p])]));
      let hp = 70;
      for (let d = 0; d < 3; d++) {
        const ev = L.events[d]; const p = parts[d];
        weather.innerHTML = ''; weather.className = `ps-weather ev-${ev.icon}`;
        weather.append(h('div', { class: 'ps-event' }, art(ev.icon, { size: 64 }), h('div', {}, h('small', {}, `Day ${d + 1}`), h('b', {}, ev.text))));
        api.sfx.whoosh();
        await api.wait(1100);
        if (verdict[p]) { hp = Math.min(100, hp + 10); api.sfx.good(d); plantBox.classList.add('happy'); setTimeout(() => plantBox.classList.remove('happy'), 500); }
        else { hp -= 35; api.sfx.bad(); shake(plantBox); pickEls[p].classList.add('bad');
          const o = PLANT_PARTS[p].find((x) => x.id === sel[p]);
          weather.append(h('div', { class: 'ps-why' }, art('warning', { size: 34 }), PLANT_FAIL[biomeKey][sel[p]] || `${o.text} don't help here.`));
          api.miss({ key: `plant:${L.id}:${p}`, q: `${L.title}: which ${p}?`, you: o.text, ans: L.need[p].map((id) => PLANT_PARTS[p].find((x) => x.id === id).text).join(' or '), why: PLANT_FAIL[biomeKey][sel[p]] || '' });
        }
        setHealth(hp);
        await api.wait(verdict[p] ? 900 : 2300);
      }
      weather.innerHTML = ''; weather.className = 'ps-weather';
      ok = parts.every((p) => verdict[p]);
      if (ok) {
        solved++; if (tries === 1) firstTry++;
        const pts = tries === 1 ? 300 : tries === 2 ? 150 : 60; score += pts; api.frame.setScore(score);
        draw(FLOWERS(stemSVG(sel.stem).pts)); plantBox.classList.add('bloom');
        api.sfx.win(); confetti(70); burstAt(plantBox, { n: 30, colors: ['#FF8FB1', '#FFD166', '#2EB872', '#FFFFFF'] });
        if (L.id === 'desert') api.learn('cactus'); if (L.id === 'mangrove') api.learn('mangrove'); if (L.id === 'lotus') api.learn('lotus');
        weather.append(h('div', { class: 'ps-event win' }, art('sparkles', { size: 56 }), h('div', {}, h('b', {}, 'It survived!'), h('span', {}, L.win))));
        await waitBtn('Next habitat');
        plantBox.classList.remove('bloom');
      } else {
        plantBox.classList.add('wilt'); api.sfx.wilt();
        if (tries < 3) { await api.wait(900); api.toast('Your plant wilted. Change the red parts and grow again!', { kind: 'bad', artId: 'wilted', ms: 2400 }); plantBox.classList.remove('wilt'); setHealth(70); }
        else {
          weather.append(h('div', { class: 'ps-event' }, art('bulb', { size: 56 }), h('div', {}, h('b', {}, 'The winning design:'), h('span', {}, ['roots', 'stem', 'leaves'].map((p) => PLANT_PARTS[p].find((x) => x.id === L.need[p][0]).text).join(' + ')))));
          await waitBtn('Next habitat'); plantBox.classList.remove('wilt');
        }
      }
      simulating = false; growBtn.disabled = false;
    }
  }
  api.frame.setProgress(1);
  api.finish({ score, correct: solved, total: PLANT_LEVELS.length, stars: firstTry >= 5 ? 3 : firstTry >= 3 && solved >= 4 ? 2 : solved >= 1 ? 1 : 0 });

  function setHealth(v) { const i = health.querySelector('i'); i.style.width = `${Math.max(0, v)}%`; i.style.background = v > 55 ? 'var(--leaf)' : v > 30 ? 'var(--mango)' : 'var(--coral)'; }
  function waitBtn(label) { return new Promise((res) => { const b = h('button', { class: 'btn go small', onclick: () => { b.remove(); res(); } }, label); weather.append(b); }); }
}
