/**
 * Mart item catalog — data, not logic.
 *
 * Moved out of MartScreen.jsx per expert panel recommendation:
 * "Data masquerading as component code."
 */

export const MART_ITEMS = [
  {
    id: "pokeball_bundle",
    label: "Pokéball Bundle",
    icon: "⚪",
    description: "×5 Pokéballs",
    reward: { pokeball: 5, greatball: 0, ultraball: 0 },
    questionCount: 3,
    subject: null, // null = random
    dailyLimit: null,
    ballType: "pokeball",
  },
  {
    id: "greatball",
    label: "Great Ball",
    icon: "🔵",
    description: "×1 Great Ball — higher catch rate",
    reward: { pokeball: 0, greatball: 1, ultraball: 0 },
    questionCount: 5,
    subject: null,
    dailyLimit: 3,
    ballType: "greatball",
  },
  {
    id: "ultraball",
    label: "Ultra Ball",
    icon: "🟡",
    description: "×1 Ultra Ball — best catch rate",
    reward: { pokeball: 0, greatball: 0, ultraball: 1 },
    questionCount: 10,
    subject: null,
    dailyLimit: 1,
    ballType: "ultraball",
  },
  {
    id: "hint_tokens",
    label: "Hint Tokens",
    icon: "💡",
    description: "×3 Hint Tokens",
    reward: { pokeball: 0, greatball: 0, ultraball: 0, hints: 3 },
    questionCount: 2,
    subject: null,
    dailyLimit: null,
    ballType: null,
  },
];
