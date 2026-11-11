// Star Shop catalogue, boss prizes and the Star Road
// price = stars from the pouch. only: 'road' | 'boss' means it cannot be bought.

export const COSTUMES = [
  { id: 'c-scientist', name: 'Scientist', price: 0 },
  { id: 'c-farmer', name: 'Farmer', price: 6 },
  { id: 'c-detective', name: 'Detective', price: 8 },
  { id: 'c-artist', name: 'Artist', price: 8 },
  { id: 'c-pilot', name: 'Pilot', price: 10 },
  { id: 'c-ninja', name: 'Ninja', price: 12 },
  { id: 'c-mage', name: 'Wizard', price: 14 },
  { id: 'c-fairy', name: 'Fairy', price: 16 },
  { id: 'c-princess', name: 'Princess', price: 20 },
  { id: 'c-astronaut', name: 'Astronaut', only: 'boss', from: 'Dr. Glitch' },
  { id: 'c-cook', name: 'Chef', only: 'boss', from: 'Hungry Hippo' },
  { id: 'c-superhero', name: 'Superhero', only: 'boss', from: 'Fake-Bot' },
];

// card = Field Guide card you must collect before you can adopt it
export const PETS = [
  { id: 'p-frog', name: 'Frog', art: 'frog', card: 'frog', price: 4 },
  { id: 'p-chick', name: 'Chick', art: 'hatching', price: 4 },
  { id: 'p-squirrel', name: 'Squirrel', art: 'chipmunk', card: 'squirrel', price: 5 },
  { id: 'p-turtle', name: 'Sea turtle', art: 'turtle', card: 'seaturtle', price: 6 },
  { id: 'p-hamster', name: 'Hamster', art: 'hamster', price: 6 },
  { id: 'p-bat', name: 'Bat', art: 'bat', card: 'bat', price: 6 },
  { id: 'p-owl', name: 'Owl', art: 'owl', card: 'owl', price: 7 },
  { id: 'p-seal', name: 'Seal', art: 'seal', card: 'harpseal', price: 7 },
  { id: 'p-penguin', name: 'Penguin', art: 'penguin', card: 'penguin', price: 8 },
  { id: 'p-sloth', name: 'Sloth', art: 'sloth', card: 'sloth', price: 8 },
  { id: 'p-fox', name: 'Fox', art: 'fox', card: 'fox', price: 8 },
  { id: 'p-dolphin', name: 'Dolphin', art: 'dolphin', card: 'dolphin', price: 10 },
  { id: 'p-panda', name: 'Panda', art: 'panda', price: 14 },
  { id: 'p-koala', name: 'Koala', art: 'koala', price: 14 },
  { id: 'p-unicorn', name: 'Unicorn', art: 'unicorn', only: 'road' },
  { id: 'p-dragon', name: 'Baby dragon', art: 'dragon', only: 'boss', from: 'Shadow Dragon' },
  // Maths Island zone-test prizes
  { id: 'p-octopus', name: 'Octopus', art: 'octopus', only: 'boss', from: 'Captain Calc' },
  { id: 'p-flamingo', name: 'Flamingo', art: 'flamingo', only: 'boss', from: 'Squiddy Slice' },
  { id: 'p-kangaroo', name: 'Kangaroo', art: 'kangaroo', only: 'boss', from: 'King Balance' },
  { id: 'p-peacock', name: 'Peacock', art: 'peacock', only: 'boss', from: 'Mammoth Prism' },
  { id: 'p-ladybug', name: 'Ladybird', art: 'ladybug', only: 'boss', from: 'Major Metre' },
  { id: 'p-trex', name: 'Baby T-rex', art: 'trex', only: 'boss', from: 'Rex the Riddler' },
];

