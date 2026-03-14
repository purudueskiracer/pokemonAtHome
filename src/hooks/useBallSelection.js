/**
 * useBallSelection — inventory-aware ball cycling logic.
 *
 * Composable hook used by useEncounter. Encapsulates ball selection
 * state and cycling behaviour independent of the encounter FSM.
 */

import { useState, useCallback } from "react";

const BALL_ORDER = ["pokeball", "greatball", "ultraball"];
export const BALL_EMOJI = { pokeball: "⚪", greatball: "🔵", ultraball: "🟡" };
export const BALL_LABEL = { pokeball: "Poké Ball", greatball: "Great Ball", ultraball: "Ultra Ball" };

/**
 * @param {{ pokeball: number, greatball: number, ultraball: number }} balls
 * @returns {{
 *   selectedBall: import('../types').BallType,
 *   ballCount: number,
 *   cycleBall: () => void,
 *   hasBalls: boolean,
 * }}
 */
export function useBallSelection(balls) {
  const safeBalls = balls ?? { pokeball: 0, greatball: 0, ultraball: 0 };
  const [selectedBall, setSelectedBall] = useState("pokeball");

  const ballCount = safeBalls[selectedBall] ?? 0;
  const hasBalls = Object.values(safeBalls).some((v) => v > 0);

  const cycleBall = useCallback(() => {
    setSelectedBall((current) => {
      const idx = BALL_ORDER.indexOf(current);
      for (let i = 1; i <= BALL_ORDER.length; i++) {
        const next = BALL_ORDER[(idx + i) % BALL_ORDER.length];
        if (safeBalls[next] > 0) return next;
      }
      return current;
    });
  }, [safeBalls]);

  return { selectedBall, ballCount, cycleBall, hasBalls };
}
