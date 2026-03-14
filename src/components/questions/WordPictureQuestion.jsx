/**
 * WordPictureQuestion — show a word, pick the matching image.
 *
 * Question shape:
 *   { format: "word_picture", word: "cat",
 *     answers: [{ text: "cat", imageUrl: "...", correct: true }, ...] }
 */

import { getImageUrl } from "../../services/ImageService";
import "../questions/QuestionFormats.css";

/** @param {{ question, selectedAnswer, onAnswer }} props */
export function WordPictureQuestion({ question, selectedAnswer, onAnswer }) {
  return (
    <>
      <p className="question-prompt word-picture-prompt">
        Which picture shows <strong>"{question.word}"</strong>?
      </p>
      <div className="answers-grid image-grid">
        {question.answers.map((ans, i) => {
          const imgUrl = ans.imageUrl || getImageUrl(ans.text);
          return (
            <button
              key={i}
              className={`answer-btn image-answer-btn${
                selectedAnswer?.text === ans.text
                  ? ans.correct ? " correct" : " wrong"
                  : ""
              }${
                selectedAnswer !== null && ans.correct ? " correct" : ""
              }`}
              onClick={() => onAnswer(ans)}
              disabled={selectedAnswer !== null}
            >
              {imgUrl ? (
                <img
                  className="image-answer-img"
                  src={imgUrl}
                  alt={selectedAnswer ? ans.text : "?"}
                  draggable={false}
                />
              ) : (
                <span className="image-answer-placeholder">🖼️</span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
