// GAME · Sort Storm — classify falling animals at the Ark doors
import { GROUPS, GROUP_ORDER, CREATURES, SORT_WAVES, CLUE_CARDS, BACKBONE_ITEMS } from '../data.js';
import { makeArena, runItems, banner } from './faller.js';
import { sample, shuffle } from '../../../core/ui.js';
import { art } from '../../../core/art.js';

export const TIMED = true;
export const HEARTS = 5;

const WHY = {
  birds: 'Feathers + beak + lays eggs = bird.', mammals: 'Hair + feeds young with milk = mammal.', reptiles: 'Dry skin with hard scales = reptile.',
  amphibians: 'Moist skin, no scales, lungs + skin = amphibian.', fish: 'Gills + fins + wet scaly skin = fish.', insects: '6 legs + antennae + 3 body parts = insect.',
};

export default async function play(api) {
  api.music('arcade');
  await api.intro({
    title: 'Sort Storm', artId: 'tornado',
    how: [['eyes', 'An animal falls from the storm clouds'], ['joystick', 'Tap the Ark door of its group'], ['heartfire', '6 in a row = FEVER, double points']],
    learn: 'Birds, fish, mammals, reptiles, amphibians and insects — and the tricky ones in between.',
  });

  const bins = GROUP_ORDER.map((g) => ({ id: g, label: GROUPS[g].name, art: GROUPS[g].icon, color: GROUPS[g].color }));
  const arena = makeArena(api, { bins, sky: 'sky-storm' });
  const state = { score: 0, hearts: api.hearts(HEARTS), combo: 0, maxCombo: 0, correct: 0, total: 0, goal: 30 };
  api.frame.setHearts(state.hearts);

  for (const wave of SORT_WAVES) {
    if (state.hearts <= 0) break;
    await banner(api, wave.title, wave.clues ? 'No pictures — read the clues!' : wave.id === 'w2' ? 'They look like one group… but belong to another!' : '');
    let items;
    if (wave.clues) {
      items = sample(CLUE_CARDS, wave.count).map((c, i) => ({ key: `clue${c.text}`, text: c.text, answer: c.group, why: WHY[c.group], q: `"${c.text}" — which group?`, label: `"${c.text}"` }));
    } else {
      items = sample(wave.items, wave.count).map((id) => {
        const c = CREATURES[id];
        return { key: id, cid: id, label: c.name, answer: c.group, learn: id, chute: true, why: c.tricky ? c.fact : WHY[c.group], tip: c.tricky ? c.fact : '', q: `${c.name} — which group?` };
      });
    }
    await runItems(api, arena, items, state, { speed: wave.speed, fallTime: wave.clues ? 9 : 7.5 });
  }

  // Bonus: X-ray backbone scanner
  if (state.hearts > 0) {
    await banner(api, 'Bonus · X-ray scanner', 'Backbone or no backbone?');
    arena.wrap.remove();
    const xr = makeArena(api, { bins: [{ id: 'yes', label: 'Has a backbone', art: 'bone', color: '#3E8EDE' }, { id: 'no', label: 'No backbone', art: 'jellyfish', color: '#B55BD6' }], sky: 'sky-xray' });
    const items = shuffle([...sample(BACKBONE_ITEMS.yes, 4).map((id) => [id, 'yes']), ...sample(BACKBONE_ITEMS.no, 4).map((id) => [id, 'no'])]).map(([id, ans]) => {
      const c = CREATURES[id];
      return { key: `bb-${id}`, cid: id, label: c.name, answer: ans, learn: id, q: `${c.name}: backbone or not?`,
        why: ans === 'no' ? (c.group === 'insects' ? 'Insects have no backbone.' : c.fact) : 'Birds, fish, mammals, reptiles and amphibians all have backbones.' };
    });
    await runItems(api, xr, items, state, { speed: 1.3, fallTime: 6 });
  }

  const won = state.hearts > 0;
  api.finish({ score: state.score + (won ? state.hearts * 150 : 0), correct: state.correct, total: state.total, won, headline: won ? undefined : 'The storm won this time!' });
}

export { art };
