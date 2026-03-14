/**
 * AudioWordQuestion — play a word via SpeechSynthesis, pick the word.
 *
 * Question shape:
 *   { format: "audio_word", word: "jump",
 *     answers: [{ text: "jump", correct: true }, ...] }
 */

import { useEffect, useCallback } from "react";
import { speak } from "../../services/ImageService";
import "../questions/QuestionFormats.css";

/** @param {{ question, selectedAnswer, onAnswer }} props */
export function AudioWordQuestion({ question, selectedAnswer, onAnswer }) {
  // Auto-play the word when the question appears
  useEffect(() => {
    // Small delay so the UI renders first on iOS
    const id = setTimeout(() => speak(question.word), 300);
    return () => clearTimeout(id);
  }, [question.word]);

  const handleReplay = useCallback(() => {
    speak(question.word);
  }, [question.word]);

  return (
    <>
      <div className="audio-word-speaker-wrap">
        <button
          className="audio-play-btn"
          onClick={handleReplay}
          aria-label="Play word audio"
        >
          <span className="audio-play-icon">🔊</span>
          <span className="audio-play-label">Tap to hear the word</span>
        </button>
      </div>
      <p className="question-prompt">Which word did you hear?</p>
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
