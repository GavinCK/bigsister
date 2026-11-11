// Particles, confetti, floating text, screen shake
const cv = document.getElementById('fx');
const g = cv.getContext('2d');
let parts = [];
let running = false;
const COLORS = ['#FFB627', '#FF5D73', '#2EB872', '#7A5CFA', '#8ED8F8', '#FFFFFF'];

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize); resize();

function loop() {
  g.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) {
    p.life -= 1; p.vy += p.grav; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    const a = Math.min(1, p.life / 20);
    g.save(); g.globalAlpha = a; g.translate(p.x, p.y); g.rotate(p.rot);
    if (p.kind === 'confetti') { g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
    else if (p.kind === 'star') { g.fillStyle = p.c; star(p.s); }
    else if (p.kind === 'ring') { g.strokeStyle = p.c; g.lineWidth = 4 * a; g.beginPath(); g.arc(0, 0, p.s + (40 - p.life) * 3, 0, 7); g.stroke(); }
    else { g.fillStyle = p.c; g.beginPath(); g.arc(0, 0, p.s, 0, 7); g.fill(); }
    g.restore();
  }
  if (parts.length) requestAnimationFrame(loop); else { running = false; g.clearRect(0, 0, innerWidth, innerHeight); }
}
function star(r) { g.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .45 : r; const a = i * Math.PI / 5 - Math.PI / 2; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); }
function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }

export function burst(x, y, { n = 18, colors = COLORS, kind = 'dot', speed = 7, grav = .25 } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) n = Math.min(n, 6);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = speed * (.4 + Math.random() * .8);
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, grav, drag: .97, life: 40 + Math.random() * 25, s: 4 + Math.random() * 6, c: colors[i % colors.length], rot: Math.random() * 6, vr: (Math.random() - .5) * .3, kind });
  }
  parts.push({ x, y, vx: 0, vy: 0, grav: 0, drag: 1, life: 40, s: 10, c: colors[0], rot: 0, vr: 0, kind: 'ring' });
  kick();
}
export function confetti(n = 120) {
  for (let i = 0; i < n; i++) {
    parts.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .5, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 3, grav: .05, drag: .995, life: 160 + Math.random() * 80, s: 8 + Math.random() * 8, c: COLORS[i % COLORS.length], rot: Math.random() * 6, vr: (Math.random() - .5) * .25, kind: Math.random() < .2 ? 'star' : 'confetti' });
  }
  kick();
}
export function burstAt(el, opts) { const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, opts); }

export function floatText(x, y, text, color = '#fff', parent = document.getElementById('overlay')) {
  const d = document.createElement('div');
  d.className = 'floattext'; d.textContent = text; d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.color = color;
  parent.appendChild(d);
  d.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-90%) scale(1.15)', opacity: 1, offset: .25 }, { transform: 'translate(-50%,-190%) scale(1)', opacity: 0 }], { duration: 1000, easing: 'ease-out' }).onfinish = () => d.remove();
}
export function floatAt(el, text, color) { const r = el.getBoundingClientRect(); floatText(r.left + r.width / 2, r.top + r.height * .3, text, color); }

export function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
