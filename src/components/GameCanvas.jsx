import { useEffect, useRef } from "react";
import { createPhaserGame } from "../game/PhaserGame";

export default function GameCanvas({ worldId }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) return; // already initialized

    gameRef.current = createPhaserGame(containerRef.current, worldId);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [worldId]);

  return (
    <div
      ref={containerRef}
      id="phaser-container"
      style={{ width: "800px", height: "500px", position: "relative" }}
    />
  );
}
