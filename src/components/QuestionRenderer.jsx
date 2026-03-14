/**
 * QuestionRenderer — dispatches on `question.format` to render
 * the appropriate question UI. Keeps EncounterModal clean as
 * new formats are added.
 *
 * Supported formats:
 *   - multiple_choice   (existing)
 *   - true_false         (existing)
 *   - picture_word       (show image, pick word)
 *   - word_picture       (show word, pick image)
 *   - audio_word         (hear word, pick word)
 *   - count              (count objects, pick number)
 *   - missing_letter     (fill the blank letter)
 */

import "./questions/QuestionFormats.css";
import { MultipleChoiceQuestion } from "./questions/MultipleChoiceQuestion";
import { TrueFalseQuestion } from "./questions/TrueFalseQuestion";
import { PictureWordQuestion } from "./questions/PictureWordQuestion";
import { WordPictureQuestion } from "./questions/WordPictureQuestion";
import { AudioWordQuestion } from "./questions/AudioWordQuestion";
import { CountQuestion } from "./questions/CountQuestion";
import { MissingLetterQuestion } from "./questions/MissingLetterQuestion";

const FORMAT_MAP = {
  multiple_choice: MultipleChoiceQuestion,
  true_false:      TrueFalseQuestion,
  picture_word:    PictureWordQuestion,
  word_picture:    WordPictureQuestion,
  audio_word:      AudioWordQuestion,
  count:           CountQuestion,
  missing_letter:  MissingLetterQuestion,
};

/**
 * @param {{
 *   question: import('../types').Question,
 *   selectedAnswer: object | null,
 *   onAnswer: (answer: object) => void,
 * }} props
 */
export default function QuestionRenderer({ question, selectedAnswer, onAnswer }) {
  const Component = FORMAT_MAP[question.format] ?? MultipleChoiceQuestion;
  return (
    <Component
      question={question}
      selectedAnswer={selectedAnswer}
      onAnswer={onAnswer}
    />
  );
}
