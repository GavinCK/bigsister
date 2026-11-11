// =============================================================
//  3D archipelago engine (Three.js): one sea, many islands.
//  Each island is built by its own builder (islands/<id>/island.js) inside a THREE.Group,
//  so every island works in its own local coordinates. The engine owns the renderer,
//  camera, sea, labels, tap-picking, camera flights, the avatar and zone bosses.
// =============================================================
import * as THREE from '../../lib/three.module.min.js';
import { OrbitControls } from '../../lib/OrbitControls.js';
import { artURL } from '../core/art.js';

const SEABED = new THREE.Color('#25AFCB');
const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function createWorld(canvas, { onPickIsland, onPickZone } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#A6DFF7');
  scene.fog = new THREE.Fog('#A6DFF7', 85, 230);
  const camera = new THREE.PerspectiveCamera(45, 1, .1, 1200);
  camera.position.set(0, 160, 220);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.enablePan = false;
  controls.minDistance = 26; controls.maxDistance = 95; controls.minPolarAngle = .45; controls.maxPolarAngle = 1.22;
  controls.autoRotate = false; controls.autoRotateSpeed = .35; controls.target.set(0, 2, 0);

  scene.add(new THREE.HemisphereLight('#E4F7FF', '#4E7A55', 1.05));
  const sun = new THREE.DirectionalLight('#FFF1D6', 2.1);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0006;
  scene.add(sun); scene.add(sun.target);
  function aimSun(cx, cz, span = 38) {
    sun.position.set(cx + 30, 55, cz + 25); sun.target.position.set(cx, 0, cz);
    Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 160 + span });
    sun.shadow.camera.updateProjectionMatrix();
  }
  aimSun(0, 0);

  const mats = {};
  const mat = (hex, extra = {}) => { const k = hex + JSON.stringify(extra); return mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: .85, ...extra })); };
  const loader = new THREE.TextureLoader();
  const texCache = {};
  const tex = (id) => texCache[id] || (texCache[id] = (() => { const t = loader.load(artURL(id)); t.colorSpace = THREE.SRGBColorSpace; return t; })());
  const puffTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();

  // ---------- the sea ----------
  const wg = new THREE.PlaneGeometry(800, 800, 96, 96); wg.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: '#27B5D0', transparent: true, opacity: .9, flatShading: true, roughness: .35, metalness: .05 }));
  water.receiveShadow = true; scene.add(water);
  const wBase = Float32Array.from(wg.attributes.position.array);
  // one even sea floor under the whole sea (so island terrain edges don't show as squares)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ color: SEABED, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.9; scene.add(floor);

  // ---------- islands ----------
  const islands = {};          // id -> { def, group, api, labels, hits, critters, label, center }
  const hits = [];             // pickable objects (userData: {island, zone?})
  let current = null;          // island id in island view, null in map view

  function kitFor(group) {
    let H = () => 0;
    const add = (geo, m, x = 0, y = 0, z = 0, parent = group) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };
    const critters = [];
    const kit = {
      THREE, group, add, mat, tex, puffTex,
      get H() { return H; },
      setHeight(fn) { H = fn; },
      // low-poly terrain from a height function and a colour function (local coordinates)
      terrain({ size = 70, seg = 110, height, color }) {
        H = height;
        const tg = new THREE.PlaneGeometry(size, size, seg, seg); tg.rotateX(-Math.PI / 2);
        const tp = tg.attributes.position;
        for (let i = 0; i < tp.count; i++) tp.setY(i, height(tp.getX(i), tp.getZ(i)));
        const terrain = tg.toNonIndexed();
        const p2 = terrain.attributes.position; const cols = new Float32Array(p2.count * 3);
        for (let i = 0; i < p2.count; i += 3) {
          const cx = (p2.getX(i) + p2.getX(i + 1) + p2.getX(i + 2)) / 3, cy = (p2.getY(i) + p2.getY(i + 1) + p2.getY(i + 2)) / 3, cz = (p2.getZ(i) + p2.getZ(i + 1) + p2.getZ(i + 2)) / 3;
          const c = cy < -1.25 ? SEABED : color(cx, cz, cy);
          for (let k = 0; k < 3; k++) { cols[(i + k) * 3] = c.r; cols[(i + k) * 3 + 1] = c.g; cols[(i + k) * 3 + 2] = c.b; }
        }
        terrain.setAttribute('color', new THREE.BufferAttribute(cols, 3));
        terrain.computeVertexNormals();
        const ground = new THREE.Mesh(terrain, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95 }));
        ground.receiveShadow = true; group.add(ground);
        return ground;
      },
      foam(r1, r2) { const f = new THREE.Mesh(new THREE.RingGeometry(r1, r2, 64), new THREE.MeshBasicMaterial({ color: '#E8FBFF', transparent: true, opacity: .35 })); f.rotation.x = -Math.PI / 2; f.position.y = .12; group.add(f); return f; },
      sprite(id, x, y, z, size, { tint = null, opacity = 1 } = {}) {
        const m = new THREE.SpriteMaterial({ map: tex(id), transparent: true, alphaTest: .05, opacity });
        if (tint) m.color = new THREE.Color(tint);
        const sp = new THREE.Sprite(m); sp.scale.set(size, size, size); sp.position.set(x, y, z); group.add(sp); return sp;
      },
      // a bobbing (or flying) picture of an animal / thing
      critter(id, x, z, { s = 2.2, fly = false, y = null, r = 0 } = {}) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(id), transparent: true, alphaTest: .05 }));
        sp.scale.set(s, s, s);
        const base = y ?? H(x, z) + s * .5;
        sp.position.set(x, base, z); sp.userData = { x, z, base, ph: Math.random() * 6, fly, r, sp: .6 + Math.random() * .6 };
        group.add(sp); critters.push(sp); return sp;
      },
      removeCritter(sp) { const i = critters.indexOf(sp); if (i >= 0) critters.splice(i, 1); group.remove(sp); },
      // simple props
      cone(x, z, s, col = '#2E8B3E') { const y = H(x, z); add(new THREE.CylinderGeometry(.22 * s, .32 * s, 1.4 * s, 6), mat('#7A4F2D'), x, y + .7 * s, z); add(new THREE.ConeGeometry(1.2 * s, 2.6 * s, 7), mat(col), x, y + 2.6 * s, z); },
      blob(x, z, s, col = '#3FAE4F') { const y = H(x, z); add(new THREE.CylinderGeometry(.22 * s, .3 * s, 1.6 * s, 6), mat('#6E4A2A'), x, y + .8 * s, z); const b = add(new THREE.IcosahedronGeometry(1.3 * s, 0), mat(col), x, y + 2.2 * s, z); b.rotation.set(Math.random(), Math.random(), 0); },
      palm(x, z, s = 1) {
        const g = new THREE.Group(); const y = H(x, z); g.position.set(x, y, z); group.add(g);
        const lean = (Math.random() - .5) * .5;
        for (let i = 0; i < 5; i++) { const seg = add(new THREE.CylinderGeometry(.2 * s, .26 * s, .9 * s, 6), mat('#A27148'), Math.sin(lean) * i * .35 * s, (.45 + i * .85) * s, 0, g); seg.rotation.z = -lean * .4; }
        const top = new THREE.Vector3(Math.sin(lean) * 4 * .35 * s, 4.3 * s, 0);
        for (let i = 0; i < 6; i++) { const f = add(new THREE.ConeGeometry(.42 * s, 2.8 * s, 4), mat(i % 2 ? '#3FAE4F' : '#2E9444'), top.x, top.y, top.z, g); f.scale.z = .25; f.rotation.y = i * Math.PI / 3; f.rotation.z = 1.9; f.geometry.translate(0, 1.4 * s, 0); }
      },
      rock(x, z, s = 1, col = '#9AA3A8') { const r = add(new THREE.DodecahedronGeometry(.8 * s, 0), mat(col), x, H(x, z) + .3 * s, z); r.rotation.set(Math.random() * 3, Math.random() * 3, 0); return r; },
      clouds(n, rMin, rMax, yMin = 24) {
        const cl = [];
        for (let i = 0; i < n; i++) {
          const g = new THREE.Group(); const a = i / n * Math.PI * 2, r = rMin + Math.random() * (rMax - rMin);
          g.userData = { a, r, y: yMin + Math.random() * 6, sp: .02 + Math.random() * .02 };
          for (let k = 0; k < 4; k++) { const m = add(new THREE.IcosahedronGeometry(1 + Math.random() * .9, 0), mat('#FFFFFF', { roughness: 1, emissive: '#FFFFFF', emissiveIntensity: .35 }), k * 1.6 - 2.4, Math.random() * .8, Math.random() * 1.2, g); m.castShadow = false; }
          group.add(g); cl.push(g);
        }
        return { update(dt) { cl.forEach((g) => { g.userData.a += dt * g.userData.sp; g.position.set(Math.cos(g.userData.a) * g.userData.r, g.userData.y, Math.sin(g.userData.a) * g.userData.r); }); } };
      },
      // a wooden sign with two lines of text
      sign(x, z, rotY, line1, line2, { color1 = '#FFB627', w = 6.6 } = {}) {
        const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 300;
        const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        const draw = () => {
          const g = cv.getContext('2d'); const W = cv.width, Hh = cv.height;
          g.fillStyle = '#B5824F'; g.fillRect(0, 0, W, Hh);
          for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#A67444' : '#BF8C58'; g.fillRect(0, i * Hh / 4, W, Hh / 4 - 4); }
          g.strokeStyle = '#6E4A2A'; g.lineWidth = 16; g.strokeRect(8, 8, W - 16, Hh - 16);
          g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
          g.font = `130px 'Lilita One', 'Baloo 2', sans-serif`; g.lineWidth = 18; g.strokeStyle = '#1B2A41'; g.strokeText(line1, W / 2, 112); g.fillStyle = color1; g.fillText(line1, W / 2, 112);
          g.font = `70px 'Lilita One', 'Baloo 2', 'PingFang HK', 'Microsoft JhengHei', sans-serif`; g.lineWidth = 12; g.strokeText(line2, W / 2, 222); g.fillStyle = '#FFFFFF'; g.fillText(line2, W / 2, 222);
          t.needsUpdate = true;
        };
        draw(); document.fonts && document.fonts.ready.then(draw);
        const sg = new THREE.Group(); sg.position.set(x, H(x, z), z); sg.rotation.y = rotY; group.add(sg);
        [-w / 2 + .7, w / 2 - .7].forEach((px) => add(new THREE.CylinderGeometry(.18, .24, 3.6, 6), mat('#6E4A2A'), px, 1.8, 0, sg));
        const wood = mat('#8A5A33'); const front = new THREE.MeshStandardMaterial({ map: t, roughness: .9 });
        add(new THREE.BoxGeometry(w, w * .295, .28), [wood, wood, wood, wood, front, wood], 0, 3.1, 0, sg);
        return sg;
      },
    };
    kit._critters = critters;
    return kit;
  }

  // def: { id, title, at:{x,z}, radius, build(kit) -> { zones:{zid:{x,z,y}}, avatar:{x,z,px,pz}, bosses:{}, decor(id, kit), update(el, dt) } }
  function addIsland(def) {
    const group = new THREE.Group(); group.position.set(def.at.x, 0, def.at.z); scene.add(group);
    const kit = kitFor(group);
    const api = def.build(kit) || {};
    const isl = { def, group, kit, api, labels: {}, zoneHits: [], bosses: {}, decor: {}, center: new THREE.Vector3(def.at.x, 0, def.at.z) };
    // big invisible hit area for the whole island (used on the sea map)
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(def.radius || 26, def.radius || 26, 30, 12), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(0, 6, 0); hit.userData = { island: def.id }; group.add(hit); hits.push(hit); isl.hit = hit;
    // map label
    isl.label = makeLabelSprite(def.title, '', 1, { w: 760, h: 200, scale: 30 });
    isl.label.position.set(0, (def.labelY || 20), 0); isl.label.userData.baseY = def.labelY || 20; group.add(isl.label);
    islands[def.id] = isl;
    return isl;
  }

  // ---------- labels ----------
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function drawLabel(cv, title, line, crown) {
    const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    const W = cv.width, Hh = cv.height;
    g.fillStyle = '#1B2A41'; roundRect(g, 6, 10, W - 12, Hh - 22, 40); g.fill();
    g.fillStyle = '#FFFFFF'; roundRect(g, 14, 4, W - 28, Hh - 30, 34); g.fill();
    g.fillStyle = '#1B2A41'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let fs = Math.round(Hh * .34); g.font = `${fs}px 'Lilita One', 'Baloo 2', 'PingFang HK', 'Microsoft JhengHei', sans-serif`;
    while (g.measureText(title).width > W - 60 && fs > 20) { fs -= 2; g.font = `${fs}px 'Lilita One', 'Baloo 2', 'PingFang HK', 'Microsoft JhengHei', sans-serif`; }
    g.fillText(title, W / 2, Hh * .35);
    g.font = `${Math.round(Hh * .24)}px 'Baloo 2', sans-serif`; g.fillStyle = '#E08E00';
    g.fillText(crown ? `♛ ${line}` : line, W / 2, Hh * .7);
  }
  const starLine = (stars, max) => (max && max <= 12 ? Array.from({ length: max }, (_, i) => (i < stars ? '★' : '☆')).join('') : `★ ${stars}${max ? ' / ' + max : ''}`);
  function makeLabelSprite(title, line, crown, { w = 560, h = 168, scale = 8.6 } = {}) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; drawLabel(cv, title, line, crown === true);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, fog: false, toneMapped: false }));
    sp.renderOrder = 10; sp.scale.set(scale, scale * h / w, 1); sp.userData = { cv, tex: t, title, ph: Math.random() * 6 };
    return sp;
  }

  // ---------- avatar (Joycelyn + pet) — stands on the island she is visiting ----------
  const av = { island: null, body: null, pet: null, bodyId: 'c-scientist', petId: null };
  function placeAvatar(id) {
    const isl = islands[id]; if (!isl || !isl.api.avatar) return;
    const { x, z, px, pz } = isl.api.avatar; const H = isl.kit.H;
    if (!av.body) { av.body = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(av.bodyId), transparent: true, alphaTest: .05 })); av.body.scale.setScalar(2.6); }
    isl.group.add(av.body); av.body.position.set(x, H(x, z) + 1.3, z);
    if (av.pet) { isl.group.add(av.pet); av.pet.position.set(px, H(px, pz) + .8, pz); }
    av.island = id;
  }

  // ---------- camera ----------
  let tween = null;
  function flyTo(pos, target, ms = 1100) { return new Promise((res) => { tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), ms, res }; }); }
  function mapView() {
    const ids = Object.keys(islands); if (!ids.length) return { pos: new THREE.Vector3(0, 160, 220), target: new THREE.Vector3() };
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    ids.forEach((id) => { const { at, radius = 26 } = islands[id].def; minX = Math.min(minX, at.x - radius); maxX = Math.max(maxX, at.x + radius); minZ = Math.min(minZ, at.z - radius); maxZ = Math.max(maxZ, at.z + radius); });
    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2, half = Math.max((maxX - minX) / 2, (maxZ - minZ) / 2 * 1.1);
    const aspect = camera.aspect || 1.4, fov = camera.fov * Math.PI / 180;
    const dist = Math.max(120, half * 1.18 / (Math.tan(fov / 2) * Math.min(aspect, 1.6)));
    return { pos: new THREE.Vector3(cx, dist * .66, cz + dist * .75), target: new THREE.Vector3(cx, 0, cz - 4) };
  }
  function setMode(islandId) {
    current = islandId;
    Object.values(islands).forEach((isl) => {
      const on = isl.def.id === islandId;
      isl.label.visible = !islandId;
      Object.values(isl.labels).forEach((l) => { l.visible = on; });
    });
    if (islandId) { scene.fog.near = 85; scene.fog.far = 230; controls.minDistance = 26; controls.maxDistance = 95; const c = islands[islandId].center; aimSun(c.x, c.z); }
    else { scene.fog.near = 320; scene.fog.far = 900; controls.minDistance = 60; controls.maxDistance = 520; const v = mapView(); aimSun(v.target.x, v.target.z, 130); }
  }

  // ---------- picking ----------
  const ray = new THREE.Raycaster(); const v2 = new THREE.Vector2(); let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || paused) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
    if (moved > 10) return;
    const r = canvas.getBoundingClientRect();
    v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v2, camera);
    const list = ray.intersectObjects(hits, false);
    for (const hit of list) {
      const u = hit.object.userData;
      if (current) {
        if (u.zone && u.island === current) { onPickZone && onPickZone(u.island, u.zone); return; }
        if (!u.zone && u.island !== current) { onPickIsland && onPickIsland(u.island); return; }
      } else if (!u.zone) { onPickIsland && onPickIsland(u.island); return; }
    }
  });

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
    const wp = water.geometry.attributes.position;
    for (let i = 0; i < wp.count; i++) { const x = wBase[i * 3], z = wBase[i * 3 + 2]; wp.setY(i, Math.sin(x * .18 + el * 1.3) * .22 + Math.cos(z * .21 + el * 1.1) * .22); }
    wp.needsUpdate = true; water.geometry.computeVertexNormals();
    Object.values(islands).forEach((isl) => {
      isl.kit._critters.forEach((c) => {
        const u = c.userData;
        if (u.fly) { const a = el * u.sp + u.ph; c.position.set(u.x + Math.cos(a) * u.r, u.base + Math.sin(el * 3 + u.ph) * .5, u.z + Math.sin(a) * u.r); }
        else c.position.y = u.base + Math.abs(Math.sin(el * 2.2 * u.sp + u.ph)) * .5;
      });
      isl.api.update && isl.api.update(el, dt);
      Object.values(isl.decor).forEach((d) => d.update && d.update(el, dt));
      Object.values(isl.labels).forEach((l) => { l.position.y = l.userData.y + Math.sin(el * 1.5 + l.userData.ph) * .25; });
      isl.label.position.y = isl.label.userData.baseY + Math.sin(el * 1.2 + isl.label.userData.ph) * .5;
      updateBosses(isl, el);
    });
    if (av.island && av.body) {
      const isl = islands[av.island], { x, z, px, pz } = isl.api.avatar, H = isl.kit.H;
      av.body.position.y = H(x, z) + 1.3 + Math.abs(Math.sin(el * 2.4)) * .35;
      if (av.pet) av.pet.position.y = H(px, pz) + .8 + Math.abs(Math.sin(el * 3 + 1)) * .45;
    }
    renderer.render(scene, camera);
  }
  frame();

  // ---------- zone bosses (spots come from the island builder) ----------
  function updateBosses(isl, t) {
    Object.entries(isl.bosses).forEach(([k, b]) => {
      const spot = isl.api.bosses[k];
      if (b.state === 'beaten') { b.sp.position.y = spot.y() - spot.s * .2 + Math.abs(Math.sin(t * 2 + 1)) * .3; return; }
      if (spot.move && b.state === 'open') spot.move(b.sp, t); else b.sp.position.y = spot.y() + (b.state === 'open' ? Math.abs(Math.sin(t * 3)) * .5 : Math.sin(t * .8) * .1);
      if (b.crown) b.crown.position.set(b.sp.position.x, b.sp.position.y + spot.s * .55, b.sp.position.z);
      if (b.zzz) { b.zzz.position.set(spot.x + 1.2, spot.y() + spot.s * .6 + (t * .6 % 1), spot.z); b.zzz.material.opacity = 1 - (t * .6 % 1); }
    });
  }

  const zoneWorldPos = (id, zid) => { const isl = islands[id], p = isl.api.zones[zid]; return new THREE.Vector3(isl.def.at.x + p.x, isl.kit.H(p.x, p.z), isl.def.at.z + p.z); };

  return {
    addIsland,
    islands: () => Object.keys(islands),
    addZone(id, zid, title, stars, max) {
      const isl = islands[id], p = isl.api.zones[zid]; if (!p) return;
      const sp = makeLabelSprite(title, starLine(stars, max));
      const y = p.y ?? isl.kit.H(p.x, p.z) + 7.5;
      sp.position.set(p.x, y, p.z); sp.userData.y = y; sp.userData.zone = zid; sp.visible = current === id;
      isl.group.add(sp); isl.labels[zid] = sp;
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(p.r || 6, p.r || 6, 14, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.set(p.x, 4, p.z); hit.userData = { island: id, zone: zid }; isl.group.add(hit); hits.unshift(hit);
      sp.userData.island = id; hits.unshift(sp);
    },
    updateZone(id, zid, stars, max, crown) { const l = islands[id]?.labels[zid]; if (!l) return; drawLabel(l.userData.cv, l.userData.title, starLine(stars, max), crown); l.userData.tex.needsUpdate = true; },
    updateIsland(id, line) { const l = islands[id]?.label; if (!l) return; drawLabel(l.userData.cv, l.userData.title, line, false); l.userData.tex.needsUpdate = true; },
    setDecor(list) {
      Object.values(islands).forEach((isl) => {
        list.forEach((id) => { if (isl.decor[id] || !isl.api.decor) return; const d = isl.api.decor(id); if (d) isl.decor[id] = d; });
        Object.keys(isl.decor).forEach((id) => { if (!list.includes(id)) { isl.decor[id].objs.forEach((o) => isl.group.remove(o)); delete isl.decor[id]; } });
      });
    },
    setAvatar(costume, pet) {
      if (!av.body) placeAvatar(av.island || Object.keys(islands)[0]);
      if (costume !== av.bodyId) { av.bodyId = costume; av.body.material.map = tex(costume); av.body.material.needsUpdate = true; }
      if (pet !== av.petId) {
        av.petId = pet;
        if (av.pet) { av.pet.parent && av.pet.parent.remove(av.pet); av.pet = null; }
        if (pet) { av.pet = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(pet), transparent: true, alphaTest: .05 })); av.pet.scale.setScalar(1.6); placeAvatar(av.island); }
      }
    },
    setBoss(id, zone, { art: artId, beaten, open }) {
      const isl = islands[id]; const spot = isl?.api.bosses?.[zone]; if (!spot) return;
      const state = beaten ? 'beaten' : open ? 'open' : 'sleep';
      let b = isl.bosses[zone];
      if (b && b.state === state) return;
      if (b) [b.sp, b.crown, b.zzz].forEach((o) => o && isl.group.remove(o));
      const k = isl.kit; b = { state };
      if (state === 'beaten') b.sp = k.sprite('trophy', spot.x, spot.y(), spot.z, 1.8);
      else {
        b.sp = k.sprite(artId, spot.x, spot.y(), spot.z, spot.s, { tint: spot.tint, opacity: state === 'sleep' ? .75 : 1 });
        if (spot.crown) b.crown = k.sprite('crown', spot.x, spot.y() + spot.s * .55, spot.z, 1.4);
        if (state === 'sleep') b.zzz = k.sprite('zzz', spot.x + 1.2, spot.y() + spot.s * .6, spot.z, 1.3);
      }
      isl.bosses[zone] = b;
    },
    // sea map: every island in view
    async showMap(ms = 1400) { setMode(null); controls.autoRotate = false; const v = mapView(); await flyTo(v.pos, v.target, ms); },
    // one island, slowly turning
    async overview(id, ms = 1300) {
      const isl = islands[id]; if (!isl) return;
      setMode(id); placeAvatar(id); controls.autoRotate = false;
      const c = isl.center, k = (isl.def.radius || 26) / 26;
      await flyTo(new THREE.Vector3(c.x, 40 * k, c.z + 58 * k), new THREE.Vector3(c.x, 2, c.z), ms);
      if (current === id) controls.autoRotate = true;
    },
    async focus(id, zid) {
      const isl = islands[id]; if (!isl || !isl.api.zones[zid]) return;
      if (current !== id) { setMode(id); placeAvatar(id); }
      controls.autoRotate = false;
      const p = isl.api.zones[zid], c = isl.center, wp = zoneWorldPos(id, zid);
      const dir = new THREE.Vector3(p.x, 0, p.z); if (dir.length() < 1) dir.set(0, 0, 1); dir.normalize();
      const dist = p.far ? 30 : 20;
      const target = new THREE.Vector3(wp.x, wp.y + (p.far ? 4 : 2), wp.z);
      const side = innerWidth > 760 ? new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(-6) : new THREE.Vector3();
      void c;
      await flyTo(target.clone().add(dir.clone().multiplyScalar(dist)).add(new THREE.Vector3(0, 13, 0)).add(side), target.clone().add(side.clone().multiplyScalar(.6)), 1000);
    },
    current: () => current,
    islandApi: (id) => islands[id]?.api || null,
    setPaused(b) { paused = b; if (!b) clock.getDelta(); },
    setAutoRotate(b) { controls.autoRotate = b; },
  };
}
