// Art helpers: Fluent 3D stickers + a few hand-drawn SVG creatures/plants
import { CREATURES, PLANTS } from './data.js';
import { ART } from './art-data.js';

let uid = 0;
const SVGS = {
  hummingbird: `<svg viewBox="0 0 100 100"><defs><radialGradient id="$a" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#8EF0AE"/><stop offset="1" stop-color="#16804F"/></radialGradient></defs>
    <path d="M32 60 L10 80 L22 79 L16 93 L36 69Z" fill="#14704A"/>
    <path d="M46 46 Q28 12 54 6 Q60 28 52 50Z" fill="#C9F7DA" opacity=".9"/>
    <ellipse cx="46" cy="57" rx="21" ry="13" fill="url(#$a)" transform="rotate(-22 46 57)"/>
    <circle cx="63" cy="42" r="11" fill="url(#$a)"/>
    <path d="M57 49 Q66 55 57 61 Q51 55 57 49Z" fill="#E8344E"/>
    <path d="M72 40 L98 34 L72 44Z" fill="#3A2A20"/>
    <circle cx="66" cy="39.5" r="2.6" fill="#1B2A41"/><circle cx="66.8" cy="38.7" r=".9" fill="#fff"/>
    <path d="M42 50 Q52 24 70 20 Q62 40 50 54Z" fill="#E6FFF0" opacity=".75"/></svg>`,
  pelican: `<svg viewBox="0 0 100 100"><defs><radialGradient id="$a" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C5D3E0"/></radialGradient></defs>
    <path d="M38 78 v14 M48 78 v14" stroke="#F2A93B" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="40" cy="64" rx="27" ry="18" fill="url(#$a)"/>
    <path d="M18 58 Q8 74 30 80 Q44 72 38 58Z" fill="#B6C4D2"/>
    <path d="M54 54 Q54 32 60 24" stroke="#EEF3F7" stroke-width="13" fill="none" stroke-linecap="round"/>
    <circle cx="62" cy="21" r="11" fill="url(#$a)"/>
    <path d="M70 19 L99 29 L72 27Z" fill="#F2B33D"/>
    <path d="M70 26 Q84 52 98 30 L72 27Z" fill="#F7909F"/>
    <circle cx="64" cy="18" r="2.4" fill="#1B2A41"/></svg>`,
  seadragon: `<svg viewBox="0 0 100 100"><defs><linearGradient id="$a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9C860"/><stop offset="1" stop-color="#B07A2A"/></linearGradient></defs>
    <g fill="#8DBA45"><path d="M60 30 q16-12 20 2 q-8 3-20-2z"/><path d="M58 44 q18-4 16 10 q-9-1-16-10z"/><path d="M46 56 q-18-6-18 8 q10 0 18-8z"/><path d="M50 72 q16 2 12 14 q-8-4-12-14z"/><path d="M44 36 q-14-14-22-4 q8 6 22 4z"/><path d="M48 22 q2-16 14-12 q-4 8-14 12z"/></g>
    <path d="M50 20 Q66 22 64 34 Q62 44 54 50 Q46 58 52 68 Q58 78 50 86 Q44 90 46 82 Q50 76 44 68 Q38 58 46 48 Q52 40 50 32 Q44 30 36 34 L32 29 Q40 21 50 20Z" fill="url(#$a)"/>
    <path d="M36 29 L12 25 L12 30 L35 34Z" fill="#B88A34"/>
    <circle cx="48" cy="26" r="2.6" fill="#1B2A41"/><circle cx="48.8" cy="25.2" r=".8" fill="#fff"/></svg>`,
  sawfish: `<svg viewBox="0 0 100 100"><defs><linearGradient id="$a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9C8A6B"/><stop offset="1" stop-color="#E9DFC9"/></linearGradient></defs>
    <path d="M84 50 L99 37 L95 50 L99 63Z" fill="#7A6A50"/>
    <path d="M52 40 L60 26 L67 41Z" fill="#7A6A50"/>
    <path d="M28 50 Q40 34 62 38 Q80 42 87 50 Q80 58 62 62 Q40 66 28 50Z" fill="url(#$a)"/>
    <path d="M30 48.5 L2 47.5 L2 52.5 L30 51.5Z" fill="#8C7A5E"/>
    <g fill="#F4EEDD">${Array.from({ length: 7 }, (_, i) => `<path d="M${5 + i * 3.6} 47.6 l1.4 -3 l1.4 3z"/><path d="M${5 + i * 3.6} 52.4 l1.4 3 l1.4 -3z"/>`).join('')}</g>
    <circle cx="36" cy="46" r="2.3" fill="#1B2A41"/><path d="M48 56 Q56 64 60 60" stroke="#7A6A50" stroke-width="2" fill="none"/></svg>`,
  stickinsect: `<svg viewBox="0 0 100 100"><g stroke="#7E5C33" stroke-linecap="round" fill="none">
    <path d="M10 56 L84 46" stroke-width="5.5"/>
    <path d="M30 53 L22 40 L14 36 M36 52 L32 66 L26 76 M52 50 L48 36 L42 30 M56 50 L60 64 L66 74 M70 48 L70 36 L76 28 M72 48 L80 60 L88 66" stroke-width="2.4"/>
    <path d="M86 45 L97 36 M86 46 L98 42" stroke-width="1.6"/></g>
    <ellipse cx="86" cy="45.5" rx="4" ry="3" fill="#6E4F2A"/><circle cx="87.5" cy="44.5" r="1" fill="#1B2A41"/></svg>`,
  mantis: `<svg viewBox="0 0 100 100"><defs><linearGradient id="$a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B8F06A"/><stop offset="1" stop-color="#4C9A2A"/></linearGradient></defs>
    <g stroke="#4C9A2A" stroke-width="2.6" stroke-linecap="round" fill="none"><path d="M40 66 L28 84 L20 90 M46 66 L52 86 L58 92 M36 64 L18 72 L8 70"/></g>
    <ellipse cx="34" cy="62" rx="24" ry="8" fill="url(#$a)" transform="rotate(-18 34 62)"/>
    <path d="M52 56 L66 30" stroke="url(#$a)" stroke-width="7" stroke-linecap="round"/>
    <path d="M60 40 L76 50 L72 30" stroke="#5DAF34" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <g fill="#2F6B1A"><path d="M66 45 l3 -3 l1 4z"/><path d="M70 48 l3 -3 l1 4z"/><path d="M73 40 l4 -1 l-2 4z"/><path d="M73 35 l4 -1 l-2 4z"/></g>
    <path d="M60 22 L74 20 L66 32Z" fill="url(#$a)"/>
    <circle cx="62" cy="23" r="3" fill="#E2F7A0" stroke="#2F6B1A" stroke-width="1"/><circle cx="72" cy="21.5" r="3" fill="#E2F7A0" stroke="#2F6B1A" stroke-width="1"/>
    <path d="M64 20 Q60 6 52 4 M70 19 Q76 6 84 6" stroke="#4C9A2A" stroke-width="1.4" fill="none"/></svg>`,
  flametree: `<svg viewBox="0 0 100 100"><defs><radialGradient id="$a" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#FF8A3D"/><stop offset="1" stop-color="#D5321F"/></radialGradient></defs>
    <path d="M47 92 L49 58 Q36 50 30 46 M49 62 Q62 52 68 46 M50 66 L53 92Z" stroke="#7A4B2A" stroke-width="6" fill="#7A4B2A" stroke-linecap="round"/>
    <ellipse cx="50" cy="40" rx="44" ry="20" fill="#3E9A44"/>
    <ellipse cx="50" cy="36" rx="42" ry="18" fill="url(#$a)"/>
    <g fill="#FFC15A"><circle cx="30" cy="34" r="3"/><circle cx="52" cy="28" r="3"/><circle cx="70" cy="36" r="3"/><circle cx="42" cy="44" r="2.5"/><circle cx="62" cy="46" r="2.5"/></g></svg>`,
  cottontree: `<svg viewBox="0 0 100 100"><path d="M48 94 L50 18 L52 94Z" fill="#8A5A36" stroke="#8A5A36" stroke-width="5" stroke-linejoin="round"/>
    <g stroke="#8A5A36" stroke-width="3.2" stroke-linecap="round"><path d="M50 32 L28 22 M50 32 L72 20 M50 50 L22 42 M50 50 L78 40 M50 68 L30 62 M50 68 L72 60"/></g>
    <g fill="#E63A2E">${[[28, 20], [72, 18], [22, 40], [78, 38], [30, 60], [72, 58], [40, 26], [60, 26], [36, 46], [64, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5"/><circle cx="${x}" cy="${y}" r="2" fill="#FFD166"/>`).join('')}</g></svg>`,
  fern: `<svg viewBox="0 0 100 100"><g fill="none" stroke-linecap="round">
    ${[[-28, '#2E9E4C'], [-8, '#3BB860'], [12, '#2E9E4C'], [30, '#47C46A']].map(([r, c]) => `<g transform="rotate(${r} 50 92)"><path d="M50 92 Q50 50 50 14" stroke="${c}" stroke-width="3"/>${Array.from({ length: 9 }, (_, i) => { const y = 82 - i * 7.6; const l = 16 - i * 1.3; return `<path d="M50 ${y} q${-l * .6} -2 ${-l} -7" stroke="${c}" stroke-width="3.4"/><path d="M50 ${y} q${l * .6} -2 ${l} -7" stroke="${c}" stroke-width="3.4"/>`; }).join('')}<path d="M50 14 q6 -2 4 -8" stroke="${c}" stroke-width="3"/></g>`).join('')}</g></svg>`,
  moss: `<svg viewBox="0 0 100 100"><defs><radialGradient id="$a" cx=".5" cy=".2" r=".9"><stop offset="0" stop-color="#9BE36B"/><stop offset="1" stop-color="#3C8A2E"/></radialGradient></defs>
    <ellipse cx="50" cy="86" rx="44" ry="8" fill="#8A6A44"/>
    <path d="M8 84 Q12 58 30 62 Q36 44 54 52 Q66 40 78 56 Q94 58 92 84Z" fill="url(#$a)"/>
    <g stroke="#6B4E2A" stroke-width="1.6" stroke-linecap="round">${[[24, 60], [34, 52], [48, 48], [60, 46], [72, 52], [82, 60]].map(([x, y]) => `<path d="M${x} ${y} l1 -12"/><circle cx="${x + 1}" cy="${y - 13}" r="1.8" fill="#A5703A"/>`).join('')}</g></svg>`,
  lithops: `<svg viewBox="0 0 100 100"><defs><radialGradient id="$a" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#D9D2BE"/><stop offset="1" stop-color="#8E8670"/></radialGradient></defs>
    <ellipse cx="50" cy="84" rx="44" ry="10" fill="#C9A970"/>
    <path d="M14 82 Q10 46 34 44 Q48 46 49 82Z" fill="url(#$a)"/><path d="M51 82 Q52 44 68 44 Q92 46 86 82Z" fill="url(#$a)"/>
    <g fill="#6F6852" opacity=".55"><circle cx="26" cy="52" r="2"/><circle cx="34" cy="50" r="1.6"/><circle cx="40" cy="55" r="2.2"/><circle cx="62" cy="52" r="2"/><circle cx="72" cy="50" r="1.7"/><circle cx="78" cy="56" r="2.2"/><circle cx="30" cy="58" r="1.4"/><circle cx="68" cy="58" r="1.4"/></g></svg>`,
  nettle: `<svg viewBox="0 0 100 100"><path d="M50 96 Q46 60 52 8" stroke="#4E8A3A" stroke-width="6" fill="none" stroke-linecap="round"/>
    <g fill="#2F5E22">${Array.from({ length: 12 }, (_, i) => { const y = 88 - i * 6.6; const s = i % 2 ? 1 : -1; return `<path d="M${50 + s * 2} ${y} l${s * 7} -3 l${-s * 6} 5z"/>`; }).join('')}</g>
    <g fill="#5DAF45" stroke="#2F6B1A" stroke-width="1.2">
    <path d="M52 66 Q76 52 90 64 Q76 76 52 66Z"/><path d="M50 46 Q24 30 10 42 Q24 56 50 46Z"/><path d="M52 28 Q72 14 86 24 Q72 36 52 28Z"/></g></svg>`,
  mimosa: `<svg viewBox="0 0 100 100"><path d="M50 96 Q48 70 50 40" stroke="#7A9A3A" stroke-width="4" fill="none" stroke-linecap="round"/>
    ${[[50, 70, -38], [50, 56, 36], [50, 44, -20], [50, 44, 24]].map(([x, y, r]) => `<g transform="rotate(${r} ${x} ${y})"><path d="M${x} ${y} L${x} ${y - 34}" stroke="#6B8E2E" stroke-width="2"/>${Array.from({ length: 8 }, (_, i) => `<g class="leaflet" style="transform-origin:${x}px ${y - 4 - i * 4}px"><ellipse cx="${x - 5}" cy="${y - 4 - i * 4}" rx="5" ry="1.8" fill="#5DB33D"/><ellipse cx="${x + 5}" cy="${y - 4 - i * 4}" rx="5" ry="1.8" fill="#4CA42E"/></g>`).join('')}</g>`).join('')}
    <circle cx="70" cy="30" r="5" fill="#F5A3D0"/><circle cx="70" cy="30" r="2.4" fill="#E86AB4"/></svg>`,
  mangrove: `<svg viewBox="0 0 100 100"><rect x="0" y="74" width="100" height="26" fill="#7C5B3A"/><rect x="0" y="70" width="100" height="6" fill="#58A6C9" opacity=".7"/>
    <g stroke="#6E4A2A" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M50 50 Q36 60 28 80 M50 50 Q64 60 74 80 M50 54 Q44 66 42 82 M50 54 Q58 66 60 82"/></g>
    <g stroke="#6E4A2A" stroke-width="2" stroke-linecap="round"><path d="M14 80 v-10 M20 82 v-9 M84 80 v-10 M90 82 v-9 M8 84 v-8"/></g>
    <path d="M48 52 L50 30 L52 52Z" fill="#6E4A2A"/>
    <ellipse cx="50" cy="28" rx="36" ry="18" fill="#2E8B3E"/><ellipse cx="44" cy="24" rx="20" ry="10" fill="#4FB45A"/></svg>`,
  twig: `<svg viewBox="0 0 100 100"><g stroke="#7E5C33" stroke-linecap="round" fill="none"><path d="M6 60 L94 40" stroke-width="5.5"/><path d="M40 52 L30 30 M64 46 L78 26 M24 56 L16 76" stroke-width="3"/></g></svg>`,
  kelp: `<svg viewBox="0 0 100 100"><g fill="#9AB94A" stroke="#6E8E2A" stroke-width="1.5"><path d="M40 98 Q30 70 44 50 Q56 30 44 6 Q62 30 52 52 Q42 74 50 98Z"/><path d="M58 98 Q66 76 58 60 Q52 44 64 30 Q60 48 66 62 Q72 80 64 98Z"/></g></svg>`,
  pebble: `<svg viewBox="0 0 100 100"><defs><radialGradient id="$a" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#F3E3BE"/><stop offset="1" stop-color="#C9AE7C"/></radialGradient></defs><ellipse cx="50" cy="56" rx="38" ry="26" fill="url(#$a)"/></svg>`,
};

