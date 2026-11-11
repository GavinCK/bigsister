// =============================================================
//  Maths Island — the 3D island builder (local coordinates; the engine places it in the sea).
//  One landmark per page of the Mental papers. Pages 1–5 (core) sit in an arc along the front beach,
//  Pages 6–8 (harder) at the back, Page 8 on top of the snowy peak. The Interview Hall is in the middle.
//    P1 abacus · P2 fraction pie · P3 3-D shapes · P4 balance · P5 clock tower ·
//    P6 circle wheel · P7 sale stall · P8 snowy peak
// =============================================================
import * as THREE from '../../../lib/three.module.min.js';

export const MPOS = {
  p1: { x: -14, z: 6 }, p2: { x: -8, z: 13.5 }, p3: { x: 0, z: 16 }, p4: { x: 8, z: 13.5 }, p5: { x: 14, z: 6 },
  p6: { x: -12, z: -8 }, p7: { x: 12, z: -8 }, p8: { x: 0, z: -14 }, hall: { x: 0, z: 0 },
};

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
  if (r < 7) h += (1 - smooth(5, 7, r)) * 1.5;                          // central plateau (Interview Hall)
  const dp = Math.hypot(x, z + 14); if (dp < 7.5) h += Math.pow(7.5 - dp, 1.15) * .95;   // the peak (Page 8)
  return h;
}
const C = (hex) => new THREE.Color(hex);
const ZCOL = { p1: C('#F7E6A6'), p2: C('#FFC7D9'), p3: C('#D6CBFF'), p4: C('#BFE6FF'), p5: C('#C9F2B3'), p6: C('#FFD8B0'), p7: C('#FFE3A3'), p8: C('#B9B3C9'), hall: C('#F3F0FF') };
function nearest(x, z) { let best = 'hall', bd = 1e9; for (const [id, p] of Object.entries(MPOS)) { const d = (p.x - x) ** 2 + (p.z - z) ** 2 * (id === 'hall' ? 2.2 : 1); if (d < bd) { bd = d; best = id; } } return best; }
function colorAt(x, z, h) {
  if (h < .45) return C('#F4DDA6');
  const zid = nearest(x, z);
  if (zid === 'p8' && h > 6.2) return C('#FFFFFF');
  if (zid === 'p8' && h > 3.5) return C('#A89FB8');
  const c = ZCOL[zid].clone(); c.offsetHSL(0, 0, (hash(Math.round(x * 3), Math.round(z * 3)) - .5) * .06); return c;
}

