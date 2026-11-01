// Zone bosses: characters, lines and question generators (all answers follow the Unit 1 notes)
import {
  GROUPS, GROUP_ORDER, GROUP_ATTR, CREATURES, PLANTS, PLANT_DEFENSES, BIOMES, BIOME_ORDER,
  AIRLIFT_ANIMALS, AIRLIFT_FACTS, SURVIVAL, PANIC_ROUNDS, DEFENSES, FEEDERS,
} from './data.js';
import { pick, sample, shuffle } from './ui.js';

const coin = () => Math.random() < .5;
const ids = (f) => Object.keys(CREATURES).filter((k) => f(CREATURES[k]));
const byGroup = (g) => ids((c) => c.group === g);
const SING = { birds: 'bird', fish: 'fish', mammals: 'mammal', reptiles: 'reptile', amphibians: 'amphibian', insects: 'insect' };
const an = (w) => (/^[aeiou]/i.test(w) ? 'an' : 'a');
const groupOpt = (g) => ({ id: g, text: GROUPS[g].name, art: GROUPS[g].icon });
const animalOpt = (id) => ({ id, text: CREATURES[id].name, cid: id });
const noBackbone = (id) => ['insects', 'invertebrate'].includes(CREATURES[id].group);
const groupWord = (id) => { const g = CREATURES[id].group; return g === 'invertebrate' ? 'an animal with no backbone (not an insect)' : `${an(SING[g])} ${SING[g]}`; };

// ---------------- Ark Beach · Kraken Kaptain ----------------
const LOOKALIKE = { birds: ['bat'], fish: ['dolphin', 'whale', 'seaturtle'], mammals: ['penguin', 'shark', 'chicken'], reptiles: ['salamander', 'frog'], amphibians: ['crocodile', 'lizard', 'seaturtle'], insects: ['spider', 'scorpion', 'crab'] };
const beach = [
  () => {
    const pool = ids((c) => GROUPS[c.group]);
    const tricky = pool.filter((k) => CREATURES[k].tricky);
    const id = Math.random() < .6 ? pick(tricky) : pick(pool); const c = CREATURES[id];
    return { key: `kr-class:${id}`, prompt: `Which group does the ${c.name.toLowerCase()} belong to?`, cid: id,
      options: shuffle([groupOpt(c.group), ...sample(GROUP_ORDER.filter((g) => g !== c.group), 3).map(groupOpt)]), correct: c.group, explain: c.fact };
  },
  () => {
    const g = pick(GROUP_ORDER); const three = sample(byGroup(g), 3); const odd = pick(LOOKALIKE[g]);
    return { key: `kr-odd:${g}:${odd}`, prompt: `Which one is NOT ${an(SING[g])} ${SING[g]}?`,
      options: shuffle([...three, odd].map(animalOpt)), correct: odd, explain: `The ${CREATURES[odd].name.toLowerCase()} is ${groupWord(odd)}. ${CREATURES[odd].fact}` };
  },
  () => {
    const none = coin();
    const yes = sample(ids((c) => GROUPS[c.group] && c.group !== 'insects'), none ? 3 : 1);
    const no = sample(ids((c) => c.group === 'insects' || c.group === 'invertebrate'), none ? 1 : 3);
    const ans = none ? no[0] : yes[0];
    return { key: `kr-bb:${ans}`, prompt: none ? 'Which animal has NO backbone?' : 'Which animal HAS a backbone?',
      options: shuffle([...yes, ...no].map(animalOpt)), correct: ans,
      explain: none ? `The ${CREATURES[ans].name.toLowerCase()} has no backbone. Birds, fish, mammals, reptiles and amphibians all have backbones.` : `The ${CREATURES[ans].name.toLowerCase()} is ${groupWord(ans)} — it has a backbone.` };
  },
];

