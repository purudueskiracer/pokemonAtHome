/**
 * PokemonService — pure functions for Pokémon display, evolution,
 * candy math, and collection entry building.
 *
 * No state, no side effects. All game balance constants come from GameConfig.
 *
 * @see {import('../types').Pokemon}
 * @see {import('../types').CollectionEntry}
 * @see {import('../types').EvolutionResult}
 */

import { CANDY, MEGA } from "../config/GameConfig";
import { EVOLUTION_CHAINS, VARIANT_CATALOG } from "../data/worlds";
import { rollIVs, getStarRating } from "./XPService";

// ── Display Helpers ─────────────────────────────────────────────────────

const VARIANT_LABELS = {
  mega:      "Mega ",
  megaShiny: "Mega ",
  alolan:    "Alolan ",
  galar:     "Galarian ",
  hisuian:   "Hisuian ",
};

/**
 * Format a Pokémon's display name with variant prefix and capitalization.
 * @param {import('../types').Pokemon} pokemon
 * @returns {string}
 */
export function displayName(pokemon) {
  const prefix = VARIANT_LABELS[pokemon.variant] ?? "";
  const name = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
  return `${prefix}${name}`;
}

/**
 * Capitalize a Pokémon name.
 * @param {string} name
 * @returns {string}
 */
export function capitalizeName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// ── Candy Math ──────────────────────────────────────────────────────────

/** Candy earned for catching a Pokémon. */
export function candyForCatch(isShiny = false) {
  return isShiny ? CANDY.onShiny : CANDY.onCatch;
}

/** Candy earned for transferring a Pokémon. */
export function candyForTransfer() {
  return CANDY.onTransfer;
}

// ── Collection Entry Builder ────────────────────────────────────────────

/**
 * Build a new collection entry for a freshly caught Pokémon.
 * @param {import('../types').Pokemon} pokemon
 * @param {string} worldId
 * @returns {import('../types').CollectionEntry}
 */
export function buildCollectionEntry(pokemon, worldId) {
  const isShiny = pokemon.isShiny ?? false;
  const ivs = rollIVs(isShiny);
  const stars = getStarRating(ivs);

  return {
    uid: crypto.randomUUID(),
    pokemonId: pokemon.pokemonId,
    name: pokemon.name,
    type: pokemon.type,
    variant: pokemon.variant ?? "regular",
    isShiny,
    rarity: pokemon.rarity,
    ivs,
    stars,
    caughtAt: Date.now(),
    worldId,
    isFavorite: false,
  };
}

// ── Pokédex Update ──────────────────────────────────────────────────────

/**
 * Return an updated pokédex object with the caught species registered.
 * @param {Object} pokedex - current pokédex
 * @param {import('../types').Pokemon} pokemon
 * @returns {Object} new pokédex
 */
export function updatePokedex(pokedex, pokemon) {
  return {
    ...pokedex,
    [pokemon.pokemonId]: {
      caught: true,
      name: pokemon.name,
      type: pokemon.type,
      seenAt: pokedex[pokemon.pokemonId]?.seenAt ?? Date.now(),
    },
  };
}

// ── Evolution ───────────────────────────────────────────────────────────

/**
 * Check if a Pokémon can evolve and return the evolution data.
 * @param {number} pokemonId
 * @returns {{ evolvesTo: number, candy: number, name: string, type: string } | null}
 */
export function getEvolution(pokemonId) {
  return EVOLUTION_CHAINS[pokemonId] ?? null;
}

/**
 * Check if a Pokémon can evolve with available candy.
 * @param {number} pokemonId
 * @param {number} candyAvailable
 * @returns {boolean}
 */
export function canEvolve(pokemonId, candyAvailable) {
  const evo = getEvolution(pokemonId);
  return evo != null && candyAvailable >= evo.candy;
}

/**
 * Compute evolution result (pure — does not mutate state).
 * @param {import('../types').CollectionEntry} mon
 * @param {Object} profile
 * @returns {import('../types').EvolutionResult}
 */
export function computeEvolution(mon, profile) {
  const evo = EVOLUTION_CHAINS[mon.pokemonId];
  if (!evo) return { success: false, reason: "no_evolution" };

  const currentCandy = profile.candy[mon.pokemonId] ?? 0;
  if (currentCandy < evo.candy) {
    return { success: false, reason: "not_enough_candy", need: evo.candy, have: currentCandy };
  }

  const isNewDex = !profile.pokedex[evo.evolvesTo]?.caught;

  return {
    success: true,
    cost: evo.candy,
    evolvedTo: evo.evolvesTo,
    evolvedName: evo.name,
    isNewDex,
  };
}

// ── Mega Evolution ──────────────────────────────────────────────────────

/**
 * Check if a species has a mega form.
 * @param {number} pokemonId
 * @returns {boolean}
 */
export function canMega(pokemonId) {
  return VARIANT_CATALOG.mega.has(pokemonId);
}

/**
 * Compute mega evolution result (pure — does not mutate state).
 * @param {number} pokemonId
 * @param {Object} profile
 * @returns {import('../types').MegaResult}
 */
export function computeMegaEvolve(pokemonId, profile) {
  if (!VARIANT_CATALOG.mega.has(pokemonId)) {
    return { success: false, reason: "no_mega" };
  }

  const existing = profile.megaActive[pokemonId];
  if (existing && existing > Date.now()) {
    return { success: false, reason: "already_active" };
  }

  const currentMegaCandy = profile.megaCandy?.[pokemonId] ?? 0;
  if (currentMegaCandy < MEGA.cost) {
    return { success: false, reason: "not_enough_mega_candy", need: MEGA.cost, have: currentMegaCandy };
  }

  return {
    success: true,
    cost: MEGA.cost,
    expiresAt: Date.now() + MEGA.durationMs,
  };
}

/**
 * Check if a Pokémon species currently has an active mega evolution.
 * @param {number} pokemonId
 * @param {Object} megaActive
 * @returns {boolean}
 */
export function isMegaActive(pokemonId, megaActive) {
  const expires = megaActive?.[pokemonId];
  return expires != null && expires > Date.now();
}
