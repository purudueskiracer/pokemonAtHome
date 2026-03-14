/**
 * CountQuestion — count objects on screen, pick the number.
 *
 * Question shape:
 *   { format: "count", objectWord: "star", imageUrl: "...",
 *     count: 7, answers: [{ text: "6" }, { text: "7", correct: true }, ...] }
 */

import { useMemo } from "react";
import { getImageUrl } from "../../services/ImageService";
import "../questions/QuestionFormats.css";

/** Generate slightly random rotations/offsets for visual variety. */
function makeJitter(count) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      rotate: Math.round((Math.random() - 0.5) * 20),
      scale: 0.9 + Math.random() * 0.2,
    });
  }
  return items;
}

/** @param {{ question, selectedAnswer, onAnswer }} props */
export function CountQuestion({ question, selectedAnswer, onAnswer }) {
  const imgUrl = question.imageUrl || getImageUrl(question.objectWord);
  const jitter = useMemo(() => makeJitter(question.count), [question.count]);

  return (
    <>
      <p className="question-prompt">How many do you see?</p>
      <div className="count-objects-grid">
        {jitter.map((j, i) => (
          <div
            key={i}
            className="count-object"
            style={{
              transform: `rotate(${j.rotate}deg) scale(${j.scale})`,
            }}
          >
            {imgUrl ? (
              <img
                className="count-object-img"
                src={imgUrl}
                alt={question.objectWord}
                draggable={false}
              />
            ) : (
              <span className="count-object-emoji">⭐</span>
            )}
          </div>
        ))}
      </div>
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
