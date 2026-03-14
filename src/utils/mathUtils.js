/**
 * mathUtils — shared animation / interpolation helpers.
 *
 * Pure functions; no React, no store access.
 * Import from here instead of duplicating inline in game components.
 */

/** Cubic ease-out: decelerates into the target. */
export function easeOut(t) {
  return 1 - (1 - t) ** 3;
}

/** Quadratic ease-out. */
export function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

/** Ease-out with overshoot (back easing). */
export function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** Linear interpolation. */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
