// =============================================================
//  Wild Quest · Biodiversity Island — learning content
//  Source: P6 GS (Science) Unit 1 Biodiversity, Ch.1–3,
//  workbook p.2–9, supplementary notes 1–5, Task 1 flowchart.
//  All facts are paraphrased for play; answers follow the school notes.
// =============================================================

// ---------- Animal groups ----------
export const GROUPS = {
  birds: {
    id: 'birds', name: 'Birds', zh: '鳥類', color: '#3E8EDE', icon: 'feather',
    traits: ['Have feathers', 'Have a beak', 'A pair of wings and a pair of legs', 'Breathe with lungs', 'Lay eggs', 'Warm-blooded'],
  },
  fish: {
    id: 'fish', name: 'Fish', zh: '魚類', color: '#1BB5B5', icon: 'tropicalfish',
    traits: ['Live in water', 'Wet skin, usually covered with scales', 'Fins for swimming and keeping balance', 'Breathe with gills', 'Lay eggs', 'Cold-blooded'],
  },
  mammals: {
    id: 'mammals', name: 'Mammals', zh: '哺乳類', color: '#E0703A', icon: 'milk',
    traits: ['Hair or fur on their bodies', 'Females feed their young with milk', 'Give birth to live young', 'Breathe with lungs', 'Warm-blooded'],
  },
  reptiles: {
    id: 'reptiles', name: 'Reptiles', zh: '爬行類', color: '#6E9B2B', icon: 'lizard',
    traits: ['Dry skin', 'Dry and hard scales on their bodies', 'Breathe with lungs', 'Lay eggs', 'Some have a hard shell', 'Cold-blooded'],
  },
  amphibians: {
    id: 'amphibians', name: 'Amphibians', zh: '兩棲類', color: '#2FAE6B', icon: 'frog',
    traits: ['Moist skin', 'No scales', 'Young live in water; adults mainly on land', 'Adults breathe with lungs and skin', 'Lay eggs', 'Cold-blooded'],
  },
  insects: {
    id: 'insects', name: 'Insects', zh: '昆蟲', color: '#B55BD6', icon: 'ant',
    traits: ['No backbone', 'Three pairs of legs', 'A pair of antennae', 'Body: head, thorax and abdomen', 'Some have one or two pairs of wings'],
  },
};
export const GROUP_ORDER = ['birds', 'fish', 'mammals', 'reptiles', 'amphibians', 'insects'];

// Flowchart attributes (school Task 1)
export const GROUP_ATTR = {
  insects:    { backbone: false },
  birds:      { backbone: true, warm: true,  eggs: true },
  mammals:    { backbone: true, warm: true,  eggs: false },
  amphibians: { backbone: true, warm: false, scales: false },
  reptiles:   { backbone: true, warm: false, scales: true, dry: true },
  fish:       { backbone: true, warm: false, scales: true, dry: false },
};

