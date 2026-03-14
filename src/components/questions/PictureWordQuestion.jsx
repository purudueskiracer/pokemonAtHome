/**
 * PictureWordQuestion — show an ARASAAC image, pick the matching word.
 *
 * Question shape:
 *   { format: "picture_word", word: "cat", imageUrl: "...",
 *     answers: [{ text: "cat", correct: true }, ...] }
 */

import { getImageUrl } from "../../services/ImageService";
import "../questions/QuestionFormats.css";

/** @param {{ question, selectedAnswer, onAnswer }} props */
export function PictureWordQuestion({ question, selectedAnswer, onAnswer }) {
  const imgUrl = question.imageUrl || getImageUrl(question.word);

  return (
    <>
      <div className="picture-word-image-wrap">
        {imgUrl ? (
          <img
            className="picture-word-image"
            src={imgUrl}
            alt="What is this?"
            draggable={false}
          />
        ) : (
          <div className="picture-word-placeholder">🖼️</div>
        )}
      </div>
      <p className="question-prompt">What is this?</p>
      <div className="answers-grid">
        {question.answers.map((ans, i) => (
          <button
            key={i}
            className={`answer-btn${
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
