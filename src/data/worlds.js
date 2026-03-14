// World area configurations
// typeWeights must sum to 100

// ── Type Color Palettes (for encounter backgrounds) ────────────────────────────
// bg1/bg2 = dark gradient pair, sparkle = bright accent for particles
// Based on official Pokémon type colors, desaturated for backgrounds.
/**
 * BIOME_PALETTES — encounter background colors keyed by the terrain biome
 * the player was standing in when the encounter triggered.
 * These are designed to look like the actual environment: sky color, ground disc,
 * sparkle accents. Colors are intentionally vivid (30-60% brightness) for WebGL.
 */
export const BIOME_PALETTES = {
  // Open grassy field — blue midday sky, lush green turf
  meadow: {
    skyZenith: "#103880", skyHorizon: "#4890c8",
    groundNear: "#48901a", groundFar: "#1e5008",
    cloudAmt: 0.65, sparkle: "#ffffaa",
  },
  // Dense tree canopy — dim filtered green light, dark earth
  forest: {
    skyZenith: "#04100a", skyHorizon: "#165018",
    groundNear: "#205010", groundFar: "#081808",
    cloudAmt: 0.08, sparkle: "#80e050",
  },
  // Sandy shoreline — warm amber horizon, pale sand ground
  beach: {
    skyZenith: "#1858a0", skyHorizon: "#c09040",
    groundNear: "#c0a040", groundFar: "#705020",
    cloudAmt: 0.40, sparkle: "#ffe090",
  },
  // Open water — deep ocean blue, blue-grey seafloor
  water: {
    skyZenith: "#040e1a", skyHorizon: "#1060a8",
    groundNear: "#0a5090", groundFar: "#021030",
    cloudAmt: 0.18, sparkle: "#60c8ff",
  },
  // Rocky highland — overcast grey sky, stone ground
  rock: {
    skyZenith: "#101015", skyHorizon: "#485060",
    groundNear: "#484850", groundFar: "#202028",
    cloudAmt: 0.75, sparkle: "#b0b8c8",
  },
  // Snow peaks — icy pale sky, white-blue snow underfoot
  snow: {
    skyZenith: "#101828", skyHorizon: "#6898b8",
    groundNear: "#c0d8e8", groundFar: "#506878",
    cloudAmt: 0.40, sparkle: "#ffffff",
  },
};

// bg1 = vivid horizon/inner sky, bg2 = dark outer sky, ground = platform disc
// Colors are intentionally saturated — they display inside a 3D canvas, not as CSS overlays.
// Fallback palettes keyed by Pokémon type (used when biome is unavailable).
// skyZenith = deep sky at top, skyHorizon = lighter horizon haze,
// groundNear = ground near horizon, groundFar = foreground ground (darker)
export const TYPE_PALETTES = {
  normal:   { skyZenith: "#1a1a14", skyHorizon: "#8a8060", groundNear: "#6a6040", groundFar: "#383020", cloudAmt: 0.4, sparkle: "#e0d090" },
  grass:    { skyZenith: "#082010", skyHorizon: "#3a9e20", groundNear: "#2e7a18", groundFar: "#0e3808", cloudAmt: 0.6, sparkle: "#90e850" },
  fire:     { skyZenith: "#2a0800", skyHorizon: "#e84010", groundNear: "#8a2800", groundFar: "#380e00", cloudAmt: 0.1, sparkle: "#ffa040" },
  water:    { skyZenith: "#001828", skyHorizon: "#1a80d0", groundNear: "#0a4a7a", groundFar: "#002038", cloudAmt: 0.2, sparkle: "#80c8ff" },
  electric: { skyZenith: "#181200", skyHorizon: "#e8c000", groundNear: "#806800", groundFar: "#301800", cloudAmt: 0.3, sparkle: "#ffe860" },
  bug:      { skyZenith: "#101800", skyHorizon: "#78a810", groundNear: "#3a5810", groundFar: "#182808", cloudAmt: 0.5, sparkle: "#c8e040" },
  flying:   { skyZenith: "#080c20", skyHorizon: "#7060d8", groundNear: "#302870", groundFar: "#100c38", cloudAmt: 0.8, sparkle: "#c0b0ff" },
  fairy:    { skyZenith: "#200818", skyHorizon: "#e060a0", groundNear: "#803060", groundFar: "#380818", cloudAmt: 0.6, sparkle: "#ffb0d8" },
  poison:   { skyZenith: "#100818", skyHorizon: "#9030a8", groundNear: "#501870", groundFar: "#200830", cloudAmt: 0.2, sparkle: "#d080e8" },
  rock:     { skyZenith: "#100e04", skyHorizon: "#a07828", groundNear: "#705020", groundFar: "#302008", cloudAmt: 0.5, sparkle: "#e0c060" },
  ground:   { skyZenith: "#180e04", skyHorizon: "#c08830", groundNear: "#806020", groundFar: "#382810", cloudAmt: 0.3, sparkle: "#ffd880" },
  ghost:    { skyZenith: "#080610", skyHorizon: "#5040a0", groundNear: "#302070", groundFar: "#100820", cloudAmt: 0.4, sparkle: "#a090e0" },
  dark:     { skyZenith: "#080604", skyHorizon: "#503828", groundNear: "#302018", groundFar: "#100808", cloudAmt: 0.1, sparkle: "#a08060" },
  steel:    { skyZenith: "#101418", skyHorizon: "#7080a8", groundNear: "#404858", groundFar: "#202428", cloudAmt: 0.5, sparkle: "#c0d0e8" },
  ice:      { skyZenith: "#041818", skyHorizon: "#40c8c8", groundNear: "#207878", groundFar: "#082828", cloudAmt: 0.3, sparkle: "#a0f0f0" },
  dragon:   { skyZenith: "#100428", skyHorizon: "#5010d8", groundNear: "#300880", groundFar: "#100430", cloudAmt: 0.4, sparkle: "#9060ff" },
  fighting: { skyZenith: "#180404", skyHorizon: "#c02018", groundNear: "#701010", groundFar: "#280404", cloudAmt: 0.3, sparkle: "#ff6050" },
  psychic:  { skyZenith: "#180410", skyHorizon: "#e03080", groundNear: "#801040", groundFar: "#300818", cloudAmt: 0.5, sparkle: "#ff80c0" },
};

