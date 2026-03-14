/**
 * TCGCardService.js
 *
 * Pure service for fetching, caching, filtering, and building TCG card entries
 * from the TCGdex API. No React imports, no store access.
 *
 * @module TCGCardService
 */

import { TCG_CARD } from '../config/GameConfig';

// Pre-built lowercase lookup map — avoids O(n) Object.keys().find() on every call.
const _NAME_MAP_LOWER = Object.fromEntries(
  Object.entries(TCG_CARD.NAME_MAP).map(([k, v]) => [k.toLowerCase(), v])
);

// ---------------------------------------------------------------------------
// Private cache state
// ---------------------------------------------------------------------------

/** @type {Map<string, Promise<RawTcgCard[]>>} In-flight dedup map keyed by tcgName */
const _inFlight = new Map();

// ---------------------------------------------------------------------------
// Private cache helpers
// ---------------------------------------------------------------------------

/**
 * Returns the localStorage key for a given Pokémon name.
 * @param {string} name
 * @returns {string}
 */
function _cacheKey(name) {
  return 'tcg:' + name.toLowerCase().trim();
}

/**
 * Reads a cached card array from localStorage.
 * Returns null on miss, expiry, version mismatch, or any parse error.
 * @param {string} name
 * @returns {RawTcgCard[]|null}
 */
function _getCache(name) {
  try {
    const key = _cacheKey(name);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== TCG_CARD.CACHE_VERSION) {
      localStorage.removeItem(key); // purge stale version immediately
      return null;
    }
    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

/**
 * Writes a card array to localStorage with TTL and version metadata.
 * Performs LRU eviction when the cache is at capacity.
 * Silently swallows QuotaExceededError.
 * @param {string} name
 * @param {RawTcgCard[]} data
 */
function _setCache(name, data) {
  try {
    // LRU eviction: if at capacity, remove the soonest-to-expire entry.
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('tcg:'));
    if (allKeys.length >= TCG_CARD.CACHE_MAX_ENTRIES) {
      let oldestKey = null;
      let oldestExpiry = Infinity;
      for (const k of allKeys) {
        try {
          const entry = JSON.parse(localStorage.getItem(k));
          if (entry && entry.expiresAt < oldestExpiry) {
            oldestExpiry = entry.expiresAt;
            oldestKey = k;
          }
        } catch {
          // Corrupt entry — treat as oldest so it gets evicted.
          oldestKey = k;
          oldestExpiry = -Infinity;
        }
      }
      if (oldestKey) localStorage.removeItem(oldestKey);
    }

    const payload = {
      data,
      expiresAt: Date.now() + TCG_CARD.CACHE_TTL_MS,
      version: TCG_CARD.CACHE_VERSION,
    };
    localStorage.setItem(_cacheKey(name), JSON.stringify(payload));
  } catch {
    // QuotaExceededError or anything else — callers must not crash.
  }
}

// ---------------------------------------------------------------------------
// Exported utility functions
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} RawTcgCard
 * @property {string}  id
 * @property {string}  name
 * @property {string}  category        - 'Pokemon' | 'Trainer' | 'Energy'
 * @property {string}  [rarity]
 * @property {Object}  set
 * @property {string}  set.id
 * @property {string}  set.name
 * @property {string}  [set.releaseDate] - "YYYY/MM/DD" or "YYYY-MM-DD"
 * @property {string}  localId
 * @property {Object}  [variants]
 * @property {boolean} [variants.holo]
 * @property {boolean} [variants.reverse]
 * @property {boolean} [variants.normal]
 * @property {boolean} [variants.firstEdition]
 * @property {boolean} [variants.wPromo]
 * @property {string}  [image]          - CDN image key (may be null/undefined)
 */

/**
 * Applies the TCG_CARD.NAME_MAP lookup (case-insensitive) to normalise a
 * Pokémon's in-game name to its TCGdex search term.
 *
 * @param {string} name - In-game Pokémon name.
 * @returns {string} TCGdex-compatible name, or the original name unchanged.
 */
