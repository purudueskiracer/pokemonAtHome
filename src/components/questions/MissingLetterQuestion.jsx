/**
 * MissingLetterQuestion — word with a blank, pick the missing letter.
 *
 * Question shape:
 *   { format: "missing_letter", word: "cat", missingIndex: 1,
 *     imageUrl: "...",
 *     answers: [{ text: "a", correct: true }, { text: "o" }, ...] }
 */

import { getImageUrl } from "../../services/ImageService";
import "../questions/QuestionFormats.css";

/** @param {{ question, selectedAnswer, onAnswer }} props */
export function MissingLetterQuestion({ question, selectedAnswer, onAnswer }) {
  const imgUrl = question.imageUrl || getImageUrl(question.word);
  const letters = question.word.split("");
  const blanked = letters.map((ch, i) =>
    i === question.missingIndex ? "_" : ch
  );

  return (
    <>
      {imgUrl && (
        <div className="missing-letter-image-wrap">
          <img
            className="missing-letter-image"
            src={imgUrl}
            alt=""
            draggable={false}
          />
        </div>
      )}
      <p className="question-prompt missing-letter-prompt">
        {blanked.map((ch, i) => (
          <span
            key={i}
            className={ch === "_" ? "missing-letter-blank" : "missing-letter-char"}
          >
            {ch}
          </span>
        ))}
      </p>
      <div className="answers-grid missing-letter-grid">
        {question.answers.map((ans, i) => (
          <button
            key={i}
            className={`answer-btn missing-letter-btn${
              selectedAnswer?.text === ans.text
                ? ans.correct ? " correct" : " wrong"
                : ""
            }${
              selectedAnswer !== null && ans.correct ? " correct" : ""
            }`}
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
