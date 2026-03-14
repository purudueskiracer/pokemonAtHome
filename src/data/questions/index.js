import { mathQuestions } from "./math";
import { readingQuestions } from "./reading";
import { generateMathQuestion } from "../../services/MathGenerator";
import { generateReadingQuestion } from "../../services/ReadingGenerator";
// Side-effect import: registers ARASAAC IDs in ImageService on startup
import "../wordBank";

export const allQuestions = [
  ...mathQuestions,
  ...readingQuestions,
];

/**
 * Get questions filtered by subject and grade.
 * Returns questions at the target grade, with fallback to adjacent grades
 * if not enough questions exist at the exact grade.
 */
export function getQuestions({ subject, grade, count = 5 }) {
  const exact = allQuestions.filter(
    (q) => q.subject === subject && q.grade === grade
  );
  if (exact.length >= count) return shuffle(exact).slice(0, count);

  // Pull from adjacent grades if needed
  const nearby = allQuestions.filter(
    (q) =>
      q.subject === subject &&
      Math.abs(q.grade - grade) <= 1
  );
  return shuffle(nearby).slice(0, count);
}

/**
 * Get a single random question for a given subject and grade.
 *
 * For math: 70% procedurally generated, 30% from static pool.
 * For reading: 60% procedurally generated (visual/audio formats), 40% static.
 * For other subjects: 100% static pool.
 */
export function getOneQuestion({ subject, grade }) {
  // ── Math: prefer procedural generation ──────────────────────────
  if (subject === "math" && Math.random() < 0.7) {
    const generated = generateMathQuestion(grade);
    if (generated) return generated;
  }

  // ── Reading: mix generated visual formats with static questions ──
  if (subject === "reading" && Math.random() < 0.6) {
    const generated = generateReadingQuestion(grade);
    if (generated) return generated;
  }

  // ── Fallback: static question pool ──────────────────────────────
  const pool = allQuestions.filter(
    (q) => q.subject === subject && Math.abs(q.grade - grade) <= 1
  );
  if (pool.length) return pool[Math.floor(Math.random() * pool.length)];

  // ── Last resort: any question from any subject ──────────────────
  if (allQuestions.length) return allQuestions[Math.floor(Math.random() * allQuestions.length)];

  // ── Absolute fallback — hardcoded question so we never return null ──
  return {
    subject: "reading",
    grade: 1,
    format: "multiple_choice",
    prompt: "Which letter comes first in the alphabet?",
    answers: [
      { text: "A", correct: true },
      { text: "B", correct: false },
      { text: "C", correct: false },
      { text: "D", correct: false },
    ],
  };
}

/**
 * Shuffle an array (Fisher-Yates)
 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Subject → Pokémon type mapping
export const subjectTypeMap = {
  math: "electric",
  reading: "normal",
  space: "flying",
};

// Pokémon type → subject mapping (reverse)
export const typeSubjectMap = {
  electric: "math",
  normal: "reading",
  flying: "space",
  grass: "science",
  water: "earth-science",
  fire: "chemistry",
  psychic: "logic",
  ghost: "history",
  dark: "spelling",
  rock: "geology",
  ground: "geography",
  ice: "physics",
  steel: "grammar",
  fairy: "writing",
  bug: "biology",
  poison: "environmental",
  dragon: "advanced-math",
};