// ---------------- Lab Tower · Dr. Glitch ----------------
const WRONG = {
  birds: ['Have hair or fur', 'Breathe with gills', 'Feed their young with milk', 'Have moist skin with no scales'],
  mammals: ['Have feathers and a beak', 'Breathe with gills', 'Are cold-blooded', 'Have dry, hard scales'],
  reptiles: ['Have moist skin with no scales', 'Have feathers', 'Feed their young with milk', 'Are warm-blooded'],
  amphibians: ['Have dry, hard scales', 'Have feathers', 'Are warm-blooded', 'Feed their young with milk'],
  fish: ['Breathe with lungs', 'Have feathers', 'Have dry skin', 'Are warm-blooded'],
  insects: ['Have four pairs of legs', 'Have a backbone', 'Have feathers', 'Breathe with gills'],
};
const FLOW_DESC = {
  insects: 'No backbone', birds: 'Backbone ✔ · Warm-blooded ✔ · Lays eggs ✔', mammals: 'Backbone ✔ · Warm-blooded ✔ · Lays eggs ✘',
  amphibians: 'Backbone ✔ · Warm-blooded ✘ · Scales ✘', reptiles: 'Backbone ✔ · Warm-blooded ✘ · Scales ✔ · Dry skin ✔', fish: 'Backbone ✔ · Warm-blooded ✘ · Scales ✔ · Dry skin ✘',
};
const lab = [
  () => {
    const g = pick(GROUP_ORDER); const id = pick(byGroup(g)); const gn = GROUPS[g].name.toLowerCase();
    const traits = sample(GROUPS[g].traits.filter((t) => !/^Some/.test(t)), 3); const wrong = pick(WRONG[g]);
    return { key: `dg-trait:${g}`, prompt: `The ${CREATURES[id].name.toLowerCase()} is one of the ${gn}. Which is NOT true of ${gn}?`, cid: id,
      options: shuffle([...traits.map((t, i) => ({ id: `t${i}`, text: t })), { id: 'w', text: wrong }]), correct: 'w',
      explain: `${GROUPS[g].name}: ${GROUPS[g].traits.join('; ')}.` };
  },
  () => {
    const warm = coin();
    const w = ids((c) => ['birds', 'mammals'].includes(c.group)); const cold = ids((c) => ['reptiles', 'amphibians', 'fish', 'insects'].includes(c.group));
    const ans = pick(warm ? w : cold); const others = sample(warm ? cold : w, 3);
    return { key: `dg-warm:${warm}`, prompt: warm ? 'Which animal is warm-blooded?' : 'Which animal is cold-blooded?',
      options: shuffle([ans, ...others].map(animalOpt)), correct: ans, explain: 'Only birds and mammals are warm-blooded. Fish, amphibians, reptiles and insects are cold-blooded.' };
  },
  () => {
    const g = pick(GROUP_ORDER);
    return { key: `dg-flow:${g}`, prompt: `Follow the flowchart: ${FLOW_DESC[g]}. Which group is it?`, artId: 'detective',
      options: shuffle([groupOpt(g), ...sample(GROUP_ORDER.filter((x) => x !== g), 3).map(groupOpt)]), correct: g, explain: `${FLOW_DESC[g]} → ${GROUPS[g].name}.` };
  },
];

