/**
 * ReadingGenerator — procedurally generates reading questions on the fly.
 *
 * Produces: picture_word, word_picture, audio_word, missing_letter
 * questions using the wordBank and ARASAAC image service.
 *
 * Depends only on wordBank (data) and ImageService (image URLs).
 */

import { getVisualWords, getAllWords, getWordDistractors } from "../data/wordBank";
import { getImageUrl } from "./ImageService";

/** Fisher-Yates shuffle (returns new array). */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Random element from array. */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Picture → Word ────────────────────────────────────────────────────

function generatePictureWord(grade) {
  const pool = getVisualWords(grade);
  if (pool.length < 4) return null;
  const entry = pick(pool);
  const distractors = getWordDistractors(entry.word, grade, entry.category);

  const answers = shuffle([
    { text: entry.word, correct: true },
    ...distractors.map((w) => ({ text: w, correct: false })),
  ]);

  return {
    id: `read-pw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    subject: "reading",
    grade,
    format: "picture_word",
    word: entry.word,
    imageUrl: getImageUrl(entry.word),
    answers,
    tags: ["picture-word", entry.category],
    generated: true,
  };
}

// ── Word → Picture ────────────────────────────────────────────────────

function generateWordPicture(grade) {
  const pool = getVisualWords(grade);
  if (pool.length < 4) return null;
  const entry = pick(pool);
  const distractors = getWordDistractors(entry.word, grade, entry.category);

  const answers = shuffle([
    { text: entry.word, imageUrl: getImageUrl(entry.word), correct: true },
    ...distractors.map((w) => ({
      text: w,
      imageUrl: getImageUrl(w),
      correct: false,
    })),
  ]);

  return {
    id: `read-wp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    subject: "reading",
    grade,
    format: "word_picture",
    word: entry.word,
    answers,
    tags: ["word-picture", entry.category],
    generated: true,
  };
}

// ── Audio → Word ──────────────────────────────────────────────────────

function generateAudioWord(grade) {
  const pool = getAllWords(grade);
  if (pool.length < 4) return null;
  const entry = pick(pool);
  // Distractors from all words (including non-visual)
  const otherWords = pool
    .filter((w) => w.word !== entry.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((w) => w.word);

  const answers = shuffle([
    { text: entry.word, correct: true },
    ...otherWords.map((w) => ({ text: w, correct: false })),
  ]);

  return {
    id: `read-aw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    subject: "reading",
    grade,
    format: "audio_word",
    word: entry.word,
    answers,
    tags: ["audio-word"],
    generated: true,
  };
}

// ── Missing Letter ────────────────────────────────────────────────────

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

function generateMissingLetter(grade) {
  // Only use visual words for the image hint, min 3 letters
  const pool = getVisualWords(grade).filter((w) => w.word.length >= 3);
  if (pool.length < 1) return null;
  const entry = pick(pool);
  const word = entry.word;

  // Pick a vowel position to blank out (easier for young readers)
  const vowelIndices = word
    .split("")
    .map((ch, i) => (VOWELS.has(ch.toLowerCase()) ? i : -1))
    .filter((i) => i >= 0);

  // If no vowels (unlikely), pick any index
  const missingIndex =
    vowelIndices.length > 0
      ? pick(vowelIndices)
      : Math.floor(Math.random() * word.length);

  const correctLetter = word[missingIndex].toLowerCase();

  // Distractors: other vowels (or consonants if correct is consonant)
  const distPool = VOWELS.has(correctLetter)
    ? [...VOWELS].filter((v) => v !== correctLetter)
    : ["b", "d", "g", "m", "n", "p", "r", "s", "t"].filter(
        (c) => c !== correctLetter
      );
  const distractors = shuffle(distPool).slice(0, 3);

  const answers = shuffle([
    { text: correctLetter, correct: true },
    ...distractors.map((d) => ({ text: d, correct: false })),
  ]);

  return {
    id: `read-ml-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    subject: "reading",
    grade,
    format: "missing_letter",
    word,
    missingIndex,
    imageUrl: getImageUrl(word),
    answers,
    tags: ["missing-letter", "phonics"],
    generated: true,
  };
}

// ── Public API ────────────────────────────────────────────────────────

const GENERATORS = [
  generatePictureWord,
  generateWordPicture,
  generateAudioWord,
  generateMissingLetter,
];

/**
 * Generate a single random reading question appropriate for the given grade.
 * @param {number} grade — 0 (K) through 5
 * @returns {import('../types').Question | null}
 */
export function generateReadingQuestion(grade) {
  const clampedGrade = Math.max(0, Math.min(5, grade));
  // Try all generators in random order until one succeeds
  const shuffled = shuffle(GENERATORS);
  for (const gen of shuffled) {
    const q = gen(clampedGrade);
    if (q) return q;
  }
  return null;
}
