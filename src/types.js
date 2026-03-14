/**
 * Shared JSDoc type definitions for the Reading Games codebase.
 *
 * Import this file for IDE autocompletion and to document contracts
 * between Model (services), ViewModel (hooks), and View (components).
 */

/**
 * @typedef {'common'|'uncommon'|'rare'|'legendary'} Rarity
 */

/**
 * @typedef {'pokeball'|'greatball'|'ultraball'} BallType
 */

/**
 * @typedef {Object} IVs
 * @property {number} attack  - 0–15
 * @property {number} defense - 0–15
 * @property {number} stamina - 0–15
 */

/**
 * @typedef {0|1|2|3|4} StarRating
 */

/**
 * @typedef {Object} Pokemon
 * @property {number}  pokemonId
 * @property {string}  name
 * @property {string}  type
 * @property {Rarity}  rarity
 * @property {string}  [variant]  - 'regular'|'mega'|'megaShiny'|'alolan'|'galar'|'hisuian'
 * @property {boolean} [isShiny]
 */

/**
 * @typedef {Object} CollectionEntry
 * @property {string}     uid
 * @property {number}     pokemonId
 * @property {string}     name
 * @property {string}     type
 * @property {string}     variant
 * @property {boolean}    isShiny
 * @property {Rarity}     rarity
 * @property {IVs}        ivs
 * @property {StarRating} stars
 * @property {number}     caughtAt    - timestamp
 * @property {string}     worldId
 * @property {boolean}    isFavorite
 */

/**
 * @typedef {Object} CatchResult
 * @property {number}     xpGained
 * @property {number}     candyEarned
 * @property {boolean}    isNew       - first time catching this species
 * @property {boolean}    didLevelUp
 * @property {number}     newLevel
 * @property {IVs}        ivs
 * @property {StarRating} stars
 */

/**
 * @typedef {Object} EvolutionResult
 * @property {boolean} success
 * @property {string}  [reason]      - 'not_found'|'no_evolution'|'not_enough_candy'
 * @property {number}  [cost]
 * @property {number}  [evolvedTo]
 * @property {string}  [evolvedName]
 * @property {boolean} [isNewDex]
 * @property {number}  [need]
 * @property {number}  [have]
 */

/**
 * @typedef {Object} MegaResult
 * @property {boolean} success
 * @property {string}  [reason]      - 'no_mega'|'already_active'|'not_enough_mega_candy'
 * @property {number}  [cost]
 * @property {number}  [expiresAt]
 * @property {number}  [need]
 * @property {number}  [have]
 */

/**
 * @typedef {Object} DailyRewardResult
 * @property {{ pokeball: number, greatball: number, ultraball: number }} reward
 * @property {number} streak
 */

/**
 * @typedef {'question'|'encounter'|'throwing'|'result'} EncounterPhase
 */

/**
 * @typedef {'tossing'|'capturing'|'wobbling'|'locked'|'burst'|null} ThrowStage
 */

/**
 * @typedef {'caught'|'fled'|'failed_wrong'|null} CatchOutcome
 */

/**
 * @typedef {Object} EncounterState
 * @property {EncounterPhase}  phase
 * @property {ThrowStage}      throwStage
 * @property {CatchOutcome}    catchResult
 * @property {CatchResult|null} catchDetails
 * @property {Object|null}     selectedAnswer
 * @property {Object|null}     question
 */

/**
 * @typedef {Object} XPResult
 * @property {number}  xpGained
 * @property {boolean} isNew
 * @property {boolean} didLevelUp
 * @property {number}  newLevel
 * @property {number}  remainingXp
 */

/**
 * @typedef {Object} LevelUpBalls
 * @property {number} pokeball
 * @property {number} greatball
 * @property {number} ultraball
 */

/** @typedef {'holo'|'reverseHolo'|'none'} FoilType */

/**
 * @typedef {Object} TcgCardEntry
 * @property {string}     uid
 * @property {string}     cardId
 * @property {number}     pokemonId
 * @property {string}     cardName
 * @property {string}     imageKey    - "{setId}/{localId}" — NOT a full URL
 * @property {string}     setId
 * @property {string}     setName
 * @property {number}     setYear
 * @property {string}     localId
 * @property {Rarity}     gameRarity
 * @property {FoilType}   foilType
 * @property {number}     caughtAt
 * @property {string}     worldId
 * @property {boolean}    revealed    - false until player flips in Cards tab
 */

// This file is intentionally declaration-only (JSDoc).
// No runtime exports — import types via /** @type {import('../types').Rarity} */
export {};