// ── Per-species procedural idle parameters ─────────────────────────────────────
// bobSpeed (Hz), bobAmp (world units), rotSpeed (rad/s), rotAmp (degrees)
// Defaults for unlisted species: { bobSpeed: 0.8, bobAmp: 0.15, rotSpeed: 0.4, rotAmp: 3 }
export const SPECIES_IDLE = {
  1:   { bobSpeed: 0.7,  bobAmp: 0.04, rotSpeed: 0.3,  rotAmp: 2 },   // Bulbasaur – sturdy, subtle
  10:  { bobSpeed: 1.4,  bobAmp: 0.03, rotSpeed: 0.8,  rotAmp: 5 },   // Caterpie – wiggly squirm
  16:  { bobSpeed: 0.9,  bobAmp: 0.03, rotSpeed: 0.2,  rotAmp: 2 },   // Pidgey – gentle hover
  17:  { bobSpeed: 0.85, bobAmp: 0.04, rotSpeed: 0.2,  rotAmp: 2 },   // Pidgeotto – smooth glide
  25:  { bobSpeed: 0.7,  bobAmp: 0.03, rotSpeed: 0.4,  rotAmp: 3 },   // Pikachu – subtle (embedded anim already bounces)
  26:  { bobSpeed: 0.9,  bobAmp: 0.04, rotSpeed: 0.4,  rotAmp: 3 },   // Raichu – confident sway
  35:  { bobSpeed: 0.8,  bobAmp: 0.05, rotSpeed: 0.6,  rotAmp: 4 },   // Clefairy – playful sway
  39:  { bobSpeed: 1.2,  bobAmp: 0.06, rotSpeed: 0.7,  rotAmp: 5 },   // Jigglypuff – bouncy round
  52:  { bobSpeed: 0.9,  bobAmp: 0.03, rotSpeed: 0.5,  rotAmp: 4 },   // Meowth – sly sway
  100: { bobSpeed: 1.8,  bobAmp: 0.02, rotSpeed: 1.2,  rotAmp: 2 },   // Voltorb – vibrate/tremble
  113: { bobSpeed: 0.5,  bobAmp: 0.04, rotSpeed: 0.3,  rotAmp: 2 },   // Chansey – gentle maternal
  125: { bobSpeed: 0.9,  bobAmp: 0.05, rotSpeed: 0.4,  rotAmp: 3 },   // Electabuzz – tough sway
  132: { bobSpeed: 1.0,  bobAmp: 0.04, rotSpeed: 0.6,  rotAmp: 4 },   // Ditto – wobbly blob
};

