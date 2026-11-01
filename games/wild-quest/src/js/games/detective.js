// GAME · Flowchart Detective — steer through the school's classification flowchart
import { GROUPS, GROUP_ATTR, CREATURES, DETECTIVE_CASES, FLOW_NODES } from '../data.js';
import { h, sample } from '../ui.js';
import { art, creatureArt } from '../art.js';
import { burstAt, floatAt, shake } from '../fx.js';

export const HEARTS = 5;

// board layout (percent coordinates)
const POS = {
  backbone: [38, 9], warm: [38, 33], eggs: [38, 58], scales: [64, 33], dry: [64, 58],
  insects: [64, 9], amphibians: [89, 33], mammals: [13, 58], birds: [38, 84], fish: [89, 58], reptiles: [64, 84],
};
const LETTER = { insects: 'A', amphibians: 'B', mammals: 'C', birds: 'D', reptiles: 'E', fish: 'F' };
const EDGES = [['backbone', 'insects', 'No'], ['backbone', 'warm', 'Yes'], ['warm', 'scales', 'No'], ['warm', 'eggs', 'Yes'], ['eggs', 'birds', 'Yes'], ['eggs', 'mammals', 'No'], ['scales', 'amphibians', 'No'], ['scales', 'dry', 'Yes'], ['dry', 'reptiles', 'Yes'], ['dry', 'fish', 'No']];