// ---------- Creatures (field-guide entries) ----------
// art: emoji-art id (art/<id>.webp) or svg:<name> for hand-drawn ones
// fx: CSS filter to restyle an art piece
export const CREATURES = {
  // amphibians
  frog:        { name: 'Frog', zh: '青蛙', art: 'frog', group: 'amphibians', fact: 'Tadpoles live in water and breathe with gills. Adult frogs live mainly on land and breathe with lungs and skin.' },
  salamander:  { name: 'Salamander', zh: '蠑螈', art: 'lizard', fx: 'hue-rotate(200deg) saturate(1.3) brightness(.75)', group: 'amphibians', tricky: true, fact: 'Looks like a lizard, but it has moist skin and no scales — an amphibian!' },
  dartfrog:    { name: 'Poison dart frog', zh: '箭毒蛙', art: 'frog', fx: 'hue-rotate(115deg) saturate(2.2) brightness(1.05)', group: 'amphibians', biome: 'rainforest', defense: 'warning', fact: 'Its bright colours warn predators: its skin can release poison.' },
  // reptiles
  crocodile:   { name: 'Crocodile', zh: '鱷魚', art: 'crocodile', group: 'reptiles', tricky: true, fact: 'Young crocodiles swim in water too, but crocodiles have dry, hard scales and breathe with lungs — reptiles.' },
  seaturtle:   { name: 'Sea turtle', zh: '海龜', art: 'turtle', group: 'reptiles', tricky: true, fact: 'Lives in the sea and crawls on land, but has dry skin, scales and a shell, and breathes with lungs — a reptile.' },
  tortoise:    { name: 'African tortoise', zh: '非洲陸龜', art: 'turtle', fx: 'sepia(.7) saturate(1.4) hue-rotate(-10deg)', group: 'reptiles', biome: 'desert', fact: 'Thick scales and a hard shell reduce water loss in the hot, dry desert.' },
  snake:       { name: 'Snake', zh: '蛇', art: 'snake', group: 'reptiles', fact: 'No legs, dry and hard scales. Snakes go into deep sleep in winter to save energy.' },
  lizard:      { name: 'Lizard', zh: '蜥蜴', art: 'lizard', group: 'reptiles', fact: 'Two pairs of legs, dry skin and hard scales. Breathes with lungs.' },
  chameleon:   { name: 'Chameleon', zh: '變色龍', art: 'lizard', fx: 'hue-rotate(40deg) saturate(1.6)', group: 'reptiles', defense: 'colour', fact: 'Changes colour with its environment to avoid predators. Its long, sticky tongue catches insects.' },
  // mammals
  bat:         { name: 'Bat', zh: '蝙蝠', art: 'bat', group: 'mammals', tricky: true, fact: 'Has wings and can fly, but has hair and feeds its young with milk — a mammal!' },
  dolphin:     { name: 'Dolphin', zh: '海豚', art: 'dolphin', group: 'mammals', tricky: true, fact: 'Swims with fins in the sea, but breathes with lungs and feeds its young with milk — a mammal.' },
  whale:       { name: 'Whale', zh: '鯨', art: 'whale', group: 'mammals', tricky: true, fact: 'The giant of the sea is a mammal: it breathes air with lungs and feeds its baby milk.' },
  harpseal:    { name: 'Young harp seal', zh: '豎琴海豹BB', art: 'seal', fx: 'grayscale(1) brightness(1.55) contrast(.85)', group: 'mammals', biome: 'polar', defense: 'colour', fact: 'Its white fur blends in with the snow — protective colouration.' },
  polarbear:   { name: 'Polar bear', zh: '北極熊', art: 'polarbear', group: 'mammals', biome: 'polar', defense: 'colour', fact: 'Thick fur, small ears and a thick layer of fat under the skin keep it warm.' },
  monkey:      { name: 'Monkey', zh: '猴子', art: 'monkey', group: 'mammals', biome: 'rainforest', fact: 'Hair on its body, feeds its young with milk.' },
  orangutan:   { name: 'Orangutan', zh: '紅毛猩猩', art: 'orangutan', group: 'mammals', biome: 'rainforest', fact: 'Lives in the trees of tropical rainforests, where food is plentiful.' },
  gorilla:     { name: 'Gorilla', zh: '大猩猩', art: 'gorilla', group: 'mammals', biome: 'rainforest', fact: 'A rainforest mammal that eats leaves, stems and fruit.' },
  tiger:       { name: 'Tiger', zh: '老虎', art: 'tiger', group: 'mammals', biome: 'rainforest', fact: 'Many tigers live in tropical rainforests.' },
  sloth:       { name: 'Sloth', zh: '樹懶', art: 'sloth', group: 'mammals', biome: 'rainforest', fact: 'Hangs in rainforest trees and moves very slowly.' },
  lion:        { name: 'Lion', zh: '獅子', art: 'lion', group: 'mammals', biome: 'grassland', defense: 'colour', fact: 'Its colour matches the dry grass, which helps it hunt. Sharp teeth tear meat.' },
  zebra:       { name: 'Zebra', zh: '斑馬', art: 'zebra', group: 'mammals', biome: 'grassland', fact: 'Grazes on tropical grasslands. Wide, flat teeth chew grass.' },
  giraffe:     { name: 'Giraffe', zh: '長頸鹿', art: 'giraffe', group: 'mammals', biome: 'grassland', fact: 'Its long neck reaches leaves at the tops of tall trees.' },
  elephant:    { name: 'Elephant', zh: '大象', art: 'elephant', group: 'mammals', biome: 'grassland', fact: 'Lives on tropical grasslands, where there is enough food.' },
  rhino:       { name: 'Rhinoceros', zh: '犀牛', art: 'rhino', group: 'mammals', biome: 'grassland', fact: 'A big plant-eater of the grasslands.' },
  camel:       { name: 'Camel', zh: '駱駝', art: 'camel', group: 'mammals', biome: 'desert', fact: 'Loses less water than other animals, so it can live in the hot, dry desert.' },
  arctichare:  { name: 'Arctic hare', zh: '北極兔', art: 'rabbit', fx: 'grayscale(1) brightness(1.6) contrast(.8)', group: 'mammals', biome: 'polar', defense: 'colour', fact: 'Thicker, longer fur keeps it warm. White fur hides it in the snow.' },
  cottontail:  { name: 'Desert cottontail', zh: '沙漠棉尾兔', art: 'rabbit', fx: 'sepia(.6) saturate(1.3)', group: 'mammals', biome: 'desert', fact: 'Bigger, longer ears help it lose heat quickly.' },
  deer:        { name: 'Spotted deer', zh: '梅花鹿', art: 'deer', group: 'mammals', defense: 'groups', fact: 'Living in groups confuses predators while the herd runs away.' },
  porcupine:   { name: 'Porcupine', zh: '豪豬', art: 'hedgehog', fx: 'brightness(.62) contrast(1.25) saturate(.7)', group: 'mammals', defense: 'warning', fact: 'Sharp, hard spikes warn predators to stay away.' },
  skunk:       { name: 'Skunk', zh: '臭鼬', art: 'skunk', group: 'mammals', defense: 'warning', fact: 'Bold stripes warn predators: it can spray a very bad smell.' },
  squirrel:    { name: 'Squirrel', zh: '松鼠', art: 'chipmunk', group: 'mammals', fact: 'A furry mammal that feeds its young with milk.' },
  goat:        { name: 'Goat', zh: '山羊', art: 'goat', group: 'mammals', fact: 'Plant-eaters like goats have wide, flat teeth for chewing plants.' },
  cow:         { name: 'Cow', zh: '牛', art: 'cow', group: 'mammals', fact: 'Grass-eating animals have wide, flat teeth for chewing plants.' },
  mouse:       { name: 'Mouse', zh: '老鼠', art: 'mouse', group: 'mammals', fact: 'A small mammal — and a favourite meal of hawks.' },
  fox:         { name: 'Fox', zh: '狐狸', art: 'fox', group: 'mammals', fact: 'A furry hunter that eats small animals such as hares.' },
  kangaroo:    { name: 'Kangaroo', zh: '袋鼠', art: 'kangaroo', group: 'mammals', fact: 'Mother kangaroos feed their young with milk.' },
  // birds
  penguin:     { name: 'Emperor penguin', zh: '皇帝企鵝', art: 'penguin', group: 'birds', biome: 'polar', tricky: true, fact: 'Cannot fly, but has feathers, a beak and lays eggs — a bird! Webbed feet and fin-like wings help it swim.' },
  hawk:        { name: 'Hawk', zh: '鷹', art: 'eagle', group: 'birds', fact: 'Its sharp beak and claws catch prey and tear it apart.' },
  parrot:      { name: 'Parrot', zh: '鸚鵡', art: 'parrot', group: 'birds', biome: 'rainforest', fact: 'A colourful bird of the tropical rainforest.' },
  owl:         { name: 'Owl', zh: '貓頭鷹', art: 'owl', group: 'birds', fact: 'Feathers, a beak, a pair of wings and a pair of legs.' },
  flamingo:    { name: 'Flamingo', zh: '紅鶴', art: 'flamingo', group: 'birds', fact: 'Even with long legs for wading, it is a bird with feathers and a beak.' },
  chicken:     { name: 'Chicken', zh: '雞', art: 'chicken', group: 'birds', fact: 'Lays eggs and has feathers — a bird, even if it barely flies.' },
  duck:        { name: 'Duck', zh: '鴨', art: 'duck', group: 'birds', fact: 'Webbed feet for swimming, feathers to stay dry.' },
  songbird:    { name: 'Hungry bird', zh: '雀鳥', art: 'bird', group: 'birds', fact: 'Many birds hunt insects such as butterflies.' },
  hummingbird: { name: 'Hummingbird', zh: '蜂鳥', art: 'svg:hummingbird', group: 'birds', fact: 'Its long, narrow beak gets nectar out of flowers easily.' },
  pelican:     { name: 'Pelican', zh: '鵜鶘', art: 'svg:pelican', group: 'birds', fact: 'Its throat pouch catches fish and stores them for a while.' },
  // fish
  goldfish:    { name: 'Fish', zh: '魚', art: 'fish', group: 'fish', fact: 'Wet skin with scales, fins for swimming, breathes with gills.' },
  tropicalfish:{ name: 'Tropical fish', zh: '熱帶魚', art: 'tropicalfish', group: 'fish', fact: 'Swims with fins and keeps balance with them too.' },
  pufferfish:  { name: 'Puffer fish', zh: '河豚', art: 'blowfish', group: 'fish', tricky: true, fact: 'Has no scales, but lives in water, has fins and breathes with gills — still a fish!' },
  shark:       { name: 'Shark', zh: '鯊魚', art: 'shark', group: 'fish', tricky: true, fact: 'Big and scary, but it breathes with gills and has fins — a fish, not a mammal.' },
  sardine:     { name: 'Sardines', zh: '沙甸魚', art: 'fish', fx: 'grayscale(.6) brightness(1.15) hue-rotate(160deg)', group: 'fish', defense: 'groups', fact: 'A huge school of sardines looks like one big fish and scares predators.' },
  flatfish:    { name: 'Flatfish', zh: '比目魚', art: 'fish', fx: 'sepia(1) saturate(.7) brightness(.95)', group: 'fish', defense: 'mimicry', fact: 'Buries itself in sand to hide; some can change colour.' },
  seadragon:   { name: 'Leafy sea dragon', zh: '葉形海龍', art: 'svg:seadragon', group: 'fish', defense: 'mimicry', fact: 'Looks just like floating seaweed (algae) — mimicry.' },
  sawfish:     { name: 'Sawfish', zh: '鋸鰩', art: 'svg:sawfish', group: 'fish', fact: 'Its saw-like snout acts like sharp teeth to kill prey.' },
  // insects
  bee:         { name: 'Honeybee', zh: '蜜蜂', art: 'bee', group: 'insects', fact: 'Three pairs of legs, a pair of antennae and two pairs of wings.' },
  ant:         { name: 'Ant', zh: '螞蟻', art: 'ant', group: 'insects', fact: 'Head, thorax and abdomen — the three body parts of an insect.' },
  butterfly:   { name: 'Butterfly', zh: '蝴蝶', art: 'butterfly', group: 'insects', fact: 'An insect with two pairs of wings and a pair of antennae.' },
  grasshopper: { name: 'Grasshopper', zh: '蚱蜢', art: 'cricket', group: 'insects', defense: 'colour', fact: 'Green like the grass. Powerful back legs jump away from enemies, and spikes on its legs protect it.' },
  ladybug:     { name: 'Ladybird', zh: '瓢蟲', art: 'ladybug', group: 'insects', fact: 'A tiny beetle — six legs, two antennae.' },
  mosquito:    { name: 'Mosquito', zh: '蚊', art: 'mosquito', group: 'insects', fact: 'One pair of wings, three pairs of legs.' },
  fly:         { name: 'Fly', zh: '蒼蠅', art: 'fly', group: 'insects', fact: 'An insect — and a snack for mantises and chameleons.' },
  fivering:    { name: 'Common five-ring', zh: '矍眼蝶', art: 'butterfly', fx: 'sepia(1) saturate(1.6) hue-rotate(-15deg) brightness(.9)', group: 'insects', defense: 'warning', fact: 'Eyespots on its wings look like the eyes of a bigger animal and scare predators.' },
  oakleaf:     { name: 'Orange oakleaf', zh: '枯葉蝶', art: 'fallenleaf', group: 'insects', defense: 'mimicry', fact: 'With wings closed it looks exactly like a dead leaf.' },
  stickinsect: { name: 'Stick insect', zh: '竹節蟲', art: 'svg:stickinsect', group: 'insects', defense: 'mimicry', fact: 'Looks like a tree branch, so predators pass it by — mimicry.' },
  mantis:      { name: 'Mantis', zh: '螳螂', art: 'svg:mantis', group: 'insects', fact: 'Its long, powerful forelegs are lined with spikes to grab prey.' },
  // other animals without backbones
  spider:      { name: 'Spider', zh: '蜘蛛', art: 'spider', group: 'invertebrate', fact: 'Eight legs and no antennae — no backbone, but NOT an insect.' },
  scorpion:    { name: 'Scorpion', zh: '蠍子', art: 'scorpion', group: 'invertebrate', biome: 'desert', fact: 'A desert animal with no backbone and eight legs — not an insect.' },
  crab:        { name: 'Crab', zh: '蟹', art: 'crab', group: 'invertebrate', fact: 'Crabs have no backbone.' },
  shrimp:      { name: 'Shrimp', zh: '蝦', art: 'shrimp', group: 'invertebrate', fact: 'Shrimps have no backbone.' },
  jellyfish:   { name: 'Jellyfish', zh: '水母', art: 'jellyfish', group: 'invertebrate', fact: 'A jellyfish has no bones at all.' },
  octopus:     { name: 'Octopus', zh: '八爪魚', art: 'octopus', group: 'invertebrate', fact: 'Soft body, no backbone.' },
  snail:       { name: 'Snail', zh: '蝸牛', art: 'snail', group: 'invertebrate', fact: 'When it is dry, it stays inactive and seals its shell mouth with mucus to reduce water loss.' },
  worm:        { name: 'Earthworm', zh: '蚯蚓', art: 'worm', group: 'invertebrate', fact: 'No backbone, no legs.' },
};

