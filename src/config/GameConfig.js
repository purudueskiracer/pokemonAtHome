/**
 * GameConfig — single source of truth for all tuning knobs.
 *
 * Designers change ONE file to adjust game balance.
 * All services import from here — no magic numbers scattered in code.
 */

/** Candy economy */
export const CANDY = {
  onCatch:    3,
  onShiny:    5,
  onTransfer: 1,
};

/** Mega evolution constants */
export const MEGA = {
  cost:       200,          // mega candy to trigger
  durationMs: 24 * 60 * 60 * 1000,  // 24 hours
};

/** IV / stat system */
export const IVS = {
  max:        15,
  shinyFloor: 10,           // shiny Pokémon get minimum 10/10/10
};

/** XP curve — xpForLevel(n) returns how much XP is needed to advance from level n */
export const XP_CURVE = [
  { maxLevel:  5, xp:  100 },
  { maxLevel: 10, xp:  200 },
  { maxLevel: 15, xp:  400 },
  { maxLevel: 20, xp:  700 },
  { maxLevel: 30, xp: 1200 },
  { maxLevel: 40, xp: 2000 },
  { maxLevel: Infinity, xp: 3500 },
];

/** XP earned per catch (base, before multipliers) */
export const CATCH_XP = {
  common:    50,
  uncommon: 100,
  rare:     250,
  legendary: 1000,
};

/** XP earned in the mart per correct answer */
export const MART_XP = 10;

/** Ball inventory caps */
export const BALL_CAPS = {
  pokeball:  30,
  greatball: 15,
  ultraball:  5,
};

/** Level-up ball bonus rules */
export const LEVEL_UP_BALLS = {
  pokeball:  3,              // every level-up
  greatball: { every: 5, amount: 2 },
  ultraball: { every: 10, amount: 1 },
};

/** Catch / flee rates per rarity (used by CatchService) */
export const RARITY_RATES = {
  common:    { catchRate: 0.85, fleeChance: 0.05, xp:   50 },
  uncommon:  { catchRate: 0.65, fleeChance: 0.10, xp:  100 },
  rare:      { catchRate: 0.40, fleeChance: 0.20, xp:  250 },
  legendary: { catchRate: 0.20, fleeChance: 0.35, xp: 1000 },
};

/** Ball catch-rate multipliers */
export const BALL_MULTIPLIERS = {
  pokeball:  1.0,
  greatball: 1.5,
  ultraball: 2.5,
};

/** Maximum effective catch rate (cap) */
export const MAX_CATCH_RATE = 0.95;

/** Daily reward tiers (keyed by streak divisor, checked highest-first) */
export const STREAK_REWARDS = [
  { divisor: 7, reward: { pokeball: 10, greatball: 3, ultraball: 1 } },
  { divisor: 5, reward: { pokeball:  5, greatball: 2, ultraball: 0 } },
  { divisor: 3, reward: { pokeball:  5, greatball: 1, ultraball: 0 } },
];
export const DEFAULT_DAILY_REWARD = { pokeball: 5, greatball: 0, ultraball: 0 };

/** Throw animation timeline durations (ms) */
export const ANIMATION = {
  toss:     560,
  capture:  560,
  wobble:  1450,
  lock:     650,
  burst:    520,
  retry:    900,
};

/** Trainer rank thresholds */
export const TRAINER_RANKS = [
  { maxLevel:  5, rank: "Youngster" },
  { maxLevel: 10, rank: "Camper" },
  { maxLevel: 15, rank: "Ace Trainer" },
  { maxLevel: 20, rank: "Veteran" },
  { maxLevel: 30, rank: "Elite Trainer" },
  { maxLevel: 40, rank: "Champion" },
  { maxLevel: Infinity, rank: "Legend" },
];

/** World / player movement constants */
export const WORLD = {
  walkSpeed:     8,
  turnSpeed:     10,       // rad/s — how quickly the player rotates toward movement
  camHeight:     45,       // isometric elevation (must match World3D camera y)
  camBack:       32,       // offset behind player (must match World3D camera z)
  camLerp:       0.08,
  defaultZoom:   23,       // orthographic camera zoom (≈50% more than original 12, then +30%)
  zoomMin:        8,       // most zoomed-out allowed
  zoomMax:       40,       // most zoomed-in allowed
  zoomStep:       3,       // +/- per button press
  encountRadius: 6,        // spawn point detection radius
  encountCd:     4,        // seconds between encounter checks
  encountP:      0.35,     // probability per qualifying step
  minMoveDist:   3,        // units player must walk before next encounter
  groundY:       0.9,      // player rests this far above flat terrain
  waterY:        -0.02,    // water plane sits between water terrain (-0.06) and land (0)
};

