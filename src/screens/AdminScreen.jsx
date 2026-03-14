/**
 * AdminScreen — Question Viewer / Previewer.
 *
 * Generates and displays questions across all formats, subjects, and
 * grades so you can visually verify every format without playing through
 * encounters. Each question is rendered with the same QuestionRenderer
 * and CSS that the real encounter uses.
 *
 * Controls:
 *   - Subject: math / reading / all
 *   - Grade: 0–3
 *   - Format filter: all / specific format
 *   - Generate: create a batch of questions
 *   - Prev / Next arrows: cycle through generated questions
 *   - Shuffle: re-generate a new batch
 */

import { useState, useCallback } from "react";
import QuestionRenderer from "../components/QuestionRenderer";
import { generateMathQuestion } from "../services/MathGenerator";
import { generateReadingQuestion } from "../services/ReadingGenerator";
import { getOneQuestion } from "../data/questions/index";
import "../components/EncounterModal.css";
import "../components/questions/QuestionFormats.css";
import "./AdminScreen.css";

const FORMATS = [
  "all",
  "multiple_choice",
  "true_false",
  "picture_word",
  "word_picture",
  "audio_word",
  "count",
  "missing_letter",
];

const SUBJECTS = ["all", "math", "reading", "space"];
const GRADES = [0, 1, 2, 3];

/** Generate a batch of questions based on filters. */
function generateBatch(subject, grade, format, batchSize = 20) {
  const out = [];
  const subjects = subject === "all" ? ["math", "reading", "space"] : [subject];
  let attempts = 0;

  while (out.length < batchSize && attempts < 200) {
    attempts++;
    const sub = subjects[Math.floor(Math.random() * subjects.length)];
    let q = null;

    if (sub === "math") {
      q = generateMathQuestion(grade);
    } else if (sub === "reading") {
      q = generateReadingQuestion(grade);
    }

    // Fallback to static pool
    if (!q) {
      q = getOneQuestion({ subject: sub, grade });
    }

    if (!q) continue;

    // Apply format filter
    if (format !== "all" && q.format !== format) continue;

    out.push(q);
  }

  return out;
}

export default function AdminScreen() {
  const [subject, setSubject] = useState("all");
  const [grade, setGrade] = useState(0);
  const [format, setFormat] = useState("all");
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const generate = useCallback(() => {
    const batch = generateBatch(subject, grade, format);
    setQuestions(batch);
    setIndex(0);
    setSelectedAnswer(null);
  }, [subject, grade, format]);

  const handleAnswer = useCallback((ans) => {
    setSelectedAnswer(ans);
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
    setSelectedAnswer(null);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => Math.min(questions.length - 1, i + 1));
    setSelectedAnswer(null);
  }, [questions.length]);

  const question = questions[index] ?? null;

  return (
    <div className="admin-screen">
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="admin-toolbar">
        <h2>🔧 Question Viewer</h2>
        <div className="admin-controls">
          <select
            className="admin-select"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Subjects" : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                Grade {g === 0 ? "K" : g}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f === "all" ? "All Formats" : f.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <button className="admin-btn" onClick={generate}>
            Generate
          </button>
        </div>
      </div>

      {/* ── Preview ─────────────────────────────────────────────── */}
      <div className="admin-preview-area">
        {question ? (
          <div
            className="admin-question-preview"
            style={{
              "--bg1": "#0d2a40",
              "--bg2": "#050d1a",
            }}
          >
            <div className="question-body">
              <QuestionRenderer
                question={question}
                selectedAnswer={selectedAnswer}
                onAnswer={handleAnswer}
              />
            </div>
          </div>
        ) : (
          <div className="admin-empty">
            <div className="admin-empty-icon">📋</div>
            <p>Pick a subject, grade, and format, then hit <strong>Generate</strong>.</p>
          </div>
        )}
      </div>

      {/* ── Nav row ─────────────────────────────────────────────── */}
      {questions.length > 0 && (
        <div className="admin-nav-row">
          <button
            className="admin-nav-btn"
            onClick={prev}
            disabled={index === 0}
          >
            ◀
          </button>
          <span className="admin-counter">
            {index + 1} / {questions.length}
          </span>
          <button
            className="admin-nav-btn"
            onClick={next}
            disabled={index >= questions.length - 1}
          >
            ▶
          </button>
          <button className="admin-btn secondary" onClick={generate}>
            🔀 Shuffle
          </button>
        </div>
      )}

      {/* ── Info bar ────────────────────────────────────────────── */}
      {question && (
        <div className="admin-info-bar">
          <span className="admin-tag format">{question.format?.replace(/_/g, " ") ?? "unknown"}</span>
          <span className="admin-tag subject">{question.subject}</span>
          <span className="admin-tag">grade {question.grade}</span>
          {question.generated && <span className="admin-tag">generated</span>}
          {question.word && <span className="admin-tag">word: {question.word}</span>}
          {question.tags?.map((t, i) => (
            <span key={i} className="admin-tag">{t}</span>
          ))}
          {question.id && (
            <span className="admin-tag" style={{ opacity: 0.5 }}>
              {String(question.id).slice(0, 24)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