// ---------- Plants ----------
export const PLANTS = {
  rose:       { name: 'Rose', zh: '玫瑰', art: 'rose', flowering: true, where: 'land' },
  sunflower:  { name: 'Sunflower', zh: '向日葵', art: 'sunflower', flowering: true, where: 'land' },
  tulip:      { name: 'Tulip', zh: '鬱金香', art: 'tulip', flowering: true, where: 'land' },
  flametree:  { name: 'Flame tree', zh: '鳳凰木', art: 'svg:flametree', flowering: true, where: 'land' },
  cottontree: { name: 'Cotton tree', zh: '木棉', art: 'svg:cottontree', flowering: true, where: 'land' },
  waterlily:  { name: 'Water lily', zh: '睡蓮', art: 'lotus', fx: 'hue-rotate(-60deg) saturate(1.2)', flowering: true, where: 'water' },
  lotus:      { name: 'Lotus', zh: '荷花', art: 'lotus', flowering: true, where: 'water' },
  fern:       { name: 'Fern', zh: '蕨類', art: 'svg:fern', flowering: false, where: 'land' },
  moss:       { name: 'Moss', zh: '苔蘚', art: 'svg:moss', flowering: false, where: 'land' },
  pine:       { name: 'Pine', zh: '松樹', art: 'pine', flowering: false, where: 'land' },
  cactus:     { name: 'Cactus', zh: '仙人掌', art: 'cactus', where: 'land' },
  oleander:   { name: 'Oleander', zh: '夾竹桃', art: 'hibiscus', fx: 'hue-rotate(-25deg) saturate(1.2)' },
  lithops:    { name: 'Lithops', zh: '生石花', art: 'svg:lithops' },
  nettle:     { name: 'Himalayan nettle', zh: '喜馬拉雅蕁麻', art: 'svg:nettle' },
  mimosa:     { name: 'Sensitive plant', zh: '含羞草', art: 'svg:mimosa' },
  mangrove:   { name: 'Mangrove', zh: '紅樹', art: 'svg:mangrove' },
};

// ---------- Biomes ----------
export const BIOMES = {
  rainforest: {
    id: 'rainforest', name: 'Tropical rainforest', zh: '熱帶雨林', icon: 'nationalpark', color: '#1E8C4E',
    climate: 'Hot and humid all year round', water: 'High rainfall all year round', food: 'Dense forest with a great variety of food', variety: 'more',
    plants: 'A large variety of plants grow to form a dense forest.',
  },
  desert: {
    id: 'desert', name: 'Desert', zh: '沙漠', icon: 'desert', color: '#E39A3B',
    climate: 'Very hot and dry; big temperature difference between day and night', water: 'Low rainfall, not enough water', food: 'Few plants, lack of food', variety: 'fewer',
    plants: 'Very few plants grow.',
  },
  grassland: {
    id: 'grassland', name: 'Tropical grassland', zh: '熱帶草原', icon: 'rice', color: '#C9B23A',
    climate: 'Warm all year round', water: 'Rainfall varies with the seasons', food: 'Few trees in tall grass; enough food', variety: 'more',
  },
  polar: {
    id: 'polar', name: 'Polar region', zh: '極地', icon: 'snowmountain', color: '#5DA9E9',
    climate: 'Very cold all year round', water: 'Land covered with snow and ice', food: 'Few plants, lack of food', variety: 'fewer',
    plants: 'Very few plants grow.',
  },
};
export const BIOME_ORDER = ['rainforest', 'desert', 'grassland', 'polar'];

// =============================================================
//  GAME 1 · Sort Storm
// =============================================================
export const SORT_WAVES = [
  { id: 'w1', title: 'Wave 1 · Warm-up', speed: 1, items: ['frog', 'hawk', 'parrot', 'goldfish', 'lion', 'lizard', 'bee', 'zebra', 'snake', 'butterfly', 'owl', 'tropicalfish', 'monkey', 'ant', 'tortoise', 'giraffe'] , count: 8 },
  { id: 'w2', title: 'Wave 2 · Tricky twins', speed: 1.15, items: ['bat', 'dolphin', 'whale', 'penguin', 'seaturtle', 'salamander', 'crocodile', 'shark', 'pufferfish', 'harpseal', 'chicken', 'dartfrog', 'chameleon', 'flamingo'], count: 8 },
  { id: 'w3', title: 'Wave 3 · Clue cards', speed: 1.25, clues: true, count: 8 },
];

export const CLUE_CARDS = [
  { text: 'Has feathers and a beak', group: 'birds' },
  { text: 'Lays eggs, has wings and is warm-blooded', group: 'birds' },
  { text: 'Hair on its body; feeds its young with milk', group: 'mammals' },
  { text: 'Gives birth to live young', group: 'mammals' },
  { text: 'Moist skin and no scales', group: 'amphibians' },
  { text: 'Young live in water; adults mainly live on land', group: 'amphibians' },
  { text: 'Adults breathe with lungs AND skin', group: 'amphibians' },
  { text: 'Dry skin with dry, hard scales', group: 'reptiles' },
  { text: 'Dry skin; some have a hard shell', group: 'reptiles' },
  { text: 'Breathes with gills and swims with fins', group: 'fish' },
  { text: 'Wet skin, usually covered with scales', group: 'fish' },
  { text: 'Three pairs of legs and a pair of antennae', group: 'insects' },
  { text: 'Body made of head, thorax and abdomen', group: 'insects' },
];