export function buildMaths(kit) {
  const { group, add, mat } = kit;
  kit.terrain({ size: 56, seg: 90, height: heightAt, color: colorAt });
  const H = heightAt;
  kit.foam(19, 22.5);
  const P = MPOS;
  const at = (id, dy = 0) => { const g = new THREE.Group(); g.position.set(P[id].x, H(P[id].x, P[id].z) + dy, P[id].z); g.rotation.y = Math.atan2(-P[id].x, -P[id].z) + Math.PI; group.add(g); return g; };

  // ---- Page 1: a giant abacus
  const ab = at('p1');
  const wood = mat('#9A5B32');
  [-3.2, 3.2].forEach((x) => add(new THREE.BoxGeometry(.45, 5, .45), wood, x, 2.5, 0, ab));
  [.6, 4.6].forEach((y) => add(new THREE.BoxGeometry(6.9, .45, .45), wood, 0, y, 0, ab));
  const beadCols = ['#FF5D73', '#FFB627', '#45D08A', '#5BC8FF'], beads = [];
  [1.5, 2.4, 3.3, 4.1].forEach((y, row) => {
    const rod = add(new THREE.CylinderGeometry(.06, .06, 6.4, 6), mat('#4A5A72'), 0, y, 0, ab); rod.rotation.z = Math.PI / 2;
    for (let i = 0; i < 5; i++) { const b = add(new THREE.SphereGeometry(.34, 10, 8), mat(beadCols[row]), -2.6 + i * .62, y, 0, ab); b.scale.x = .75; beads.push({ b, row, i }); }
  });

  // ---- Page 2: a pie with one slice pulled out (3/4 + 1/4)
  const pie = at('p2', .2);
  add(new THREE.CylinderGeometry(2.6, 2.6, 1.1, 28, 1, false, 0, Math.PI * 1.5), mat('#F2C14E'), 0, .55, 0, pie);
  add(new THREE.CylinderGeometry(2.45, 2.45, .2, 28, 1, false, 0, Math.PI * 1.5), mat('#FF5D73'), 0, 1.15, 0, pie);
  const slice = new THREE.Group(); slice.position.set(.9, 0, .9); pie.add(slice);
  add(new THREE.CylinderGeometry(2.6, 2.6, 1.1, 10, 1, false, Math.PI * 1.5, Math.PI * .5), mat('#F2C14E'), 0, .55, 0, slice);
  add(new THREE.CylinderGeometry(2.45, 2.45, .2, 10, 1, false, Math.PI * 1.5, Math.PI * .5), mat('#FF5D73'), 0, 1.15, 0, slice);

  // ---- Page 3: 3-D shapes (cube, pyramid, cylinder, prism, sphere, cone)
  const sg = at('p3');
  const shapes = [
    [new THREE.BoxGeometry(1.5, 1.5, 1.5), '#FF5D73', -2.1, .75, -.6], [new THREE.ConeGeometry(1.05, 2.1, 4), '#FFB627', 0, 1.05, -1.6], [new THREE.CylinderGeometry(.85, .85, 1.9, 16), '#45D08A', 2.1, .95, -.6],
    [new THREE.CylinderGeometry(.95, .95, 1.7, 6), '#7A5CFA', -1.3, .85, 1.3], [new THREE.SphereGeometry(.9, 14, 10), '#5BC8FF', 1.3, .9, 1.4], [new THREE.ConeGeometry(.85, 1.9, 16), '#FF8FB1', 0, .95, .3],
  ];
  const sgObjs = shapes.map(([g, c, x, y, z]) => add(g, mat(c), x, y, z, sg));

  // ---- Page 4: a balance scale that keeps rocking back to level
  const bal = at('p4');
  add(new THREE.CylinderGeometry(1.4, 1.7, .5, 10), mat('#7A5CFA'), 0, .25, 0, bal);
  add(new THREE.CylinderGeometry(.22, .28, 4.6, 8), mat('#C9CFE6'), 0, 2.6, 0, bal);
  const beam = new THREE.Group(); beam.position.set(0, 4.9, 0); bal.add(beam);
  add(new THREE.BoxGeometry(6.4, .3, .4), mat('#FFB627'), 0, 0, 0, beam);
  const pans = [-3, 3].map((x) => { const g = new THREE.Group(); g.position.set(x, 0, 0); beam.add(g); add(new THREE.CylinderGeometry(.03, .03, 1.6, 4), mat('#4A5A72'), 0, -.8, 0, g); add(new THREE.CylinderGeometry(1.1, .8, .25, 12), mat('#FFFFFF'), 0, -1.7, 0, g); return g; });
  add(new THREE.BoxGeometry(.7, .7, .7), mat('#45D08A'), 0, -1.25, 0, pans[0]);
  add(new THREE.SphereGeometry(.4, 10, 8), mat('#FF5D73'), -.3, -1.2, 0, pans[1]); add(new THREE.SphereGeometry(.4, 10, 8), mat('#FF5D73'), .35, -1.2, 0, pans[1]);

  // ---- Page 5: clock tower (speed and time)
  const ct = at('p5');
  add(new THREE.BoxGeometry(2.2, 6, 2.2), mat('#F3F4FB'), 0, 3, 0, ct);
  const roof = add(new THREE.ConeGeometry(2, 1.8, 4), mat('#E2574C'), 0, 6.9, 0, ct); roof.rotation.y = Math.PI / 4;
  const fx = P.p5.x + Math.sin(Math.atan2(P.p5.x, P.p5.z)) * 1.25, fz = P.p5.z + Math.cos(Math.atan2(P.p5.x, P.p5.z)) * 1.25;
  const face = kit.sprite('clock', fx, H(P.p5.x, P.p5.z) + 4.6, fz, 1.9);

  // ---- Page 6: a big circle wheel (circumference, radius, diameter)
  const wh = at('p6');
  add(new THREE.CylinderGeometry(.35, .5, 3.4, 8), mat('#C9CFE6'), 0, 1.7, 0, wh);
  const wheel = new THREE.Group(); wheel.position.set(0, 3.9, 0); wh.add(wheel);
  add(new THREE.TorusGeometry(2.4, .22, 10, 40), mat('#FF7A45'), 0, 0, 0, wheel);
  for (let i = 0; i < 6; i++) { const s = add(new THREE.BoxGeometry(.12, 4.8, .12), mat('#FFFFFF'), 0, 0, 0, wheel); s.rotation.z = i * Math.PI / 6; }
  add(new THREE.SphereGeometry(.38, 12, 10), mat('#FFB627'), 0, 0, 0, wheel);

  // ---- Page 7: a sale stall (discounts and percentages)
  const st = at('p7');
  add(new THREE.BoxGeometry(3.6, 1.3, 1.8), mat('#C9A27A'), 0, .65, 0, st);
  [-1.6, 1.6].forEach((x) => add(new THREE.CylinderGeometry(.08, .08, 2.8, 6), mat('#6E4A2A'), x, 2.2, .7, st));
  for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(.62, .14, 2.2), mat(i % 2 ? '#FFFFFF' : '#E2574C'), -1.55 + i * .62, 3.6, .2, st);
  [[-1, '#45D08A'], [0, '#5BC8FF'], [1, '#FF8FB1']].forEach(([x, c]) => add(new THREE.BoxGeometry(.6, .6, .6), mat(c), x, 1.6, 0, st));
  const bag = kit.sprite('moneybag', P.p7.x, H(P.p7.x, P.p7.z) + 5.2, P.p7.z, 1.8);

  // ---- Page 8: flag on top of the peak
  const top = H(0, -14);
  add(new THREE.CylinderGeometry(.08, .08, 2.6, 5), mat('#6E4A2A'), 0, top + 1.3, -14);
  const flag = add(new THREE.PlaneGeometry(1.4, .8), mat('#FF5D73', { side: THREE.DoubleSide }), .7, top + 2.2, -14);
  [[-4.5, -11], [4.5, -11], [-5.5, -16], [5.5, -16]].forEach(([x, z], i) => (i % 2 ? kit.rock(x, z, 1, '#C8C2D6') : kit.cone(x, z, .75, '#5E8F78')));

  // ---- Interview Hall in the middle
  const hall = new THREE.Group(); hall.position.set(0, H(0, 0), 0); group.add(hall);
  add(new THREE.BoxGeometry(6, .5, 4.6), mat('#E6E2F5'), 0, .25, 0, hall);
  add(new THREE.BoxGeometry(5, 3.2, 3.4), mat('#FFFFFF'), 0, 2.1, -.3, hall);
  for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(.22, .22, 3.2, 10), mat('#F7F4FF'), -2 + i * 1.33, 2.1, 1.7, hall);
  const hroof = add(new THREE.ConeGeometry(3.9, 1.6, 4), mat('#7A5CFA'), 0, 4.5, 0, hall); hroof.rotation.y = Math.PI / 4; hroof.scale.z = .8;
  add(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#FFB627', { emissive: '#FF9900', emissiveIntensity: .25 }), 0, 5.2, 0, hall);
  const crown = kit.sprite('crown', 0, H(0, 0) + 7.4, 0, 2.2);
  kit.critter('owl', 2.6, 3.4, { s: 2 });

  // palms, candy trees, clouds and the island sign
  [[-12, 15], [12, 15.5], [-18, -1], [18, -1]].forEach(([x, z], i) => kit.palm(x, z, .85 + (i % 2) * .1));
  [[-4, 19], [4.5, 19], [-17.5, 9], [17.5, 10], [-6, -6], [6, -6], [-16, -13], [16, -13]].forEach(([x, z], i) => kit.blob(x, z, .75, ['#FFB7D0', '#B5E8A5', '#FFC7A8', '#C9B8FF', '#9FDCFF', '#FFE08A'][i % 6]));
  const clouds = kit.clouds(4, 30, 40, 46);
  kit.sign(-3.4, 19.6, .1, 'Joycelyn', 'Maths Island');

  // ---- decorations bought in the Star Shop for this island
  const DSPOT = { bullseye: [4.2, 7.6, 2.4], hundred: [-4.2, 7.6, 3], rocket: [17.6, -4.5, 4.2] };
  function decor(id) {
    if (!DSPOT[id]) return null;
    const [x, z, s] = DSPOT[id]; const sp = kit.sprite(id, x, H(x, z) + s * .45, z, s);
    if (id === 'rocket') return { objs: [sp], update(el) { sp.position.y = H(x, z) + s * .45 + Math.abs(Math.sin(el * .7)) * .6; } };
    return { objs: [sp], update(el) { sp.position.y = H(x, z) + s * .45 + Math.sin(el * 1.3 + x) * .08; } };
  }

  const yAt = (id, dy) => H(P[id].x, P[id].z) + dy;
  return {
    zones: {
      p1: { ...P.p1, y: yAt('p1', 7.6) }, p2: { ...P.p2, y: yAt('p2', 5.8) }, p3: { ...P.p3, y: yAt('p3', 5.4) }, p4: { ...P.p4, y: yAt('p4', 7.6) },
      p5: { ...P.p5, y: yAt('p5', 9.2) }, p6: { ...P.p6, y: yAt('p6', 8.2) }, p7: { ...P.p7, y: yAt('p7', 7.6) }, p8: { ...P.p8, y: H(0, -14) + 4.6, far: true },
    },
    avatar: { x: 2.6, z: 19.2, px: 3.6, pz: 20 },
    bosses: {},
    decor,
    update(el, dt) {
      beads.forEach(({ b, row, i }) => { b.position.x = -2.6 + i * .62 + (i >= 3 ? 1.2 + Math.sin(el * 1.2 + row) * .6 : 0); });
      slice.position.set(.9 + Math.sin(el * 1.4) * .35, Math.abs(Math.sin(el * 1.4)) * .3, .9 + Math.sin(el * 1.4) * .35);
      const tilt = Math.sin(el * .9) * .18 * (1 - (el % 8) / 8); beam.rotation.z = tilt; pans.forEach((p) => { p.rotation.z = -tilt; });
      sgObjs.forEach((o, i) => { o.rotation.y += dt * (.3 + i * .08); });
      wheel.rotation.z += dt * .5;
      face.position.y = H(P.p5.x, P.p5.z) + 4.6;
      bag.position.y = H(P.p7.x, P.p7.z) + 5.2 + Math.sin(el * 1.7) * .25;
      flag.rotation.y = Math.sin(el * 3) * .3;
      crown.position.y = H(0, 0) + 7.4 + Math.sin(el * 1.6) * .4;
      clouds.update(dt);
    },
  };
}
