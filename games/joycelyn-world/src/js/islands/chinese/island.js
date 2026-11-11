// =============================================================
//  成語島 Idiom Island — the 3D island builder for 成語大冒險 (Chengyu Adventure).
//  A red arena (Chapter 1), a pagoda village (Chapter 2), a fun-fair (修辭樂園), bamboo and a lotus pond.
// =============================================================
import * as THREE from '../../../lib/three.module.min.js';

export const CPOS = { ch1: { x: 0, z: 12 }, ch2: { x: 11, z: -5 }, dlc: { x: -11, z: -5 } };
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
const fbm = (x, y) => vnoise(x, y) * .6 + vnoise(x * 2.1, y * 2.1) * .3 + vnoise(x * 4.3, y * 4.3) * .1;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function heightAt(x, z) {
  const r = Math.hypot(x, z), n = fbm(x * .11 + 2, z * .11 + 9);
  const edge = 19 + n * 3, m = 1 - smooth(edge - 5, edge + 1, r);
  let h = -2 + m * (2.6 + n * 1.3);
  const dh = Math.hypot(x, z + 2); if (dh < 6) h += (1 - smooth(3, 6, dh)) * 2.4;       // pagoda hill
  const dpd = Math.hypot(x - 5, z - 4); if (dpd < 3.4) h -= (1 - smooth(1.6, 3.4, dpd)) * 1.1;  // lotus pond
  return h;
}
const C = (hex) => new THREE.Color(hex);
function colorAt(x, z, h) {
  if (h < .45) return C('#F2D9A4');
  if (Math.hypot(x - 5, z - 4) < 2.3) return C('#6FCB9F');
  const c = h > 3 ? C('#4FAF5E') : C('#7FCF6B'); c.offsetHSL(0, 0, (hash(Math.round(x * 3), Math.round(z * 3)) - .5) * .07); return c;
}

export function buildChinese(kit) {
  const { group, add, mat } = kit;
  kit.terrain({ size: 52, seg: 84, height: heightAt, color: colorAt });
  const H = heightAt;
  kit.foam(17.5, 21);
  const red = mat('#D7263D'), gold = mat('#FFB627'), dark = mat('#2B2140');

  // Chapter 1: 成語擂台 — a red arena with four posts
  const ar = new THREE.Group(); ar.position.set(CPOS.ch1.x, H(CPOS.ch1.x, CPOS.ch1.z), CPOS.ch1.z); group.add(ar);
  add(new THREE.BoxGeometry(6, .6, 5), red, 0, .3, 0, ar);
  add(new THREE.BoxGeometry(5.4, .1, 4.4), mat('#F7E3C0'), 0, .65, 0, ar);
  [[-2.8, -2.3], [2.8, -2.3], [-2.8, 2.3], [2.8, 2.3]].forEach(([x, z]) => { add(new THREE.CylinderGeometry(.14, .14, 2.4, 6), gold, x, 1.8, z, ar); add(new THREE.SphereGeometry(.3, 8, 6), red, x, 3.1, z, ar); });
  kit.critter('panda', CPOS.ch1.x - 1.2, CPOS.ch1.z + .3, { s: 2.4, y: H(CPOS.ch1.x, CPOS.ch1.z) + 1.9 });

  // Chapter 2: a pagoda on the hill
  const pg = new THREE.Group(); pg.position.set(0, H(0, -2), -2); group.add(pg);
  for (let i = 0; i < 4; i++) {
    const s = 1 - i * .18, y = i * 1.5;
    add(new THREE.BoxGeometry(2.6 * s, 1.2, 2.6 * s), mat(i % 2 ? '#F7E3C0' : '#FFFFFF'), 0, y + .6, 0, pg);
    const roof = add(new THREE.ConeGeometry(2.6 * s * 1.05, .7, 4), red, 0, y + 1.45, 0, pg); roof.rotation.y = Math.PI / 4; roof.scale.y = .9;
  }
  add(new THREE.CylinderGeometry(.06, .06, 1.4, 5), gold, 0, 6.8, 0, pg); add(new THREE.SphereGeometry(.22, 8, 6), gold, 0, 7.5, 0, pg);
  // village houses for Chapter 2
  [[2.4, 2.4], [-2.2, 2.6], [2.6, -2.4]].forEach(([dx, dz]) => {
    const x = CPOS.ch2.x + dx, z = CPOS.ch2.z + dz, y = H(x, z);
    add(new THREE.BoxGeometry(1.8, 1.2, 1.4), mat('#F7E3C0'), x, y + .6, z);
    const r = add(new THREE.ConeGeometry(1.5, .8, 4), dark, x, y + 1.55, z); r.rotation.y = Math.PI / 4;
  });
  // 修辭樂園: a little fun-fair
  kit.critter('carousel', CPOS.dlc.x, CPOS.dlc.z, { s: 3.6 });
  kit.critter('ferriswheel', CPOS.dlc.x - 3, CPOS.dlc.z - 2.6, { s: 4.2 });

  // red moon bridge over the pond + lotus
  const br = add(new THREE.TorusGeometry(2.2, .28, 6, 14, Math.PI), red, 5, H(5, 4) + .2, 4); br.rotation.y = Math.PI / 2.4;
  kit.critter('lotus', 4.4, 3, { s: 1.4, y: H(4.4, 3) + .6 }); kit.critter('lotus', 6, 5.2, { s: 1.2, y: H(6, 5.2) + .55 });
  // bamboo groves
  const bamboo = (x, z) => { const y = H(x, z); for (let k = 0; k < 4; k++) { const dx = (hash(x + k, z) - .5) * 1.4, dz = (hash(z, x + k) - .5) * 1.4; add(new THREE.CylinderGeometry(.09, .11, 3.6 + k * .4, 5), mat('#5BAE4A'), x + dx, y + 1.8 + k * .2, z + dz); add(new THREE.ConeGeometry(.5, 1.1, 5), mat('#3F9B47'), x + dx, y + 3.9 + k * .4, z + dz); } };
  [[-7, 9], [8, 10], [-14, 3], [14, 3], [-6, -13], [6, -13]].forEach(([x, z]) => bamboo(x, z));
  kit.critter('cherryblossom', -4.5, -9, { s: 3 });
  const clouds = kit.clouds(4, 28, 38, 44);
  kit.sign(-8, 15, .35, 'Joycelyn', '成語島 Idiom Island');

  const DSPOT = { lotus: [7, 7, 2.2], cherryblossom: [9, -11, 3.4], pandastatue: [-9.5, 9.5, 3.2] };
  function decor(id) {
    if (!DSPOT[id]) return null; const [x, z, s] = DSPOT[id];
    const sp = kit.sprite({ pandastatue: 'panda' }[id] || id, x, H(x, z) + s * .45, z, s);
    return { objs: [sp], update(el) { sp.position.y = H(x, z) + s * .45 + Math.sin(el * 1.3 + x) * .08; } };
  }
  return {
    zones: { ch1: { ...CPOS.ch1, y: H(CPOS.ch1.x, CPOS.ch1.z) + 7 }, ch2: { ...CPOS.ch2, y: H(CPOS.ch2.x, CPOS.ch2.z) + 6.5 }, dlc: { ...CPOS.dlc, y: H(CPOS.dlc.x, CPOS.dlc.z) + 8 } },
    avatar: { x: 3.4, z: 15.4, px: 2.1, pz: 16 },
    bosses: {},
    decor,
    update(el, dt) { clouds.update(dt); },
  };
}