export const BACKBONE_ITEMS = {
  yes: ['goldfish', 'frog', 'snake', 'bat', 'penguin', 'shark', 'whale', 'crocodile', 'parrot', 'seaturtle'],
  no: ['bee', 'butterfly', 'ant', 'crab', 'shrimp', 'jellyfish', 'octopus', 'snail', 'worm', 'spider'],
};

// =============================================================
//  GAME 2 · Creature Lab
// =============================================================
export const LAB_SLOTS = [
  { id: 'cover', label: 'Body covering', options: [
    { id: 'feathers', text: 'Feathers', art: 'feather' },
    { id: 'hair', text: 'Hair / fur', art: 'paw' },
    { id: 'dryScales', text: 'Dry skin, hard scales', art: 'shield' },
    { id: 'moist', text: 'Moist skin, no scales', art: 'droplet' },
    { id: 'wetScales', text: 'Wet skin with scales', art: 'wave' },
    { id: 'exo', text: 'Hard outer body case', art: 'shell' },
  ]},
  { id: 'breath', label: 'Breathes with', options: [
    { id: 'lungs', text: 'Lungs', art: 'lungs' },
    { id: 'gills', text: 'Gills', art: 'bubbles' },
    { id: 'lungsSkin', text: 'Lungs + skin', art: 'droplet' },
    { id: 'holes', text: 'Tiny holes on body', art: 'dizzy' },
  ]},
  { id: 'babies', label: 'Babies', options: [
    { id: 'eggs', text: 'Lays eggs', art: 'egg' },
    { id: 'milk', text: 'Gives birth + milk', art: 'babybottle' },
  ]},
  { id: 'body', label: 'Body parts', options: [
    { id: 'wings', text: '1 pair wings + 1 pair legs', art: 'feather' },
    { id: 'four', text: '2 pairs of limbs', art: 'paw' },
    { id: 'none', text: 'No legs', art: 'snake' },
    { id: 'fins', text: 'Fins', art: 'tropicalfish' },
    { id: 'six', text: '3 pairs of legs + antennae', art: 'ant' },
  ]},
  { id: 'temp', label: 'Body temperature', options: [
    { id: 'warm', text: 'Warm-blooded', art: 'fire' },
    { id: 'cold', text: 'Cold-blooded', art: 'snowflake' },
  ]},
];

export const LAB_RULES = {
  birds:      { cover: ['feathers'], breath: ['lungs'], babies: ['eggs'], body: ['wings'], temp: ['warm'] },
  mammals:    { cover: ['hair'], breath: ['lungs'], babies: ['milk'], body: ['four', 'wings', 'fins'], temp: ['warm'] },
  reptiles:   { cover: ['dryScales'], breath: ['lungs'], babies: ['eggs'], body: ['four', 'none'], temp: ['cold'] },
  amphibians: { cover: ['moist'], breath: ['lungsSkin'], babies: ['eggs'], body: ['four'], temp: ['cold'] },
  fish:       { cover: ['wetScales'], breath: ['gills'], babies: ['eggs'], body: ['fins'], temp: ['cold'] },
  insects:    { cover: ['exo'], breath: ['holes'], babies: ['eggs'], body: ['six'], temp: ['cold'] },
};

// what pops out of the machine when the recipe is right
export const LAB_RESULTS = {
  birds: { wings: ['parrot', 'owl', 'hawk', 'flamingo', 'penguin'] },
  mammals: { four: ['lion', 'zebra', 'tiger', 'giraffe', 'monkey'], wings: ['bat'], fins: ['dolphin', 'whale'] },
  reptiles: { four: ['lizard', 'crocodile', 'seaturtle'], none: ['snake'] },
  amphibians: { four: ['frog', 'salamander'] },
  fish: { fins: ['goldfish', 'tropicalfish', 'shark'] },
  insects: { six: ['bee', 'butterfly', 'ant', 'ladybug'] },
};

export const LAB_ORDERS = [
  { group: 'birds', who: 'owl', say: 'I need a BIRD for my aviary!' },
  { group: 'fish', who: 'goldfish', say: 'Fill my aquarium with a FISH, please.' },
  { group: 'amphibians', who: 'frog', say: 'My pond needs an AMPHIBIAN!' },
  { group: 'reptiles', who: 'lizard', say: 'Build me a REPTILE for the desert zoo.' },
  { group: 'insects', who: 'bee', say: 'My garden wants an INSECT.' },
  { group: 'mammals', who: 'monkey', say: 'One MAMMAL, please!' },
  { group: 'mammals', body: 'wings', who: 'bat', say: 'I want a MAMMAL that can FLY. Possible?!' },
  { group: 'mammals', body: 'fins', who: 'dolphin', say: 'Make a MAMMAL that swims with FINS!' },
  { group: 'reptiles', body: 'none', who: 'snake', say: 'A REPTILE with NO legs, please.' },
];

export const LAB_EXPLAIN = {
  cover: {
    feathers: 'Only birds have feathers.', hair: 'Hair or fur means mammal.', dryScales: 'Dry skin with hard scales belongs to reptiles.',
    moist: 'Moist skin with no scales belongs to amphibians.', wetScales: 'Wet skin with scales belongs to fish.', exo: 'Insects have a hard outer body case.',
  },
  breath: { lungs: 'Birds, mammals and reptiles breathe with lungs.', gills: 'Fish breathe with gills.', lungsSkin: 'Adult amphibians breathe with lungs AND skin.', holes: 'Insects breathe through tiny holes on their bodies.' },
  babies: { eggs: 'Birds, fish, reptiles, amphibians and insects lay eggs.', milk: 'Mammals give birth to live young and feed them milk.' },
  body: { wings: 'A pair of wings and a pair of legs: birds (and bats!).', four: 'Two pairs of limbs: many mammals, reptiles and amphibians.', none: 'No legs: snakes (reptiles).', fins: 'Fins: fish (and dolphins, whales).', six: 'Three pairs of legs + antennae: insects.' },
  temp: { warm: 'Only birds and mammals are warm-blooded.', cold: 'Fish, amphibians, reptiles and insects are cold-blooded.' },
};

// Flowchart detective (school Task 1 key)
export const DETECTIVE_CASES = [
  { id: 'bat', clues: ['I have hair on my body.', 'I feed my babies with milk.', 'I can fly at night!'] },
  { id: 'penguin', clues: ['I cannot fly.', 'I have feathers and a beak.', 'I lay eggs on the ice.'] },
  { id: 'salamander', clues: ['I look like a lizard.', 'My skin is moist, with no scales.', 'My young live in water.'] },
  { id: 'seaturtle', clues: ['I live in the sea.', 'My skin is dry, with scales.', 'I breathe with lungs.'] },
  { id: 'dolphin', clues: ['I swim with fins.', 'I breathe with lungs.', 'I feed my baby milk.'] },
  { id: 'bee', clues: ['I have six legs.', 'I have a pair of antennae.', 'My body has three parts.'] },
  { id: 'tropicalfish', clues: ['I live in water.', 'My wet skin is covered with scales.', 'I breathe with gills.'] },
  { id: 'crocodile', clues: ['My babies swim in rivers.', 'My skin is dry and covered with hard scales.', 'I lay eggs.'] },
  { id: 'frog', clues: ['I was a tadpole once.', 'My skin is moist.', 'I breathe with lungs and skin.'] },
  { id: 'owl', clues: ['I hunt at night.', 'I have feathers.', 'I hatch from an egg.'] },
];