export function normalizePokemonName(name) {
  if (!name) return name;
  // O(1) lookup via pre-built lowercase map.
  return _NAME_MAP_LOWER[name.toLowerCase()] ?? name;
}

/**
 * Builds a full CDN image URL from a TCGdex image key.
 *
 * @param {string} imageKey    - e.g. "swsh1/1"
 * @param {string} [resolution='high']
 * @param {string} [format='webp']
 * @returns {string} Absolute CDN URL, or '' if imageKey is falsy.
 */
export function resolveImageUrl(imageKey, resolution = 'high', format = 'webp') {
  if (!imageKey) return '';
  return `${TCG_CARD.CDN_BASE}/${imageKey}/${resolution}.${format}`;
}

/**
 * Fetches TCG cards for a given Pokémon from the TCGdex API.
 *
 * - Results are cached in localStorage (TTL = TCG_CARD.CACHE_TTL_MS).
 * - Concurrent requests for the same name are de-duplicated via _inFlight.
 * - Returns [] on any error (network, timeout, parse failure, abort).
 *
 * @param {{ name: string, pokemonId?: number }} pokemon
 * @param {{ signal?: AbortSignal }} [options={}]
 * @returns {Promise<RawTcgCard[]>}
 */
export async function fetchCardsForPokemon(pokemon, { signal } = {}) {
  const tcgName = normalizePokemonName(pokemon.name);

  // 1. Cache hit
  const cached = _getCache(tcgName);
  if (cached !== null) return cached;

  // 2. In-flight dedup
  if (_inFlight.has(tcgName)) {
    return _inFlight.get(tcgName);
  }

  // 3. Build a combined abort signal (timeout + caller signal)
  let combinedSignal;
  try {
    const signals = [AbortSignal.timeout(7000), signal].filter(Boolean);
    // AbortSignal.any is not universally available — fall back gracefully.
    combinedSignal = signals.length > 1 && typeof AbortSignal.any === 'function'
      ? AbortSignal.any(signals)
      : signals[0];
  } catch {
    combinedSignal = undefined;
  }

  // 4. Build fetch Promise and register before awaiting
  const url = `${TCG_CARD.API_BASE}/cards?name=${encodeURIComponent(tcgName)}`;

  const promise = (async () => {
    try {
      const response = await fetch(url, { signal: combinedSignal });
      if (!response.ok) {
        console.warn(`[TCGCardService] API error ${response.status} for "${tcgName}"`);
        return [];
      }
      const json = await response.json();
      // TCGdex may return a plain array or a { data: [...] } envelope.
      const all = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
      // The list endpoint returns {id, localId, name, image} — category is NOT present.
      // Keep only cards that have artwork; category check would always be false on list results.
      const pokemonCards = all.filter(c => c.image);
      _setCache(tcgName, pokemonCards);
      return pokemonCards;
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.warn(`[TCGCardService] Fetch failed for "${tcgName}":`, err?.message ?? err);
      }
      return [];
    } finally {
      _inFlight.delete(tcgName);
    }
  })();

  _inFlight.set(tcgName, promise);
  return promise;
}

/**
 * Fetches the full card detail for a single card id from the TCGdex API.
 *
 * The list endpoint (/cards?name=…) returns only {id, localId, name, image}.
 * This endpoint returns the complete card shape including set metadata,
 * rarity, and variants — needed for proper set-mode grouping and foil display.
 *
 * Returns null on any error so callers can fall back to the lightweight card.
 *
 * @param {string} cardId  - TCGdex card id, e.g. "base1-58"
 * @param {{ signal?: AbortSignal }} [options={}]
 * @returns {Promise<RawTcgCard|null>}
 */
