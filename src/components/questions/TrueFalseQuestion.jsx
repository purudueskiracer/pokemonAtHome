/**
 * TrueFalseQuestion — 2 buttons (True ✅ / False ❌).
 * Extracted from EncounterModal for the QuestionRenderer dispatch.
 */

import "../questions/QuestionFormats.css";

/** @param {{ question, selectedAnswer, onAnswer }} props */
export function TrueFalseQuestion({ question, selectedAnswer, onAnswer }) {
  const answers = [
    { text: "True ✅", correct: question.correct },
    { text: "False ❌", correct: !question.correct },
  ];

  return (
    <>
      <p className="question-prompt">{question.prompt}</p>
      <div className="answers-grid tf-grid">
        {answers.map((ans, i) => (
          <button
            key={i}
            className={`answer-btn${
              selectedAnswer?.text === ans.text
                ? ans.correct ? " correct" : " wrong"
                : ""
            }${selectedAnswer !== null && ans.correct ? " correct" : ""}`}
            onClick={() => onAnswer(ans)}
            disabled={selectedAnswer !== null}
          >
            {ans.text}
          </button>
        ))}
      </div>
    </>
  );
}
