// Reading / Sight Word questions organized by grade level

export const readingQuestions = [
  // --- Grade K (Pre-K) ---
  {
    id: "read-k-001",
    subject: "reading",
    grade: 0,
    format: "multiple_choice",
    prompt: "Which word says 'the'?",
    audioPrompt: "Tap the word: the",
    answers: [
      { text: "and", correct: false },
      { text: "the", correct: true },
      { text: "is", correct: false },
      { text: "it", correct: false },
    ],
    tags: ["sight-words", "dolch-preprimer"],
  },
  {
    id: "read-k-002",
    subject: "reading",
    grade: 0,
    format: "multiple_choice",
    prompt: "Which word says 'and'?",
    audioPrompt: "Tap the word: and",
    answers: [
      { text: "the", correct: false },
      { text: "in", correct: false },
      { text: "and", correct: true },
      { text: "a", correct: false },
    ],
    tags: ["sight-words", "dolch-preprimer"],
  },
  {
    id: "read-k-003",
    subject: "reading",
    grade: 0,
    format: "multiple_choice",
    prompt: "Which picture matches the word 'cat'?",
    audioPrompt: "Which one is a cat?",
    answers: [
      { text: "🐶", correct: false },
      { text: "🐱", correct: true },
      { text: "🐸", correct: false },
      { text: "🐟", correct: false },
    ],
    tags: ["word-match", "animals"],
  },

  // --- Grade 1 ---
  {
    id: "read-1-001",
    subject: "reading",
    grade: 1,
    format: "multiple_choice",
    prompt: "Which word says 'jump'?",
    audioPrompt: "Tap the word: jump",
    answers: [
      { text: "bump", correct: false },
      { text: "dump", correct: false },
      { text: "jump", correct: true },
      { text: "pump", correct: false },
    ],
    tags: ["sight-words", "dolch-primer"],
  },
  {
    id: "read-1-002",
    subject: "reading",
    grade: 1,
    format: "multiple_choice",
    prompt: "Fill in the blank: 'The dog ___ fast.'",
    audioPrompt: "The dog blank fast. Pick the right word.",
    answers: [
      { text: "run", correct: false },
      { text: "ran", correct: true },
      { text: "runs", correct: false },
      { text: "running", correct: false },
    ],
    tags: ["sentence-fill", "verb-tense"],
  },
  {
    id: "read-1-003",
    subject: "reading",
    grade: 1,
    format: "multiple_choice",
    prompt: "Which word rhymes with 'cat'?",
    audioPrompt: "Which word rhymes with cat?",
    answers: [
      { text: "dog", correct: false },
      { text: "hat", correct: true },
      { text: "cup", correct: false },
      { text: "tree", correct: false },
    ],
    tags: ["rhyming"],
  },

  // --- Grade 2 ---
  {
    id: "read-2-001",
    subject: "reading",
    grade: 2,
    format: "multiple_choice",
    prompt: "What does 'enormous' mean?",
    audioPrompt: "What does the word enormous mean?",
    answers: [
      { text: "Very tiny", correct: false },
      { text: "Very fast", correct: false },
      { text: "Very large", correct: true },
      { text: "Very loud", correct: false },
    ],
    tags: ["vocabulary"],
  },
  {
    id: "read-2-002",
    subject: "reading",
    grade: 2,
    format: "multiple_choice",
    prompt: "Which is a compound word?",
    audioPrompt: "Which one is a compound word?",
    answers: [
      { text: "running", correct: false },
      { text: "sunshine", correct: true },
      { text: "quickly", correct: false },
      { text: "happy", correct: false },
    ],
    tags: ["compound-words"],
  },

  // --- Grade 3 ---
  {
    id: "read-3-001",
    subject: "reading",
    grade: 3,
    format: "multiple_choice",
    prompt: "'She was so tired she could barely keep her ___ open.'",
    audioPrompt: "Fill in the blank: She was so tired she could barely keep her blank open.",
    answers: [
      { text: "hands", correct: false },
      { text: "mouth", correct: false },
      { text: "eyes", correct: true },
      { text: "feet", correct: false },
    ],
    tags: ["context-clues"],
  },
  {
    id: "read-3-002",
    subject: "reading",
    grade: 3,
    format: "multiple_choice",
    prompt: "What is the opposite of 'brave'?",
    audioPrompt: "What is the opposite of brave?",
    answers: [
      { text: "strong", correct: false },
      { text: "cowardly", correct: true },
      { text: "kind", correct: false },
      { text: "happy", correct: false },
    ],
    tags: ["antonyms"],
  },

  // --- Grade 4 ---
  {
    id: "read-4-001",
    subject: "reading",
    grade: 4,
    format: "multiple_choice",
    prompt: "What does the prefix 'un-' mean?",
    audioPrompt: "What does the prefix un mean?",
    answers: [
      { text: "again", correct: false },
      { text: "before", correct: false },
      { text: "not or opposite", correct: true },
      { text: "after", correct: false },
    ],
    tags: ["prefixes"],
  },

  // --- Grade 5 ---
  {
    id: "read-5-001",
    subject: "reading",
    grade: 5,
    format: "multiple_choice",
    prompt: "What does 'benevolent' mean?",
    audioPrompt: "What does the word benevolent mean?",
    answers: [
      { text: "Cruel and mean", correct: false },
      { text: "Kind and generous", correct: true },
      { text: "Shy and quiet", correct: false },
      { text: "Brave and bold", correct: false },
    ],
    tags: ["vocabulary", "advanced"],
  },
];
