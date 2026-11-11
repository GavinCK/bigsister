// =============================================================
//  Biodiversity Island (P6 Science Unit 1) — the 3D island builder.
//  Everything here is in the island's own local coordinates; the engine places the island in the sea.
// =============================================================
import * as THREE from '../../../lib/three.module.min.js';
export const ZONE_POS = {
  beach: { x: 0, z: 17 }, lab: { x: 15, z: 8 }, greenhouse: { x: 15, z: -8 },
  peaks: { x: 0, z: -17 }, jungle: { x: -15, z: -8 }, savanna: { x: -15, z: 8 }, volcano: { x: 0, z: 0 },
};

// ---------- tiny value noise ----------
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y) => vnoise(x, y) * .6 + vnoise(x * 2.1, y * 2.1) * .3 + vnoise(x * 4.3, y * 4.3) * .1;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function heightAt(x, z) {
  const r = Math.hypot(x, z);
  const n = fbm(x * .09 + 3, z * .09 + 7);
  const edge = 24 + n * 4;
  const m = 1 - smooth(edge - 6, edge + 1, r);
  let h = -2 + m * (3 + n * 1.4);
  if (r < 9.5) h += Math.pow(9.5 - r, 1.18) * .92;
  if (r < 2.4) h -= (2.4 - r) * 2.2;
  const dp = Math.hypot(x, z + 17);
  if (dp < 8.5) h += Math.pow(8.5 - dp, 1.15) * 1.25 * (.75 + n * .5);
  const db = Math.hypot(x, z - 18);
  if (db < 9) h = h + (1.1 - h) * (1 - smooth(4, 9, db)) * .8;
  return h;
}
function nearestZone(x, z) {
  let best = 'beach', bd = 1e9;
  for (const [id, p] of Object.entries(ZONE_POS)) { if (id === 'volcano') continue; const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; best = id; } }
  return best;
}
const C = (hex) => new THREE.Color(hex);
const ZONE_COL = { beach: C('#F6DB9E'), lab: C('#8FD67F'), greenhouse: C('#6CC86A'), peaks: C('#A7BDB0'), jungle: C('#2F9E49'), savanna: C('#DCC45C') };
function colorAt(x, z, h) {
  const r = Math.hypot(x, z);
  if (h < .45) return C('#F1D39A');
  if (r < 9.5 && h > 2.2) return h > 7.5 ? C('#5B3F37') : C('#8A6552');
  const zid = nearestZone(x, z);
  if (zid === 'peaks' && h > 3.6) return C('#F7FBFF');
  const c = ZONE_COL[zid].clone();
  const n = hash(Math.round(x * 3), Math.round(z * 3));
  c.offsetHSL(0, 0, (n - .5) * .06);
  return c;
}


