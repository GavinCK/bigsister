// =============================================================
//  Procedural music + SFX (Web Audio). No audio files needed.
// =============================================================
let ctx = null, master, musicBus, sfxBus, noiseBuf;
let musicOn = true, sfxOn = true;
let cur = null;            // currently playing song state
let tempoMul = 1, fever = false;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function initAudio() {
  if (ctx) { if (ctx.state !== 'running') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4;
  master = ctx.createGain(); master.gain.value = .9;
  musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? .34 : 0;
  sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? .75 : 0;
  musicBus.connect(master); sfxBus.connect(master); master.connect(comp); comp.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  // iOS unlock
  const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050); b.connect(ctx.destination); b.start(0);
  ctx.resume();
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
}

export function setMusic(on) { musicOn = on; if (musicBus) musicBus.gain.setTargetAtTime(on ? .34 : 0, ctx.currentTime, .05); }
export function setSfx(on) { sfxOn = on; if (sfxBus) sfxBus.gain.setTargetAtTime(on ? .75 : 0, ctx.currentTime, .05); }
export const audioState = () => ({ music: musicOn, sfx: sfxOn });

// ---------------- instruments ----------------
function env(g, t, a, peak, dur, r) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, .0002), t + a);
  g.gain.setValueAtTime(Math.max(peak, .0002), t + Math.max(a, dur));
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a, dur) + r);
}
function osc(type, f, t, dur, { vol = .2, a = .005, r = .12, cutoff = 0, q = 1, dest, slideTo = 0, slideT = 0, detune = 0, vib = 0 } = {}) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + (slideT || dur));
  let node = o;
  if (vib) {
    const l = ctx.createOscillator(); const lg = ctx.createGain(); l.frequency.value = 5.5; lg.gain.value = vib;
    l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + r + .05);
  }
  if (cutoff) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cutoff; fl.Q.value = q; node.connect(fl); node = fl; }
  const g = ctx.createGain(); env(g, t, a, vol, dur, r);
  node.connect(g); g.connect(dest || sfxBus);
  o.start(t); o.stop(t + dur + r + .05);
}
function noise(t, dur, { vol = .2, type = 'bandpass', freq = 1000, q = 1, a = .002, r = .05, dest, sweepTo = 0 } = {}) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  const g = ctx.createGain(); env(g, t, a, vol, dur, r);
  s.connect(f); f.connect(g); g.connect(dest || sfxBus);
  s.start(t, Math.random() * .5); s.stop(t + dur + r + .05);
}