export const FLOW_NODES = {
  backbone: { q: 'Does it have a backbone?', hint: 'Insects have no backbone (vertebrates do).', attr: 'backbone', yes: 'warm', no: 'insects' },
  warm:     { q: 'Is it warm-blooded?', hint: 'Only birds and mammals keep a warm body temperature.', attr: 'warm', yes: 'eggs', no: 'scales' },
  eggs:     { q: 'Does it lay eggs?', hint: 'Mammals give birth to live young.', attr: 'eggs', yes: 'birds', no: 'mammals' },
  scales:   { q: 'Does it have scales?', hint: 'Amphibians have no scales.', attr: 'scales', yes: 'dry', no: 'amphibians' },
  dry:      { q: 'Does it have dry skin?', hint: 'Reptiles: dry skin. Fish: wet skin.', attr: 'dry', yes: 'reptiles', no: 'fish' },
};

// =============================================================
//  GAME 3 · Plant Survivor
// =============================================================
export const PLANT_PARTS = {
  roots: [
    { id: 'deep', text: 'Deep roots', does: 'absorb water deep in the ground' },
    { id: 'shallow', text: 'Shallow roots, wide area', does: 'absorb water quickly when it rains' },
    { id: 'buttress', text: 'Buttress roots', does: 'support very tall trees' },
    { id: 'aerial', text: 'Aerial roots', does: 'absorb oxygen from the air' },
    { id: 'normal', text: 'Ordinary roots', does: 'hold the plant in the soil' },
  ],
  stem: [
    { id: 'thick', text: 'Thick, juicy stem', does: 'stores water' },
    { id: 'trunk', text: 'Tall woody trunk', does: 'lifts leaves up high' },
    { id: 'climbing', text: 'Climbing stem', does: 'twines around trees to reach sunlight' },
    { id: 'holes', text: 'Underground stem with holes', does: 'lets gases move in and out' },
  ],
  leaves: [
    { id: 'needle', text: 'Needle-shaped leaves', does: 'reduce water loss' },
    { id: 'broad', text: 'Broad, smooth leaves', does: 'get more sunlight and shed rainwater' },
    { id: 'waxy', text: 'Waxy leaves', does: 'reduce water loss in salty soil' },
  ],
};

export const PLANT_LEVELS = [
  {
    id: 'desert', biome: 'desert', title: 'Desert dunes', brief: 'Low rainfall. Scorching days, cold nights. Rain is rare and dries up fast.',
    need: { roots: ['deep', 'shallow'], stem: ['thick'], leaves: ['needle'] },
    events: [
      { icon: 'sun', text: 'Scorching sun all day' },
      { icon: 'rain', text: 'A short shower — gone in minutes!' },
      { icon: 'coldface', text: 'Freezing night' },
    ],
    win: 'Cactus power! Your roots grab water, the thick stem stores it and the needles stop water loss.',
  },
  {
    id: 'giant', biome: 'rainforest', title: 'Rainforest giant', brief: 'Hot and rainy all year. The forest is so dense that little sunlight reaches the ground.',
    need: { roots: ['buttress'], stem: ['trunk'], leaves: ['broad'] },
    events: [
      { icon: 'rain', text: 'Heavy rain every afternoon' },
      { icon: 'cloud', text: 'Deep shade under the canopy' },
      { icon: 'tornado', text: 'A storm shakes the tall trees' },
    ],
    win: 'Buttress roots hold your giant trunk up to the sunlight, and broad smooth leaves shed the rain.',
  },
  {
    id: 'vine', biome: 'rainforest', title: 'Rainforest climber', brief: 'You are a small plant on the dark forest floor. Sunlight is far above!',
    lock: { roots: 'normal' },
    need: { roots: ['normal'], stem: ['climbing'], leaves: ['broad'] },
    events: [
      { icon: 'cloud', text: 'Dark shade on the forest floor' },
      { icon: 'tree', text: 'A tall tree trunk nearby' },
      { icon: 'rain', text: 'Downpour!' },
    ],
    win: 'You twined up the tree and reached the sunlight!',
  },
  {
    id: 'mangrove', biome: 'wetland', title: 'Mangrove mudflat', brief: 'Wetland in Hong Kong. Loose, salty mud with little oxygen. Water levels keep changing.',
    lock: { stem: 'trunk' },
    need: { roots: ['aerial'], stem: ['trunk'], leaves: ['waxy'] },
    events: [
      { icon: 'wave', text: 'Salty tide rushes in' },
      { icon: 'bubbles', text: 'Mud with almost no oxygen' },
      { icon: 'sun', text: 'Low tide in the hot sun' },
    ],
    win: 'Aerial roots breathe in oxygen from the air, and waxy leaves reduce water loss in salty soil.',
  },
  {
    id: 'lotus', biome: 'wetland', title: 'Lotus pond', brief: 'Pond mud is soggy and lacks oxygen.',
    lock: { roots: 'normal', leaves: 'broad' },
    need: { roots: ['normal'], stem: ['holes'], leaves: ['broad'] },
    events: [
      { icon: 'bubbles', text: 'Thick mud with no oxygen' },
      { icon: 'wave', text: 'Pond water all around' },
      { icon: 'sun', text: 'Summer sunshine' },
    ],
    win: 'Your stem grows underground with holes, so gases can move in and out — just like a lotus root!',
  },
];

// why a wrong part fails in a biome
export const PLANT_FAIL = {
  desert: {
    buttress: 'Buttress roots are for super-tall rainforest trees — no help finding water here.',
    aerial: 'Aerial roots take oxygen from the air. In the desert you need WATER.',
    normal: 'Ordinary roots can\'t reach deep water or catch quick rain.',
    trunk: 'A woody trunk can\'t store water for dry days.', climbing: 'Nothing to climb in the desert!', holes: 'An underground hole-y stem is for oxygen-poor wetland mud.',
    broad: 'Broad leaves lose lots of water in the hot sun.', waxy: 'Close! But cacti use needle-shaped leaves to reduce water loss.',
  },
  rainforest: {
    deep: 'Water is everywhere here — your problem is reaching sunlight.', shallow: 'Water is not a problem here.', aerial: 'Rainforest soil has enough oxygen.', normal: 'Ordinary roots can\'t hold up a giant tree.',
    thick: 'No need to store water in such a rainy place.', holes: 'That stem is for wetland mud.', climbing: 'A climbing stem works for vines — but this giant needs a tall trunk.', trunk: 'A climber can\'t grow a giant trunk in the shade — twine around a tree instead!',
    needle: 'Needles reduce water loss — not a rainforest problem.', waxy: 'Waxy leaves are for salty wetland soil.',
  },
  wetland: {
    deep: 'The mud has little oxygen — deep roots would suffocate.', shallow: 'Water is not the problem — oxygen is.', buttress: 'Buttress roots don\'t solve the oxygen problem.', normal: 'Ordinary roots get no oxygen in this mud.',
    thick: 'Storing water is pointless in a pond.', climbing: 'Climbing won\'t help in the mud.', trunk: 'A trunk can\'t move gases through the mud.',
    needle: 'Needle leaves are for deserts.', broad: 'Broad leaves are fine in rainforests, but salty soil makes plants lose water.',
  },
};

export const PLANT_DEFENSES = [
  { plant: 'oleander', defense: 'poison', text: 'Poisonous', reaction: 'sick', line: 'Oleanders are poisonous — the goat feels sick and runs away!' },
  { plant: 'lithops', defense: 'stones', text: 'Looks like stones', reaction: 'confused', line: 'Lithops look like stones — the animal can\'t spot them.' },
  { plant: 'nettle', defense: 'spikes', text: 'Spikes on the stem', reaction: 'ouch', line: 'Himalayan nettle stems are full of spikes — ouch, stung!' },
  { plant: 'mimosa', defense: 'close', text: 'Leaves close when touched', reaction: 'scared', line: 'Sensitive plant leaves close when touched — the movement scares animals away.' },
  { plant: 'cactus', defense: 'needles', text: 'Sharp needle-shaped leaves', reaction: 'ouch', line: 'Sharp needles keep hungry mouths away.' },
];
export const HERBIVORES = ['goat', 'cow', 'deer', 'rabbit', 'zebra'];