export const DECOR = [
  { id: 'hut', name: 'Beach hut', art: 'hut', price: 4 },
  { id: 'kite', name: 'Kite', art: 'kite', price: 4 },
  { id: 'tent', name: 'Camp tent', art: 'camping', price: 5 },
  { id: 'house', name: 'Cottage', art: 'house', price: 8 },
  { id: 'carousel', name: 'Carousel', art: 'carousel', price: 8 },
  { id: 'cake', name: 'Giant cake', art: 'cake', price: 9 },
  { id: 'moai', name: 'Stone head', art: 'moai', price: 10 },
  { id: 'rainbow', name: 'Rainbow', art: 'rainbow', price: 12 },
  { id: 'ferriswheel', name: 'Ferris wheel', art: 'ferriswheel', price: 14 },
  { id: 'jcastle', name: 'Pagoda castle', art: 'jcastle', price: 14 },
  { id: 'fireworks', name: 'Fireworks show', art: 'fireworks', price: 15 },
  { id: 'rollercoaster', name: 'Roller coaster', art: 'rollercoaster', price: 16 },
  { id: 'castle', name: 'Fairy castle', art: 'castle', price: 18 },
  { id: 'sailboat', name: 'Sailboat', art: 'sailboat', only: 'boss', from: 'Kraken Kaptain' },
  { id: 'fountain', name: 'Fountain', art: 'fountain', only: 'boss', from: 'King Goat' },
  { id: 'snowman', name: 'Friendly snowman', art: 'snowman', only: 'boss', from: 'Blizzard' },
  // island: which island it appears on (default: Biodiversity Island)
  { id: 'bullseye', name: 'Target board', art: 'bullseye', price: 6, island: 'maths' },
  { id: 'hundred', name: 'Giant 100 sign', art: 'hundred', price: 9, island: 'maths' },
  { id: 'rocket', name: 'Rocket', art: 'rocket', price: 14, island: 'maths' },
  { id: 'lotus', name: 'Lotus pond', art: 'lotus', price: 5, island: 'chinese' },
  { id: 'cherryblossom', name: 'Blossom tree', art: 'cherryblossom', price: 8, island: 'chinese' },
  { id: 'pandastatue', name: 'Giant panda', art: 'panda', price: 10, island: 'chinese' },
];

export const POWERUPS = [
  { id: 'heart', name: 'Extra heart', art: 'heart', price: 3, desc: '+1 heart in your next game.', needs: 'hearts' },
  { id: 'slow', name: 'Slow-mo clock', art: 'clock', price: 3, desc: 'Timers run 25% slower in your next game.', needs: 'timed' },
  { id: 'shield', name: 'Lucky shield', art: 'shield', price: 4, desc: 'Your first mistake costs no heart.', needs: 'hearts' },
  { id: 'clover', name: 'Lucky clover', art: 'clover', price: 4, desc: 'Get 3 stars and your pouch stars are doubled.', needs: 'any' },
];

export const ALL_ITEMS = Object.fromEntries([
  ...COSTUMES.map((x) => [x.id, { ...x, type: 'costume', art: x.id }]),
  ...PETS.map((x) => [x.id, { ...x, type: 'pet' }]),
  ...DECOR.map((x) => [x.id, { ...x, type: 'decor' }]),
]);

// First win against each zone boss
export const BOSS_PRIZES = {
  beach: 'sailboat', lab: 'c-astronaut', greenhouse: 'fountain', peaks: 'snowman', jungle: 'p-dragon', savanna: 'c-cook', volcano: 'c-superhero',
  'm-calc': 'p-octopus', 'm-frac': 'p-flamingo', 'm-eq': 'p-kangaroo', 'm-shape': 'p-peacock', 'm-measure': 'p-ladybug', 'm-peak': 'p-trex',
};
export const ISLAND_NAME = { science: 'Biodiversity Island', maths: 'Maths Island', chinese: 'Idiom Island' };

// Star Road: every star ever earned counts (spending does not move you back)
export const ROAD = [
  { at: 3, gift: { power: 'heart', n: 2 } },
  { at: 6, gift: { item: 'c-farmer' } },
  { at: 10, gift: { item: 'kite' } },
  { at: 15, gift: { item: 'p-panda' } },
  { at: 20, gift: { power: 'slow', n: 2 } },
  { at: 26, gift: { item: 'carousel' } },
  { at: 33, gift: { item: 'c-fairy' } },
  { at: 40, gift: { item: 'ferriswheel' } },
  { at: 50, gift: { item: 'p-koala' } },
  { at: 60, gift: { power: 'shield', n: 3 } },
  { at: 70, gift: { item: 'rainbow' } },
  { at: 80, gift: { item: 'c-princess' } },
  { at: 95, gift: { item: 'fireworks' } },
  { at: 110, gift: { item: 'p-unicorn' } },
  { at: 130, gift: { item: 'castle' } },
  { at: 150, gift: { stars: 20 } },
];
