/**
 * ThrowTimeline — declarative animation timelines for the throw sequence.
 *
 * Each outcome is an array of { stage, duration } steps.
 * The last entry is always 'done' with duration 0 — signals completion.
 *
 * Timings come from GameConfig.ANIMATION so designers can tune in one place.
 *
 * @see {import('../types').ThrowStage}
 */

import { ANIMATION } from "../config/GameConfig";

/** @type {Record<string, Array<{ stage: string, duration: number }>>} */
export const THROW_STAGES = {
  caught: [
    { stage: "tossing",   duration: ANIMATION.toss },
    { stage: "capturing", duration: ANIMATION.capture },
    { stage: "wobbling",  duration: ANIMATION.wobble },
    { stage: "locked",    duration: ANIMATION.lock },
    { stage: "done",      duration: 0 },
  ],
  fled: [
    { stage: "tossing",   duration: ANIMATION.toss },
    { stage: "capturing", duration: ANIMATION.capture },
    { stage: "wobbling",  duration: ANIMATION.wobble },
    { stage: "burst",     duration: ANIMATION.burst },
    { stage: "done",      duration: 0 },
  ],
  breakFree: [
    { stage: "tossing",   duration: ANIMATION.toss },
    { stage: "capturing", duration: ANIMATION.capture },
    { stage: "wobbling",  duration: ANIMATION.wobble },
    { stage: "burst",     duration: ANIMATION.retry },
    { stage: "done",      duration: 0 },
  ],
};