/** Water shader visual constants */
export const WATER = {
  shallowColor: 0x3a8bd5,
  deepColor:    0x1a4a7a,
  foamColor:    0x8ac4ee,
  opacity:      0.72,
};

/** Player avatar animation constants */
/** Trainer appearance colour presets used by TrainerDesignerScreen and PlayerAvatar. */
export const TRAINER_PALETTE = {
  skin:  ["#ffcc80", "#f5c27c", "#e8a96b", "#c87941", "#8d5524", "#4a2912"],
  shirt: ["#3a8bd5", "#e94560", "#27ae60", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#ecf0f1"],
  pants: ["#2a4a6a", "#1a2a3a", "#5d4037", "#424242", "#37474f", "#ffffff"],
  hat:   ["#e94560", "#3a8bd5", "#27ae60", "#f39c12", "#9b59b6", "#1a1a1a"],
  shoes: ["#4a3020", "#1a1a1a", "#ffffff", "#e94560"],
};

/** Default trainer colour selections (indices into TRAINER_PALETTE arrays). */
export const TRAINER_DEFAULTS = {
  skin:  0,
  shirt: 0,
  pants: 0,
  hat:   0,
  shoes: 0,
};

export const PLAYER_AVATAR = {
  strideFreq: 8,     // walk cycle frequency (rad/s)
  idleDecay:  0.85,  // per-60fps-frame damping when stopping
  swingAmp:   0.45,  // max arm/leg rotation (radians)
  legScale:   0.7,   // leg swing relative to arm swing
  bobAmp:     0.02,  // body up/down bob height
  turnSpeed:  10,    // degrees-per-second rotation toward movement (rad/s)
};

/** Pokéball throw-animation tuning constants.
 *  tossSpin / dropSpin are in rad per 60fps frame (multiply by delta*60 in useFrame).
 *  Alpha values are exponential-decay bases (used as Math.pow(alpha, delta*60)). */
export const POKEBALL_ANIM = {
  tossStartX:        1.9,
  tossStartY:       -0.95,
  tossStartZ:        8.2,
  tossArcHeight:     1.58,
  tossCatchX:        0.18,
  tossCatchY:        0.46,
  tossCatchZ:        2.95,
  tossCatchScale:    0.78,
  tossStartScale:   0.45,
  tossSpin:         0.13,    // rad / 60fps frame
  groundY:          -0.89,
  groundScale:      0.35,
  dropPct:          0.35,
  captureHoldPct:   0.66,
  bounceDuration:    0.34,
  bounceGravity:     7.8,
  bounceRestitution: 0.42,
  bounceFriction:    0.72,
  impactWindow:      0.22,
  impactBounce:      0.14,
  impactSquash:      0.16,
  impactForward:     0.16,
  impactSide:        0.025,
  dropSpin:         0.06,    // rad / 60fps frame
  glowIntensity:    3,
  wobbleAmp:        0.32,
  wobbleHalfCycles: 6,       // sin(t*π*6) → 3 full oscillations (half-cycles)
  burstPeak:        1.2,     // peak scale multiplier when Pokémon pushes out
  ballZ:            2.32,    // Z-offset in front of Pokémon (encounter cam at z=6)
  burstShakeFreq:   18,      // shake frequency (half-cycles) during burst build-up
  lockedPulseAmp:   0.12,    // scale pulse amplitude during locked stage
  lockedGlowMax:    0.9,     // peak emissive intensity cap during locked stage
  lockedGlowRGB:    [1, 0.84, 0],   // golden button RGB during locked stage
  wobbleLerpAlpha:  0.88,    // exp-decay base for Y-rotation convergence in wobbling
  wobbleDecayAlpha: 0.88,    // exp-decay base for residual Z-sway in locked stage
  lockedLerpAlpha:  0.85,    // exp-decay base for Y-rotation convergence in locked
  burstDecayAlpha:  0.92,    // exp-decay base for Z-spin wind-down during burst
};

/** Pokémon capture pull-in tuning. Used by Pokemon3D during the capture stage. */
export const POKEMON_CAPTURE_ANIM = {
  holdPct:        0.66,  // delay after ball lands/bounces before pull-in begins
  targetY:       -1.18,  // final downward pull toward the settled ball
  targetZ:        1.82,  // forward pull toward the ball from the camera view
  stretchPct:     0.34,  // early portion of the pull used for suction stretch
  stretchAmp:     0.42,  // temporary forward stretch amount during suction
  liftAmp:        0.08,  // tiny upward flutter as the pull starts
  fadeStartPct:   0.12,  // begin fading shortly after the pull starts
  preScale:       1.03,  // subtle anticipation scale before the suction begins
  breakOutY:     -0.86,  // emerge from the Pokéball center near the ground
  breakOutZ:      2.16,  // emerge from the settled Pokéball depth
  breakOutScale:  0.08,  // tiny starting scale while still inside the ball
  breakOutTilt:   0.22,  // initial forward tilt as the Pokémon bursts out
};

/** Per-type Pokéball colors.
 *  captureGlow  — [r,g,b] float for THREE.Color.setRGB() during capture/burst.
 *  band/button  — override POKEBALL_CHROME defaults when present.
 *  marking      — primary accent color used on decorative geometry (swirls, stripes, M-logo).
 *  markingAlt   — secondary accent (e.g. Great Ball red swirl, Master Ball circle dots).
 *
 *  Ultra Ball: dark-navy top / yellow-bottom (matches official image). */
export const POKEBALL_COLORS = {
  pokeball: {
    top: "#e8302a", bottom: "#f0f0f0",
    captureGlow: [1.0, 0.25, 0.25],
  },
  greatball: {
    top: "#3b6fd4", bottom: "#f0f0f0",
    captureGlow: [0.3,  0.6,  1.0],
    marking:     "#e8302a",  // red swoosh spots
    markingAlt:  "#1a1a2e",  // dark outline
  },
  ultraball: {
    top: "#1a1a2e", bottom: "#f5f0e0",
    captureGlow: [1.0, 0.85, 0.1],
    band:        "#f9c846",  // yellow equatorial band instead of dark chrome
    button:      "#f8f8f8",
    marking:     "#f9c846",  // yellow stripes on top
    markingAlt:  "#000000",  // black stripe between yellows
  },
  masterball: {
    top: "#9b46c8", bottom: "#e884b8",
    captureGlow: [0.85, 0.3, 1.0],
    band:        "#2a1a3a",
    button:      "#f8f8f8",
    marking:     "#f5d800",  // M-logo / zigzag gold
    markingAlt:  "#ff3366",  // red accent dots
  },
};

/** Shared chrome / structural colors — separate from per-type ball palettes.
 *  Individual ball types may override band/button via POKEBALL_COLORS. */
export const POKEBALL_CHROME = {
  band:   "#1a1a2e",
  button: "#f8f8f8",
};

/** TCG Card Collection — all tuning knobs for the card feature */
export const TCG_CARD = {
  CDN_BASE: 'https://assets.tcgdex.net/en',
  API_BASE: 'https://api.tcgdex.net/v2/en',
  CACHE_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  CACHE_VERSION: 2,
  CACHE_MAX_ENTRIES: 150,
  MAX_TCG_CARDS: 1000,
  RARITY_WEIGHTS: { common: 40, uncommon: 25, rare: 10, legendary: 2 },
  // Keys are lowercase TCGdex rarity strings; values are game rarity tiers.
  // Note: TCGdex 'uncommon' is intentionally mapped to 'common' — our tiers
  // reflect card desirability, not set print-run rarity.
  RARITY_MAP: {
    // ── Base rarities ──
    'common':   'common',
    'uncommon': 'common',  // intentional: maps to game common tier
    'promo':    'common',
    // ── Standard holos ──
    'rare':                'uncommon',
    'rare holo':           'uncommon',
    'rare holo lv.x':      'uncommon',
    'rare holo ex':        'uncommon',
    'rare holo gx':        'uncommon',
    'rare holo v':         'uncommon',
    'rare holo vmax':      'uncommon',
    'rare holo vstar':     'uncommon',
    'rare prime':          'uncommon',
    'rare break':          'uncommon',
    'classic collection':  'uncommon',
    'legend':              'uncommon',
    // ── Ultra rares / full-arts ──
    'double rare':               'rare',
    'ultra rare':                'rare',
    'rare ultra':                'rare',
    'illustration rare':         'rare',
    'amazing rare':              'rare',
    'radiant rare':              'rare',
    'trainer gallery rare holo': 'rare',
    'rare prism star':           'rare',
    'rare ace':                  'rare',
    'shining':                   'rare',
    'star':                      'rare',
    // ── Hyper / secret rares ──
    'special illustration rare': 'legendary',
    'hyper rare':                'legendary',
    'ace spec rare':             'legendary',
    'rare secret':               'legendary',
    'rare rainbow':              'legendary',
    'rare holo star':            'legendary',
  },
  // Keys are lowercase in-game name variants (hyphen and underscore forms);
  // values are the exact TCGdex search names.
  NAME_MAP: {
    // ── Gen 1 ──
    'nidoran-f': 'Nidoran\u2640', 'nidoran_f': 'Nidoran\u2640',
    'nidoran-m': 'Nidoran\u2642', 'nidoran_m': 'Nidoran\u2642',
    'mr-mime':   'Mr. Mime',      'mr_mime':   'Mr. Mime',
    'farfetchd': "Farfetch'd",
    // ── Gen 2 ──
    'ho-oh': 'Ho-Oh', 'ho_oh': 'Ho-Oh',
    // ── Gen 2 move-compat ──
    'mime-jr': 'Mime Jr.', 'mime_jr': 'Mime Jr.',
    // ── Gen 4 ──
    'porygon-z': 'Porygon-Z', 'porygon_z': 'Porygon-Z',
    // ── Gen 6 ──
    'flabebe': 'Flab\u00e9b\u00e9',
    'type-null': 'Type: Null', 'type_null': 'Type: Null',
    // ── Gen 7 ──
    'tapu-koko': 'Tapu Koko', 'tapu_koko': 'Tapu Koko',
    'tapu-lele': 'Tapu Lele', 'tapu_lele': 'Tapu Lele',
    'tapu-bulu': 'Tapu Bulu', 'tapu_bulu': 'Tapu Bulu',
    'tapu-fini': 'Tapu Fini', 'tapu_fini': 'Tapu Fini',
    'jangmo-o':  'Jangmo-o',  'jangmo_o':  'Jangmo-o',
    'hakamo-o':  'Hakamo-o',  'hakamo_o':  'Hakamo-o',
    'kommo-o':   'Kommo-o',   'kommo_o':   'Kommo-o',
    // ── Gen 8 ──
    'mr-rime':   'Mr. Rime',  'mr_rime':   'Mr. Rime',
    'sirfetchd': "Sirfetch'd",
    // ── Gen 9 Paradox / Ruinous ──
    'great-tusk':   'Great Tusk',   'great_tusk':   'Great Tusk',
    'sandy-shocks': 'Sandy Shocks', 'sandy_shocks': 'Sandy Shocks',
    'scream-tail':  'Scream Tail',  'scream_tail':  'Scream Tail',
    'brute-bonnet': 'Brute Bonnet', 'brute_bonnet': 'Brute Bonnet',
    'flutter-mane': 'Flutter Mane', 'flutter_mane': 'Flutter Mane',
    'slither-wing': 'Slither Wing', 'slither_wing': 'Slither Wing',
    'roaring-moon': 'Roaring Moon', 'roaring_moon': 'Roaring Moon',
    'walking-wake': 'Walking Wake', 'walking_wake': 'Walking Wake',
    'gouging-fire': 'Gouging Fire', 'gouging_fire': 'Gouging Fire',
    'raging-bolt':  'Raging Bolt',  'raging_bolt':  'Raging Bolt',
    'iron-treads':  'Iron Treads',  'iron_treads':  'Iron Treads',
    'iron-bundle':  'Iron Bundle',  'iron_bundle':  'Iron Bundle',
    'iron-hands':   'Iron Hands',   'iron_hands':   'Iron Hands',
    'iron-jugulis': 'Iron Jugulis', 'iron_jugulis': 'Iron Jugulis',
    'iron-moth':    'Iron Moth',    'iron_moth':    'Iron Moth',
    'iron-thorns':  'Iron Thorns',  'iron_thorns':  'Iron Thorns',
    'iron-valiant': 'Iron Valiant', 'iron_valiant': 'Iron Valiant',
    'iron-leaves':  'Iron Leaves',  'iron_leaves':  'Iron Leaves',
    'iron-boulder': 'Iron Boulder', 'iron_boulder': 'Iron Boulder',
    'iron-crown':   'Iron Crown',   'iron_crown':   'Iron Crown',
    'chi-yu':    'Chi-Yu',    'chi_yu':    'Chi-Yu',
    'chien-pao': 'Chien-Pao', 'chien_pao': 'Chien-Pao',
    'ting-lu':   'Ting-Lu',   'ting_lu':   'Ting-Lu',
    'wo-chien':  'Wo-Chien',  'wo_chien':  'Wo-Chien',
  },
};

/** Procedural math generation — operand ranges per grade level.
 *  Used by MathGenerator to produce age-appropriate questions. */
export const MATH_GRADE_RANGES = {
  0: { addMin: 0, addMax: 5,  subMin: 0, subMax: 10,  countMin: 1, countMax: 10 },
  1: { addMin: 0, addMax: 10, subMin: 0, subMax: 20,  countMin: 1, countMax: 20 },
  2: { addMin: 0, addMax: 50, subMin: 0, subMax: 100, mulMin: 1, mulMax: 5,  countMin: 5, countMax: 20 },
  3: { addMin: 0, addMax: 100, subMin: 0, subMax: 100, mulMin: 1, mulMax: 12, divMin: 2, divMax: 12 },
  4: { addMin: 10, addMax: 200, subMin: 10, subMax: 200, mulMin: 2, mulMax: 15, divMin: 2, divMax: 12 },
  5: { addMin: 10, addMax: 500, subMin: 10, subMax: 500, mulMin: 2, mulMax: 20, divMin: 2, divMax: 15 },
};