export const DEFAULT_IDLE = { bobSpeed: 0.8, bobAmp: 0.05, rotSpeed: 0.4, rotAmp: 3 };

// ── Shiny & Variant Chances ────────────────────────────────────────────────────
const SHINY_CHANCE = 1 / 20;      // 5 % encounter chance for shiny

// Pokémon → which extra variant folders exist (used at encounter time)
// Only list forms we want to actively use. G-Max & Shadow excluded for now.
export const VARIANT_CATALOG = {
  // Mega evolutions
  mega: new Set([
    3,6,9,15,18,65,80,94,115,127,130,142,150,181,208,212,214,229,248,254,
    257,260,282,302,303,306,310,319,323,334,354,359,362,373,376,380,381,
    384,428,445,448,460,475,
  ]),
  // Alolan forms
  alolan: new Set([26,27,28,37,38,50,51,52,53,74,75,76,88,89,103,105]),
  // Galarian forms
  galar: new Set([52,77,78,83,110,122,222,263,264,554,555,562,618]),
  // Hisuian forms
  hisuian: new Set([58,59,100,101,157,211,215,503,549,550,570,571,628,705,706,713,724,899,900,901,903,904]),
};

// Map world biome themes → regional variant type to use
export const WORLD_REGION_MAP = {
  sunlit_meadow:  null,          // no regional variant bias
  sparkling_flats: null,
  // future worlds can map to alolan, galar, hisuian, etc.
  // e.g. "tropic_island": "alolan",
  //      "frozen_tundra":  "galar",
  //      "ancient_ruins":  "hisuian",
};

export const worlds = [
  {
    id: "sunlit_meadow",
    name: "Sunlit Meadow",
    description: "A warm, open field buzzing with life.",
    unlockCondition: null, // starting world
    difficulty: 1,
    tilesetKey: "meadow",
    mapKey: "map_meadow",
    typeWeights: {
      normal: 35,
      grass: 25,
      bug: 15,
      electric: 10,
      fairy: 8,
      flying: 5,
      other: 2,
    },
    timeOfDay: {
      night: { ghost: 20, normal: 20, grass: 15, bug: 10, electric: 10, fairy: 10, flying: 5, other: 10 },
    },
    introducedMechanic: null,
    pokemonPool: [
      { pokemonId: 1, name: "bulbasaur", type: "grass", rarity: "uncommon" },
      { pokemonId: 10, name: "caterpie", type: "bug", rarity: "common" },
      { pokemonId: 16, name: "pidgey", type: "flying", rarity: "common" },
      { pokemonId: 25, name: "pikachu", type: "electric", rarity: "uncommon" },
      { pokemonId: 35, name: "clefairy", type: "fairy", rarity: "rare" },
      { pokemonId: 39, name: "jigglypuff", type: "fairy", rarity: "uncommon" },
      { pokemonId: 52, name: "meowth", type: "normal", rarity: "common" },
      { pokemonId: 113, name: "chansey", type: "normal", rarity: "rare" },
    ],
  },
  {
    id: "sparkling_flats",
    name: "Sparkling Flats",
    description: "Wide open plains crackle with electricity.",
    unlockCondition: { type: "catch_count", area: "sunlit_meadow", count: 10 },
    difficulty: 2,
    tilesetKey: "plains",
    mapKey: "map_flats",
    typeWeights: {
      electric: 40,
      normal: 20,
      flying: 15,
      grass: 10,
      bug: 8,
      other: 7,
    },
    timeOfDay: {
      night: { electric: 30, ghost: 20, dark: 15, normal: 15, flying: 10, other: 10 },
    },
    introducedMechanic: "poke_mart",
    pokemonPool: [
      { pokemonId: 25, name: "pikachu", type: "electric", rarity: "uncommon" },
      { pokemonId: 26, name: "raichu", type: "electric", rarity: "rare" },
      { pokemonId: 100, name: "voltorb", type: "electric", rarity: "common" },
      { pokemonId: 125, name: "electabuzz", type: "electric", rarity: "rare" },
      { pokemonId: 16, name: "pidgey", type: "flying", rarity: "common" },
      { pokemonId: 17, name: "pidgeotto", type: "flying", rarity: "uncommon" },
      { pokemonId: 132, name: "ditto", type: "normal", rarity: "rare" },
    ],
  },
];

