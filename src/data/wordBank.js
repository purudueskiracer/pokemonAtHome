/**
 * wordBank — structured sight word data with verified ARASAAC pictogram IDs.
 *
 * Built from the official Dolch sight word lists (Pre-Primer through Grade 3)
 * plus the 95 Dolch Nouns, organized by grade level. Each word was FIRST
 * selected from the grade-appropriate list, THEN verified against the
 * ARASAAC API (https://api.arasaac.org/v1/pictograms/en/search/{word})
 * to confirm a real pictogram exists.
 *
 * Visual words (concrete nouns + clear action verbs) are used for:
 *   picture_word, word_picture, missing_letter question formats.
 *
 * Abstract sight words (pronouns, prepositions, articles, etc.) are used for:
 *   audio_word, multiple_choice question formats.
 *
 * Attribution: Pictograms by ARASAAC (https://arasaac.org),
 * created by Sergio Palao, Gobierno de Aragón. CC BY-NC-SA 4.0.
 */

import { registerImageIds } from "../services/ImageService";

/**
 * Word bank entries.
 * arasaacId values verified via https://api.arasaac.org/v1/pictograms/en/search/{word}
 * using the first result's `_id` field.
 */
export const WORD_BANK = [
  // ═══════════════════════════════════════════════════════════════════
  // GRADE 0 — Pre-K / Kindergarten
  // Source: Pre-Primer + Primer Dolch lists + simple Dolch Nouns
  // ═══════════════════════════════════════════════════════════════════

  // ── Animals (Dolch Nouns: cat, dog, bird, duck, pig, cow, fish + extras) ──
  { word: "cat",     category: "animals",  grade: 0, arasaacId: 7114,  visual: true },
  { word: "dog",     category: "animals",  grade: 0, arasaacId: 7202,  visual: true },
  { word: "fish",    category: "animals",  grade: 0, arasaacId: 2520,  visual: true },
  { word: "bird",    category: "animals",  grade: 0, arasaacId: 2490,  visual: true },
  { word: "duck",    category: "animals",  grade: 0, arasaacId: 28479, visual: true },
  { word: "pig",     category: "animals",  grade: 0, arasaacId: 24972, visual: true },
  { word: "cow",     category: "animals",  grade: 0, arasaacId: 2609,  visual: true },
  { word: "frog",    category: "animals",  grade: 0, arasaacId: 28473, visual: true },
  { word: "hen",     category: "animals",  grade: 0, arasaacId: 2403,  visual: true },
  { word: "bug",     category: "animals",  grade: 0, arasaacId: 28459, visual: true },

  // ── Food (Dolch Nouns: apple, cake, egg, milk, bread) ──
  { word: "apple",   category: "food",     grade: 0, arasaacId: 2462,  visual: true },
  { word: "cake",    category: "food",     grade: 0, arasaacId: 2502,  visual: true },
  { word: "egg",     category: "food",     grade: 0, arasaacId: 2427,  visual: true },
  { word: "milk",    category: "food",     grade: 0, arasaacId: 2445,  visual: true },
  { word: "bread",   category: "food",     grade: 0, arasaacId: 2494,  visual: true },

  // ── Objects (Dolch Nouns: ball, bed, box, doll, toy, top + extras) ──
  { word: "ball",    category: "objects",   grade: 0, arasaacId: 3241,  visual: true },
  { word: "book",    category: "objects",   grade: 0, arasaacId: 25191, visual: true },
  { word: "cup",     category: "objects",   grade: 0, arasaacId: 2582,  visual: true },
  { word: "hat",     category: "objects",   grade: 0, arasaacId: 2572,  visual: true },
  { word: "bed",     category: "objects",   grade: 0, arasaacId: 25900, visual: true },
  { word: "box",     category: "objects",   grade: 0, arasaacId: 24749, visual: true },
  { word: "doll",    category: "objects",   grade: 0, arasaacId: 26238, visual: true },
  { word: "toy",     category: "objects",   grade: 0, arasaacId: 9813,  visual: true },

  // ── Nature ──
  { word: "sun",     category: "nature",    grade: 0, arasaacId: 7252,  visual: true },
  { word: "star",    category: "nature",    grade: 0, arasaacId: 2752,  visual: true },
  { word: "tree",    category: "nature",    grade: 0, arasaacId: 3057,  visual: true },
  { word: "water",   category: "nature",    grade: 0, arasaacId: 32464, visual: true },

  // ── Vehicles ──
  { word: "car",     category: "vehicles",  grade: 0, arasaacId: 2339,  visual: true },
  { word: "bus",     category: "vehicles",  grade: 0, arasaacId: 2262,  visual: true },
  { word: "boat",    category: "vehicles",  grade: 0, arasaacId: 6932,  visual: true },

  // ── People (Dolch Nouns) ──
  { word: "boy",     category: "people",    grade: 0, arasaacId: 7176,  visual: true },
  { word: "girl",    category: "people",    grade: 0, arasaacId: 27509, visual: true },
  { word: "baby",    category: "people",    grade: 0, arasaacId: 6060,  visual: true },

  // ── Body ──
  { word: "eye",     category: "body",      grade: 0, arasaacId: 6573,  visual: true },

  // ── Actions (Pre-Primer/Primer Dolch verbs) ──
  { word: "run",     category: "actions",   grade: 0, arasaacId: 6465,  visual: true },
  { word: "jump",    category: "actions",   grade: 0, arasaacId: 39052, visual: true },
  { word: "eat",     category: "actions",   grade: 0, arasaacId: 6456,  visual: true },
  { word: "ride",    category: "actions",   grade: 0, arasaacId: 6045,  visual: true },

  // ── Abstract Sight Words (Pre-Primer + Primer Dolch) ──
  { word: "the",     category: "sight",     grade: 0, visual: false },
  { word: "and",     category: "sight",     grade: 0, visual: false },
  { word: "a",       category: "sight",     grade: 0, visual: false },
  { word: "is",      category: "sight",     grade: 0, visual: false },
  { word: "to",      category: "sight",     grade: 0, visual: false },
  { word: "in",      category: "sight",     grade: 0, visual: false },
  { word: "it",      category: "sight",     grade: 0, visual: false },
  { word: "you",     category: "sight",     grade: 0, visual: false },
  { word: "we",      category: "sight",     grade: 0, visual: false },
  { word: "my",      category: "sight",     grade: 0, visual: false },
  { word: "I",       category: "sight",     grade: 0, visual: false },
  { word: "can",     category: "sight",     grade: 0, visual: false },
  { word: "for",     category: "sight",     grade: 0, visual: false },
  { word: "here",    category: "sight",     grade: 0, visual: false },
  { word: "said",    category: "sight",     grade: 0, visual: false },
  { word: "me",      category: "sight",     grade: 0, visual: false },
  { word: "not",     category: "sight",     grade: 0, visual: false },
  { word: "up",      category: "sight",     grade: 0, visual: false },
  { word: "go",      category: "sight",     grade: 0, visual: false },
  { word: "see",     category: "sight",     grade: 0, visual: false },
  { word: "no",      category: "sight",     grade: 0, visual: false },
  { word: "all",     category: "sight",     grade: 0, visual: false },
  { word: "am",      category: "sight",     grade: 0, visual: false },
  { word: "are",     category: "sight",     grade: 0, visual: false },
  { word: "at",      category: "sight",     grade: 0, visual: false },
  { word: "be",      category: "sight",     grade: 0, visual: false },
  { word: "but",     category: "sight",     grade: 0, visual: false },
  { word: "did",     category: "sight",     grade: 0, visual: false },
  { word: "do",      category: "sight",     grade: 0, visual: false },
  { word: "get",     category: "sight",     grade: 0, visual: false },
  { word: "good",    category: "sight",     grade: 0, visual: false },
  { word: "have",    category: "sight",     grade: 0, visual: false },
  { word: "he",      category: "sight",     grade: 0, visual: false },
  { word: "into",    category: "sight",     grade: 0, visual: false },
  { word: "like",    category: "sight",     grade: 0, visual: false },
  { word: "must",    category: "sight",     grade: 0, visual: false },
  { word: "now",     category: "sight",     grade: 0, visual: false },
  { word: "on",      category: "sight",     grade: 0, visual: false },
  { word: "our",     category: "sight",     grade: 0, visual: false },
  { word: "she",     category: "sight",     grade: 0, visual: false },
  { word: "so",      category: "sight",     grade: 0, visual: false },
  { word: "that",    category: "sight",     grade: 0, visual: false },
  { word: "they",    category: "sight",     grade: 0, visual: false },
  { word: "this",    category: "sight",     grade: 0, visual: false },
  { word: "too",     category: "sight",     grade: 0, visual: false },
  { word: "was",     category: "sight",     grade: 0, visual: false },
  { word: "what",    category: "sight",     grade: 0, visual: false },
  { word: "will",    category: "sight",     grade: 0, visual: false },
  { word: "with",    category: "sight",     grade: 0, visual: false },
  { word: "yes",     category: "sight",     grade: 0, visual: false },

  // ═══════════════════════════════════════════════════════════════════
  // GRADE 1 — First Grade
  // Source: Grade 1 Dolch list + medium-difficulty Dolch Nouns
  // ═══════════════════════════════════════════════════════════════════

  // ── Animals (Dolch Nouns: horse, bear, rabbit, sheep, chicken, goat + extras) ──
  { word: "horse",    category: "animals",  grade: 1, arasaacId: 2294,  visual: true },
  { word: "bear",     category: "animals",  grade: 1, arasaacId: 2488,  visual: true },
  { word: "rabbit",   category: "animals",  grade: 1, arasaacId: 2351,  visual: true },
  { word: "sheep",    category: "animals",  grade: 1, arasaacId: 2489,  visual: true },
  { word: "mouse",    category: "animals",  grade: 1, arasaacId: 2546,  visual: true },
  { word: "goat",     category: "animals",  grade: 1, arasaacId: 25887, visual: true },
  { word: "chicken",  category: "animals",  grade: 1, arasaacId: 4952,  visual: true },

  // ── Food ──
  { word: "banana",   category: "food",     grade: 1, arasaacId: 2530,  visual: true },
  { word: "orange",   category: "food",     grade: 1, arasaacId: 2888,  visual: true },
  { word: "pizza",    category: "food",     grade: 1, arasaacId: 2527,  visual: true },

  // ── Objects (Dolch Nouns: chair, bell, shoe, ring, watch, coat, stick, window) ──
  { word: "door",     category: "objects",  grade: 1, arasaacId: 3244,  visual: true },
  { word: "chair",    category: "objects",  grade: 1, arasaacId: 3155,  visual: true },
  { word: "bell",     category: "objects",  grade: 1, arasaacId: 5949,  visual: true },
  { word: "table",    category: "objects",  grade: 1, arasaacId: 3129,  visual: true },
  { word: "shoe",     category: "objects",  grade: 1, arasaacId: 32922, visual: true },
  { word: "ring",     category: "objects",  grade: 1, arasaacId: 6900,  visual: true },
  { word: "watch",    category: "objects",  grade: 1, arasaacId: 6564,  visual: true },
  { word: "coat",     category: "objects",  grade: 1, arasaacId: 2242,  visual: true },
  { word: "stick",    category: "objects",  grade: 1, arasaacId: 11322, visual: true },
  { word: "window",   category: "objects",  grade: 1, arasaacId: 2611,  visual: true },

  // ── Nature (Dolch Nouns: flower, rain, snow, nest, seed, grass, fire, hill, wood) ──
  { word: "flower",   category: "nature",   grade: 1, arasaacId: 7104,  visual: true },
  { word: "rain",     category: "nature",   grade: 1, arasaacId: 7148,  visual: true },
  { word: "snow",     category: "nature",   grade: 1, arasaacId: 7172,  visual: true },
  { word: "nest",     category: "nature",   grade: 1, arasaacId: 7173,  visual: true },
  { word: "seed",     category: "nature",   grade: 1, arasaacId: 7245,  visual: true },
  { word: "grass",    category: "nature",   grade: 1, arasaacId: 3113,  visual: true },
  { word: "fire",     category: "nature",   grade: 1, arasaacId: 4654,  visual: true },
  { word: "hill",     category: "nature",   grade: 1, arasaacId: 38728, visual: true },
  { word: "wood",     category: "nature",   grade: 1, arasaacId: 6143,  visual: true },

  // ── Vehicles ──
  { word: "train",    category: "vehicles", grade: 1, arasaacId: 2603,  visual: true },
  { word: "bike",     category: "vehicles", grade: 1, arasaacId: 6935,  visual: true },

  // ── Body (Dolch Nouns: hand, feet, head, leg) ──
  { word: "hand",     category: "body",     grade: 1, arasaacId: 28431, visual: true },
  { word: "feet",     category: "body",     grade: 1, arasaacId: 25327, visual: true },
  { word: "head",     category: "body",     grade: 1, arasaacId: 2673,  visual: true },
  { word: "leg",      category: "body",     grade: 1, arasaacId: 8666,  visual: true },

  // ── People (Dolch Nouns: man, father, mother, brother, sister, farmer) ──
  { word: "man",      category: "people",   grade: 1, arasaacId: 4665,  visual: true },
  { word: "father",   category: "people",   grade: 1, arasaacId: 2497,  visual: true },
  { word: "mother",   category: "people",   grade: 1, arasaacId: 2458,  visual: true },
  { word: "brother",  category: "people",   grade: 1, arasaacId: 2423,  visual: true },
  { word: "sister",   category: "people",   grade: 1, arasaacId: 2422,  visual: true },
  { word: "farmer",   category: "people",   grade: 1, arasaacId: 2982,  visual: true },

  // ── Places (Dolch Nouns: house, farm, school, street) ──
  { word: "house",    category: "places",   grade: 1, arasaacId: 6964,  visual: true },
  { word: "farm",     category: "places",   grade: 1, arasaacId: 32482, visual: true },
  { word: "school",   category: "places",   grade: 1, arasaacId: 32446, visual: true },
  { word: "street",   category: "places",   grade: 1, arasaacId: 2299,  visual: true },

  // ── Actions (Grade 1 Dolch verbs) ──
  { word: "walk",     category: "actions",  grade: 1, arasaacId: 29951, visual: true },
  { word: "fly",      category: "actions",  grade: 1, arasaacId: 6246,  visual: true },
  { word: "stop",     category: "actions",  grade: 1, arasaacId: 7196,  visual: true },
  { word: "open",     category: "actions",  grade: 1, arasaacId: 24825, visual: true },
  { word: "sleep",    category: "actions",  grade: 1, arasaacId: 6479,  visual: true },

  // ── Abstract Sight Words (Grade 1 Dolch) ──
  { word: "after",    category: "sight",    grade: 1, visual: false },
  { word: "again",    category: "sight",    grade: 1, visual: false },
  { word: "an",       category: "sight",    grade: 1, visual: false },
  { word: "any",      category: "sight",    grade: 1, visual: false },
  { word: "as",       category: "sight",    grade: 1, visual: false },
  { word: "by",       category: "sight",    grade: 1, visual: false },
  { word: "could",    category: "sight",    grade: 1, visual: false },
  { word: "every",    category: "sight",    grade: 1, visual: false },
  { word: "from",     category: "sight",    grade: 1, visual: false },
  { word: "had",      category: "sight",    grade: 1, visual: false },
  { word: "has",      category: "sight",    grade: 1, visual: false },
  { word: "her",      category: "sight",    grade: 1, visual: false },
  { word: "him",      category: "sight",    grade: 1, visual: false },
  { word: "his",      category: "sight",    grade: 1, visual: false },
  { word: "how",      category: "sight",    grade: 1, visual: false },
  { word: "just",     category: "sight",    grade: 1, visual: false },
  { word: "know",     category: "sight",    grade: 1, visual: false },
  { word: "let",      category: "sight",    grade: 1, visual: false },
  { word: "of",       category: "sight",    grade: 1, visual: false },
  { word: "once",     category: "sight",    grade: 1, visual: false },
  { word: "some",     category: "sight",    grade: 1, visual: false },
  { word: "then",     category: "sight",    grade: 1, visual: false },
  { word: "think",    category: "sight",    grade: 1, visual: false },
  { word: "were",     category: "sight",    grade: 1, visual: false },
  { word: "when",     category: "sight",    grade: 1, visual: false },

  // ═══════════════════════════════════════════════════════════════════
  // GRADE 2 — Second Grade
  // Source: Grade 2 Dolch list + intermediate Dolch Nouns
  // ═══════════════════════════════════════════════════════════════════

  // ── Animals (Dolch Nouns: squirrel + expanded vocabulary) ──
  { word: "lion",     category: "animals",  grade: 2, arasaacId: 25187, visual: true },
  { word: "tiger",    category: "animals",  grade: 2, arasaacId: 2590,  visual: true },
  { word: "elephant", category: "animals",  grade: 2, arasaacId: 2372,  visual: true },
  { word: "monkey",   category: "animals",  grade: 2, arasaacId: 2477,  visual: true },
  { word: "snake",    category: "animals",  grade: 2, arasaacId: 2568,  visual: true },
  { word: "turtle",   category: "animals",  grade: 2, arasaacId: 10241, visual: true },
  { word: "squirrel", category: "animals",  grade: 2, arasaacId: 25815, visual: true },

  // ── Food (Dolch Nouns: corn + expanded) ──
  { word: "cheese",   category: "food",     grade: 2, arasaacId: 2541,  visual: true },
  { word: "grape",    category: "food",     grade: 2, arasaacId: 9142,  visual: true },
  { word: "corn",     category: "food",     grade: 2, arasaacId: 4879,  visual: true },

  // ── Objects (Dolch Nouns: letter, paper, money, picture + expanded) ──
  { word: "clock",    category: "objects",  grade: 2, arasaacId: 5561,  visual: true },
  { word: "pencil",   category: "objects",  grade: 2, arasaacId: 2440,  visual: true },
  { word: "letter",   category: "objects",  grade: 2, arasaacId: 2688,  visual: true },
  { word: "paper",    category: "objects",  grade: 2, arasaacId: 8349,  visual: true },
  { word: "money",    category: "objects",  grade: 2, arasaacId: 4630,  visual: true },
  { word: "picture",  category: "objects",  grade: 2, arasaacId: 2360,  visual: true },
  { word: "game",     category: "objects",  grade: 2, arasaacId: 6170,  visual: true },

  // ── Nature (Dolch Nouns: garden, wind + expanded) ──
  { word: "moon",     category: "nature",   grade: 2, arasaacId: 2933,  visual: true },
  { word: "cloud",    category: "nature",   grade: 2, arasaacId: 34383, visual: true },
  { word: "wind",     category: "nature",   grade: 2, arasaacId: 7259,  visual: true },
  { word: "garden",   category: "nature",   grade: 2, arasaacId: 2974,  visual: true },

  // ── Places / Events (Dolch Nouns) ──
  { word: "party",    category: "places",   grade: 2, arasaacId: 7099,  visual: true },
  { word: "birthday", category: "objects",  grade: 2, arasaacId: 37363, visual: true },

  // ── Actions (Grade 2 Dolch verbs) ──
  { word: "read",     category: "actions",  grade: 2, arasaacId: 7141,  visual: true },
  { word: "write",    category: "actions",  grade: 2, arasaacId: 2380,  visual: true },
  { word: "sing",     category: "actions",  grade: 2, arasaacId: 6960,  visual: true },
  { word: "sit",      category: "actions",  grade: 2, arasaacId: 6611,  visual: true },
  { word: "wash",     category: "actions",  grade: 2, arasaacId: 34826, visual: true },
  { word: "work",     category: "actions",  grade: 2, arasaacId: 6624,  visual: true },
  { word: "call",     category: "actions",  grade: 2, arasaacId: 32669, visual: true },
  { word: "buy",      category: "actions",  grade: 2, arasaacId: 8986,  visual: true },
  { word: "pull",     category: "actions",  grade: 2, arasaacId: 36601, visual: true },

  // ── Abstract Sight Words (Grade 2 Dolch) ──
  { word: "because",  category: "sight",    grade: 2, visual: false },
  { word: "would",    category: "sight",    grade: 2, visual: false },
  { word: "their",    category: "sight",    grade: 2, visual: false },
  { word: "there",    category: "sight",    grade: 2, visual: false },
  { word: "where",    category: "sight",    grade: 2, visual: false },
  { word: "which",    category: "sight",    grade: 2, visual: false },
  { word: "very",     category: "sight",    grade: 2, visual: false },
  { word: "many",     category: "sight",    grade: 2, visual: false },
  { word: "before",   category: "sight",    grade: 2, visual: false },
  { word: "about",    category: "sight",    grade: 2, visual: false },
  { word: "does",     category: "sight",    grade: 2, visual: false },
  { word: "always",   category: "sight",    grade: 2, visual: false },
  { word: "both",     category: "sight",    grade: 2, visual: false },
  { word: "your",     category: "sight",    grade: 2, visual: false },
  { word: "why",      category: "sight",    grade: 2, visual: false },
  { word: "been",     category: "sight",    grade: 2, visual: false },
  { word: "best",     category: "sight",    grade: 2, visual: false },

  // ═══════════════════════════════════════════════════════════════════
  // GRADE 3 — Third Grade
  // Source: Grade 3 Dolch list + advanced Dolch Nouns + expanded vocab
  // ═══════════════════════════════════════════════════════════════════

  // ── Animals (expanded vocabulary) ──
  { word: "dolphin",  category: "animals",  grade: 3, arasaacId: 2732,  visual: true },
  { word: "eagle",    category: "animals",  grade: 3, arasaacId: 2638,  visual: true },
  { word: "whale",    category: "animals",  grade: 3, arasaacId: 2268,  visual: true },
  { word: "spider",   category: "animals",  grade: 3, arasaacId: 38275, visual: true },

  // ── Food (expanded vocabulary) ──
  { word: "tomato",   category: "food",     grade: 3, arasaacId: 2594,  visual: true },
  { word: "carrot",   category: "food",     grade: 3, arasaacId: 2619,  visual: true },
  { word: "lemon",    category: "food",     grade: 3, arasaacId: 3022,  visual: true },

  // ── Objects (expanded vocabulary) ──
  { word: "guitar",   category: "objects",  grade: 3, arasaacId: 2417,  visual: true },
  { word: "camera",   category: "objects",  grade: 3, arasaacId: 24925, visual: true },
  { word: "umbrella", category: "objects",  grade: 3, arasaacId: 2500,  visual: true },
  { word: "bridge",   category: "objects",  grade: 3, arasaacId: 6194,  visual: true },

  // ── Actions (Grade 3 Dolch verbs) ──
  { word: "draw",     category: "actions",  grade: 3, arasaacId: 8088,  visual: true },
  { word: "drink",    category: "actions",  grade: 3, arasaacId: 6061,  visual: true },
  { word: "cut",      category: "actions",  grade: 3, arasaacId: 5975,  visual: true },
  { word: "clean",    category: "actions",  grade: 3, arasaacId: 26172, visual: true },
  { word: "carry",    category: "actions",  grade: 3, arasaacId: 8983,  visual: true },
  { word: "grow",     category: "actions",  grade: 3, arasaacId: 7002,  visual: true },
  { word: "laugh",    category: "actions",  grade: 3, arasaacId: 13354, visual: true },
  { word: "fall",     category: "actions",  grade: 3, arasaacId: 39440, visual: true },
  { word: "hold",     category: "actions",  grade: 3, arasaacId: 32761, visual: true },

  // ── Abstract Sight Words (Grade 3 Dolch) ──
  { word: "never",    category: "sight",    grade: 3, visual: false },
  { word: "together", category: "sight",    grade: 3, visual: false },
  { word: "today",    category: "sight",    grade: 3, visual: false },
  { word: "enough",   category: "sight",    grade: 3, visual: false },
  { word: "between",  category: "sight",    grade: 3, visual: false },
  { word: "through",  category: "sight",    grade: 3, visual: false },
  { word: "thought",  category: "sight",    grade: 3, visual: false },
  { word: "different",category: "sight",    grade: 3, visual: false },
  { word: "important",category: "sight",    grade: 3, visual: false },
  { word: "myself",   category: "sight",    grade: 3, visual: false },
  { word: "shall",    category: "sight",    grade: 3, visual: false },
  { word: "better",   category: "sight",    grade: 3, visual: false },
  { word: "only",     category: "sight",    grade: 3, visual: false },
  { word: "keep",     category: "sight",    grade: 3, visual: false },
];

