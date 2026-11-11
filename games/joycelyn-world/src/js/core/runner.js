// =============================================================
//  Game runner — launches any island's game inside the shared game frame,
//  gives it the `api` toolkit, and pays out stars when it finishes.
//  Two ways to finish:
//    api.finish(res)   → the standard results card (stars, pouch, Star Road, next game)
//    api.complete(res) → record + pay only; the game shows its own results (used by Maths Island)
// =============================================================
import { h, gameFrame, modal, intro as introModal, toast as toastFn, ask as askFn } from './ui.js';
import { art, creatureArt } from './art.js';
import { initAudio, playMusic, sfx, setFever, setIntensity, setDanger } from './audio.js';
import { store } from './store.js';
import { confetti, burstAt } from './fx.js';
import { openRoad, openGift, powerTray, claimableRoad, nextRoad } from './economy.js';
import { BOSS_PRIZES, ALL_ITEMS } from './items.js';

// env: { stage, overlay, world, find(modeId) -> { m, pack, z }, bossOpen(pack, z), onQuit(), ectx() }
export function createRunner(env) {
  const { stage, overlay } = env;
  let busy = false;

  async function launch(modeId, opts = {}) {
    const found = env.find(modeId); if (!found || busy) return;
    const { m, pack, z } = found;
    busy = true;
    initAudio(); sfx.pop();
    env.beforeLaunch && env.beforeLaunch();
    let mod;
    try { mod = await pack.mods[m.mod](); } catch (e) { console.error(e); busy = false; env.onQuit(m, pack); return; }
    env.world && env.world.setPaused(true);
    stage.querySelectorAll('.game').forEach((g) => g.remove());
    setDanger(false); setIntensity(0);

    const misses = []; const newCards = [];
    const api = { alive: true, mode: m, pack, opts, sfx, slow: 1, power: {} };
    const frame = gameFrame({ title: m.title, hearts: 0, score: mod.SCORE !== false, progress: mod.PROGRESS !== false, bg: mod.BG || '', onExit: () => { sfx.tap(); quit(); } });
    stage.append(frame.root);
    let maxHearts = 0, shield = false, lastIntensity = 0;
    Object.assign(api, {
      frame, body: frame.body, root: frame.root,
      music: (n) => playMusic(n), fever: setFever,
      intensity(n) { if (n !== lastIntensity) { lastIntensity = n; setIntensity(n); } },
      wait: (ms) => new Promise((r) => setTimeout(() => api.alive && r(), ms)),
      loop(fn) { let last = performance.now(); const step = (t) => { if (!api.alive) return; const dt = Math.min((t - last) / 1000, .05); last = t; if (fn(dt, t) !== false) requestAnimationFrame(step); }; requestAnimationFrame(step); },
      learn(id) { if (!id || (pack.isCard && !pack.isCard(id))) return; if (store.unlock(id)) newCards.push(id); },
      miss(x) { misses.push(x); store.mistake({ pack: pack.id, ...x, game: x.game || m.title }); },
      toast: (t, o) => toastFn(frame.root, t, o),
      hearts(n) { maxHearts = n + (api.power.heart ? 1 : 0); frame.setHearts(maxHearts, maxHearts); return maxHearts; },
      loseHeart(cur) {
        if (shield) { shield = false; toastFn(frame.root, 'Lucky shield! No heart lost.', { artId: 'shield', ms: 1500 }); sfx.dodge(); return cur; }
        const n = Math.max(0, cur - 1); frame.setHearts(n, maxHearts); setDanger(n === 1 && maxHearts > 1); return n;
      },
      intro: (o) => new Promise((r) => {
        const tray = powerTray({ hearts: !!mod.HEARTS, timed: !!mod.TIMED }, { sfx });
        introModal(frame.root, { ...o, extra: tray.el }).then(() => {
          api.power = tray.take(); api.slow = api.power.slow ? 1.25 : 1; shield = !!api.power.shield;
          const on = Object.keys(api.power).map((k) => ({ heart: 'Extra heart', slow: 'Slow-mo', shield: 'Lucky shield', clover: 'Lucky clover' }[k]));
          if (on.length) toastFn(frame.root, `Power-up on: ${on.join(', ')}`, { artId: 'zap', ms: 1800 });
          api.alive && r();
        });
      }),
      ask: (o) => new Promise((r) => askFn(frame.root, { sfx, ...o }).then((v) => api.alive && r(v))),
      finish: (res) => finish(res),
      complete: (res) => complete(res),
      exit: () => quit(),
      relaunch: (o) => { api.alive = false; calm(); frame.root.remove(); busy = false; launch(m.id, o || opts); },
      switchTo: (id, o) => { api.alive = false; calm(); frame.root.remove(); busy = false; launch(id, o || {}); },
      openGift: (item, o = {}) => openGift(frame.root, { item }, env.ectx(), { title: 'Boss prize!', ...o }),
      openRoad: () => { quit(); openRoad(overlay, env.ectx()); },
    });
    busy = false;

    function calm() { setFever(false); setIntensity(0); setDanger(false); }
    function quit() {
      api.alive = false; calm();
      frame.root.remove();
      env.world && env.world.setPaused(false);
      playMusic(pack.music || 'island');
      env.onQuit(m, pack);
    }

    // record the result and pay stars into the pouch; returns what happened (no UI)
    function complete({ stars: st = 0, score = 0, won = true, recordAs = m.id } = {}) {
      const prevBest = store.stars(recordAs);
      store.record(recordAs, st, score);
      const firstBossWin = !!(m.reward && won && store.bossWins(m.reward) === 0);
      let earned = st; if (api.power.clover && st === 3) earned *= 2;
      const bossBonus = m.reward && won ? (firstBossWin ? 5 : 2) : 0;
      const roadBefore = claimableRoad();
      store.earn(earned + bossBonus);
      if (m.reward && won) store.bossWin(m.reward);
      store.markDay();
      return { stars: st, earned, bossBonus, pouch: store.pouch(), prevBest, newBest: st > prevBest && prevBest > 0, newGifts: claimableRoad() > roadBefore, nextRoad: nextRoad(), lifetime: store.lifetime(), firstBossWin, prize: firstBossWin ? ALL_ITEMS[BOSS_PRIZES[m.reward]] || null : null, newCards: newCards.slice() };
    }

    function finish({ score = 0, correct = 0, total = 0, stars = null, won = true, headline } = {}) {
      if (!api.alive) return;
      calm();
      const acc = total ? correct / total : 0;
      const st = stars ?? (won ? (acc >= .9 ? 3 : acc >= .7 ? 2 : 1) : (acc >= .6 ? 1 : 0));
      const r = complete({ stars: st, score, won });
      playMusic(st >= 2 ? 'victory' : (pack.music || 'island'));
      const starEls = [0, 1, 2].map(() => art('star'));
      const title = headline || (st === 3 ? 'Brilliant!' : st === 2 ? 'Great job!' : st === 1 ? 'Nice try!' : 'Keep training!');
      const next = (() => { const i = z.modes.findIndex((x) => x.id === m.id); if (i >= 0 && z.modes[i + 1]) return z.modes[i + 1]; if (i >= 0 && z.boss && env.bossOpen(pack, z) && !store.bossWins(z.boss.reward || z.id)) return z.boss; return null; })();
      const nr = r.nextRoad;
      const md = modal(frame.root,
        h('div', { class: 'bigstars' }, starEls),
        h('h2', {}, title),
        h('div', { class: 'result-score' }, `Score ${score}`),
        total ? h('p', {}, `${correct} of ${total} correct`) : null,
        r.newBest ? h('p', { class: 'learnline' }, 'New best!') : null,
        r.earned + r.bossBonus > 0 ? h('div', { class: 'pouch-gain' }, art('star', { size: 34 }), h('b', {}, `+${r.earned + r.bossBonus}`), h('span', {}, ` to your pouch${api.power.clover && st === 3 ? ' (clover doubled it!)' : ''}${r.bossBonus ? ` · boss bonus +${r.bossBonus}` : ''} · you have ${store.pouch()}`)) : null,
        r.newGifts ? h('p', { class: 'gift-line' }, art('gift', { size: 30 }), 'A Star Road gift is waiting for you!') : nr ? h('p', { class: 'learnline' }, `Star Road: ${nr.at - store.lifetime()} more stars to the next gift.`) : null,
        newCards.length ? h('div', {}, h('p', { style: { fontWeight: 700, marginTop: '10px' } }, `New Field Guide cards: ${newCards.length}`), h('div', { style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px' } }, newCards.slice(0, 12).map((id) => creatureArt(id, { size: 56 })))) : null,
        misses.length ? h('div', { class: 'review' }, h('b', {}, 'Remember:'), misses.slice(0, 4).map((x) => h('div', { class: 'ri' }, h('div', {}, x.q), h('div', {}, h('b', {}, '✔ '), x.ans)))) : null,
        h('div', { class: 'actions' },
          h('button', { class: 'btn ghost', onclick: () => { md.close(); quit(); } }, 'Island'),
          h('button', { class: 'btn', onclick: () => { md.close(); api.relaunch(); } }, m.isBoss && !won ? 'Try again' : 'Play again'),
          r.newGifts ? h('button', { class: 'btn hot', onclick: () => { md.close(); api.openRoad(); } }, 'Open gift') : null,
          next ? h('button', { class: `btn go ${next.isBoss ? 'bossy' : ''}`, onclick: () => { md.close(); api.alive = false; frame.root.remove(); launch(next.id); } }, next.isBoss ? `Fight ${next.title}!` : `Next: ${next.title}`) : null));
      st >= 2 ? sfx.win() : sfx.lose();
      if (st >= 2) confetti(st === 3 ? 160 : 70);
      starEls.forEach((s, i) => { if (i < st) setTimeout(() => { s.classList.add('on'); sfx.star(); burstAt(s, { n: 14, kind: 'star', colors: ['#FFB627', '#FFE066', '#FFFFFF'] }); }, 450 + i * 380); });
      if (r.firstBossWin) setTimeout(() => { if (api.alive) openGift(frame.root, { item: BOSS_PRIZES[m.reward] }, env.ectx(), { title: 'Boss prize!', sub: `${m.title} dropped a gift.` }); }, 1700);
    }

    try { await mod.default(api); } catch (e) { console.error(e); api.toast('Something went wrong in this game. Tap the map to go back.', { kind: 'bad', ms: 0 }); }
  }
  return { launch, get busy() { return busy; } };
}
