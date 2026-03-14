/**
 * MultipleChoiceQuestion — 4 answer buttons in a 2×2 grid.
 * Extracted from EncounterModal for the QuestionRenderer dispatch.
 */

import "../questions/QuestionFormats.css";

/** @param {{ question, selectedAnswer, onAnswer }} props */
export function MultipleChoiceQuestion({ question, selectedAnswer, onAnswer }) {
  return (
    <>
      <p className="question-prompt">{question.prompt}</p>
      <div className="answers-grid">
        {question.answers.map((ans, i) => (
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