const INST = {
  marimba(m, t, len, v = 1, dest) {
    const f = mtof(m);
    osc('sine', f, t, .02, { vol: .22 * v, a: .002, r: .35, dest });
    osc('sine', f * 4, t, .01, { vol: .05 * v, a: .001, r: .08, dest });
  },
  pluck(m, t, len, v = 1, dest) { osc('triangle', mtof(m), t, .03, { vol: .2 * v, r: .25, cutoff: 2600, dest }); },
  stab(m, t, len, v = 1, dest) { osc('square', mtof(m), t, .05, { vol: .06 * v, r: .12, cutoff: 1800, dest }); },
  bass(m, t, len, v = 1, dest) { osc('triangle', mtof(m), t, len * .9, { vol: .3 * v, a: .005, r: .06, cutoff: 900, dest }); },
  sqbass(m, t, len, v = 1, dest) { osc('square', mtof(m), t, len * .5, { vol: .09 * v, a: .003, r: .05, cutoff: 700, q: 4, dest }); },
  lead(m, t, len, v = 1, dest) { osc('square', mtof(m), t, len * .85, { vol: .06 * v, a: .01, r: .08, cutoff: 2400, vib: 4, dest }); },
  flute(m, t, len, v = 1, dest) { osc('sine', mtof(m), t, len * .9, { vol: .16 * v, a: .04, r: .12, vib: 5, dest }); osc('triangle', mtof(m) * 2, t, len * .9, { vol: .02 * v, a: .05, r: .1, dest }); },
  pad(m, t, len, v = 1, dest) {
    osc('sawtooth', mtof(m), t, len, { vol: .025 * v, a: .25, r: .4, cutoff: 1100, detune: -7, dest });
    osc('sawtooth', mtof(m), t, len, { vol: .025 * v, a: .25, r: .4, cutoff: 1100, detune: 7, dest });
  },
  bloop(m, t, len, v = 1, dest) { osc('sine', mtof(m) * .5, t, .08, { vol: .2 * v, slideTo: mtof(m), slideT: .05, r: .1, dest }); },
  kick(t, v = 1, dest) { osc('sine', 150, t, .12, { vol: .55 * v, a: .001, r: .18, slideTo: 42, slideT: .12, dest }); },
  snare(t, v = 1, dest) { noise(t, .08, { vol: .22 * v, freq: 1800, q: .8, r: .1, dest }); osc('triangle', 190, t, .03, { vol: .12 * v, r: .06, dest }); },
  clap(t, v = 1, dest) { for (let i = 0; i < 3; i++) noise(t + i * .012, .02, { vol: .14 * v, freq: 1400, q: 1.5, r: .04, dest }); noise(t + .036, .06, { vol: .14 * v, freq: 1400, q: 1.5, r: .12, dest }); },
  hat(t, v = 1, dest) { noise(t, .02, { vol: .07 * v, type: 'highpass', freq: 7500, r: .03, dest }); },
  shaker(t, v = 1, dest) { noise(t, .03, { vol: .06 * v, freq: 5200, q: 2, a: .01, r: .05, dest }); },
  bongo(f, t, v = 1, dest) { osc('sine', f * 1.5, t, .04, { vol: .25 * v, slideTo: f, slideT: .04, r: .12, dest }); },
  wood(f, t, v = 1, dest) { osc('sine', f, t, .01, { vol: .2 * v, r: .05, dest }); osc('square', f * 2.01, t, .005, { vol: .03 * v, r: .02, dest }); },
};

// ---------------- songs ----------------
const CH = { C: [60, 64, 67], Am: [57, 60, 64], F: [53, 57, 60], G: [55, 59, 62], Dm: [62, 65, 69], Bb: [58, 62, 65], Em: [64, 67, 71], D: [62, 66, 69], B: [59, 63, 66], E: [64, 68, 71], Am7: [57, 60, 64, 67], G7: [55, 59, 62, 65], Dm7: [62, 65, 69, 72], Cmaj: [60, 64, 67, 71] };

function chillSong({ bpm, key = 0, prog, melody, arpInst = 'marimba', perc = 'shaker' }) {
  return {
    bpm, swing: .12, bars: prog.length,
    step(bar, s, t, loop, d) {
      const ch = CH[prog[bar]].map((n) => n + key);
      const arpIdx = [0, 1, 2, 1, 0, 1, 2, 3];
      if (s % 2 === 0) { const i = arpIdx[(s / 2) % 8]; const n = i === 3 ? ch[0] + 12 : ch[i]; INST[arpInst](n + 12, t, d, .8, musicBus); }
      if (s === 0 || s === 8) INST.bass(ch[0] - 24, t, d * 5, 1, musicBus);
      if (s === 6 || s === 14) INST.bass(ch[2] - 24, t, d * 2, .8, musicBus);
      if (perc === 'shaker' && s % 2 === 0) INST.shaker(t, s % 4 === 2 ? 1 : .55, musicBus);
      if (perc === 'bongo') { if ([0, 3, 6, 10, 11, 14].includes(s)) INST.bongo(s % 2 ? 330 : 220, t, .7, musicBus); if (s % 2 === 0) INST.shaker(t, .5, musicBus); }
      if (s === 0) INST.kick(t, .45, musicBus);
      if (s === 0) INST.pad(ch[0], t, d * 15, .9, musicBus), INST.pad(ch[1], t, d * 15, .9, musicBus);
      if (melody && (loop % 4 === 1 || loop % 4 === 2)) {
        for (const [st, n, len] of melody) if (st === bar * 16 + s) INST.flute(n + key, t, len * d, 1, musicBus);
      }
    },
  };
}