/**
 * Get a random Pokémon from an area based on type weights.
 * Also rolls for shiny, mega, and regional variants.
 * Returns { ...pokemon, variant, isShiny }.
 */
export function getRandomEncounter(worldId, timeOfDay = "day") {
  const world = worlds.find((w) => w.id === worldId);
  if (!world) return null;

  const weights = timeOfDay === "night" && world.timeOfDay?.night
    ? world.timeOfDay.night
    : world.typeWeights;

  // Pick a type using weighted random
  const chosenType = weightedRandom(weights);

  // Find Pokémon of that type in the pool, fall back to any
  const pool = world.pokemonPool.filter((p) => p.type === chosenType);
  const finalPool = pool.length > 0 ? pool : world.pokemonPool;

  const pokemon = finalPool[Math.floor(Math.random() * finalPool.length)];

  // ── Roll variant ──────────────────────────────────────────────────────
  let variant = "regular";
  let isShiny = false;

  // 1. Regional variant — if the world biome maps to a region and the mon has that form
  const region = WORLD_REGION_MAP[worldId];
  if (region && VARIANT_CATALOG[region]?.has(pokemon.pokemonId)) {
    variant = region;
  }

  // 2. Shiny — can stack with regional variants
  if (Math.random() < SHINY_CHANCE) {
    isShiny = true;
    if (variant === "regular") variant = "shiny";
    // For regional forms, shiny models might not exist — fall back to shiny
    // (the model will gracefully fall to error boundary if missing)
  }

  return { ...pokemon, variant, isShiny };
}

/**
 * Weighted random selection from an object of { key: weight }
 */
function weightedRandom(weights) {
  const entries = Object.entries(weights).filter(([k]) => k !== "other");
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let rand = Math.random() * total;
  for (const [key, weight] of entries) {
    rand -= weight;
    if (rand <= 0) return key;
  }
  return entries[0][0];
}

/**
 * Check if a world is unlocked for a given child profile
 */
export function isWorldUnlocked(worldId, profile) {
  const world = worlds.find((w) => w.id === worldId);
  if (!world || !world.unlockCondition) return true;

  const { type, area, count, level } = world.unlockCondition;

  if (type === "catch_count") {
    const caught = profile.caughtByArea?.[area] ?? 0;
    return caught >= count;
  }
  if (type === "level") {
    return (profile.level ?? 1) >= level;
  }
  return false;
}

// ── Evolution chains ───────────────────────────────────────────────────────────
// { pokemonId: { evolvesTo: id, candy: cost, name, type } }
// Covers all Pokémon currently in the game's pokemonPool.
// Candy costs follow Pokémon GO conventions (25 / 50 / 100).
export const EVOLUTION_CHAINS = {
  // Bulbasaur → Ivysaur → Venusaur
  1:   { evolvesTo: 2,   candy: 25,  name: "ivysaur",    type: "grass" },
  2:   { evolvesTo: 3,   candy: 100, name: "venusaur",   type: "grass" },

  // Caterpie → Metapod → Butterfree
  10:  { evolvesTo: 11,  candy: 12,  name: "metapod",    type: "bug" },
  11:  { evolvesTo: 12,  candy: 50,  name: "butterfree",  type: "bug" },

  // Pidgey → Pidgeotto → Pidgeot
  16:  { evolvesTo: 17,  candy: 12,  name: "pidgeotto",  type: "flying" },
  17:  { evolvesTo: 18,  candy: 50,  name: "pidgeot",    type: "flying" },

  // Pikachu → Raichu
  25:  { evolvesTo: 26,  candy: 50,  name: "raichu",     type: "electric" },

  // Clefairy → Clefable
  35:  { evolvesTo: 36,  candy: 50,  name: "clefable",   type: "fairy" },

  // Jigglypuff → Wigglytuff
  39:  { evolvesTo: 40,  candy: 50,  name: "wigglytuff", type: "fairy" },

  // Meowth → Persian
  52:  { evolvesTo: 53,  candy: 50,  name: "persian",    type: "normal" },

  // Voltorb → Electrode
  100: { evolvesTo: 101, candy: 50,  name: "electrode",  type: "electric" },

  // Chansey → Blissey
  113: { evolvesTo: 242, candy: 50,  name: "blissey",    type: "normal" },

  // Electabuzz → Electivire
  125: { evolvesTo: 466, candy: 100, name: "electivire", type: "electric" },
};
