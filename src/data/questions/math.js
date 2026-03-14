// Math questions organized by grade level
// format: multiple_choice | true_false | fill_blank | sort | tap_number

export const mathQuestions = [
  // --- Grade K ---
  {
    id: "math-k-001",
    subject: "math",
    grade: 0, // K
    format: "multiple_choice",
    prompt: "What is 2 + 1?",
    answers: [
      { text: "2", correct: false },
      { text: "3", correct: true },
      { text: "4", correct: false },
      { text: "5", correct: false },
    ],
    tags: ["addition", "counting"],
  },
  {
    id: "math-k-002",
    subject: "math",
    grade: 0,
    format: "true_false",
    prompt: "5 is bigger than 3.",
    correct: true,
    tags: ["comparison"],
  },
  {
    id: "math-k-003",
    subject: "math",
    grade: 0,
    format: "multiple_choice",
    prompt: "How many stars? ⭐⭐⭐⭐",
    answers: [
      { text: "3", correct: false },
      { text: "4", correct: true },
      { text: "5", correct: false },
      { text: "6", correct: false },
    ],
    tags: ["counting"],
  },

  // --- Grade 1 ---
  {
    id: "math-1-001",
    subject: "math",
    grade: 1,
    format: "multiple_choice",
    prompt: "What is 7 + 5?",
    answers: [
      { text: "11", correct: false },
      { text: "12", correct: true },
      { text: "13", correct: false },
      { text: "10", correct: false },
    ],
    tags: ["addition"],
  },
  {
    id: "math-1-002",
    subject: "math",
    grade: 1,
    format: "multiple_choice",
    prompt: "What is 10 - 4?",
    answers: [
      { text: "5", correct: false },
      { text: "7", correct: false },
      { text: "6", correct: true },
      { text: "4", correct: false },
    ],
    tags: ["subtraction"],
  },
  {
    id: "math-1-003",
    subject: "math",
    grade: 1,
    format: "true_false",
    prompt: "14 is an even number.",
    correct: true,
    tags: ["even-odd"],
  },

  // --- Grade 2 ---
  {
    id: "math-2-001",
    subject: "math",
    grade: 2,
    format: "multiple_choice",
    prompt: "What is 36 + 47?",
    answers: [
      { text: "73", correct: false },
      { text: "83", correct: true },
      { text: "93", correct: false },
      { text: "82", correct: false },
    ],
    tags: ["addition", "place-value"],
  },
  {
    id: "math-2-002",
    subject: "math",
    grade: 2,
    format: "multiple_choice",
    prompt: "What is 3 × 4?",
    answers: [
      { text: "10", correct: false },
      { text: "14", correct: false },
      { text: "12", correct: true },
      { text: "7", correct: false },
    ],
    tags: ["multiplication", "intro"],
  },

  // --- Grade 3 ---
  {
    id: "math-3-001",
    subject: "math",
    grade: 3,
    format: "multiple_choice",
    prompt: "What is 7 × 8?",
    answers: [
      { text: "54", correct: false },
      { text: "56", correct: true },
      { text: "63", correct: false },
      { text: "48", correct: false },
    ],
    tags: ["multiplication", "times-tables"],
  },
  {
    id: "math-3-002",
    subject: "math",
    grade: 3,
    format: "multiple_choice",
    prompt: "What is 72 ÷ 9?",
    answers: [
      { text: "7", correct: false },
      { text: "9", correct: false },
      { text: "8", correct: true },
      { text: "6", correct: false },
    ],
    tags: ["division"],
  },
  {
    id: "math-3-003",
    subject: "math",
    grade: 3,
    format: "multiple_choice",
    prompt: "Which fraction is biggest?",
    answers: [
      { text: "1/4", correct: false },
      { text: "1/2", correct: true },
      { text: "1/8", correct: false },
      { text: "1/3", correct: false },
    ],
    tags: ["fractions", "comparison"],
  },

  // --- Grade 4 ---
  {
    id: "math-4-001",
    subject: "math",
    grade: 4,
    format: "multiple_choice",
    prompt: "What is 24 × 6?",
    answers: [
      { text: "124", correct: false },
      { text: "144", correct: true },
      { text: "134", correct: false },
      { text: "148", correct: false },
    ],
    tags: ["multiplication", "multi-digit"],
  },
  {
    id: "math-4-002",
    subject: "math",
    grade: 4,
    format: "multiple_choice",
    prompt: "What is 3/4 + 1/4?",
    answers: [
      { text: "4/8", correct: false },
      { text: "1", correct: true },
      { text: "4/4", correct: false },
      { text: "2/4", correct: false },
    ],
    tags: ["fractions", "addition"],
  },

  // --- Grade 5 ---
  {
    id: "math-5-001",
    subject: "math",
    grade: 5,
    format: "multiple_choice",
    prompt: "What is 2.5 × 4?",
    answers: [
      { text: "8", correct: false },
      { text: "9", correct: false },
      { text: "10", correct: true },
      { text: "12", correct: false },
    ],
    tags: ["decimals", "multiplication"],
  },
  {
    id: "math-5-002",
    subject: "math",
    grade: 5,
    format: "multiple_choice",
    prompt: "What is 60% of 80?",
    answers: [
      { text: "42", correct: false },
      { text: "48", correct: true },
      { text: "50", correct: false },
      { text: "56", correct: false },
    ],
    tags: ["percentages"],
  },
];