const SONGS = {
  island: chillSong({
    bpm: 100, prog: ['C', 'Am', 'F', 'G'],
    melody: [[0, 76, 4], [4, 79, 2], [6, 81, 2], [8, 79, 4], [12, 76, 4], [16, 72, 4], [20, 74, 2], [22, 76, 2], [24, 74, 6], [32, 69, 2], [34, 72, 2], [36, 74, 4], [40, 72, 2], [42, 69, 2], [44, 67, 4], [48, 74, 4], [52, 76, 2], [54, 74, 2], [56, 71, 4], [60, 67, 4]],
  }),
  garden: chillSong({
    bpm: 94, key: 7, prog: ['C', 'Am', 'F', 'G'], arpInst: 'pluck',
    melody: [[0, 72, 6], [6, 74, 2], [8, 76, 8], [16, 72, 4], [20, 69, 4], [24, 67, 8], [32, 69, 4], [36, 72, 4], [40, 74, 8], [48, 76, 4], [52, 74, 4], [56, 71, 8]],
  }),
  jungle: chillSong({
    bpm: 108, key: -3, prog: ['C', 'C', 'Am', 'G'], perc: 'bongo',
    melody: [[0, 72, 2], [2, 74, 2], [4, 76, 4], [10, 79, 2], [12, 76, 4], [16, 74, 2], [18, 72, 2], [20, 69, 8], [32, 72, 2], [34, 76, 2], [36, 79, 4], [42, 81, 2], [44, 79, 4], [48, 76, 4], [52, 74, 4], [56, 72, 8]],
  }),
  arcade: {
    bpm: 128, swing: 0, bars: 4,
    step(bar, s, t, loop, d) {
      const prog = ['Dm', 'Bb', 'F', 'C']; const ch = CH[prog[bar]];
      const root = prog[bar] === 'F' ? 53 : prog[bar] === 'Bb' ? 58 : ch[0];
      if (s % 4 === 0) INST.kick(t, fever ? 1 : .85, musicBus);
      if (s === 4 || s === 12) INST.clap(t, .9, musicBus);
      INST.hat(t, s % 2 ? .9 : .4, musicBus);
      if (s % 2 === 0) INST.bass((s % 4 === 0 ? root - 24 : root - 12), t, d * 1.6, .9, musicBus);
      if ([2, 6, 10, 14].includes(s)) ch.forEach((n) => INST.stab(n + 12, t, d, 1, musicBus));
      const A = [[0, 74, 2], [2, 77, 2], [4, 76, 1], [5, 74, 1], [6, 72, 2], [8, 74, 4], [12, 69, 2], [14, 72, 2]];
      const B = [[0, 74, 2], [2, 77, 2], [4, 79, 2], [6, 81, 2], [8, 79, 2], [10, 77, 2], [12, 76, 4]];
      const C = [[0, 74, 2], [2, 77, 2], [4, 79, 2], [6, 77, 2], [8, 76, 2], [10, 74, 2], [12, 72, 4]];
      const mel = [A, B, A, C][bar];
      if (loop % 2 === 1 || fever) for (const [st, n, len] of mel) if (st === s) INST.lead(n, t, len * d, 1, musicBus);
    },
  },
  lab: {
    bpm: 116, swing: .16, bars: 2,
    step(bar, s, t, loop, d) {
      const ch = bar === 0 ? CH.Dm7 : CH.G7;
      const bl = bar === 0 ? [[0, 38], [3, 50], [6, 45], [8, 48], [10, 50], [13, 45]] : [[0, 43], [3, 55], [6, 50], [8, 53], [10, 55], [13, 50]];
      for (const [st, n] of bl) if (st === s) INST.sqbass(n, t, d * 2, 1, musicBus);
      if (s === 0 || s === 10) INST.kick(t, .6, musicBus);
      if (s === 4 || s === 12) INST.wood(s === 4 ? 1100 : 800, t, 1, musicBus);
      if (s % 2 === 1) INST.hat(t, .5, musicBus);
      if (s === 2 || s === 9) ch.slice(1).forEach((n) => INST.stab(n + 12, t, d, .8, musicBus));
      const mel = loop % 2 ? [[0, 74], [2, 77], [5, 81], [8, 79], [11, 77], [14, 74]] : [[0, 69], [3, 72], [6, 74], [10, 72], [12, 69]];
      for (const [st, n] of mel) if (st === s) INST.bloop(n + (bar ? 5 : 0), t, d, .7, musicBus);
    },
  },
  boss: {
    bpm: 150, swing: 0, bars: 4,
    step(bar, s, t, loop, d) {
      const prog = ['Em', 'C', 'D', 'B']; const ch = CH[prog[bar]];
      const root = { Em: 40, C: 36, D: 38, B: 35 }[prog[bar]];
      INST.sqbass(s % 4 === 2 ? root + 12 : root, t, d, 1.1, musicBus);
      if ([0, 6, 8, 14].includes(s)) INST.kick(t, 1, musicBus);
      if (s === 4 || s === 12) INST.snare(t, 1.1, musicBus);
      if (s % 2 === 0) INST.hat(t, .7, musicBus);
      if (s === 0 || s === 3 || s === 6) { INST.stab(ch[0], t, d * 2, 1.6, musicBus); INST.stab(ch[0] + 7, t, d * 2, 1.3, musicBus); }
      const mel = [[[0, 76, 4], [4, 79, 2], [6, 78, 2], [8, 76, 4], [12, 71, 4]], [[0, 72, 4], [4, 76, 4], [8, 79, 6], [14, 78, 2]], [[0, 74, 4], [4, 78, 2], [6, 81, 2], [8, 79, 4], [12, 78, 4]], [[0, 75, 6], [6, 78, 2], [8, 83, 8]]][bar];
      if (loop % 2 === 1) for (const [st, n, len] of mel) if (st === s) INST.lead(n, t, len * d, 1.2, musicBus);
    },
  },
};

