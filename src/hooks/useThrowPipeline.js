/**
 * useThrowPipeline — frame-driven throw animation pipeline.
 *
 * Instead of a chain of setTimeout calls, this hook exposes a `tick()`
 * function that Pokeball3D calls from `useFrame` every render frame.
 *
 * `tick()` computes the current animation stage and normalized progress
 * (0–1) from elapsed wall-clock time — no timers, no drift, frame-accurate.
 *
 * React state (`stage`) is updated only when the stage actually changes,
 * keeping re-renders minimal. The parent uses `stage` for UI text and
 * Pokémon visibility; the 3D mesh uses `tick()` for smooth animation.
 *
 * @see {import('../services/ThrowTimeline').THROW_STAGES}
 */

import { useRef, useState, useCallback } from "react";
import { THROW_STAGES } from "../services/ThrowTimeline";

/**
 * @returns {{
 *   stage: import('../types').ThrowStage,
 *   start: (outcome: 'caught'|'fled'|'breakFree', onComplete: () => void) => void,
 *   cancel: () => void,
 *   tick: () => { stage: string|null, t: number },
 * }}
 */
export function useThrowPipeline() {
  const [stage, setStage] = useState(null);

  /** Active throw command — everything the tick function needs. */
  const commandRef = useRef(null);
  /** Last stage reported to React — avoids redundant setState calls. */
  const lastStageRef = useRef(null);

  /**
   * Start a throw animation.
   * Sets the first stage synchronously so React + the 3D mesh are in
   * sync on the very first render after the throw button is pressed.
   */
  const start = useCallback((outcome, onComplete) => {
    const timeline = THROW_STAGES[outcome];
    if (!timeline) return;
    commandRef.current = {
      timeline,
      startedAt: performance.now(),
      onComplete,
    };
    // Synchronously set the first stage for immediate React UI response
    const first = timeline[0]?.stage;
    if (first && first !== "done") {
      lastStageRef.current = first;
      setStage(first);
    }
  }, []);

  /** Cancel any in-progress animation (used on flee / unmount). */
  const cancel = useCallback(() => {
    commandRef.current = null;
    lastStageRef.current = null;
    setStage(null);
  }, []);

  /**
   * Called by Pokeball3D from useFrame every render frame.
   *
   * Returns the current { stage, t } where `t` is the normalised 0–1
   * progress within the current stage. When the timeline finishes,
   * fires `onComplete` and returns `{ stage: null, t: 0 }`.
   *
   * Crucially: setState is only called when the stage *changes*, so
   * this is safe to call at 60 fps without thrashing React.
   */
  const tick = useCallback(() => {
    const cmd = commandRef.current;
    if (!cmd) return { stage: null, t: 0 };

    const elapsed = performance.now() - cmd.startedAt;
    let accumulated = 0;

    for (const { stage: s, duration } of cmd.timeline) {
      // Terminal "done" entry — fire the completion callback
      if (s === "done") {
        const cb = cmd.onComplete;
        commandRef.current = null;
        lastStageRef.current = null;
        setStage(null);
        // Defer the external callback so our internal state is fully
        // consistent before the parent dispatches its own state updates.
        if (cb) queueMicrotask(cb);
        return { stage: null, t: 0 };
      }

      // Still within this stage's time window
      if (elapsed < accumulated + duration) {
        const t = Math.min((elapsed - accumulated) / duration, 1);
        // Only update React state when the stage actually transitions
        if (lastStageRef.current !== s) {
          lastStageRef.current = s;
          setStage(s);
        }
        return { stage: s, t };
      }

      accumulated += duration;
    }

    // Shouldn't happen — fallback safety
    return { stage: null, t: 0 };
  }, []);

  return { stage, start, cancel, tick };
}
