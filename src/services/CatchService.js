/**
 * CatchService — centralises all catch/flee logic.
 *
 * Tuning knobs now live in config/GameConfig.js — single source of truth.
 * This service exposes roll functions and config lookups.
 */

import {
  RARITY_RATES as RARITY,
  BALL_MULTIPLIERS,
  MAX_CATCH_RATE,
} from "../config/GameConfig";

// ── Public helpers ──────────────────────────────────────────────────────

/** Look up the full config for a rarity tier (defaults to common). */
export function getRarityConfig(rarity) {
  return RARITY[rarity] ?? RARITY.common;
}

/** Return the XP reward for catching a Pokémon of a given rarity. */
export function getXp(rarity) {
  return getRarityConfig(rarity).xp;
}

/**
 * Roll for catch success.
 * @param {string}  rarity     – common | uncommon | rare | legendary
 * @param {string}  ballType   – pokeball | greatball | ultraball
 * @param {number}  speedBonus – 0.00–0.10, based on answer speed
 * @returns {boolean} true if caught
 */
export function rollCatch(rarity, ballType, speedBonus = 0) {
  const base = getRarityConfig(rarity).catchRate;
  const multiplier = BALL_MULTIPLIERS[ballType] ?? 1.0;
  const rate = Math.min(base * multiplier + speedBonus, MAX_CATCH_RATE);
  return Math.random() < rate;
}

/**
 * Roll whether the Pokémon flees after a break-free or wrong answer.
 * @param {string} rarity
 * @returns {boolean} true if the Pokémon flees
 */
export function rollFlee(rarity) {
  const chance = getRarityConfig(rarity).fleeChance;
  return Math.random() < chance;
}

/**
 * Compute the effective catch rate for display / UI hints.
 * @returns {number} 0–0.95
 */
export function effectiveCatchRate(rarity, ballType, speedBonus = 0) {
  const base = getRarityConfig(rarity).catchRate;
  const multiplier = BALL_MULTIPLIERS[ballType] ?? 1.0;
  return Math.min(base * multiplier + speedBonus, MAX_CATCH_RATE);
}

// Re-export raw tables for anything that still reads them directly
export { RARITY as rarityConfig, BALL_MULTIPLIERS as ballMultipliers };