export function buildScience(kit) {
  const { group, add, mat, puffTex } = kit;
  kit.terrain({ size: 70, seg: 110, height: heightAt, color: colorAt });
  const H = heightAt;
  kit.foam(23.5, 27);
  // ---------- props ----------
  function acacia(x, z, s = 1) {
    const y = H(x, z); add(new THREE.CylinderGeometry(.18 * s, .3 * s, 3 * s, 6), mat('#7A4F2D'), x, y + 1.5 * s, z);
    add(new THREE.CylinderGeometry(2.4 * s, 1.6 * s, .6 * s, 9), mat('#5E9B37'), x, y + 3.2 * s, z);
  }
  function cactus(x, z, s = 1) {
    const y = H(x, z); const m = mat('#3E9B4A');
    add(new THREE.CylinderGeometry(.35 * s, .38 * s, 2.4 * s, 8), m, x, y + 1.2 * s, z);
    add(new THREE.SphereGeometry(.35 * s, 8, 6), m, x, y + 2.4 * s, z);
    const arm = add(new THREE.CylinderGeometry(.22 * s, .22 * s, 1 * s, 8), m, x + .55 * s, y + 1.6 * s, z); arm.rotation.z = .1;
  }
  function ice(x, z, s = 1) { const r = add(new THREE.OctahedronGeometry(.9 * s, 0), mat('#CDEFFF', { roughness: .2, metalness: .1, transparent: true, opacity: .92 }), x, H(x, z) + .7 * s, z); r.scale.y = 1.6; r.rotation.y = Math.random() * 3; }

  // Beach: palms + the Ark
  [[-6, 19], [6, 20], [-9, 15], [9, 16], [-3, 22], [4, 13]].forEach(([x, z], i) => kit.palm(x, z, .9 + (i % 3) * .1));
  const ark = new THREE.Group(); ark.position.set(0, .25, 27); group.add(ark);
  {
    const shape = new THREE.Shape(); shape.moveTo(-4.5, 1.6); shape.quadraticCurveTo(-4, -.6, -2, -1); shape.lineTo(2, -1); shape.quadraticCurveTo(4, -.6, 4.5, 1.6); shape.lineTo(-4.5, 1.6);
    const hull = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: true, bevelSize: .25, bevelThickness: .25, bevelSegments: 1 }); hull.translate(0, 0, -1.5);
    add(hull, mat('#9A5B32'), 0, 0, 0, ark);
    add(new THREE.BoxGeometry(4.6, 2, 2.4), mat('#F2C14E'), 0, 2.5, 0, ark);
    const roof = add(new THREE.ConeGeometry(3.4, 1.6, 4), mat('#E2574C'), 0, 4.3, 0, ark); roof.rotation.y = Math.PI / 4; roof.scale.z = .75;
    [-1.3, 0, 1.3].forEach((x) => add(new THREE.BoxGeometry(.6, .6, .1), mat('#1B2A41'), x, 2.6, 1.22, ark));
    const mast = add(new THREE.CylinderGeometry(.08, .08, 3, 5), mat('#6E4A2A'), 2.6, 4.6, 0, ark);
    const flag = add(new THREE.PlaneGeometry(1.2, .7), mat('#FF5D73', { side: THREE.DoubleSide }), 3.2, 5.7, 0, ark); flag.name = 'flag';
    const plank = add(new THREE.BoxGeometry(.9, .15, 4), mat('#B5824F'), -1, .9, -3.2, ark); plank.rotation.x = -.25;
    void mast;
  }

  // Lab tower
  const lab = new THREE.Group(); lab.position.set(ZONE_POS.lab.x, H(ZONE_POS.lab.x, ZONE_POS.lab.z), ZONE_POS.lab.z); group.add(lab);
  add(new THREE.CylinderGeometry(2, 2.4, 1, 10), mat('#C9CFE6'), 0, .5, 0, lab);
  add(new THREE.CylinderGeometry(1.6, 1.9, 5.5, 10), mat('#F3F4FB'), 0, 3.6, 0, lab);
  add(new THREE.CylinderGeometry(1.95, 1.95, .5, 10), mat('#7A5CFA'), 0, 2.4, 0, lab);
  add(new THREE.CylinderGeometry(1.75, 1.75, .4, 10), mat('#7A5CFA'), 0, 5.4, 0, lab);
  add(new THREE.SphereGeometry(1.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#7FE6F2', { emissive: '#2BB7C9', emissiveIntensity: .45, roughness: .15 }), 0, 6.35, 0, lab);
  const ring = add(new THREE.TorusGeometry(2.6, .14, 6, 28), mat('#FFB627', { emissive: '#FF9900', emissiveIntensity: .5 }), 0, 6.4, 0, lab); ring.rotation.x = 1.2;
  add(new THREE.CylinderGeometry(.06, .06, 2, 5), mat('#4A5A72'), 0, 8.6, 0, lab);
  const bulb = add(new THREE.SphereGeometry(.32, 10, 8), new THREE.MeshBasicMaterial({ color: '#B6FFF6' }), 0, 9.7, 0, lab);
  const labLight = new THREE.PointLight('#7FFFE8', 6, 12); labLight.position.set(0, 9.7, 0); lab.add(labLight);
  [[3.5, 2], [-3.2, 2.6], [2.8, -3]].forEach(([dx, dz]) => kit.blob(ZONE_POS.lab.x + dx, ZONE_POS.lab.z + dz, .7, '#58B95A'));

  // Greenhouse
  const gh = new THREE.Group(); gh.position.set(ZONE_POS.greenhouse.x, H(ZONE_POS.greenhouse.x, ZONE_POS.greenhouse.z) + .1, ZONE_POS.greenhouse.z); group.add(gh);
  const domeGeo = new THREE.SphereGeometry(3.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeo, new THREE.MeshStandardMaterial({ color: '#D9FBFF', transparent: true, opacity: .32, roughness: .1, flatShading: true })); gh.add(dome);
  gh.add(new THREE.LineSegments(new THREE.EdgesGeometry(domeGeo), new THREE.LineBasicMaterial({ color: '#FFFFFF' })));
  ['#FF5D73', '#FFB627', '#7A5CFA', '#FF8FB1', '#FFE066'].forEach((c, i) => {
    const a = i * 1.25, r = 1.6; add(new THREE.CylinderGeometry(.05, .05, 1.2, 4), mat('#3E9B4A'), Math.cos(a) * r, .6, Math.sin(a) * r, gh);
    add(new THREE.IcosahedronGeometry(.35, 0), mat(c), Math.cos(a) * r, 1.3, Math.sin(a) * r, gh);
  });
  add(new THREE.IcosahedronGeometry(.9, 0), mat('#3FAE4F'), 0, .9, 0, gh);
  [[4.5, 3], [-4, -2.5], [3.5, -4], [-3.4, 3.6]].forEach(([dx, dz], i) => { const x = ZONE_POS.greenhouse.x + dx, z = ZONE_POS.greenhouse.z + dz; i % 2 ? cactus(x, z, .8) : kit.blob(x, z, .8, '#62C25A'); });

  // Peaks: snowy mountain + ice + pines
  [[-5, -14], [5, -14], [-7, -19], [7, -19], [-3, -22], [4, -22]].forEach(([x, z], i) => (i % 2 ? ice(x, z, .9) : kit.cone(x, z, .8, '#2F7A4A')));
  [[-2, -12.5], [2.5, -12.8]].forEach(([x, z]) => kit.rock(x, z, .9, '#B8C4CC'));

  // Jungle: dense trees
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 7.5;
    const x = ZONE_POS.jungle.x + Math.cos(a) * r, z = ZONE_POS.jungle.z + Math.sin(a) * r;
    if (Math.hypot(x, z) > 22 || Math.hypot(x, z) < 10) continue;
    (i % 3 ? kit.blob : kit.cone)(x, z, .8 + Math.random() * .5, ['#1F8A3C', '#2FA34A', '#3DBB57'][i % 3]);
  }
  // Savanna: acacias + rocks
  [[-18, 5], [-12, 12], [-19, 11], [-11, 5]].forEach(([x, z], i) => acacia(x, z, .9 + (i % 2) * .2));
  kit.rock(-16, 13, .8, '#B79A6A');
  // Volcano lava + smoke
  const lava = new THREE.Mesh(new THREE.CircleGeometry(2.1, 16), new THREE.MeshBasicMaterial({ color: '#FF7A1A' }));
  lava.rotation.x = -Math.PI / 2; lava.position.set(0, H(0, 0) + .6, 0); group.add(lava);
  const lavaLight = new THREE.PointLight('#FF7A1A', 30, 18); lavaLight.position.set(0, H(0, 0) + 2, 0); group.add(lavaLight);
  const puffs = [];
  for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: '#E9E3E0', transparent: true, depthWrite: false })); s.userData.t = i / 10; group.add(s); puffs.push(s); }

  const clouds = kit.clouds(6, 34, 48);

  // ---------- animal billboards ----------
  const P = ZONE_POS;
  kit.critter('turtle', -2.5, 18.5); kit.critter('crab', 2.5, 21.5, { s: 1.6 }); kit.critter('duck', 4.5, 17); kit.critter('frog', -5, 16.5, { s: 1.8 }); kit.critter('elephant', -1, 23, { s: 2.6 }); kit.critter('giraffe', 1.6, 23.5, { s: 3 });
  kit.critter('scientist', P.lab.x - 3, P.lab.z + 2.8, { s: 2.4 }); kit.critter('dna', P.lab.x + 2.6, P.lab.z + 2, { s: 1.6, fly: true, r: 1 });
  kit.critter('sunflower', P.greenhouse.x - 3.2, P.greenhouse.z + 3, { s: 2.2 }); kit.critter('tulip', P.greenhouse.x + 4, P.greenhouse.z, { s: 1.8 }); kit.critter('bee', P.greenhouse.x, P.greenhouse.z, { s: 1.3, fly: true, r: 4.5, y: 5 }); kit.critter('butterfly', P.greenhouse.x, P.greenhouse.z, { s: 1.4, fly: true, r: 3.2, y: 4.2 });
  kit.critter('polarbear', P.peaks.x - 4, P.peaks.z + 4.5, { s: 2.6 }); kit.critter('penguin', P.peaks.x + 3.5, P.peaks.z + 5, { s: 2 }); kit.critter('seal', P.peaks.x + 6, P.peaks.z + 1.5, { s: 2 });
  kit.critter('monkey', P.jungle.x + 2, P.jungle.z + 4.5, { s: 2.2 }); kit.critter('tiger', P.jungle.x - 2, P.jungle.z + 5.5, { s: 2.5 }); kit.critter('parrot', P.jungle.x, P.jungle.z, { s: 1.6, fly: true, r: 6, y: 9 }); kit.critter('sloth', P.jungle.x + 4.5, P.jungle.z - 1, { s: 2 });
  kit.critter('giraffe', P.savanna.x + 1, P.savanna.z - 1, { s: 3.2 }); kit.critter('zebra', P.savanna.x + 4, P.savanna.z + 2.5, { s: 2.4 }); kit.critter('lion', P.savanna.x - 2, P.savanna.z + 4.5, { s: 2.4 }); kit.critter('elephant', P.savanna.x - 4, P.savanna.z - 3, { s: 3 });
  const bot = kit.critter('robot', 0, 0, { s: 3.4, y: H(0, 0) + 5.5 });


  // ---------- dynamic things: decorations, Joycelyn + pet, zone bosses ----------
  const DECOR_SPOT = {
    hut: [-8.5, 19, 2.6], tent: [-17.5, 12, 2.2], house: [6, -12.5, 3], carousel: [8.5, 13.5, 2.8], cake: [-6.5, 11.5, 2.6], moai: [-6.5, -12.5, 3],
    ferriswheel: [20.5, 0, 5.8], jcastle: [-10.5, -17.5, 4.6], castle: [10.5, -17.5, 5], rollercoaster: [-20.5, 0, 5.6], fountain: [12.5, -1.5, 2.6], snowman: [-3.5, -20.5, 2.6],
  };
  const decorObjs = {};
  function makeDecor(id) {
    const ART = { tent: 'camping' };
    if (DECOR_SPOT[id]) {
      const [x, z, s] = DECOR_SPOT[id];
      const sp = kit.sprite(ART[id] || id, x, H(x, z) + s * .45, z, s);
      return { objs: [sp], update(el) { sp.position.y = H(x, z) + s * .45 + Math.sin(el * 1.3 + x) * .08; } };
    }
    if (id === 'sailboat') { const sp = kit.sprite('sailboat', 0, .9, 0, 3); return { objs: [sp], update(el) { const a = el * .08; sp.position.set(Math.cos(a) * 31, .9 + Math.sin(el * 1.5) * .2, Math.sin(a) * 31); } }; }
    if (id === 'kite') { const sp = kit.sprite('kite', 0, 16, 0, 2.6); return { objs: [sp], update(el) { sp.position.set(-12 + Math.sin(el * .5) * 3, 15 + Math.sin(el * 1.1) * 1.2, 10 + Math.cos(el * .4) * 2); } }; }
    if (id === 'rainbow') { const sp = kit.sprite('rainbow', 0, 14, -26, 22, { opacity: .85 }); return { objs: [sp], update() {} }; }
    if (id === 'fireworks') {
      const sps = [0, 1, 2].map(() => kit.sprite('fireworks', 0, 20, 0, 1, { opacity: 0 }));
      sps.forEach((sp, i) => { sp.userData.t = i / 3; });
      return { objs: sps, update(el, dt) { sps.forEach((sp) => { sp.userData.t += dt * .35; if (sp.userData.t > 1) { sp.userData.t = 0; const a = Math.random() * 6.28; sp.position.set(Math.cos(a) * 14, 18 + Math.random() * 6, Math.sin(a) * 14); } const t = sp.userData.t; sp.scale.setScalar(1 + t * 6); sp.material.opacity = t < .15 ? t / .15 : Math.max(0, 1 - (t - .15) / .85); }); } };
    }
    return null;
  }
  // Zone bosses
  const BOSS_SPOT = {
    beach: { x: 8, z: 27, y: () => 1.6, s: 4.2, tint: '#C9A8FF', move: (o, el) => { o.position.x = 8 + Math.sin(el * .6) * 1.5; o.position.y = 1.4 + Math.sin(el * 1.8) * .4; } },
    lab: { x: 19, z: 5, y: () => H(19, 5) + 5, s: 3, move: (o, el) => { o.position.y = H(19, 5) + 5 + Math.sin(el * 2.2) * .6; } },
    greenhouse: { x: 19, z: -11.5, y: () => H(19, -11.5) + 1.6, s: 3.2, crown: true },
    peaks: { x: 4.5, z: -13.5, y: () => H(4.5, -13.5) + 1.5, s: 3, tint: '#D6F2FF' },
    jungle: { x: -15, z: -8, y: () => 11, s: 3.6, tint: '#8A6FD0', move: (o, el) => { const a = el * .5; o.position.set(-15 + Math.cos(a) * 5, 11 + Math.sin(el * 1.4) * .8, -8 + Math.sin(a) * 5); } },
    savanna: { x: -19.5, z: 12, y: () => H(-19.5, 12) + 1.3, s: 3.2 },
  };

  // Welcome sign on the beach
  kit.sign(9.8, 20.3, -0.25, 'Joycelyn', 'Biodiversity Island');

  return {
    zones: Object.fromEntries(Object.entries(ZONE_POS).map(([id, p]) => [id, { x: p.x, z: p.z, y: id === 'volcano' ? H(0, 0) + 9.5 : id === 'peaks' ? H(p.x, p.z) + 4.5 : H(p.x, p.z) + 7.5, far: id === 'volcano' }])),
    avatar: { x: 1.4, z: 19.2, px: -.1, pz: 19.9 },
    bosses: BOSS_SPOT,
    decor: makeDecor,
    update(el, dt) {
      ark.position.y = .25 + Math.sin(el * 1.4) * .18; ark.rotation.z = Math.sin(el * 1.1) * .03; ark.rotation.x = Math.cos(el * .9) * .02;
      ring.rotation.z += dt * 1.2; labLight.intensity = 5 + Math.sin(el * 9) * 2; bulb.scale.setScalar(1 + Math.sin(el * 9) * .12);
      lavaLight.intensity = 26 + Math.sin(el * 5) * 6;
      puffs.forEach((s) => { s.userData.t = (s.userData.t + dt * .12) % 1; const t = s.userData.t; s.position.set(Math.sin(t * 7 + s.id) * t * 2, H(0, 0) + 1 + t * 9, Math.cos(t * 5 + s.id) * t * 1.5); s.scale.setScalar(1.2 + t * 4); s.material.opacity = (1 - t) * .7; });
      clouds.update(dt);
      bot.position.y = H(0, 0) + 5.5 + Math.sin(el * 1.6) * .6;
    },
  };
}