export const SEED_SORT = [
  { round: 'flower', bins: [{ id: 'yes', label: 'Flowering', art: 'blossom' }, { id: 'no', label: 'Non-flowering', art: 'herb' }],
    items: [['rose', 'yes'], ['sunflower', 'yes'], ['tulip', 'yes'], ['flametree', 'yes'], ['cottontree', 'yes'], ['waterlily', 'yes'], ['fern', 'no'], ['moss', 'no'], ['pine', 'no']] },
  { round: 'where', bins: [{ id: 'land', label: 'Land plant', art: 'seedling' }, { id: 'water', label: 'Water plant', art: 'wave' }],
    items: [['flametree', 'land'], ['waterlily', 'water'], ['lotus', 'water'], ['cactus', 'land'], ['sunflower', 'land'], ['pine', 'land'], ['rose', 'land']] },
];

// =============================================================
//  GAME 4 · Biome Rescue
// =============================================================
export const AIRLIFT_ANIMALS = ['orangutan', 'gorilla', 'tiger', 'parrot', 'sloth', 'dartfrog', 'monkey', 'camel', 'scorpion', 'cottontail', 'tortoise', 'zebra', 'lion', 'giraffe', 'elephant', 'rhino', 'polarbear', 'penguin', 'harpseal', 'arctichare'];
export const AIRLIFT_FACTS = [
  ['Very cold all year round', 'polar'],
  ['Land covered with snow and ice', 'polar'],
  ['High rainfall all year round', 'rainforest'],
  ['Hot and humid all year round', 'rainforest'],
  ['Dense forest, a great variety of food', 'rainforest'],
  ['Low rainfall all year round', 'desert'],
  ['Huge temperature difference between day and night', 'desert'],
  ['Rainfall varies with the seasons', 'grassland'],
  ['Few trees in tall grass', 'grassland'],
  ['Warm all year round, with enough food', 'grassland'],
];

export const SURVIVAL = [
  {
    id: 'polarbear', where: 'polar', danger: 'Body heat', title: 'Arctic blizzard',
    traits: [
      { label: 'Fur', options: ['Thick', 'Thin'], ok: 0, why: 'Thick fur keeps the body warm.' },
      { label: 'Ears', options: ['Small', 'Large'], ok: 0, why: 'Small ears lose less heat.' },
      { label: 'Under the skin', options: ['Thick layer of fat', 'Thin layer of fat'], ok: 0, why: 'A thick layer of fat keeps it warm.' },
    ],
  },
  {
    id: 'penguin', where: 'polar', danger: 'Body heat', title: 'Antarctic winter',
    traits: [
      { label: 'Adult feathers', options: ['Short and thick', 'Sparse'], ok: 0, why: 'Short, thick, greasy feathers are waterproof and hold heat.' },
      { label: 'Feet', options: ['Webbed feet', 'Sharp claws'], ok: 0, why: 'Webbed feet and fin-like wings help it swim and catch fish.' },
      { label: 'Chick feathers', options: ['Grey and dense', 'Red and thin'], ok: 0, why: 'Dense grey feathers keep chicks warm.' },
    ],
  },
  {
    id: 'arctichare', where: 'polar', danger: 'Body heat', title: 'Snowy tundra',
    traits: [
      { label: 'Fur', options: ['Thicker and longer', 'Short and thin'], ok: 0, why: 'Thicker, longer fur keeps it warm.' },
      { label: 'Ears', options: ['Small', 'Big and long'], ok: 0, why: 'Smaller ears lose less heat.' },
      { label: 'Colour', options: ['White', 'Brown'], ok: 0, why: 'White fur blends in with the snow (protective colouration).' },
    ],
  },
  {
    id: 'cottontail', where: 'desert', danger: 'Cooling', title: 'Desert heatwave',
    traits: [
      { label: 'Ears', options: ['Big and long', 'Small'], ok: 0, why: 'Bigger, longer ears help it lose heat quickly.' },
      { label: 'Colour', options: ['Sandy brown', 'Snow white'], ok: 0, why: 'Sandy colours blend in with the desert.' },
    ],
  },
  {
    id: 'camel', where: 'desert', danger: 'Water', title: 'Sahara crossing',
    traits: [
      { label: 'Water use', options: ['Loses less water', 'Sweats a lot'], ok: 0, why: 'Camels lose less water than other animals.' },
      { label: 'Waste', options: ['Concentrated urine, dry droppings', 'Lots of watery urine'], ok: 0, why: 'Concentrated urine and dry droppings save water.' },
    ],
  },
  {
    id: 'snail', where: 'desert', danger: 'Water', title: 'Dry spell',
    traits: [
      { label: 'When it is dry', options: ['Stay inactive in the shell', 'Crawl around in the sun'], ok: 0, why: 'Staying inactive saves water.' },
      { label: 'Shell mouth', options: ['Seal it with mucus', 'Leave it open'], ok: 0, why: 'Sealing the shell mouth with mucus reduces water loss.' },
    ],
  },
  {
    id: 'tortoise', where: 'desert', danger: 'Water', title: 'Hot, dry desert',
    traits: [
      { label: 'Skin', options: ['Thick scales', 'Thin moist skin'], ok: 0, why: 'Thick scales reduce water loss.' },
      { label: 'Body', options: ['Hard shell', 'Soft body'], ok: 0, why: 'A hard shell reduces water loss and blocks heat.' },
    ],
  },
  {
    id: 'snake', where: 'winter', danger: 'Energy', title: 'Freezing winter',
    traits: [
      { label: 'In winter', options: ['Go into deep sleep', 'Hunt all winter'], ok: 0, why: 'Deep sleep in winter saves energy when food is scarce.' },
    ],
  },
];

// =============================================================
//  GAME 5 · Hide & Seek Safari
// =============================================================
export const DEFENSES = {
  colour:  { id: 'colour', name: 'Protective colouration', short: 'Colour camo', icon: 'eyes', desc: 'Its colours match the surroundings, so it blends in.' },
  mimicry: { id: 'mimicry', name: 'Mimicry', short: 'Look-alike', icon: 'fallenleaf', desc: 'It looks like something else — a twig, a leaf, seaweed, the sea floor.' },
  warning: { id: 'warning', name: 'Warning', short: 'Warning', icon: 'warning', desc: 'Bright colours, eyespots, spikes or smells scare predators away.' },
  groups:  { id: 'groups', name: 'Living in groups', short: 'Groups', icon: 'deer', desc: 'Many animals together confuse or scare predators.' },
};

export const HIDE_SCENES = [
  { id: 'snow', title: 'Snowfield', bg: 'snow', target: 'harpseal', decoys: ['ice', 'snowflake', 'cloud'], answer: 'colour' },
  { id: 'savanna', title: 'Dry grass', bg: 'savanna', target: 'lion', decoys: ['rice', 'rock', 'wood'], answer: 'colour' },
  { id: 'meadow', title: 'Green meadow', bg: 'meadow', target: 'grasshopper', decoys: ['herb', 'leafygreen', 'seedling', 'clover'], answer: 'colour' },
  { id: 'twigs', title: 'Twiggy bush', bg: 'twigs', target: 'stickinsect', decoys: ['svg:twig'], answer: 'mimicry' },
  { id: 'kelp', title: 'Seaweed reef', bg: 'kelp', target: 'seadragon', decoys: ['svg:kelp', 'herb'], answer: 'mimicry' },
  { id: 'sand', title: 'Sandy sea floor', bg: 'sand', target: 'flatfish', decoys: ['rock', 'shell', 'svg:pebble'], answer: 'mimicry' },
  { id: 'leaves', title: 'Leaf litter', bg: 'leaves', target: 'oakleaf', decoys: ['fallenleaf', 'fallenleaf', 'wood'], answer: 'mimicry' },
  { id: 'tundra', title: 'Tundra', bg: 'snow', target: 'arctichare', decoys: ['ice', 'snowflake', 'rock'], answer: 'colour' },
];