// ---------------- Greenhouse · King Goat ----------------
const HAB = { desert: { id: 'desert', text: 'Desert', art: 'desert' }, rainforest: { id: 'rainforest', text: 'Tropical rainforest', art: 'nationalpark' }, wetland: { id: 'wetland', text: 'Wetland', art: 'wave' }, polar: { id: 'polar', text: 'Polar region', art: 'snowmountain' } };
const FEATURES = [
  ['Deep roots', 'desert', 'They absorb water deep in the ground.'], ['Shallow roots spread over a wide area', 'desert', 'They absorb rainwater quickly.'],
  ['Buttress roots', 'rainforest', 'They support very tall trees reaching for sunlight.'], ['Aerial roots', 'wetland', 'They absorb oxygen from the air (mangroves).'],
  ['A thick stem that stores water', 'desert', 'Cacti store water in thick stems.'], ['A climbing stem that twines around trees', 'rainforest', 'It reaches more sunlight above the dark forest floor.'],
  ['An underground stem with holes', 'wetland', 'Lotus stems have holes for gaseous exchange.'], ['Needle-shaped leaves', 'desert', 'They reduce water loss.'],
  ['Broad, smooth leaves', 'rainforest', 'They get more sunlight and shed rainwater.'], ['Waxy leaves', 'wetland', 'They reduce water loss in salty soil (mangroves).'],
];
const FLOWERING = ['rose', 'sunflower', 'tulip', 'flametree', 'cottontree', 'waterlily', 'lotus'];
const greenhouse = [
  () => {
    const [f, hab, why] = pick(FEATURES);
    return { key: `kg-feat:${f}`, prompt: `Where does this help a plant most? "${f}"`, artId: 'seedling', options: shuffle(Object.values(HAB)), correct: hab, explain: why };
  },
  () => {
    const d = pick(PLANT_DEFENSES); const others = sample(PLANT_DEFENSES.filter((x) => x.defense !== d.defense), 3);
    return { key: `kg-def:${d.plant}`, prompt: `How does the ${PLANTS[d.plant].name.toLowerCase()} protect itself?`, cid: d.plant,
      options: shuffle([d, ...others].map((x) => ({ id: x.defense, text: x.text }))), correct: d.defense, explain: d.line };
  },
  () => {
    if (coin()) {
      const ans = pick(['fern', 'moss', 'pine']); const others = sample(FLOWERING, 3);
      return { key: 'kg-nonflower', prompt: 'Which is a NON-flowering plant?', options: shuffle([ans, ...others].map((id) => ({ id, text: PLANTS[id].name, cid: id }))), correct: ans, explain: 'Mosses, ferns and pines do not produce flowers.' };
    }
    const ans = pick(['lotus', 'waterlily']); const others = sample(['rose', 'sunflower', 'cactus', 'pine', 'flametree', 'tulip'], 3);
    return { key: 'kg-water', prompt: 'Which is a WATER plant?', options: shuffle([ans, ...others].map((id) => ({ id, text: PLANTS[id].name, cid: id }))), correct: ans, explain: 'Lotuses and water lilies grow in water.' };
  },
  () => (coin()
    ? { key: 'kg-growth', prompt: 'What affects the growth of plants?', artId: 'thermometer', options: shuffle([{ id: 'a', text: 'Temperature and rainfall' }, { id: 'b', text: 'Stones and sand' }, { id: 'c', text: 'Animals and colours' }, { id: 'd', text: 'Wind and clouds only' }]), correct: 'a', explain: 'The growth of plants is affected by temperature and rainfall.' }
    : { key: 'kg-desert', prompt: 'Why do very few plants grow in deserts?', artId: 'desert', options: shuffle([{ id: 'a', text: 'Low rainfall and a big temperature difference between day and night' }, { id: 'b', text: 'Too much rain' }, { id: 'c', text: 'Too many animals' }, { id: 'd', text: 'It is too dark' }]), correct: 'a', explain: 'Deserts have low rainfall and a large temperature difference between day and night.' }),
];

// ---------------- Biome Peaks · Blizzard ----------------
const peaks = [
  () => {
    const b = pick(BIOME_ORDER); const ans = pick(AIRLIFT_ANIMALS.filter((k) => CREATURES[k].biome === b));
    const others = sample(AIRLIFT_ANIMALS.filter((k) => CREATURES[k].biome !== b), 3);
    return { key: `bz-hab:${ans}`, prompt: `Which animal lives in the ${BIOMES[b].name.toLowerCase()}?`, artId: BIOMES[b].icon,
      options: shuffle([ans, ...others].map(animalOpt)), correct: ans, explain: `${CREATURES[ans].name}: ${CREATURES[ans].fact}` };
  },
  () => {
    const R = pick(SURVIVAL); const t = pick(R.traits); const right = t.options[t.ok]; const own = t.options.filter((_, i) => i !== t.ok);
    // distractors only from traits about something else (an 'Ears' answer must not meet another animal's ears)
    const pool = SURVIVAL.flatMap((s) => s.traits.filter((tr) => tr.label !== t.label).flatMap((tr) => tr.options.filter((_, i) => i !== tr.ok))).filter((x) => x !== right && !own.includes(x));
    const opts = [right, ...own, ...sample([...new Set(pool)], 3 - own.length)];
    return { key: `bz-surv:${R.id}:${t.label}`, prompt: `${R.title}! Which ${t.label.toLowerCase()} helps the ${CREATURES[R.id].name.toLowerCase()} survive?`, cid: R.id,
      options: shuffle(opts.map((text, i) => ({ id: i === 0 ? 'ok' : `x${i}`, text }))), correct: 'ok', explain: t.why };
  },
  () => {
    const [fact, b] = pick(AIRLIFT_FACTS);
    return { key: `bz-clim:${fact}`, prompt: `Which habitat is this? "${fact}"`, artId: 'thermometer',
      options: shuffle(BIOME_ORDER.map((id) => ({ id, text: BIOMES[id].name, art: BIOMES[id].icon }))), correct: b, explain: `${BIOMES[b].name}: ${BIOMES[b].climate.toLowerCase()}; ${BIOMES[b].water.toLowerCase()}.` };
  },
  () => {
    const fewer = coin(); const ans = fewer ? pick(['desert', 'polar']) : pick(['rainforest', 'grassland']);
    const others = fewer ? ['rainforest', 'grassland'] : ['desert', 'polar'];
    return { key: `bz-var:${fewer}`, prompt: fewer ? 'Which habitat has FEWER kinds of animals?' : 'Which habitat has MORE kinds of animals?', artId: 'paw',
      options: shuffle([ans, ...others].map((id) => ({ id, text: BIOMES[id].name, art: BIOMES[id].icon }))), correct: ans,
      explain: 'Tropical rainforests and grasslands have enough water and food, so more kinds of animals live there. Deserts and polar regions are extreme.' };
  },
];

