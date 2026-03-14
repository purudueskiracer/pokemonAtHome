/**
 * XPService — pure functions for IV rolling, XP calculations,
 * star ratings, level-up detection, and trainer rank.
 *
 * All functions are pure (no state, no side effects).
 * GameConfig is the single source for all tuning knobs.
 *
 * @see {import('../types').IVs}
 * @see {import('../types').StarRating}
 * @see {import('../types').XPResult}
 */

import {
  IVS, XP_CURVE, CATCH_XP, BALL_CAPS,
  LEVEL_UP_BALLS, TRAINER_RANKS,
} from "../config/GameConfig";

// ── IV Rolling ──────────────────────────────────────────────────────────

/** Roll a single IV stat with an optional floor. */
export function rollIV(floor = 0) {
  return floor + Math.floor(Math.random() * (IVS.max - floor + 1));
}

/**
 * Roll a full set of IVs. Shiny Pokémon get a guaranteed floor.
 * @param {boolean} isShiny
 * @returns {import('../types').IVs}
 */
export function rollIVs(isShiny = false) {
  const floor = isShiny ? IVS.shinyFloor : 0;
  return {
    attack:  rollIV(floor),
    defense: rollIV(floor),
    stamina: rollIV(floor),
  };
}

// ── Star Ratings ────────────────────────────────────────────────────────

/**
 * Calculate star rating 0–4 from IVs (Pokémon GO appraisal style).
 * @param {import('../types').IVs} ivs
 * @returns {import('../types').StarRating}
 */
export function getStarRating(ivs) {
  const total = ivs.attack + ivs.defense + ivs.stamina;
  const pct = total / (IVS.max * 3);
  if (pct >= 1)    return 4;  // 100% — perfect "hundo"
  if (pct >= 0.82) return 3;  // 82–99%
  if (pct >= 0.67) return 2;  // 67–81%
  if (pct >= 0.50) return 1;  // 50–66%
  return 0;                   // 0–49%
}

/** Pretty star display string. */
export function starString(rating) {
  return "★".repeat(rating) + "☆".repeat(4 - rating);
}

// ── XP Curve ────────────────────────────────────────────────────────────

/** How much XP is needed to advance from the given level. */
export function xpForLevel(level) {
  for (const tier of XP_CURVE) {
    if (level <= tier.maxLevel) return tier.xp;
  }
  return XP_CURVE[XP_CURVE.length - 1].xp;
}

/** Trainer rank title for a given level. */
export function trainerRank(level) {
  for (const tier of TRAINER_RANKS) {
    if (level <= tier.maxLevel) return tier.rank;
  }
  return TRAINER_RANKS[TRAINER_RANKS.length - 1].rank;
}

// ── Catch XP Calculation ────────────────────────────────────────────────

/**
 * Calculate XP, level-up result, and remaining XP after a catch.
 * @param {import('../types').Pokemon} pokemon
 * @param {{ xp: number, level: number, pokedex: Object }} profile
 * @param {boolean} isShiny
 * @returns {import('../types').XPResult}
 */
export function calculateCatchXP(pokemon, profile, isShiny = false) {
  const isNew = !profile.pokedex[pokemon.pokemonId]?.caught;
  const baseXp = CATCH_XP[pokemon.rarity] ?? CATCH_XP.common;

  let xpMult = 1;
  if (isNew)   xpMult *= 2;
  if (isShiny) xpMult *= 2;

  const xpGained = baseXp * xpMult;

  // Loop to handle gaining enough XP for multiple levels at once
  let remainingXp = profile.xp + xpGained;
  let newLevel = profile.level;
  let didLevelUp = false;
  let xpNeeded = xpForLevel(newLevel);
  while (remainingXp >= xpNeeded) {
    remainingXp -= xpNeeded;
    newLevel += 1;
    didLevelUp = true;
    xpNeeded = xpForLevel(newLevel);
  }

  return { xpGained, isNew, didLevelUp, newLevel, remainingXp };
}

/**
 * Process arbitrary XP gain (mart questions, exploration, etc.)
 * @param {number} amount
 * @param {{ xp: number, level: number }} profile
 * @returns {{ remainingXp: number, newLevel: number, didLevelUp: boolean }}
 */
export function addXP(amount, profile) {
  let remainingXp = profile.xp + amount;
  let newLevel = profile.level;
  let didLevelUp = false;
  let xpNeeded = xpForLevel(newLevel);
  while (remainingXp >= xpNeeded) {
    remainingXp -= xpNeeded;
    newLevel += 1;
    didLevelUp = true;
    xpNeeded = xpForLevel(newLevel);
  }
  return { remainingXp, newLevel, didLevelUp };
}

// ── Level-Up Balls ──────────────────────────────────────────────────────

/**
 * Calculate bonus balls awarded on level-up.
 * @param {number} newLevel
 * @param {{ pokeball: number, greatball: number, ultraball: number }} currentBalls
 * @returns {import('../types').LevelUpBalls}
 */
export function levelUpBalls(newLevel, currentBalls) {
  const bonus = { pokeball: LEVEL_UP_BALLS.pokeball, greatball: 0, ultraball: 0 };
  if (newLevel % LEVEL_UP_BALLS.greatball.every === 0) bonus.greatball = LEVEL_UP_BALLS.greatball.amount;
  if (newLevel % LEVEL_UP_BALLS.ultraball.every === 0) bonus.ultraball = LEVEL_UP_BALLS.ultraball.amount;

  return {
    pokeball:  Math.min(currentBalls.pokeball  + bonus.pokeball,  BALL_CAPS.pokeball),
    greatball: Math.min(currentBalls.greatball + bonus.greatball, BALL_CAPS.greatball),
    ultraball: Math.min(currentBalls.ultraball + bonus.ultraball, BALL_CAPS.ultraball),
  };
}

/**
 * Cap balls at their maximum values.
 * @param {{ pokeball: number, greatball: number, ultraball: number }} balls
 * @returns {{ pokeball: number, greatball: number, ultraball: number }}
 */
export function capBalls(balls) {
  return {
    pokeball:  Math.min(balls.pokeball,  BALL_CAPS.pokeball),
    greatball: Math.min(balls.greatball, BALL_CAPS.greatball),
    ultraball: Math.min(balls.ultraball, BALL_CAPS.ultraball),
  };
}