let schedTimer = null;
export function playMusic(name) {
  if (!ctx) return;
  if (cur && cur.name === name) return;
  stopMusic();
  const song = SONGS[name]; if (!song) return;
  cur = { name, song, bar: 0, step: 0, loop: 0, next: ctx.currentTime + .08 };
  schedTimer = setInterval(scheduler, 25);
}
export function stopMusic() { if (schedTimer) clearInterval(schedTimer); schedTimer = null; cur = null; fever = false; tempoMul = 1; }
export function setFever(on) { fever = on; tempoMul = on ? 1.1 : 1; }
function scheduler() {
  if (!cur || !ctx) return;
  const { song } = cur;
  const d = 60 / (song.bpm * tempoMul) / 4;
  while (cur.next < ctx.currentTime + .14) {
    const sw = cur.step % 2 ? d * (song.swing || 0) : 0;
    try { song.step(cur.bar, cur.step, cur.next + sw, cur.loop, d); } catch (e) { /* keep going */ }
    cur.next += d; cur.step++;
    if (cur.step >= 16) { cur.step = 0; cur.bar++; if (cur.bar >= song.bars) { cur.bar = 0; cur.loop++; } }
  }
}

// ---------------- SFX ----------------
const now = () => ctx.currentTime + .005;
export const sfx = {
  tap() { if (!ctx) return; osc('triangle', 880, now(), .02, { vol: .12, r: .06 }); },
  good(n = 0) {
    if (!ctx) return; const t = now(); const b = 72 + Math.min(n, 12);
    [0, 4, 7, 12].forEach((iv, i) => osc('triangle', mtof(b + iv), t + i * .055, .04, { vol: .2, r: .18 }));
    osc('sine', mtof(b + 24), t + .2, .02, { vol: .08, r: .3 });
  },
  bad() { if (!ctx) return; const t = now(); osc('square', 260, t, .18, { vol: .12, slideTo: 110, cutoff: 1200, r: .1 }); noise(t, .1, { vol: .15, type: 'lowpass', freq: 400, r: .1 }); },
  pop() { if (!ctx) return; osc('sine', 500, now(), .05, { vol: .25, slideTo: 1200, slideT: .05, r: .05 }); },
  whoosh() { if (!ctx) return; noise(now(), .25, { vol: .18, freq: 400, sweepTo: 3000, q: 1.2, a: .05, r: .1 }); },
  splash() { if (!ctx) return; noise(now(), .3, { vol: .25, type: 'lowpass', freq: 2200, sweepTo: 300, r: .3 }); },
  thunder() { if (!ctx) return; noise(now(), .9, { vol: .45, type: 'lowpass', freq: 220, q: .5, a: .03, r: .9 }); },
  zap() { if (!ctx) return; const t = now(); osc('sawtooth', 1800, t, .25, { vol: .08, slideTo: 80, cutoff: 3000, r: .1 }); noise(t, .25, { vol: .1, freq: 3000, q: 3, r: .1 }); },
  bubble() { if (!ctx) return; osc('sine', 300, now(), .12, { vol: .2, slideTo: 900, r: .05 }); },
  star() { if (!ctx) return; const t = now(); [84, 88, 91, 96].forEach((m, i) => osc('triangle', mtof(m), t + i * .07, .03, { vol: .14, r: .3 })); },
  coin() { if (!ctx) return; const t = now(); osc('square', mtof(83), t, .06, { vol: .07, r: .02 }); osc('square', mtof(88), t + .07, .12, { vol: .07, r: .15 }); },
  munch() { if (!ctx) return; const t = now(); for (let i = 0; i < 3; i++) noise(t + i * .1, .05, { vol: .25, freq: 700 + i * 120, q: 2, r: .04 }); },
  ouch() { if (!ctx) return; osc('square', 700, now(), .2, { vol: .09, slideTo: 200, cutoff: 1800, r: .08 }); },
  boing() { if (!ctx) return; osc('sine', 180, now(), .3, { vol: .25, slideTo: 520, slideT: .12, r: .1, vib: 30 }); },
  freeze() { if (!ctx) return; const t = now(); [96, 100, 103, 108].forEach((m, i) => osc('sine', mtof(m), t + i * .04, .05, { vol: .06, r: .4 })); },
  drop() { if (!ctx) return; osc('sine', 900, now(), .2, { vol: .2, slideTo: 200, r: .05 }); },
  tick() { if (!ctx) return; INST.wood(1500, now(), .5); },
  lever() { if (!ctx) return; const t = now(); noise(t, .12, { vol: .2, freq: 900, q: 4 }); osc('square', 90, t + .1, .1, { vol: .1, r: .1 }); },
  hum() { if (!ctx) return; const t = now(); osc('sawtooth', 70, t, 1.1, { vol: .06, a: .2, r: .3, cutoff: 500, vib: 6 }); osc('sawtooth', 140, t, 1.1, { vol: .03, a: .3, r: .3, cutoff: 900 }); },
  grow() { if (!ctx) return; const t = now(); [60, 64, 67, 72, 76, 79].forEach((m, i) => INST.marimba(m + 12, t + i * .08, .1, 1.1, sfxBus)); },
  wilt() { if (!ctx) return; osc('triangle', 400, now(), .6, { vol: .15, slideTo: 120, r: .2, vib: 10 }); },
  laser() { if (!ctx) return; osc('square', 1400, now(), .15, { vol: .06, slideTo: 300, cutoff: 3000, r: .05 }); },
  boom() { if (!ctx) return; const t = now(); noise(t, .5, { vol: .4, type: 'lowpass', freq: 800, sweepTo: 80, r: .4 }); osc('sine', 120, t, .3, { vol: .4, slideTo: 40, r: .2 }); },
  win() {
    if (!ctx) return; const t = now();
    [[72, 0], [76, .12], [79, .24], [84, .36]].forEach(([m, dt]) => osc('square', mtof(m), t + dt, .1, { vol: .08, cutoff: 3000, r: .1 }));
    [72, 76, 79, 84].forEach((m) => osc('triangle', mtof(m), t + .5, .5, { vol: .1, r: .6 }));
    INST.kick(t + .5, .6, sfxBus);
  },
  lose() { if (!ctx) return; const t = now(); [67, 66, 65, 64].forEach((m, i) => osc('triangle', mtof(m), t + i * .22, .18, { vol: .15, r: .2, vib: i === 3 ? 8 : 0 })); },
  fanfare() {
    if (!ctx) return; const t = now();
    [[67, 0, .12], [67, .14, .12], [67, .28, .12], [72, .42, .5], [76, .95, .15], [79, 1.12, .7]].forEach(([m, dt, len]) => { osc('square', mtof(m), t + dt, len, { vol: .07, cutoff: 3500, r: .1 }); osc('triangle', mtof(m - 12), t + dt, len, { vol: .1, r: .1 }); });
  },
};