// ---------------- Hide & Seek · Shadow Dragon ----------------
const DEF_OPTS = () => Object.values(DEFENSES).map((d) => ({ id: d.id, text: d.name, art: d.icon }));
const PHRASE = { colour: 'protective colouration', mimicry: 'mimicry', warning: 'warning predators', groups: 'living in groups' };
const jungle = [
  () => {
    const R = pick(PANIC_ROUNDS);
    return { key: `sd-def:${R.prey}`, prompt: `How does the ${CREATURES[R.prey].name.toLowerCase()} protect itself?`, cid: R.prey, options: DEF_OPTS(), correct: R.answer, explain: R.line };
  },
  () => {
    const d = pick(['colour', 'mimicry', 'warning', 'groups']);
    const ans = pick(ids((c) => c.defense === d)); const others = sample(ids((c) => c.defense && c.defense !== d && c !== CREATURES.oakleaf), 3);
    return { key: `sd-which:${d}`, prompt: `Which animal protects itself by ${PHRASE[d]}?`, artId: DEFENSES[d].icon,
      options: shuffle([ans, ...others].map(animalOpt)), correct: ans, explain: `${CREATURES[ans].name}: ${CREATURES[ans].fact}` };
  },
  () => {
    const d = pick(Object.keys(DEFENSES));
    return { key: `sd-mean:${d}`, prompt: `Which sentence describes ${DEFENSES[d].name.toLowerCase()}?`, artId: 'thinking',
      options: shuffle(Object.values(DEFENSES).map((x) => ({ id: x.id, text: x.desc }))), correct: d, explain: `${DEFENSES[d].name}: ${DEFENSES[d].desc}` };
  },
];

// ---------------- Savanna Diner · Hungry Hippo ----------------
const savanna = [
  () => {
    const f = pick(FEEDERS); const others = sample(FEEDERS.filter((x) => x.id !== f.id), 3);
    return { key: `hh-feat:${f.id}`, prompt: `What helps the ${CREATURES[f.id].name.toLowerCase()} get ${f.food}?`, cid: f.id,
      options: shuffle([f, ...others].map((x) => ({ id: x.id, text: x.feature }))), correct: f.id, explain: `Its ${f.feature.toLowerCase()} ${f.does}.` };
  },
  () => {
    const f = pick(FEEDERS); const others = sample(FEEDERS.filter((x) => x.id !== f.id), 3);
    return { key: `hh-who:${f.id}`, prompt: `Which animal uses its ${f.feature.toLowerCase()} to get food?`, artId: f.foodArt,
      options: shuffle([f, ...others].map((x) => animalOpt(x.id))), correct: f.id, explain: `The ${CREATURES[f.id].name.toLowerCase()}: its ${f.feature.toLowerCase()} ${f.does}.` };
  },
  () => {
    const meat = coin();
    return { key: `hh-teeth:${meat}`, prompt: meat ? 'Meat-eating animals like lions have…' : 'Grass-eating animals like cows have…', artId: meat ? 'lion' : 'cow',
      options: shuffle([{ id: 'sharp', text: 'Sharp teeth to tear meat' }, { id: 'flat', text: 'Wide, flat teeth for chewing plants' }, { id: 'none', text: 'No teeth at all' }, { id: 'soft', text: 'Soft, round teeth' }]),
      correct: meat ? 'sharp' : 'flat', explain: 'Meat-eaters have sharp teeth to tear their prey; plant-eaters have wide, flat teeth to chew plants.' };
  },
  () => {
    const f = pick(FEEDERS); const others = sample(FEEDERS.filter((x) => x.food !== f.food), 3);
    return { key: `hh-food:${f.id}`, prompt: `What does the ${CREATURES[f.id].name.toLowerCase()} eat?`, cid: f.id,
      options: shuffle([f, ...others].map((x) => ({ id: x.id, text: x.food[0].toUpperCase() + x.food.slice(1), art: x.foodArt }))), correct: f.id, explain: `Its ${f.feature.toLowerCase()} ${f.does}.` };
  },
];

