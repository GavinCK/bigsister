// GAME · Animal Airlift — drop animals and climate crates into the right habitat
import { CREATURES, BIOMES, BIOME_ORDER, AIRLIFT_ANIMALS, AIRLIFT_FACTS } from '../data.js';
import { makeArena, runItems, banner } from './faller.js';
import { sample, shuffle, h } from '../ui.js';
import { art } from '../art.js';

export const TIMED = true;
export const HEARTS = 5;

function biomeDoor(id) {
  const b = BIOMES[id];
  return h('div', { class: `biome-door bd-${id}` }, art(b.icon));
}

export default async function play(api) {
  api.music('arcade');
  await api.intro({
    title: 'Animal Airlift', artId: 'balloon',
    how: [['balloon', 'Lost animals parachute down'], ['nationalpark', 'Tap the habitat they live in'], ['memo', 'Weather crates fall too — match the climate!']],
    learn: 'Different animals live in different natural environments: climate, water and food decide who survives where.',
  });
  const bins = BIOME_ORDER.map((id) => ({ id, label: BIOMES[id].name, artEl: biomeDoor(id), color: BIOMES[id].color }));
  const arena = makeArena(api, { bins, sky: 'sky-balloon' });
  const state = { score: 0, hearts: api.hearts(HEARTS), combo: 0, maxCombo: 0, correct: 0, total: 0, goal: 20 };
  api.frame.setHearts(state.hearts);

  const animals = sample(AIRLIFT_ANIMALS, 12).map((id) => {
    const c = CREATURES[id];
    return { key: id, cid: id, label: c.name, answer: c.biome, learn: id, chute: true, why: `${c.name} lives in the ${BIOMES[c.biome].name.toLowerCase()}. ${c.fact}`, q: `Where does the ${c.name.toLowerCase()} live?` };
  });
  const facts = sample(AIRLIFT_FACTS, 8).map(([text, biome]) => ({ key: `fact-${text}`, text, kind: 'crate', icon: 'thermometer', answer: biome, label: `"${text}"`, why: `That describes the ${BIOMES[biome].name.toLowerCase()}.`, q: `"${text}" — which habitat?` }));

  await banner(api, 'Drop 1 · Lost animals');
  await runItems(api, arena, animals.slice(0, 8), state, { fallTime: 7.5 });
  if (state.hearts > 0) {
    await banner(api, 'Drop 2 · Weather crates', 'Read the climate clue!');
    await runItems(api, arena, facts.slice(0, 6), state, { fallTime: 9.5 });
  }
  if (state.hearts > 0) {
    await banner(api, 'Drop 3 · Mixed rush!');
    await runItems(api, arena, shuffle([...animals.slice(8), ...facts.slice(6)]), state, { fallTime: 6.5, speed: 1.15 });
  }
  // finale question: which habitats have more kinds of animals?
  if (state.hearts > 0) {
    const r = await api.ask({ prompt: 'Which two habitats have MORE kinds of animals?', artId: 'thinking',
      options: [{ id: 'a', text: 'Rainforest + grassland', art: 'nationalpark' }, { id: 'b', text: 'Desert + polar region', art: 'snowmountain' }, { id: 'c', text: 'Desert + rainforest', art: 'desert' }, { id: 'd', text: 'Polar region + grassland', art: 'ice' }],
      correct: 'a', explain: 'Warm, wet places with plenty of food (tropical rainforests and grasslands) support more kinds of animals. Deserts and polar regions are extreme.' });
    state.total++; if (r.ok) { state.correct++; state.score += 300; api.frame.setScore(state.score); } else api.miss({ key: 'airlift-variety', q: 'Which habitats have more kinds of animals?', you: '', ans: 'Tropical rainforests and tropical grasslands', why: 'They are warm with enough water and food.' });
  }
  const won = state.hearts > 0;
  api.finish({ score: state.score + (won ? state.hearts * 120 : 0), correct: state.correct, total: state.total, won });
}