export const PANIC_ROUNDS = [
  { prey: 'sardine', predator: 'shark', answer: ['groups'], line: 'Thousands of sardines swirl into one giant "fish"!' },
  { prey: 'dartfrog', predator: 'snake', answer: ['warning'], line: 'Bright colours shout: "My skin is poisonous!"' },
  { prey: 'stickinsect', predator: 'hawk', answer: ['mimicry'], line: 'Just a twig… nothing to eat here.' },
  { prey: 'harpseal', predator: 'polarbear', answer: ['colour'], line: 'White fur on white snow — invisible!' },
  { prey: 'fivering', predator: 'songbird', answer: ['warning'], line: 'Eyespots flash — they look like the eyes of a big animal!' },
  { prey: 'deer', predator: 'tiger', answer: ['groups'], line: 'The herd scatters together — the tiger can\'t pick one.' },
  { prey: 'porcupine', predator: 'lion', answer: ['warning'], line: 'Spikes up! Hard spikes scare the predator away.' },
  { prey: 'seadragon', predator: 'shark', answer: ['mimicry'], line: 'Floating "seaweed"… the shark swims past.' },
  { prey: 'grasshopper', predator: 'hawk', answer: ['colour'], line: 'Green on green grass — hidden!' },
  { prey: 'skunk', predator: 'fox', answer: ['warning'], line: 'Bold stripes warn: "I smell terrible!"' },
  { prey: 'flatfish', predator: 'shark', answer: ['mimicry'], line: 'Buried in sand, it looks like the sea floor.' },
  { prey: 'oakleaf', predator: 'songbird', answer: ['mimicry', 'colour'], line: 'Wings closed — it\'s a dead leaf!' },
  { prey: 'chameleon', predator: 'hawk', answer: ['colour'], line: 'It changes colour to match the branch.' },
  { prey: 'arctichare', predator: 'fox', answer: ['colour'], line: 'White fur in the snow — protective colouration.' },
];

// =============================================================
//  GAME 6 · Feeding Frenzy
// =============================================================
export const FEEDERS = [
  { id: 'hummingbird', food: 'nectar', foodArt: 'hibiscus', feature: 'Long, narrow beak', does: 'gets nectar out of flowers easily' },
  { id: 'giraffe', food: 'treetop leaves', foodArt: 'tree', feature: 'Long neck', does: 'reaches leaves at the top of tall trees' },
  { id: 'lion', food: 'meat', foodArt: 'meat', feature: 'Sharp teeth', does: 'tear the prey apart' },
  { id: 'mantis', food: 'a fly', foodArt: 'fly', feature: 'Spiky forelegs', does: 'attack and hold prey' },
  { id: 'hawk', food: 'a mouse', foodArt: 'mouse', feature: 'Sharp beak and claws', does: 'catch prey and tear it apart' },
  { id: 'pelican', food: 'fish', foodArt: 'fish', feature: 'Throat pouch', does: 'catches fish and stores them for a while' },
  { id: 'sawfish', food: 'shrimp', foodArt: 'shrimp', feature: 'Saw-like snout', does: 'acts like sharp teeth to kill prey' },
  { id: 'cow', food: 'grass', foodArt: 'rice', feature: 'Wide, flat teeth', does: 'chew plants' },
  { id: 'chameleon', food: 'a cricket', foodArt: 'cricket', feature: 'Long, sticky tongue', does: 'catches insects' },
];

// =============================================================
//  GAME 7 · Fake-Bot showdown
// =============================================================
// [word] marks the mistake. fix = correction, alts = wrong corrections
export const STATEMENTS = [
  { s: 'Temperature and rainfall affect the growth of plants.', ok: true },
  { s: 'Very few plants grow in deserts because of the [high] rainfall.', fix: 'low', alts: ['heavy', 'cold'] },
  { s: 'Cacti have shallow roots spread over a wide area to [lose heat].', fix: 'absorb water', alts: ['get oxygen', 'grow taller'] },
  { s: 'The stems of lotuses have holes to help [water] exchange.', fix: 'gaseous', alts: ['salt', 'food'] },
  { s: 'Mangroves have waxy leaves because of the [low] salt content in the soil.', fix: 'high', alts: ['no', 'sweet'] },
  { s: 'When the leaves of a sensitive plant are touched, they close.', ok: true },
  { s: 'Bats have hair and feed their young with milk, so they are [birds].', fix: 'mammals', alts: ['insects', 'reptiles'] },
  { s: 'Dolphins feed their young with milk, so they are mammals.', ok: true },
  { s: 'Sea turtles live in the sea, but they are [amphibians].', fix: 'reptiles', alts: ['fish', 'mammals'] },
  { s: 'Amphibians have [dry] skin and no scales.', fix: 'moist', alts: ['hairy', 'scaly'] },
  { s: 'Reptiles have dry skin and scales, and breathe with lungs.', ok: true },
  { s: 'Adult amphibians breathe with their lungs and through their skin.', ok: true },
  { s: 'Insects have [four] pairs of legs.', fix: 'three', alts: ['two', 'five'] },
  { s: 'An insect\'s body has three parts: the head, the thorax and the abdomen.', ok: true },
  { s: 'Fish breathe with their [lungs].', fix: 'gills', alts: ['skin', 'fins'] },
  { s: 'Birds and mammals are warm-blooded.', ok: true },
  { s: 'Penguins cannot fly, but they have feathers and lay eggs, so they are [mammals].', fix: 'birds', alts: ['fish', 'reptiles'] },
  { s: 'Ferns and pines are [flowering] plants.', fix: 'non-flowering', alts: ['water', 'climbing'] },
  { s: 'Flame trees and cotton trees are flowering plants.', ok: true },
  { s: 'Water lilies are [land] plants.', fix: 'water', alts: ['desert', 'non-flowering'] },
  { s: 'Buttress roots support tall trees so they can get more sunlight.', ok: true },
  { s: 'Aerial roots absorb [water] from the air.', fix: 'oxygen', alts: ['salt', 'sunlight'] },
  { s: 'Cacti have [thin] stems to store water.', fix: 'thick', alts: ['climbing', 'hollow'] },
  { s: 'Climbing plants twine their stems around trees to reach more sunlight.', ok: true },
  { s: 'Needle-shaped leaves help cacti [get more sunlight].', fix: 'reduce water loss', alts: ['shed rainwater', 'absorb oxygen'] },
  { s: 'Lithops look like stones, so animals cannot spot them easily.', ok: true },
  { s: 'The stems of Himalayan nettles are [smooth].', fix: 'full of spikes', alts: ['poisonous', 'waxy'] },
  { s: 'Polar bears have [large] ears to reduce heat loss.', fix: 'small', alts: ['long', 'pointed'] },
  { s: 'Polar bears have a thick layer of fat under the skin to keep warm.', ok: true },
  { s: 'Snakes go into deep sleep in winter to save energy.', ok: true },
  { s: 'Desert cottontails have [small] ears to lose heat quickly.', fix: 'big, long', alts: ['round', 'furry'] },
  { s: 'Snails seal their shell mouth with mucus to reduce water loss.', ok: true },
  { s: 'Deserts and polar regions have a [great] variety of animals.', fix: 'small', alts: ['warm', 'huge'] },
  { s: 'Tropical rainforests and tropical grasslands have more kinds of animals.', ok: true },
  { s: 'Poison dart frogs have [dull] colours that warn predators.', fix: 'bright', alts: ['white', 'brown'] },
  { s: 'Sardines live in large groups that look like one big fish.', ok: true },
  { s: 'A stick insect looks like a twig. This is called [warning].', fix: 'mimicry', alts: ['living in groups', 'hibernation'] },
  { s: 'A hummingbird has a [short and thick] beak to get nectar.', fix: 'long and narrow', alts: ['sharp and hooked', 'wide and flat'] },
  { s: 'Meat-eating animals have [wide and flat] teeth to tear meat.', fix: 'sharp', alts: ['tiny', 'soft'] },
  { s: 'A mantis catches prey with forelegs lined with sharp spikes.', ok: true },
  { s: 'Birds migrate to [colder] places in winter.', fix: 'warmer', alts: ['darker', 'drier'] },
  { s: 'The survival of animals depends on climate, water supply and food supply.', ok: true },
  { s: 'Whales breathe with [gills].', fix: 'lungs', alts: ['skin', 'holes'] },
  { s: 'Reptiles have [moist] skin.', fix: 'dry', alts: ['hairy', 'feathery'] },
];

