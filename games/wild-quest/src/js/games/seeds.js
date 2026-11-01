// GAME · Seed Sorter — flowering vs non-flowering, land vs water plants
import { PLANTS, SEED_SORT } from '../data.js';
import { makeArena, runItems, banner } from './faller.js';
import { shuffle } from '../ui.js';

export const TIMED = true;
export const HEARTS = 4;

const WHY = {
  yes: 'It produces flowers, so it is a flowering plant.',
  no: 'Mosses, ferns and pines do not produce flowers — non-flowering plants.',
  land: 'It grows in soil on land.',
  water: 'Water lilies and lotuses grow in water — water plants.',
};

export default async function play(api) {
  api.music('garden');
  await api.intro({
    title: 'Seed Sorter', artId: 'blossom',
    how: [['seedling', 'Plants float down from the greenhouse roof'], ['joystick', 'Tap the right basket'], ['heart', '4 hearts — careful!']],
    learn: 'Plants can be classified as flowering or non-flowering, and as land or water plants.',
  });
  const state = { score: 0, hearts: api.hearts(HEARTS), combo: 0, maxCombo: 0, correct: 0, total: 0, goal: 16 };
  api.frame.setHearts(state.hearts);
  let arena = null;
  for (const round of SEED_SORT) {
    if (state.hearts <= 0) break;
    arena?.wrap.remove();
    await banner(api, round.round === 'flower' ? 'Round 1 · Flowers?' : 'Round 2 · Land or water?');
    arena = makeArena(api, { bins: round.bins.map((b) => ({ ...b, color: b.id === 'yes' || b.id === 'land' ? '#2EB872' : b.id === 'water' ? '#27B5D0' : '#8A7A6A' })), sky: 'sky-garden' });
    const items = shuffle(round.items).slice(0, 8).map(([id, ans]) => ({ key: `${round.round}-${id}`, cid: id, label: PLANTS[id].name, answer: ans, learn: id, why: WHY[ans], q: `${PLANTS[id].name}: ${round.round === 'flower' ? 'flowering or non-flowering?' : 'land or water plant?'}` }));
    await runItems(api, arena, items, state, { fallTime: 8 });
  }
  const won = state.hearts > 0;
  api.finish({ score: state.score + (won ? state.hearts * 100 : 0), correct: state.correct, total: state.total, won });
}