export default async function play(api) {
  api.music('lab');
  await api.intro({
    title: 'Flowchart Detective', artId: 'detective',
    how: [['memo', 'Read the 3 clues about the mystery animal'], ['joystick', 'Answer YES or NO at each box of the flowchart'], ['magnifier', 'Reach the right letter to unmask it']],
    learn: 'This is the same flowchart as your Science Task 1: backbone → warm-blooded → lay eggs / scales → dry skin.',
  });

  let hearts = api.hearts(HEARTS), score = 0, correct = 0, total = 0;
  const revealed = new Set();
  api.frame.setHearts(hearts);

  // --- layout ---
  const box = h('div', { class: 'det-box' });
  const clues = h('div', { class: 'det-clues' });
  const board = h('div', { class: 'det-board' });
  const qText = h('div', { class: 'det-q' });
  const yesBtn = h('button', { class: 'btn go det-yes' }, 'YES');
  const noBtn = h('button', { class: 'btn hot det-no' }, 'NO');
  const hintBtn = h('button', { class: 'btn small ghost' }, art('bulb', { size: 30 }), 'Hint');
  const wrap = h('div', { class: 'det' },
    h('div', { class: 'det-left' }, box, clues),
    h('div', { class: 'det-right' }, board, h('div', { class: 'det-controls' }, qText, h('div', { class: 'det-btns' }, noBtn, yesBtn, hintBtn))));
  api.body.append(wrap);

  // draw board
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.classList.add('det-lines');
  const edgeEls = {};
  EDGES.forEach(([a, b, lab]) => {
    const [x1, y1] = POS[a], [x2, y2] = POS[b];
    const l = document.createElementNS(svgNS, 'line'); l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2); l.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.append(l); edgeEls[`${a}-${b}`] = l;
  });
  board.append(svg);
  EDGES.forEach(([a, b, lab]) => {
    const [x1, y1] = POS[a], [x2, y2] = POS[b];
    board.append(h('div', { class: `det-elabel ${lab === 'Yes' ? 'y' : 'n'}`, style: { left: `${(x1 + x2) / 2}%`, top: `${(y1 + y2) / 2}%` } }, lab));
  });
  const nodeEls = {};
  Object.entries(POS).forEach(([id, [x, y]]) => {
    const isQ = !!FLOW_NODES[id];
    const el = h('div', { class: `det-node ${isQ ? 'q' : 'leaf'}`, style: { left: `${x}%`, top: `${y}%` } }, isQ ? FLOW_NODES[id].q : h('span', { class: 'lt' }, LETTER[id]));
    nodeEls[id] = el; board.append(el);
  });
  const token = h('div', { class: 'det-token' }, art('detective'));
  board.append(token);
  function moveToken(id, instant) {
    const [x, y] = POS[id];
    token.style.transition = instant ? 'none' : 'left .45s ease, top .45s ease';
    token.style.left = `${x}%`; token.style.top = `${y}%`;
  }
  function revealLeaf(g) {
    revealed.add(g);
    const el = nodeEls[g]; el.innerHTML = '';
    el.append(h('span', { class: 'lt' }, LETTER[g]), h('span', { class: 'gn' }, GROUPS[g].name));
    el.style.setProperty('--gc', GROUPS[g].color); el.classList.add('open');
  }

  const cases = sample(DETECTIVE_CASES, 6);
  for (let k = 0; k < cases.length && hearts > 0; k++) {
    const cs = cases[k]; const c = CREATURES[cs.id]; const attrs = GROUP_ATTR[c.group];
    api.frame.setProgress(k / cases.length);
    box.innerHTML = ''; const sil = creatureArt(cs.id, { cls: 'det-sil', sticker: false }); box.append(h('div', { class: 'det-curtain' }), sil, h('div', { class: 'det-case' }, `Case ${k + 1}`));
    clues.innerHTML = ''; cs.clues.forEach((t, i) => { const cl = h('div', { class: 'det-clue' }, art('magnifier', { size: 34 }), t); clues.append(cl); cl.animate([{ opacity: 0, transform: 'translateX(-30px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: i * 250, fill: 'backwards' }); });
    Object.values(edgeEls).forEach((e) => e.classList.remove('on', 'bad'));
    Object.values(nodeEls).forEach((e) => e.classList.remove('cur', 'done'));
    let node = 'backbone'; moveToken(node, true);
    let wrongs = 0, hinted = false;
    while (FLOW_NODES[node] && hearts > 0) {
      const fn = FLOW_NODES[node];
      nodeEls[node].classList.add('cur'); qText.textContent = fn.q;
      const ans = await choose();
      const truth = attrs[fn.attr] ? 'yes' : 'no';
      if (ans === 'hint') { hinted = true; api.toast(fn.hint, { artId: 'bulb', ms: 3000 }); continue; }
      total++;
      if (ans === truth) {
        correct++; api.sfx.pop();
        const nxt = truth === 'yes' ? fn.yes : fn.no;
        edgeEls[`${node}-${nxt}`].classList.add('on');
        nodeEls[node].classList.remove('cur'); nodeEls[node].classList.add('done');
        node = nxt; moveToken(node);
        await api.wait(480);
      } else {
        wrongs++; hearts = api.loseHeart(hearts); api.sfx.bad(); shake(nodeEls[node]);
        const wrongNext = ans === 'yes' ? fn.yes : fn.no;
        const e = edgeEls[`${node}-${wrongNext}`]; e.classList.add('bad'); setTimeout(() => e.classList.remove('bad'), 1200);
        api.toast(h('span', {}, h('b', {}, `Trapdoor! `), `${c.name}: the answer is ${truth.toUpperCase()}. ${fn.hint}`), { kind: 'bad', ms: 3200 });
        api.miss({ key: `det:${cs.id}:${node}`, q: `${c.name} — ${fn.q}`, you: ans.toUpperCase(), ans: truth.toUpperCase(), why: fn.hint });
        await api.wait(1200);
      }
    }
    if (hearts <= 0) break;
    // reached a leaf
    const g = node; nodeEls[g].classList.add('cur');
    revealLeaf(g);
    box.querySelector('.det-curtain').classList.add('open'); sil.classList.add('show');
    api.sfx.win(); burstAt(sil, { n: 26 });
    const pts = Math.max(60, 250 - wrongs * 70 - (hinted ? 40 : 0)); score += pts; api.frame.setScore(score); floatAt(sil, `+${pts}`);
    api.learn(cs.id);
    qText.innerHTML = ''; qText.append(h('b', {}, `${LETTER[g]} = ${GROUPS[g].name}! `), `It's a ${c.name}.`);
    await api.wait(2200);
    nodeEls[g].classList.remove('cur');
  }

  // exam-style finale
  if (hearts > 0) {
    api.frame.setProgress(1);
    const q1 = await api.ask({ prompt: 'In the flowchart, what do C (mammals) and D (birds) have in common?', artId: 'thinking',
      options: [{ id: 'warm', text: 'They are warm-blooded' }, { id: 'eggs', text: 'They lay eggs' }, { id: 'scales', text: 'They have scales' }, { id: 'gills', text: 'They breathe with gills' }],
      correct: 'warm', explain: 'Both come from the YES branch of "Is it warm-blooded?". Only birds lay eggs.' });
    total++; if (q1.ok) { correct++; score += 200; } else api.miss({ key: 'det:CD', q: 'Common characteristic of mammals (C) and birds (D)?', you: q1.choice, ans: 'They are warm-blooded', why: 'Birds and mammals are the only warm-blooded groups.' });
    const q2 = await api.ask({ prompt: 'Which letter stands for animals with no scales and no warm blood?', artId: 'frog',
      options: [{ id: 'B', text: 'B — amphibians' }, { id: 'C', text: 'C — mammals' }, { id: 'F', text: 'F — fish' }, { id: 'E', text: 'E — reptiles' }],
      correct: 'B', explain: 'Cold-blooded + no scales = amphibians (B).' });
    total++; if (q2.ok) { correct++; score += 200; } else api.miss({ key: 'det:B', q: 'Cold-blooded, no scales: which group?', you: q2.choice, ans: 'B — amphibians', why: 'Amphibians have moist skin and no scales.' });
    api.frame.setScore(score);
  }
  api.finish({ score: score + hearts * 80, correct, total, won: hearts > 0 });

  function choose() {
    return new Promise((res) => {
      const done = (v) => { yesBtn.onclick = noBtn.onclick = hintBtn.onclick = null; res(v); };
      yesBtn.onclick = () => done('yes'); noBtn.onclick = () => done('no'); hintBtn.onclick = () => done('hint');
    });
  }
}
