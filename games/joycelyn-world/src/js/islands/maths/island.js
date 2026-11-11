// =============================================================
//  Maths Island — the 3D island builder (local coordinates; the engine places it in the sea).
//  Landmarks: a giant abacus (Calc Cove), a fraction pie (Fraction Falls), a rocking balance
//  (Algebra Bridge), shape sculptures (Shape Garden), a clock tower (Measure Market),
//  a snowy spire (Challenge Peak) and the Interview Hall on the central plateau.
// =============================================================
import * as THREE from '../../../lib/three.module.min.js';
import { TOPIC } from './mathlib.js';
import { zoneOfTopic } from './data.js';

export const MPOS = { calc: { x: 0, z: 15 }, frac: { x: 13, z: 7 }, eq: { x: 13, z: -7 }, peak: { x: 0, z: -14 }, shape: { x: -13, z: -7 }, measure: { x: -13, z: 7 }, hall: { x: 0, z: 0 } };

function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y) => vnoise(x, y) * .6 + vnoise(x * 2.1, y * 2.1) * .3 + vnoise(x * 4.3, y * 4.3) * .1;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function heightAt(x, z) {
  const r = Math.hypot(x, z), n = fbm(x * .1 + 11, z * .1 + 5);
  const edge = 21 + n * 3, m = 1 - smooth(edge - 5, edge + 1, r);
  let h = -2 + m * (2.8 + n * 1.1);
  if (r < 7) h += (1 - smooth(5, 7, r)) * 1.5;                          // central plateau
  const dp = Math.hypot(x, z + 14); if (dp < 7.5) h += Math.pow(7.5 - dp, 1.15) * .95;   // Challenge Peak
  return h;
}
const C = (hex) => new THREE.Color(hex);
const ZCOL = { calc: C('#F7E6A6'), frac: C('#FFC7D9'), eq: C('#BFE6FF'), shape: C('#D6CBFF'), measure: C('#C9F2B3'), peak: C('#B9B3C9'), hall: C('#F3F0FF') };
function nearest(x, z) { let best = 'hall', bd = 1e9; for (const [id, p] of Object.entries(MPOS)) { const d = (p.x - x) ** 2 + (p.z - z) ** 2 * (id === 'hall' ? 2.2 : 1); if (d < bd) { bd = d; best = id; } } return best; }
function colorAt(x, z, h) {
  if (h < .45) return C('#F4DDA6');
  const zid = nearest(x, z);
  if (zid === 'peak' && h > 6.2) return C('#FFFFFF');
  if (zid === 'peak' && h > 3.5) return C('#A89FB8');
  const c = ZCOL[zid].clone(); c.offsetHSL(0, 0, (hash(Math.round(x * 3), Math.round(z * 3)) - .5) * .06); return c;
}