export async function fetchFullCard(cardId, { signal } = {}) {
  if (!cardId) return null;
  const url = `${TCG_CARD.API_BASE}/cards/${encodeURIComponent(cardId)}`;
  try {
    let combinedSignal;
    try {
      const signals = [AbortSignal.timeout(5000), signal].filter(Boolean);
      combinedSignal = signals.length > 1 && typeof AbortSignal.any === 'function'
        ? AbortSignal.any(signals)
        : signals[0];
    } catch {
      combinedSignal = undefined;
    }
    const response = await fetch(url, { signal: combinedSignal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Fetches the total official card count for a set from the TCGdex API.
 * Cached for 30 days (sets never change). Returns null on any error.
 *
 * @param {string} setId  - TCGdex set id, e.g. "base1"
 * @returns {Promise<number|null>}
 */
export async function fetchSetCardCount(setId) {
  if (!setId) return null;
  const key = `tcg:set:${setId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const { total, expiresAt } = JSON.parse(raw);
      if (expiresAt > Date.now()) return total;
    }
  } catch { /* ignore */ }
  try {
    const resp = await fetch(
      `${TCG_CARD.API_BASE}/sets/${encodeURIComponent(setId)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const total = data.cardCount?.official ?? data.cards?.length ?? null;
    if (total != null) {
      try {
        localStorage.setItem(key, JSON.stringify({
          total,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        }));
      } catch { /* quota */ }
    }
    return total;
  } catch {
    return null;
  }
}

/**
 * Returns the total number of available cards for a Pokémon from the
 * existing localStorage card-list cache (no network call).
 * Returns null on cache miss.
 *
 * @param {string} pokemonName  - In-game Pokémon name (will be normalised).
 * @returns {number|null}
 */
export function getCachedPokemonTotal(pokemonName) {
  const cached = _getCache(normalizePokemonName(pokemonName));
  return cached != null ? cached.length : null;
}

/**
 * Maps a raw TCGdex rarity string to a game rarity value.
 *
 * @param {string} rarity - Raw rarity string from the TCGdex API.
 * @returns {string} Mapped game rarity, defaulting to 'common'.
 */
export function mapTcgRarity(rarity) {
  if (!rarity) return 'common';
  const key = rarity.toLowerCase().trim();
  return TCG_CARD.RARITY_MAP[key] ?? 'common';
}

/**
 * Derives the foil type of a raw TCG card.
 *
 * Note: `variants.holo` is intentionally NOT used because the TCGdex data
 * incorrectly marks many common cards as holo=true. Rarity string is the
 * authoritative source for holo detection.
 *
 * @param {RawTcgCard} rawCard
 * @returns {'holo'|'reverseHolo'|'none'}
 */
export function deriveFoilType(rawCard) {
  const r = (rawCard?.rarity ?? '').toLowerCase();
  // Physical variant takes precedence: a Holo Rare with reverse=true is a reverse-holo.
  if (rawCard?.variants?.reverse === true) return 'reverseHolo';
  // Rarity-based holo detection covers all standard holo and full-art classes.
  if (
    r.includes('holo') ||
    r.includes('ultra rare') ||
    r.includes('illustration rare') ||
    r.includes('hyper rare') ||
    r.includes('rainbow') ||
    r.includes('radiant') ||
    r.includes('shining') ||
    r.includes('special illustration')
  ) return 'holo';
  return 'none';
}

// ---------------------------------------------------------------------------
// filterByVariant helpers
// ---------------------------------------------------------------------------

/** Prefix map for regional/mega variants. */
const _VARIANT_PREFIX_MAP = {
  alolan:   'Alolan ',
  galar:    'Galarian ',
  galarian: 'Galarian ',
  hisuian:  'Hisuian ',
  paldean:  'Paldean ',
  mega:     'M ',
};

/**
 * Regex that matches special-card suffixes (V, VMAX, VSTAR, GX, EX, ex, TAG TEAM)
 * as whole words so "Vivid" or "Vex" are not accidentally excluded.
 */
const _SPECIAL_SUFFIX_RE = /\b(VMAX|VSTAR|GX|EX|ex|V)\b|TAG TEAM/;

/**
 * Applies a "regular" filter — excludes all special-mechanic cards.
 * @param {RawTcgCard[]} cards
 * @returns {RawTcgCard[]}
 */
function _regularFilter(cards) {
  return cards.filter(c => !_SPECIAL_SUFFIX_RE.test(c.name));
}

/**
 * Filters a card array to those matching the Pokémon's variant.
 *
 * Fallback chain:
 *  1. Apply variant-specific filter.
 *  2. If empty, try the 'regular' filter instead.
 *  3. If still empty, return all cards unfiltered.
 *
 * @param {RawTcgCard[]} cards
 * @param {{ variant?: string }} pokemon
 * @returns {RawTcgCard[]}
 */
export function filterByVariant(cards, pokemon) {
  if (!cards.length) return cards;

  const variant = pokemon.variant ?? 'regular';
  const prefix = _VARIANT_PREFIX_MAP[variant];

  // Prefix-based variant filter
  if (prefix) {
    const prefixFiltered = cards.filter(c => c.name.startsWith(prefix));
    if (prefixFiltered.length > 0) return prefixFiltered;

    console.warn(
      `[TCGCardService] No "${variant}" (prefix "${prefix}") cards found for ` +
      `"${pokemon.name}" — falling back to regular filter.`
    );
    const regular = _regularFilter(cards);
    if (regular.length > 0) return regular;

    console.warn(
      `[TCGCardService] Regular filter also empty for "${pokemon.name}" — returning all cards.`
    );
    return cards;
  }

  // Default: regular filter (exclude special mechanics)
  const regular = _regularFilter(cards);
  if (regular.length > 0) return regular;

  console.warn(
    `[TCGCardService] Regular filter returned 0 cards for "${pokemon.name}" — returning all cards.`
  );
  return cards;
}

// ---------------------------------------------------------------------------
// Raw-card mapping
// ---------------------------------------------------------------------------

/**
 * Maps a raw TCGdex API card to the shape expected by `rollCard`/`computeWeight`.
 *
 * `computeWeight` requires `gameRarity` (string) and `setYear` (number), which
 * are absent on raw API cards. Call this on the filtered card array BEFORE passing
 * to `rollCard`, then use the returned mapped card directly in `buildCardEntry`.
 *
 * @param {RawTcgCard} rawCard
 * @returns {RawTcgCard & { gameRarity: string, setYear: number, foilType: string }}
 */
export function mapRawCard(rawCard) {
  const setYear =
    parseInt(rawCard.set?.releaseDate?.split(/[-/]/)[0], 10) ||
    new Date().getFullYear();
  return {
    ...rawCard,
    gameRarity: mapTcgRarity(rawCard.rarity),
    setYear,
    foilType: deriveFoilType(rawCard),
  };
}

// ---------------------------------------------------------------------------
// Weight & roll
// ---------------------------------------------------------------------------

/**
 * Computes the weighted selection score for a card.
 *
 * Weight = baseRarityWeight × ageDecay (3 % per year, floor 0).
 *
 * @param {{ gameRarity: string, setYear: number }} card
 * @param {number} [referenceDate=Date.now()]
 * @returns {number}
 */
export function computeWeight(card, referenceDate = Date.now()) {
  const base = TCG_CARD.RARITY_WEIGHTS[card.gameRarity] ?? 1;
  const currentYear = new Date(referenceDate).getFullYear();
  const ageYears = Math.max(0, currentYear - card.setYear);
  const decay = Math.max(0, 1 - 0.03 * ageYears);
  return base * decay;
}

/**
 * Performs a weighted random selection over a card array.
 *
 * @param {Array<{ gameRarity: string, setYear: number }>} cards
 * @param {number} [referenceDate=Date.now()]
 * @returns {object|null} A randomly selected card, or null if the array is empty
 *   or all weights are zero.
 */
export function rollCard(cards, referenceDate = Date.now()) {
  if (!cards || cards.length === 0) return null;

  const weights = cards.map(c => computeWeight(c, referenceDate));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  if (totalWeight <= 0) return null;

  let r = Math.random() * totalWeight;
  for (let i = 0; i < cards.length; i++) {
    r -= weights[i];
    if (r < 0) return cards[i];
  }

  // Floating-point safety: return last card.
  return cards[cards.length - 1];
}

// ---------------------------------------------------------------------------
// buildCardEntry
// ---------------------------------------------------------------------------

/**
 * Constructs a TcgCardEntry from a raw API card, the source Pokémon, and the
 * world the card was obtained in.
 *
 * Validation rules:
 *  - rawCard must be truthy with a non-empty id string.
 *  - rawCard.image must be truthy (cards without art are rejected).
 *  - pokemon.pokemonId must be a positive number.
 *  - worldId must be a non-empty string.
 *
 * @param {RawTcgCard}                          rawCard
 * @param {{ name: string, pokemonId: number }} pokemon
 * @param {string}                              worldId
 * @returns {import('../types').TcgCardEntry|null}
 */
export function buildCardEntry(rawCard, pokemon, worldId) {
  // --- Validation ---
  if (!rawCard || typeof rawCard.id !== 'string' || rawCard.id === '') {
    console.warn('[TCGCardService] buildCardEntry: invalid rawCard.id', rawCard);
    return null;
  }
  if (!rawCard.image) {
    console.warn('[TCGCardService] buildCardEntry: rawCard has no image — skipping', rawCard.id);
    return null;
  }
  if (!Number.isFinite(pokemon.pokemonId) || pokemon.pokemonId <= 0) {
    console.warn('[TCGCardService] buildCardEntry: invalid pokemon.pokemonId', pokemon);
    return null;
  }
  if (!worldId || typeof worldId !== 'string') {
    console.warn('[TCGCardService] buildCardEntry: invalid worldId', worldId);
    return null;
  }

  // --- Parse imageKey ---
  // Full-card endpoint has `set.id` and `set.name`.
  // List-endpoint fallback: derive imageKey from the image URL.
  const cdnPrefix = TCG_CARD.CDN_BASE + '/';
  const hasSetObj = rawCard.set?.id != null;
  const localId   = rawCard.localId ?? (rawCard.image?.split('/').pop() ?? '');
  const imageKey = rawCard.image?.startsWith(cdnPrefix)
    ? rawCard.image.slice(cdnPrefix.length)          // e.g. "swsh/base1/58"
    : hasSetObj
      ? `${rawCard.set.id}/${localId}`               // full card endpoint, no CDN prefix
      : '';

  if (!imageKey) {
    console.warn('[TCGCardService] buildCardEntry: could not derive imageKey', rawCard.id);
    return null;
  }

  // --- Parse set metadata ---
  // Full-card endpoint has set.id, set.name, set.releaseDate.
  // List-endpoint fallback: derive setId from the card id (format "{setId}-{localId}").
  const setId   = rawCard.set?.id   ?? rawCard.id.slice(0, rawCard.id.length - localId.length - 1);
  const setName = rawCard.set?.name ?? setId;

  const setYear    = parseInt(rawCard.set?.releaseDate?.split(/[-/]/)[0], 10) || new Date().getFullYear();
  const gameRarity = mapTcgRarity(rawCard.rarity);
  const foilType   = deriveFoilType(rawCard);

  return {
    uid: crypto.randomUUID(),
    pokemonId: pokemon.pokemonId,
    pokemonName: pokemon.name,
    cardId: rawCard.id,
    cardName: rawCard.name,
    imageKey,
    setId,
    setName,
    setYear,
    localId,
    gameRarity,
    foilType,
    worldId,
    revealed: false,
    caughtAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Test / dev utilities
// ---------------------------------------------------------------------------

/**
 * Clears all TCG localStorage cache entries and the in-flight dedup map.
 * Intended for use in tests and dev tooling only.
 */
export function clearCache() {
  _inFlight.clear();
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith('tcg:'))
      .forEach(k => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