export const BOSSES = {
  beach: { name: 'Kraken Kaptain', art: 'octopus', fx: 'hue-rotate(240deg) saturate(1.5)', bg: 'bf-sea', attack: 'ink', hp: 9, gens: beach,
    lines: { intro: 'Har har! My storm will mix up every animal on this beach!', hit: ['Glub! Lucky guess!', 'Ouch, my tentacle!', 'Grr… you know your groups!'], miss: ['INK ATTACK!', 'Wrong! Splash!', 'Har har har!'], enrage: 'You made me ANGRY! Faster, faster!' } },
  lab: { name: 'Dr. Glitch', art: 'alien', bg: 'bf-lab', attack: 'glitch', hp: 9, gens: lab,
    lines: { intro: 'Beep boop. I have scrambled every animal fact in my lab!', hit: ['ERROR! ERROR!', 'Bzzt! My data!', 'System… overheating…'], miss: ['GLITCH BLAST!', 'Ha! Fact scrambled!', 'Beep beep, wrong!'], enrage: 'OVERCLOCK MODE ON!' } },
  greenhouse: { name: 'King Goat', art: 'goat', crown: true, bg: 'bf-garden', attack: 'headbutt', hp: 9, gens: greenhouse,
    lines: { intro: 'Maaa! I am the King, and I will eat EVERY plant in this greenhouse!', hit: ['Maaa! My crown!', 'Bleh, spiky!', 'Not fair, maaa!'], miss: ['HEADBUTT!', 'Munch munch!', 'Maaa-ha-ha!'], enrage: 'Now I am REALLY hungry!' } },
  peaks: { name: 'Blizzard', art: 'snowman', fx: 'hue-rotate(170deg) saturate(1.3)', bg: 'bf-snow', attack: 'frost', hp: 9, gens: peaks,
    lines: { intro: 'Brrr! I will freeze every habitat on these peaks!', hit: ['I\'m melting!', 'Too warm in here!', 'Drip… drip…'], miss: ['FROST BREATH!', 'Snowball!', 'Freeze!'], enrage: 'BLIZZARD MODE!' } },
  jungle: { name: 'Shadow Dragon', art: 'dragon', fx: 'brightness(.6) saturate(1.5) hue-rotate(230deg)', bg: 'bf-jungle', attack: 'fire', hp: 9, gens: jungle,
    lines: { intro: 'Nobody can hide from me… unless they know the tricks!', hit: ['Rrrgh! Where did it go?', 'Mimicry?! No!', 'Hssss!'], miss: ['FIRE BREATH!', 'Found you!', 'Rawr!'], enrage: 'I see EVERYTHING now!' } },
  savanna: { name: 'Hungry Hippo', art: 'hippo', bg: 'bf-savanna', attack: 'chomp', hp: 9, gens: savanna,
    lines: { intro: 'CHOMP! I\'m stealing every dish in the Savanna Diner!', hit: ['Burp! My tummy!', 'Ow, sharp teeth!', 'Not my snack!'], miss: ['CHOMP CHOMP!', 'Mine, all mine!', 'Yum!'], enrage: 'SUPER HUNGRY MODE!' } },
};
