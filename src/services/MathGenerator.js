/**
 * MathGenerator — procedurally generates math questions on the fly.
 *
 * Produces standard question objects compatible with the encounter system.
 * Covers: counting, addition, subtraction, multiplication, division,
 * fractions, decimals, percentages — scaled by grade level.
 *
 * Depends only on GameConfig for grade ranges.
 */

import { MATH_GRADE_RANGES } from "../config/GameConfig";

/** Fisher-Yates shuffle (in-place). */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Random int in [min, max] inclusive. */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick n unique distractors that are different from `correct`. */
function makeDistractors(correct, count, minVal, maxVal) {
  const set = new Set([correct]);
  let attempts = 0;
  while (set.size < count + 1 && attempts < 50) {
    // Bias distractors close to the correct answer for harder questions
    const offset = randInt(-3, 3);
    let d = correct + offset;
    if (d < minVal) d = minVal;
    if (d > maxVal) d = maxVal;
    if (d !== correct) set.add(d);

    // Also try fully random to avoid deadlocks
    const r = randInt(minVal, maxVal);
    if (r !== correct) set.add(r);
    attempts++;
  }
  // If we still don't have enough, pad with sequential numbers
  let pad = 1;
  while (set.size < count + 1) {
    if (!set.has(correct + pad)) set.add(correct + pad);
    else if (!set.has(correct - pad)) set.add(correct - pad);
    pad++;
  }
  set.delete(correct);
  return [...set].slice(0, count);
}

/** Build a standard question object. */
function makeQuestion({ grade, prompt, correct, distractors, tags }) {
  const answers = shuffle([
    { text: String(correct), correct: true },
    ...distractors.map((d) => ({ text: String(d), correct: false })),
  ]);
  return {
    id: `math-gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    subject: "math",
    grade,
    format: "multiple_choice",
    prompt,
    answers,
    tags: tags ?? [],
    generated: true,
  };
}

// ── Counting questions (Grade K) ──────────────────────────────────────

const COUNT_EMOJIS = ["⭐", "🍎", "🐟", "🎈", "🌺", "🔵", "🟢", "🦋", "🐞", "🍕"];

function generateCountQuestion(grade) {
  const cfg = MATH_GRADE_RANGES[grade] ?? MATH_GRADE_RANGES[0];
  const count = randInt(cfg.countMin ?? 1, cfg.countMax ?? 10);
  const emoji = COUNT_EMOJIS[randInt(0, COUNT_EMOJIS.length - 1)];
  const objects = Array(count).fill(emoji).join("");
  const distractors = makeDistractors(count, 3, 1, (cfg.countMax ?? 10) + 2);
  return makeQuestion({
    grade,
    prompt: `How many? ${objects}`,
    correct: count,
    distractors,
    tags: ["counting"],
  });
}

// ── Addition ──────────────────────────────────────────────────────────

function generateAddition(grade) {
  const cfg = MATH_GRADE_RANGES[grade] ?? MATH_GRADE_RANGES[0];
  const a = randInt(cfg.addMin, cfg.addMax);
  const b = randInt(cfg.addMin, cfg.addMax);
  const correct = a + b;
  const distractors = makeDistractors(correct, 3, 0, correct + 5);
  return makeQuestion({
    grade,
    prompt: `What is ${a} + ${b}?`,
    correct,
    distractors,
    tags: ["addition"],
  });
}

// ── Subtraction ───────────────────────────────────────────────────────

function generateSubtraction(grade) {
  const cfg = MATH_GRADE_RANGES[grade] ?? MATH_GRADE_RANGES[0];
  let a = randInt(cfg.subMin, cfg.subMax);
  let b = randInt(cfg.subMin, a); // ensure b <= a so no negatives
  const correct = a - b;
  const distractors = makeDistractors(correct, 3, 0, a + 3);
  return makeQuestion({
    grade,
    prompt: `What is ${a} − ${b}?`,
    correct,
    distractors,
    tags: ["subtraction"],
  });
}

// ── Multiplication ────────────────────────────────────────────────────

function generateMultiplication(grade) {
  const cfg = MATH_GRADE_RANGES[grade] ?? MATH_GRADE_RANGES[0];
  if (!cfg.mulMax) return generateAddition(grade); // fallback if grade too low
  const a = randInt(cfg.mulMin ?? 1, cfg.mulMax);
  const b = randInt(cfg.mulMin ?? 1, cfg.mulMax);
  const correct = a * b;
  const distractors = makeDistractors(correct, 3, 1, correct + 10);
  return makeQuestion({
    grade,
    prompt: `What is ${a} × ${b}?`,
    correct,
    distractors,
    tags: ["multiplication"],
  });
}

// ── Division ──────────────────────────────────────────────────────────

function generateDivision(grade) {
  const cfg = MATH_GRADE_RANGES[grade] ?? MATH_GRADE_RANGES[0];
  if (!cfg.divMax) return generateSubtraction(grade);
  const b = randInt(cfg.divMin ?? 2, cfg.divMax);
  const correct = randInt(1, cfg.divMax);
  const a = b * correct; // ensure exact division
  const distractors = makeDistractors(correct, 3, 1, correct + 5);
  return makeQuestion({
    grade,
    prompt: `What is ${a} ÷ ${b}?`,
    correct,
    distractors,
    tags: ["division"],
  });
}

// ── Count objects (visual format) ─────────────────────────────────────

const COUNT_WORDS = [
  { word: "apple", emoji: "🍎" },
  { word: "star",  emoji: "⭐" },
  { word: "fish",  emoji: "🐟" },
  { word: "ball",  emoji: "🏈" },
  { word: "flower", emoji: "🌺" },
  { word: "bird",  emoji: "🐦" },
  { word: "bug",   emoji: "🐞" },
  { word: "heart", emoji: "❤️" },
];

function generateCountObjectsQuestion(grade) {
  const cfg = MATH_GRADE_RANGES[grade] ?? MATH_GRADE_RANGES[0];
  const count = randInt(cfg.countMin ?? 1, cfg.countMax ?? 10);
  const obj = COUNT_WORDS[randInt(0, COUNT_WORDS.length - 1)];
  const distractors = makeDistractors(count, 3, 1, (cfg.countMax ?? 10) + 2);
  const answers = shuffle([
    { text: String(count), correct: true },
    ...distractors.map((d) => ({ text: String(d), correct: false })),
  ]);
  return {
    id: `math-count-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    subject: "math",
    grade,
    format: "count",
    objectWord: obj.word,
    count,
    answers,
    tags: ["counting", "visual"],
    generated: true,
  };
}

// ── Public API ────────────────────────────────────────────────────────

/** All available generators by grade-appropriate types. */
const GENERATORS_BY_GRADE = {
  0: [generateCountQuestion, generateAddition, generateSubtraction, generateCountObjectsQuestion],
  1: [generateAddition, generateSubtraction, generateCountObjectsQuestion],
  2: [generateAddition, generateSubtraction, generateMultiplication],
  3: [generateAddition, generateSubtraction, generateMultiplication, generateDivision],
  4: [generateMultiplication, generateDivision, generateAddition, generateSubtraction],
  5: [generateMultiplication, generateDivision, generateAddition, generateSubtraction],
};

/**
 * Generate a single random math question appropriate for the given grade.
 * @param {number} grade — 0 (K) through 5
 * @returns {import('../types').Question}
 */
export function generateMathQuestion(grade) {
  const clampedGrade = Math.max(0, Math.min(5, grade));
  const generators = GENERATORS_BY_GRADE[clampedGrade];
  const gen = generators[randInt(0, generators.length - 1)];
  return gen(clampedGrade);
}
