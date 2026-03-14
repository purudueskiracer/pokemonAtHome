// Simple event bus to bridge Phaser ↔ React
// Phaser fires events, React listens (and vice versa)

const listeners = {};

export const EventBus = {
  on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  },

  off(event, callback) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter((cb) => cb !== callback);
  },

  emit(event, data) {
    if (!listeners[event]) return;
    // Slice to protect against mid-iteration removal
    listeners[event].slice().forEach((cb) => {
      try { cb(data); } catch (e) { console.error(`[EventBus] Error in "${event}" listener:`, e); }
    });
  },

  once(event, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  },
};

// Event name constants — keeps things consistent
export const EVENTS = {
  // Phaser → React
  WILD_ENCOUNTER:       "wild-encounter",       // { pokemon, worldId }
  ITEM_FOUND:           "item-found",           // { itemType, quantity }
  WORLD_LOADED:         "world-loaded",         // { worldId }

  // React → Phaser
  ENCOUNTER_RESOLVED:   "encounter-resolved",   // { caught: bool }
  RESUME_WORLD:         "resume-world",
  PAUSE_WORLD:          "pause-world",

  // Catch → Card pipeline
  POKEMON_CAUGHT:       "pokemon:caught",        // { pokemon, worldId }
  CARD_EARNED:          "card:earned",            // { card, pokemon }
};