export function svgMarkup(name) {
  const s = SVGS[name];
  if (!s) return '';
  const p = `s${++uid}_`;
  return s.replace(/\$/g, p);
}

// In the built single-file game ART holds every picture as a data: URL; in src it is null.
export const artURL = (id) => (ART && ART[id]) || `art/${id}.webp`;

// art('frog') | art('svg:mantis') ; opts: {size, fx, sticker, cls, title}
export function art(id, opts = {}) {
  const { size, fx = '', sticker = true, cls = '', title = '' } = opts;
  const span = document.createElement('span');
  span.className = `art ${sticker ? 'sticker' : 'flat'} ${cls}`.trim();
  if (size) { span.style.width = span.style.height = typeof size === 'number' ? size + 'px' : size; }
  if (title) span.setAttribute('aria-label', title);
  if (id && id.startsWith('svg:')) {
    span.innerHTML = svgMarkup(id.slice(4));
    const svg = span.firstElementChild;
    if (svg && fx) svg.style.filter = sticker ? `${fx} var(--sticker)` : fx;
  } else if (id) {
    const img = document.createElement('img');
    img.src = artURL(id); img.alt = title; img.draggable = false; img.decoding = 'async';
    if (fx) img.style.filter = sticker ? `${fx} ${STICKER}` : fx;
    span.appendChild(img);
  }
  return span;
}
const STICKER = 'drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(0 6px 6px rgba(27,42,65,.28))';

export function creatureArt(cid, opts = {}) {
  const c = CREATURES[cid] || PLANTS[cid];
  if (!c) return art(cid, opts);
  return art(c.art, { title: c.name, ...opts, fx: [c.fx, opts.fx].filter(Boolean).join(' ') });
}

export function preload(ids) {
  ids.forEach((id) => { if (!id.startsWith('svg:')) { const i = new Image(); i.src = artURL(id); } });
}
