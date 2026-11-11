// =============================================================
//  Biodiversity Island — P6 Science (General Studies) Unit 1.
//  An island "pack": what the island is, where it sits in the sea, its zones and games.
//  (This is the original Wild Quest; mode ids are unchanged so saved stars still match.)
// =============================================================
import { h } from '../../core/ui.js';
import { registerCreatures } from '../../core/art.js';
import { store } from '../../core/store.js';
import { CREATURES, PLANTS, COVERAGE } from './data.js';
import * as DATA from './data.js';
import { BOSSES } from './bosses.js';
import { openGuide, TOTAL_CARDS, scienceCardCount } from './guide.js';
import { buildScience } from './island.js';

registerCreatures(CREATURES, PLANTS);

// static module map (lets the build step bundle everything into one HTML file)
const mods = {
  sortstorm: () => import('./games/sortstorm.js'), lab: () => import('./games/lab.js'), detective: () => import('./games/detective.js'),
  seeds: () => import('./games/seeds.js'), plants: () => import('./games/plants.js'), guard: () => import('./games/guard.js'),
  airlift: () => import('./games/airlift.js'), survival: () => import('./games/survival.js'), hideseek: () => import('./games/hideseek.js'),
  panic: () => import('./games/panic.js'), feeding: () => import('./games/feeding.js'), boss: () => import('./games/boss.js'),
  bossfight: () => import('./games/bossfight.js'),
};

const zb = (key) => ({ id: `boss-${key}`, title: BOSSES[key].name, art: BOSSES[key].art, fx: BOSSES[key].fx, mod: 'bossfight', key, isBoss: true, reward: key });
export const ZONES = [
  { id: 'beach', title: 'Ark Beach', art: 'desertisland', learn: 'Classify animals into birds, fish, mammals, reptiles, amphibians and insects.',
    modes: [{ id: 'sort', title: 'Sort Storm', art: 'tornado', desc: 'Animals rain from the sky. Send each one through the right Ark door before it lands!', mod: 'sortstorm' }], boss: zb('beach') },
  { id: 'lab', title: 'Lab Tower', art: 'alembic', learn: 'The characteristics of each animal group, and the classification flowchart.',
    modes: [
      { id: 'build', title: 'Build-a-Beast', art: 'dna', desc: 'Mix body parts in the creature machine to fill zoo orders.', mod: 'lab' },
      { id: 'detective', title: 'Flowchart Detective', art: 'detective', desc: 'Read the clues and steer through the flowchart to unmask the mystery animal.', mod: 'detective' },
    ], boss: zb('lab') },
  { id: 'greenhouse', title: 'Greenhouse', art: 'seedling', learn: 'How plants are classified and how roots, stems and leaves help them survive.',
    modes: [
      { id: 'seeds', title: 'Seed Sorter', art: 'blossom', desc: 'Catch falling plants: flowering or not? Land or water?', mod: 'seeds' },
      { id: 'grow', title: 'Plant Survivor', art: 'pottedplant', desc: 'Design a plant with the right roots, stem and leaves, then survive 3 wild days.', mod: 'plants' },
      { id: 'guard', title: 'Garden Guard', art: 'shield', desc: 'Hungry animals are coming! Use each plant\'s own defence to protect the garden.', mod: 'guard' },
    ], boss: zb('greenhouse') },
  { id: 'peaks', title: 'Biome Peaks', art: 'snowmountain', learn: 'Where animals live and how their bodies help them survive there.',
    modes: [
      { id: 'airlift', title: 'Animal Airlift', art: 'balloon', desc: 'Drop lost animals and weather crates into the right habitat.', mod: 'airlift' },
      { id: 'suit', title: 'Survival Suit', art: 'thermometer', desc: 'Switch on the right body features before the blizzard or heatwave wins.', mod: 'survival' },
    ], boss: zb('peaks') },
  { id: 'jungle', title: 'Hide & Seek', art: 'eyes', learn: 'How animals protect themselves: colouration, mimicry, warning, living in groups.',
    modes: [
      { id: 'hide', title: 'Hide & Seek', art: 'magnifier', desc: 'Spot the camouflaged animals hiding in each scene.', mod: 'hideseek' },
      { id: 'panic', title: 'Predator Panic', art: 'scream', desc: 'A predator charges! Pick the trick that saves the animal.', mod: 'panic' },
    ], boss: zb('jungle') },
  { id: 'savanna', title: 'Savanna Diner', art: 'meat', learn: 'How beaks, necks, teeth and claws help animals get food.',
    modes: [{ id: 'feed', title: 'Feeding Frenzy', art: 'giraffe', desc: 'Serve each dish to the animal whose body is built to eat it.', mod: 'feeding' }], boss: zb('savanna') },
  { id: 'volcano', title: 'Fake-Bot', art: 'robot', learn: 'Final revision boss: true or false, fill in the blanks, data analysis.',
    modes: [{ id: 'boss', title: 'Fake-Bot Showdown', art: 'robot', desc: 'Fake-Bot is spreading fake facts. Bust them, fix them and blast him!', mod: 'boss', reward: 'volcano', isBoss: true }] },
];

function parents() {
  return h('div', {},
    h('p', {}, 'P6 General Studies (Science) Unit 1 Biodiversity: classification of living things, plants and environment, animals and environment. Every game is built around play first; the facts are what you need to win.'),
    h('table', {}, h('tr', {}, h('th', {}, 'Question type in the workbook'), h('th', {}, 'Practised in')), COVERAGE.map((c) => h('tr', {}, h('td', {}, c.format), h('td', {}, c.games.join(', '))))),
    h('ul', {},
      h('li', {}, `${scienceCardCount()} of ${TOTAL_CARDS} Field Guide cards collected. Correct answers unlock cards; each card repeats the key fact.`),
      h('li', {}, 'Each game gives up to 3 stars; replaying only ever raises the best. Every wrong answer goes into the Oops Book with the reason.'),
      h('li', {}, 'Answers follow the school notes (e.g. bats and dolphins are mammals; sea turtles are reptiles; only birds and mammals are warm-blooded).'),
      h('li', {}, 'Each zone has a boss that wakes up once every game in the zone has at least 1 star; the first win gives a prize.')));
}

export default {
  id: 'science', title: 'Biodiversity Island', short: 'Science', subject: 'Science · P6 Unit 1', art: 'frog', color: '#3FAE4F', lang: 'en',
  at: { x: 0, z: 0 }, radius: 28, labelY: 26,
  build: buildScience,
  zones: ZONES, mods,
  music: 'island',
  welcome: 'Biodiversity Island — tap a place to start.',
  isCard: (id) => !!(CREATURES[id] || PLANTS[id]),
  books: [{ id: 'guide', art: 'books', label: () => `${scienceCardCount()}/${TOTAL_CARDS}`, open: (parent, ctx, done) => openGuide(parent, ctx.sfx, done) }],
  parents,
  // for the old tests and tools
  DATA, BOSSES,
};
export { store };