export const BLANKS = [
  { s: 'Animals with backbones include birds, fish, mammals, reptiles and ___.', a: 'amphibians', d: ['insects', 'spiders', 'worms'] },
  { s: 'Insects have three pairs of legs and a pair of ___.', a: 'antennae', d: ['wings', 'fins', 'gills'] },
  { s: 'Fish swim with their fins and breathe with their ___.', a: 'gills', d: ['lungs', 'skin', 'scales'] },
  { s: 'Female mammals feed their young with ___.', a: 'milk', d: ['nectar', 'seeds', 'insects'] },
  { s: 'Amphibians have ___ skin and no scales.', a: 'moist', d: ['dry', 'hairy', 'hard'] },
  { s: 'Reptiles have ___ skin and scales on their bodies.', a: 'dry', d: ['moist', 'wet', 'feathery'] },
  { s: 'Mosses, ferns and pines are ___ plants.', a: 'non-flowering', d: ['flowering', 'water', 'desert'] },
  { s: 'The growth of plants is affected by temperature and ___.', a: 'rainfall', d: ['animals', 'stones', 'wind'] },
  { s: 'Deep roots absorb ___ deep in the ground.', a: 'water', d: ['oxygen', 'sunlight', 'salt'] },
  { s: 'Aerial roots absorb ___ from the air.', a: 'oxygen', d: ['water', 'sunlight', 'food'] },
  { s: 'Buttress roots support trees that grow very tall to get more ___.', a: 'sunlight', d: ['water', 'salt', 'oxygen'] },
  { s: 'Cacti have ___ stems to store water.', a: 'thick', d: ['thin', 'climbing', 'hollow'] },
  { s: 'Mangroves have ___ leaves to reduce water loss.', a: 'waxy', d: ['broad', 'needle-shaped', 'hairy'] },
  { s: 'Oleanders are ___.', a: 'poisonous', d: ['spiky', 'stony', 'sticky'] },
  { s: 'The stems of Himalayan nettles are full of ___.', a: 'spikes', d: ['holes', 'water', 'wax'] },
  { s: 'Lithops look like ___.', a: 'stones', d: ['sticks', 'leaves', 'shells'] },
  { s: 'Polar bears have a thick layer of ___ under the skin.', a: 'fat', d: ['scales', 'feathers', 'water'] },
  { s: 'Snakes go into deep ___ in winter to save energy.', a: 'sleep', d: ['water', 'holes', 'groups'] },
  { s: 'A hummingbird has a long and narrow ___ to get nectar.', a: 'beak', d: ['neck', 'tongue', 'leg'] },
  { s: 'A hawk\'s beak and claws are ___ and good for hunting.', a: 'sharp', d: ['flat', 'soft', 'short'] },
  { s: 'The body of a hawk is covered with ___.', a: 'feathers', d: ['hair', 'scales', 'fur'] },
  { s: 'Some trees in tropical rainforests have ___ roots.', a: 'buttress', d: ['aerial', 'needle', 'shallow'] },
  { s: 'Some rainforest trees have ___ leaves to get more sunlight.', a: 'broad', d: ['needle-shaped', 'waxy', 'tiny'] },
  { s: 'Polar bears have a thick layer of fat to keep warm in a ___ environment.', a: 'cold', d: ['hot', 'dry', 'wet'] },
  { s: 'African tortoises have thick scales and hard shells to reduce water ___.', a: 'loss', d: ['supply', 'rain', 'heat'] },
  { s: 'Animals\' survival depends on climate, water supply and ___ supply.', a: 'food', d: ['sun', 'air', 'rock'] },
  { s: 'Ferns are non-flowering plants. Cotton trees and flame trees are ___ plants.', a: 'flowering', d: ['non-flowering', 'water', 'climbing'] },
  { s: 'Birds fly to ___ places to stay away from the cold.', a: 'warmer', d: ['colder', 'darker', 'higher'] },
  { s: 'Grass-eating animals have wide and ___ teeth for chewing plants.', a: 'flat', d: ['sharp', 'long', 'curved'] },
  { s: 'The colour of a chameleon changes with the ___ to help it avoid predators.', a: 'environment', d: ['temperature', 'weather', 'time'] },
];

// Chris & Laura style data analysis
export const WHO_RIGHT = [
  {
    data: ['Has a pair of legs', 'Cannot fly', 'Covered with feathers', 'Breathes with lungs'],
    a: 'It can\'t fly, so it can\'t be a bird.', b: 'It has feathers, so it is a bird.', right: 'b',
    why: 'Feathers are only found on birds — some birds (penguins, ostriches) cannot fly.',
  },
  {
    data: ['Does not have legs', 'Can crawl', 'Dry skin and scales', 'Breathes with lungs'],
    a: 'It has scales but no legs. It must be a fish.', b: 'It has dry skin and scales. It is a reptile.', right: 'b',
    why: 'Fish have WET skin and breathe with gills. Dry skin + scales + lungs = reptile (like a snake).',
  },
  {
    data: ['Has a pair of wings', 'Can fly', 'Has hair', 'Feeds its young with milk'],
    a: 'It has hair and feeds its young milk. It is a mammal.', b: 'It flies with wings, so it is a bird.', right: 'a',
    why: 'Hair and milk mean mammal — this is a bat!',
  },
  {
    data: ['Lives in the sea', 'Swims with fins', 'Breathes with lungs', 'Feeds its young with milk'],
    a: 'It swims with fins, so it is a fish.', b: 'It feeds its young milk, so it is a mammal.', right: 'b',
    why: 'Dolphins and whales breathe with lungs and feed milk — mammals.',
  },
  {
    data: ['Eight legs', 'No antennae', 'No backbone', 'Two body parts'],
    a: 'It has lots of legs and no backbone, so it is an insect.', b: 'Insects have six legs, so it is not an insect.', right: 'b',
    why: 'Insects have 3 pairs of legs, antennae and 3 body parts. A spider is not an insect.',
  },
  {
    data: ['Moist skin', 'No scales', 'Young live in water', 'Adults breathe with lungs and skin'],
    a: 'It is a reptile because it looks like a lizard.', b: 'It is an amphibian.', right: 'b',
    why: 'Moist skin with no scales = amphibian (like a salamander).',
  },
];

// Exam-format coverage (for the parent page)
export const COVERAGE = [
  { format: 'Matching / Classification', games: ['Sort Storm', 'Biome Rescue airlift', 'Seed Sorter'] },
  { format: 'Classifying (backbone or not)', games: ['Sort Storm · X-ray bonus'] },
  { format: 'Flowchart / data analysis', games: ['Creature Lab · Detective', 'Fake-Bot · Who\'s right?'] },
  { format: 'True or false + correct the mistake', games: ['Fake-Bot · Fact or Fake'] },
  { format: 'Fill in the blanks', games: ['Fake-Bot · Word Blaster'] },
  { format: 'Completing the table (characteristics)', games: ['Creature Lab · Build-a-Beast'] },
  { format: 'Picture scenario / analysis', games: ['Plant Survivor', 'Hide & Seek', 'Predator Panic', 'Survival Suit', 'Feeding Frenzy'] },
  { format: 'Multiple choice / circle the answer', games: ['Survival Suit', 'Garden Guard', 'Feeding Frenzy'] },
];