// ── Self-register all visual words with ImageService on import ────────
const visualEntries = WORD_BANK.filter((w) => w.visual && w.arasaacId);
registerImageIds(visualEntries);

// ── Helper lookups ────────────────────────────────────────────────────

/**
 * Get visual words at ±1 grade, optionally filtered by category.
 * @param {number} grade
 * @param {string} [category]
 * @returns {typeof WORD_BANK}
 */
export function getVisualWords(grade, category) {
  return WORD_BANK.filter(
    (w) =>
      w.visual &&
      Math.abs(w.grade - grade) <= 1 &&
      (!category || w.category === category)
  );
}

/**
 * Get all words (including abstract) at ±1 grade.
 * @param {number} grade
 * @returns {typeof WORD_BANK}
 */
export function getAllWords(grade) {
  return WORD_BANK.filter((w) => Math.abs(w.grade - grade) <= 1);
}

/**
 * Get n random distractors from the same grade/category, excluding `exclude`.
 * @param {string} exclude — correct word to exclude
 * @param {number} grade
 * @param {string} [category]
 * @param {number} [count=3]
 * @returns {string[]}
 */
export function getWordDistractors(exclude, grade, category, count = 3) {
  const pool = getVisualWords(grade, category).filter(
    (w) => w.word !== exclude
  );
  // Shuffle & take
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  // If same-category pool is too small, expand to all visual words at grade
  if (shuffled.length < count) {
    const expanded = getVisualWords(grade)
      .filter(
        (w) => w.word !== exclude && !shuffled.find((s) => s.word === w.word)
      )
      .sort(() => Math.random() - 0.5);
    shuffled.push(...expanded);
  }

  return shuffled.slice(0, count).map((w) => w.word);
}