export function buildMaths(kit) {
  const { group, add, mat } = kit;
  kit.terrain({ size: 56, seg: 90, height: heightAt, color: colorAt });
  const H = heightAt;
  kit.foam(19, 22.5);
  const P = MPOS;

  // ---- Calc Cove: a giant abacus on the beach
  const ab = new THREE.Group(); ab.position.set(P.calc.x, H(P.calc.x, P.calc.z), P.calc.z); group.add(ab);
  const wood = mat('#9A5B32');
  [-3.2, 3.2].forEach((x) => add(new THREE.BoxGeometry(.45, 5, .45), wood, x, 2.5, 0, ab));
  [.6, 4.6].forEach((y) => add(new THREE.BoxGeometry(6.9, .45, .45), wood, 0, y, 0, ab));
  const beadCols = ['#FF5D73', '#FFB627', '#45D08A', '#5BC8FF'];
  const beads = [];
  [1.5, 2.4, 3.3, 4.1].forEach((y, row) => {
    const rod = add(new THREE.CylinderGeometry(.06, .06, 6.4, 6), mat('#4A5A72'), 0, y, 0, ab); rod.rotation.z = Math.PI / 2;
    for (let i = 0; i < 5; i++) { const b = add(new THREE.SphereGeometry(.34, 10, 8), mat(beadCols[row]), -2.6 + i * .62, y, 0, ab); b.scale.x = .75; beads.push({ b, row, i }); }
  });
  [[-6, 13], [6, 12.5], [-4, 18], [5, 18.5]].forEach(([x, z], i) => kit.palm(x, z, .85 + (i % 2) * .1));

  // ---- Fraction Falls: a pie with one slice pulled out (3/4 + 1/4)
  const pie = new THREE.Group(); pie.position.set(P.frac.x, H(P.frac.x, P.frac.z) + .2, P.frac.z); group.add(pie);
  add(new THREE.CylinderGeometry(2.6, 2.6, 1.1, 28, 1, false, 0, Math.PI * 1.5), mat('#F2C14E'), 0, .55, 0, pie);
  add(new THREE.CylinderGeometry(2.45, 2.45, .2, 28, 1, false, 0, Math.PI * 1.5), mat('#FF5D73'), 0, 1.15, 0, pie);
  const slice = new THREE.Group(); slice.position.set(.9, 0, .9); pie.add(slice);
  add(new THREE.CylinderGeometry(2.6, 2.6, 1.1, 10, 1, false, Math.PI * 1.5, Math.PI * .5), mat('#F2C14E'), 0, .55, 0, slice);
  add(new THREE.CylinderGeometry(2.45, 2.45, .2, 10, 1, false, Math.PI * 1.5, Math.PI * .5), mat('#FF5D73'), 0, 1.15, 0, slice);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(2.2, 18), new THREE.MeshStandardMaterial({ color: '#5BC8FF', roughness: .2 })); pond.rotation.x = -Math.PI / 2; pond.position.set(P.frac.x + 4.2, H(P.frac.x + 4.2, P.frac.z - 2.5) + .08, P.frac.z - 2.5); group.add(pond);
  kit.blob(P.frac.x - 3.5, P.frac.z + 3, .75, '#FF8FB1'); kit.blob(P.frac.x + 3.6, P.frac.z + 3.2, .7, '#FFB7D0');

  // ---- Algebra Bridge: a balance scale that keeps rocking back to level
  const bal = new THREE.Group(); bal.position.set(P.eq.x, H(P.eq.x, P.eq.z), P.eq.z); group.add(bal);
  add(new THREE.CylinderGeometry(1.4, 1.7, .5, 10), mat('#7A5CFA'), 0, .25, 0, bal);
  add(new THREE.CylinderGeometry(.22, .28, 4.6, 8), mat('#C9CFE6'), 0, 2.6, 0, bal);
  const beam = new THREE.Group(); beam.position.set(0, 4.9, 0); bal.add(beam);
  add(new THREE.BoxGeometry(6.4, .3, .4), mat('#FFB627'), 0, 0, 0, beam);
  const pans = [-3, 3].map((x) => { const g = new THREE.Group(); g.position.set(x, 0, 0); beam.add(g); add(new THREE.CylinderGeometry(.03, .03, 1.6, 4), mat('#4A5A72'), 0, -.8, 0, g); add(new THREE.CylinderGeometry(1.1, .8, .25, 12), mat('#FFFFFF'), 0, -1.7, 0, g); return g; });
  add(new THREE.BoxGeometry(.7, .7, .7), mat('#45D08A'), 0, -1.25, 0, pans[0]);
  add(new THREE.SphereGeometry(.4, 10, 8), mat('#FF5D73'), -.3, -1.2, 0, pans[1]); add(new THREE.SphereGeometry(.4, 10, 8), mat('#FF5D73'), .35, -1.2, 0, pans[1]);
  kit.blob(P.eq.x + 3.6, P.eq.z - 3.4, .75, '#7FD3FF'); kit.blob(P.eq.x - 3, P.eq.z - 3.8, .65, '#9BE7C4');

  // ---- Shape Garden: prism, pyramid, cube, cylinder, cone, sphere
  const sg = new THREE.Group(); sg.position.set(P.shape.x, H(P.shape.x, P.shape.z), P.shape.z); group.add(sg);
  const shapes = [
    [new THREE.BoxGeometry(1.6, 1.6, 1.6), '#FF5D73', -2.2, .8, -1], [new THREE.ConeGeometry(1.1, 2.2, 4), '#FFB627', 0, 1.1, -2], [new THREE.CylinderGeometry(.9, .9, 2, 16), '#45D08A', 2.2, 1, -1],
    [new THREE.CylinderGeometry(1, 1, 1.8, 3), '#7A5CFA', -1.4, .9, 1.4], [new THREE.SphereGeometry(.95, 14, 10), '#5BC8FF', 1.4, .95, 1.5], [new THREE.ConeGeometry(.9, 2, 16), '#FF8FB1', 0, 1, .2],
  ];
  const sgObjs = shapes.map(([g, c, x, y, z]) => add(g, mat(c), x, y, z, sg));

  // ---- Measure Market: clock tower + stalls
  const ct = new THREE.Group(); ct.position.set(P.measure.x, H(P.measure.x, P.measure.z), P.measure.z); group.add(ct);
  add(new THREE.BoxGeometry(2.2, 6, 2.2), mat('#F3F4FB'), 0, 3, 0, ct);
  const roof = add(new THREE.ConeGeometry(2, 1.8, 4), mat('#E2574C'), 0, 6.9, 0, ct); roof.rotation.y = Math.PI / 4;
  const face = kit.sprite('clock', P.measure.x, H(P.measure.x, P.measure.z) + 4.6, P.measure.z + 1.2, 1.9);
  [[2.8, 2.4, '#FF5D73'], [-2.6, 2.8, '#45D08A'], [2.4, -2.6, '#FFB627']].forEach(([dx, dz, c]) => {
    const x = P.measure.x + dx, z = P.measure.z + dz, y = H(x, z);
    add(new THREE.BoxGeometry(1.8, 1, 1.2), mat('#C9A27A'), x, y + .5, z);
    const r = add(new THREE.ConeGeometry(1.5, .8, 4), mat(c), x, y + 1.5, z); r.rotation.y = Math.PI / 4;
  });

  // ---- Challenge Peak: flag on top
  const top = H(0, -14);
  add(new THREE.CylinderGeometry(.08, .08, 2.6, 5), mat('#6E4A2A'), 0, top + 1.3, -14);
  const flag = add(new THREE.PlaneGeometry(1.4, .8), mat('#FF5D73', { side: THREE.DoubleSide }), .7, top + 2.2, -14);
  [[-4, -11], [4, -11], [-5.5, -15], [5.5, -15]].forEach(([x, z], i) => (i % 2 ? kit.rock(x, z, 1, '#C8C2D6') : kit.cone(x, z, .75, '#5E8F78')));

  // ---- Interview Hall: columns, roof and a crown
  const hall = new THREE.Group(); hall.position.set(0, H(0, 0), 0); group.add(hall);
  add(new THREE.BoxGeometry(6, .5, 4.6), mat('#E6E2F5'), 0, .25, 0, hall);
  add(new THREE.BoxGeometry(5, 3.2, 3.4), mat('#FFFFFF'), 0, 2.1, -.3, hall);
  for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(.22, .22, 3.2, 10), mat('#F7F4FF'), -2 + i * 1.33, 2.1, 1.7, hall);
  const hroof = add(new THREE.ConeGeometry(3.9, 1.6, 4), mat('#7A5CFA'), 0, 4.5, 0, hall); hroof.rotation.y = Math.PI / 4; hroof.scale.z = .8;
  add(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#FFB627', { emissive: '#FF9900', emissiveIntensity: .25 }), 0, 5.2, 0, hall);
  const crown = kit.sprite('crown', 0, H(0, 0) + 7.4, 0, 2.2);
  kit.critter('owl', 2.6, 3.4, { s: 2 });

  // candy trees all round
  [[8, 15, '#FFB7D0'], [-9, 14, '#B5E8A5'], [17, 0, '#FFC7A8'], [-17, 0, '#C9B8FF'], [9, -15, '#9FDCFF'], [-9, -16, '#FFE08A'], [15, 11, '#B5E8A5'], [-15, -12, '#FFB7D0']].forEach(([x, z, c]) => kit.blob(x, z, .8, c));
  const clouds = kit.clouds(4, 30, 40, 46);
  kit.sign(8.5, 17.4, -.35, 'Joycelyn', 'Maths Island');

  // ---- collected Maths Pals live here
  const pals = {};
  function setPals(ids) {
    ids.forEach((tid, i) => {
      if (pals[tid]) return; const z = zoneOfTopic(tid); const p = z ? MPOS[z.id] : MPOS.hall;
      const a = (i * 2.4) % (Math.PI * 2), r = 3.4 + (i % 3) * .8;
      pals[tid] = kit.critter(TOPIC[tid].pal[0], p.x + Math.cos(a) * r, p.z + Math.sin(a) * r + 1, { s: 1.9, fly: ['butterfly', 'bee', 'parrot', 'dragon', 'owl'].includes(TOPIC[tid].pal[0]), r: 2.2, y: ['butterfly', 'bee', 'parrot', 'dragon', 'owl'].includes(TOPIC[tid].pal[0]) ? H(p.x, p.z) + 5 : null });
    });
  }

  // ---- decorations bought in the Star Shop for this island
  const DSPOT = { bullseye: [5.5, 9.5, 2.4], hundred: [-6, 9.5, 3], rocket: [16.5, -4, 4.2] };
  function decor(id) {
    if (!DSPOT[id]) return null;
    const [x, z, s] = DSPOT[id]; const sp = kit.sprite(id, x, H(x, z) + s * .45, z, s);
    if (id === 'rocket') return { objs: [sp], update(el) { sp.position.y = H(x, z) + s * .45 + Math.abs(Math.sin(el * .7)) * .6; } };
    return { objs: [sp], update(el) { sp.position.y = H(x, z) + s * .45 + Math.sin(el * 1.3 + x) * .08; } };
  }

  const yAt = (id, dy) => H(P[id].x, P[id].z) + dy;
  return {
    zones: {
      calc: { ...P.calc, y: yAt('calc', 7.8) }, frac: { ...P.frac, y: yAt('frac', 6) }, eq: { ...P.eq, y: yAt('eq', 7.6) }, shape: { ...P.shape, y: yAt('shape', 5.6) },
      measure: { ...P.measure, y: yAt('measure', 9.2) }, peak: { ...P.peak, y: H(0, -14) + 4.6, far: true }, hall: { ...P.hall, y: H(0, 0) + 9.6, far: true },
    },
    avatar: { x: 2.4, z: 17.6, px: 1, pz: 18.4 },
    bosses: {
      calc: { x: -5, z: 16.5, y: () => H(-5, 16.5) + 1.6, s: 3 },
      frac: { x: 16.5, z: 9, y: () => H(16.5, 9) + 1.6, s: 3, tint: '#FFD6E6' },
      eq: { x: 16.5, z: -9.5, y: () => H(16.5, -9.5) + 1.6, s: 3.2, crown: true },
      shape: { x: -16.5, z: -9.5, y: () => H(-16.5, -9.5) + 1.6, s: 3.4 },
      measure: { x: -17, z: 10, y: () => H(-17, 10) + 1.5, s: 3, move: (o, el) => { o.position.x = -17 + Math.sin(el * .6) * 1.2; } },
      peak: { x: 3.2, z: -13, y: () => H(3.2, -13) + 1.6, s: 3.4, tint: '#E6FFE6' },
    },
    decor, setPals,
    update(el, dt) {
      beads.forEach(({ b, row, i }) => { b.position.x = -2.6 + i * .62 + (i >= 3 ? 1.2 + Math.sin(el * 1.2 + row) * .6 : 0); });
      slice.position.set(.9 + Math.sin(el * 1.4) * .35, Math.abs(Math.sin(el * 1.4)) * .3, .9 + Math.sin(el * 1.4) * .35);
      const tilt = Math.sin(el * .9) * .18 * (1 - (el % 8) / 8); beam.rotation.z = tilt; pans.forEach((p) => { p.rotation.z = -tilt; });
      sgObjs.forEach((o, i) => { o.rotation.y += dt * (.3 + i * .08); });
      face.position.y = H(P.measure.x, P.measure.z) + 4.6;
      flag.rotation.y = Math.sin(el * 3) * .3;
      crown.position.y = H(0, 0) + 7.4 + Math.sin(el * 1.6) * .4;
      clouds.update(dt);
    },
  };
}
