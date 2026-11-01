// =============================================================
//  3D Biodiversity Island (Three.js low-poly world hub)
// =============================================================
import * as THREE from '../lib/three.module.min.js';
import { OrbitControls } from '../lib/OrbitControls.js';
import { artURL } from './art.js';

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

export function createWorld(canvas, { onPick } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#A6DFF7');
  scene.fog = new THREE.Fog('#A6DFF7', 85, 230);
  const camera = new THREE.PerspectiveCamera(45, 1, .1, 500);
  camera.position.set(0, 90, 120);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.enablePan = false;
  controls.minDistance = 26; controls.maxDistance = 95; controls.minPolarAngle = .45; controls.maxPolarAngle = 1.22;
  controls.autoRotate = true; controls.autoRotateSpeed = .35; controls.target.set(0, 2, 0);

  scene.add(new THREE.HemisphereLight('#E4F7FF', '#4E7A55', 1.05));
  const sun = new THREE.DirectionalLight('#FFF1D6', 2.1);
  sun.position.set(30, 55, 25); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 1, far: 140 });
  sun.shadow.bias = -.0006;
  scene.add(sun);

  const mats = {};
  const mat = (hex, extra = {}) => { const k = hex + JSON.stringify(extra); return mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: .85, ...extra })); };
  const add = (geo, m, x = 0, y = 0, z = 0, parent = scene) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };

  // ---------- terrain ----------
  const tg = new THREE.PlaneGeometry(70, 70, 110, 110); tg.rotateX(-Math.PI / 2);
  const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setY(i, heightAt(tp.getX(i), tp.getZ(i)));
  const terrain = tg.toNonIndexed();
  const p2 = terrain.attributes.position; const cols = new Float32Array(p2.count * 3);
  for (let i = 0; i < p2.count; i += 3) {
    const cx = (p2.getX(i) + p2.getX(i + 1) + p2.getX(i + 2)) / 3, cy = (p2.getY(i) + p2.getY(i + 1) + p2.getY(i + 2)) / 3, cz = (p2.getZ(i) + p2.getZ(i + 1) + p2.getZ(i + 2)) / 3;
    const c = colorAt(cx, cz, cy);
    for (let k = 0; k < 3; k++) { cols[(i + k) * 3] = c.r; cols[(i + k) * 3 + 1] = c.g; cols[(i + k) * 3 + 2] = c.b; }
  }
  terrain.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  terrain.computeVertexNormals();
  const ground = new THREE.Mesh(terrain, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95 }));
  ground.receiveShadow = true; scene.add(ground);

  // ---------- water ----------
  const wg = new THREE.PlaneGeometry(520, 520, 90, 90); wg.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: '#27B5D0', transparent: true, opacity: .9, flatShading: true, roughness: .35, metalness: .05 }));
  water.receiveShadow = true; scene.add(water);
  const wBase = Float32Array.from(wg.attributes.position.array);
  const foam = new THREE.Mesh(new THREE.RingGeometry(23.5, 27, 64), new THREE.MeshBasicMaterial({ color: '#E8FBFF', transparent: true, opacity: .35 }));
  foam.rotation.x = -Math.PI / 2; foam.position.y = .12; scene.add(foam);

  // ---------- props ----------
  const H = (x, z) => heightAt(x, z);
  function cone(x, z, s, col = '#2E8B3E') {
    const y = H(x, z); add(new THREE.CylinderGeometry(.22 * s, .32 * s, 1.4 * s, 6), mat('#7A4F2D'), x, y + .7 * s, z);
    add(new THREE.ConeGeometry(1.2 * s, 2.6 * s, 7), mat(col), x, y + 2.6 * s, z);
  }
  function blob(x, z, s, col = '#3FAE4F') {
    const y = H(x, z); add(new THREE.CylinderGeometry(.22 * s, .3 * s, 1.6 * s, 6), mat('#6E4A2A'), x, y + .8 * s, z);
    const b = add(new THREE.IcosahedronGeometry(1.3 * s, 0), mat(col), x, y + 2.2 * s, z); b.rotation.set(Math.random(), Math.random(), 0);
  }
  function palm(x, z, s = 1) {
    const g = new THREE.Group(); const y = H(x, z); g.position.set(x, y, z); scene.add(g);
    const lean = (Math.random() - .5) * .5;
    for (let i = 0; i < 5; i++) { const seg = add(new THREE.CylinderGeometry(.2 * s, .26 * s, .9 * s, 6), mat('#A27148'), Math.sin(lean) * i * .35 * s, (.45 + i * .85) * s, 0, g); seg.rotation.z = -lean * .4; }
    const top = new THREE.Vector3(Math.sin(lean) * 4 * .35 * s, 4.3 * s, 0);
    for (let i = 0; i < 6; i++) {
      const f = add(new THREE.ConeGeometry(.42 * s, 2.8 * s, 4), mat(i % 2 ? '#3FAE4F' : '#2E9444'), top.x, top.y, top.z, g);
      f.scale.z = .25; f.rotation.y = i * Math.PI / 3; f.rotation.z = 1.9; f.geometry.translate(0, 1.4 * s, 0);
    }
  }
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
  function rock(x, z, s = 1, col = '#9AA3A8') { const r = add(new THREE.DodecahedronGeometry(.8 * s, 0), mat(col), x, H(x, z) + .3 * s, z); r.rotation.set(Math.random() * 3, Math.random() * 3, 0); }
  function ice(x, z, s = 1) { const r = add(new THREE.OctahedronGeometry(.9 * s, 0), mat('#CDEFFF', { roughness: .2, metalness: .1, transparent: true, opacity: .92 }), x, H(x, z) + .7 * s, z); r.scale.y = 1.6; r.rotation.y = Math.random() * 3; }

  // Beach: palms + the Ark
  [[-6, 19], [6, 20], [-9, 15], [9, 16], [-3, 22], [4, 13]].forEach(([x, z], i) => palm(x, z, .9 + (i % 3) * .1));
  const ark = new THREE.Group(); ark.position.set(0, .25, 27); scene.add(ark);
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
  const lab = new THREE.Group(); lab.position.set(ZONE_POS.lab.x, H(ZONE_POS.lab.x, ZONE_POS.lab.z), ZONE_POS.lab.z); scene.add(lab);
  add(new THREE.CylinderGeometry(2, 2.4, 1, 10), mat('#C9CFE6'), 0, .5, 0, lab);
  add(new THREE.CylinderGeometry(1.6, 1.9, 5.5, 10), mat('#F3F4FB'), 0, 3.6, 0, lab);
  add(new THREE.CylinderGeometry(1.95, 1.95, .5, 10), mat('#7A5CFA'), 0, 2.4, 0, lab);
  add(new THREE.CylinderGeometry(1.75, 1.75, .4, 10), mat('#7A5CFA'), 0, 5.4, 0, lab);
  add(new THREE.SphereGeometry(1.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#7FE6F2', { emissive: '#2BB7C9', emissiveIntensity: .45, roughness: .15 }), 0, 6.35, 0, lab);
  const ring = add(new THREE.TorusGeometry(2.6, .14, 6, 28), mat('#FFB627', { emissive: '#FF9900', emissiveIntensity: .5 }), 0, 6.4, 0, lab); ring.rotation.x = 1.2;
  add(new THREE.CylinderGeometry(.06, .06, 2, 5), mat('#4A5A72'), 0, 8.6, 0, lab);
  const bulb = add(new THREE.SphereGeometry(.32, 10, 8), new THREE.MeshBasicMaterial({ color: '#B6FFF6' }), 0, 9.7, 0, lab);
  const labLight = new THREE.PointLight('#7FFFE8', 6, 12); labLight.position.set(0, 9.7, 0); lab.add(labLight);
  [[3.5, 2], [-3.2, 2.6], [2.8, -3]].forEach(([dx, dz]) => blob(ZONE_POS.lab.x + dx, ZONE_POS.lab.z + dz, .7, '#58B95A'));

  // Greenhouse
  const gh = new THREE.Group(); gh.position.set(ZONE_POS.greenhouse.x, H(ZONE_POS.greenhouse.x, ZONE_POS.greenhouse.z) + .1, ZONE_POS.greenhouse.z); scene.add(gh);
  const domeGeo = new THREE.SphereGeometry(3.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeo, new THREE.MeshStandardMaterial({ color: '#D9FBFF', transparent: true, opacity: .32, roughness: .1, flatShading: true })); gh.add(dome);
  gh.add(new THREE.LineSegments(new THREE.EdgesGeometry(domeGeo), new THREE.LineBasicMaterial({ color: '#FFFFFF' })));
  ['#FF5D73', '#FFB627', '#7A5CFA', '#FF8FB1', '#FFE066'].forEach((c, i) => {
    const a = i * 1.25, r = 1.6; add(new THREE.CylinderGeometry(.05, .05, 1.2, 4), mat('#3E9B4A'), Math.cos(a) * r, .6, Math.sin(a) * r, gh);
    add(new THREE.IcosahedronGeometry(.35, 0), mat(c), Math.cos(a) * r, 1.3, Math.sin(a) * r, gh);
  });
  add(new THREE.IcosahedronGeometry(.9, 0), mat('#3FAE4F'), 0, .9, 0, gh);
  [[4.5, 3], [-4, -2.5], [3.5, -4], [-3.4, 3.6]].forEach(([dx, dz], i) => { const x = ZONE_POS.greenhouse.x + dx, z = ZONE_POS.greenhouse.z + dz; i % 2 ? cactus(x, z, .8) : blob(x, z, .8, '#62C25A'); });

  // Peaks: snowy mountain + ice + pines
  [[-5, -14], [5, -14], [-7, -19], [7, -19], [-3, -22], [4, -22]].forEach(([x, z], i) => (i % 2 ? ice(x, z, .9) : cone(x, z, .8, '#2F7A4A')));
  [[-2, -12.5], [2.5, -12.8]].forEach(([x, z]) => rock(x, z, .9, '#B8C4CC'));

  // Jungle: dense trees
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 7.5;
    const x = ZONE_POS.jungle.x + Math.cos(a) * r, z = ZONE_POS.jungle.z + Math.sin(a) * r;
    if (Math.hypot(x, z) > 22 || Math.hypot(x, z) < 10) continue;
    (i % 3 ? blob : cone)(x, z, .8 + Math.random() * .5, ['#1F8A3C', '#2FA34A', '#3DBB57'][i % 3]);
  }
  // Savanna: acacias + rocks
  [[-18, 5], [-12, 12], [-19, 11], [-11, 5]].forEach(([x, z], i) => acacia(x, z, .9 + (i % 2) * .2));
  rock(-16, 13, .8, '#B79A6A');
  // Volcano lava + smoke
  const lava = new THREE.Mesh(new THREE.CircleGeometry(2.1, 16), new THREE.MeshBasicMaterial({ color: '#FF7A1A' }));
  lava.rotation.x = -Math.PI / 2; lava.position.set(0, H(0, 0) + .6, 0); scene.add(lava);
  const lavaLight = new THREE.PointLight('#FF7A1A', 30, 18); lavaLight.position.set(0, H(0, 0) + 2, 0); scene.add(lavaLight);
  const puffTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; })();
  const puffs = [];
  for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: '#E9E3E0', transparent: true, depthWrite: false })); s.userData.t = i / 10; scene.add(s); puffs.push(s); }

  // Clouds
  const clouds = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(); const a = i / 6 * Math.PI * 2, r = 34 + Math.random() * 14;
    g.userData = { a, r, y: 24 + Math.random() * 6, sp: .02 + Math.random() * .02 };
    for (let k = 0; k < 4; k++) { const m = add(new THREE.IcosahedronGeometry(1 + Math.random() * .9, 0), mat('#FFFFFF', { roughness: 1, emissive: '#FFFFFF', emissiveIntensity: .35 }), k * 1.6 - 2.4, Math.random() * .8, Math.random() * 1.2, g); m.castShadow = false; }
    scene.add(g); clouds.push(g);
  }

  // ---------- animal billboards ----------
  const loader = new THREE.TextureLoader();
  const texCache = {};
  const tex = (id) => texCache[id] || (texCache[id] = (() => { const t = loader.load(artURL(id)); t.colorSpace = THREE.SRGBColorSpace; return t; })());
  const critters = [];
  function critter(id, x, z, { s = 2.2, fly = false, y = null, r = 0 } = {}) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(id), transparent: true, alphaTest: .05 }));
    sp.scale.set(s, s, s);
    const base = y ?? H(x, z) + s * .5;
    sp.position.set(x, base, z); sp.userData = { x, z, base, ph: Math.random() * 6, fly, r, sp: .6 + Math.random() * .6 };
    scene.add(sp); critters.push(sp); return sp;
  }
  const P = ZONE_POS;
  critter('turtle', -2.5, 18.5); critter('crab', 2.5, 21.5, { s: 1.6 }); critter('duck', 4.5, 17); critter('frog', -5, 16.5, { s: 1.8 }); critter('elephant', -1, 23, { s: 2.6 }); critter('giraffe', 1.6, 23.5, { s: 3 });
  critter('scientist', P.lab.x - 3, P.lab.z + 2.8, { s: 2.4 }); critter('dna', P.lab.x + 2.6, P.lab.z + 2, { s: 1.6, fly: true, r: 1 });
  critter('sunflower', P.greenhouse.x - 3.2, P.greenhouse.z + 3, { s: 2.2 }); critter('tulip', P.greenhouse.x + 4, P.greenhouse.z, { s: 1.8 }); critter('bee', P.greenhouse.x, P.greenhouse.z, { s: 1.3, fly: true, r: 4.5, y: 5 }); critter('butterfly', P.greenhouse.x, P.greenhouse.z, { s: 1.4, fly: true, r: 3.2, y: 4.2 });
  critter('polarbear', P.peaks.x - 4, P.peaks.z + 4.5, { s: 2.6 }); critter('penguin', P.peaks.x + 3.5, P.peaks.z + 5, { s: 2 }); critter('seal', P.peaks.x + 6, P.peaks.z + 1.5, { s: 2 });
  critter('monkey', P.jungle.x + 2, P.jungle.z + 4.5, { s: 2.2 }); critter('tiger', P.jungle.x - 2, P.jungle.z + 5.5, { s: 2.5 }); critter('parrot', P.jungle.x, P.jungle.z, { s: 1.6, fly: true, r: 6, y: 9 }); critter('sloth', P.jungle.x + 4.5, P.jungle.z - 1, { s: 2 });
  critter('giraffe', P.savanna.x + 1, P.savanna.z - 1, { s: 3.2 }); critter('zebra', P.savanna.x + 4, P.savanna.z + 2.5, { s: 2.4 }); critter('lion', P.savanna.x - 2, P.savanna.z + 4.5, { s: 2.4 }); critter('elephant', P.savanna.x - 4, P.savanna.z - 3, { s: 3 });
  const bot = critter('robot', 0, 0, { s: 3.4, y: H(0, 0) + 5.5 });

  // ---------- zone labels ----------
  const labels = {}; const hits = [];
  function drawLabel(cv, title, stars, max) {
    const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    const W = cv.width, Hh = cv.height;
    g.fillStyle = '#1B2A41'; roundRect(g, 6, 10, W - 12, Hh - 22, 40); g.fill();
    g.fillStyle = '#FFFFFF'; roundRect(g, 14, 4, W - 28, Hh - 30, 34); g.fill();
    g.fillStyle = '#1B2A41'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `56px 'Lilita One', 'Baloo 2', sans-serif`; g.fillText(title, W / 2, 58);
    g.font = `40px sans-serif`;
    let s = ''; for (let i = 0; i < max; i++) s += i < stars ? '★' : '☆';
    g.fillStyle = '#E08E00'; g.fillText(s, W / 2, 118);
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function makeLabel(id, title, stars, max) {
    const cv = document.createElement('canvas'); cv.width = 560; cv.height = 168; drawLabel(cv, title, stars, max);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, fog: false, toneMapped: false }));
    sp.renderOrder = 10;
    const p = ZONE_POS[id]; const y = (id === 'volcano' ? H(0, 0) + 9.5 : id === 'peaks' ? H(p.x, p.z) + 4.5 : H(p.x, p.z) + 7.5);
    sp.position.set(p.x, y, p.z); sp.scale.set(8.6, 2.58, 1); sp.userData = { zone: id, cv, tex: t, title, y, ph: Math.random() * 6 };
    scene.add(sp); labels[id] = sp; hits.push(sp);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 14, 8), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(p.x, 4, p.z); hit.userData.zone = id; scene.add(hit); hits.push(hit);
  }

  // ---------- picking ----------
  const ray = new THREE.Raycaster(); const v2 = new THREE.Vector2(); let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || paused) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
    if (moved > 10) return;
    const r = canvas.getBoundingClientRect();
    v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v2, camera);
    const hit = ray.intersectObjects(hits, false)[0];
    if (hit && onPick) onPick(hit.object.userData.zone);
  });

  // ---------- camera tween ----------
  let tween = null;
  function flyTo(pos, target, ms = 1100) {
    return new Promise((res) => {
      tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), ms, res };
    });
  }
  const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // ---------- loop ----------
  let paused = false; const clock = new THREE.Clock(); let el = 0;
  function resize() {
    const w = canvas.clientWidth || innerWidth, hh = canvas.clientHeight || innerHeight;
    renderer.setSize(w, hh, false); camera.aspect = w / hh;
    camera.fov = w / hh < 1 ? 62 : 45; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();
  function frame() {
    requestAnimationFrame(frame);
    if (paused) return;
    const dt = Math.min(clock.getDelta(), .05); el += dt;
    if (tween) {
      const k = Math.min(1, (performance.now() - tween.start) / tween.ms), e = ease(k);
      camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0, tween.t1, e);
      if (k >= 1) { const r = tween.res; tween = null; r(); }
    } else controls.update();
    // water waves
    const wp = water.geometry.attributes.position;
    for (let i = 0; i < wp.count; i++) { const x = wBase[i * 3], z = wBase[i * 3 + 2]; wp.setY(i, Math.sin(x * .18 + el * 1.3) * .22 + Math.cos(z * .21 + el * 1.1) * .22); }
    wp.needsUpdate = true; water.geometry.computeVertexNormals();
    ark.position.y = .25 + Math.sin(el * 1.4) * .18; ark.rotation.z = Math.sin(el * 1.1) * .03; ark.rotation.x = Math.cos(el * .9) * .02;
    ring.rotation.z += dt * 1.2; labLight.intensity = 5 + Math.sin(el * 9) * 2; bulb.scale.setScalar(1 + Math.sin(el * 9) * .12);
    lavaLight.intensity = 26 + Math.sin(el * 5) * 6;
    puffs.forEach((s) => { s.userData.t = (s.userData.t + dt * .12) % 1; const t = s.userData.t; s.position.set(Math.sin(t * 7 + s.id) * t * 2, H(0, 0) + 1 + t * 9, Math.cos(t * 5 + s.id) * t * 1.5); s.scale.setScalar(1.2 + t * 4); s.material.opacity = (1 - t) * .7; });
    clouds.forEach((g) => { g.userData.a += dt * g.userData.sp; g.position.set(Math.cos(g.userData.a) * g.userData.r, g.userData.y, Math.sin(g.userData.a) * g.userData.r); });
    critters.forEach((c) => {
      const u = c.userData;
      if (u.fly) { const a = el * u.sp + u.ph; c.position.set(u.x + Math.cos(a) * u.r, u.base + Math.sin(el * 3 + u.ph) * .5, u.z + Math.sin(a) * u.r); }
      else c.position.y = u.base + Math.abs(Math.sin(el * 2.2 * u.sp + u.ph)) * .5;
    });
    bot.position.y = H(0, 0) + 5.5 + Math.sin(el * 1.6) * .6;
    Object.values(labels).forEach((l) => { l.position.y = l.userData.y + Math.sin(el * 1.5 + l.userData.ph) * .25; });
    renderer.render(scene, camera);
  }
  frame();

  return {
    addZone(id, title, stars, max) { makeLabel(id, title, stars, max); },
    updateZone(id, stars, max) { const l = labels[id]; if (!l) return; drawLabel(l.userData.cv, l.userData.title, stars, max); l.userData.tex.needsUpdate = true; },
    redrawLabels(fn) { Object.keys(labels).forEach((id) => { const [s, m] = fn(id); this.updateZone(id, s, m); }); },
    async focus(id) {
      controls.autoRotate = false;
      const p = ZONE_POS[id]; const hgt = H(p.x, p.z);
      const dir = new THREE.Vector3(p.x, 0, p.z); if (dir.length() < 1) dir.set(0, 0, 1); dir.normalize();
      const dist = id === 'volcano' ? 30 : 20;
      const target = new THREE.Vector3(p.x, hgt + (id === 'volcano' ? 4 : 2), p.z);
      const side = innerWidth > 760 ? new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(-6) : new THREE.Vector3();
      await flyTo(target.clone().add(dir.clone().multiplyScalar(dist)).add(new THREE.Vector3(0, 13, 0)).add(side), target.clone().add(side.clone().multiplyScalar(.6)), 1000);
    },
    async overview(ms = 1300) { await flyTo(new THREE.Vector3(0, 40, 58), new THREE.Vector3(0, 2, 0), ms); controls.autoRotate = true; },
    setPaused(b) { paused = b; if (!b) clock.getDelta(); },
    setAutoRotate(b) { controls.autoRotate = b; },
  };
}
