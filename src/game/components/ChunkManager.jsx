import React, { useState, useRef, useEffect, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { CHUNK_SIZE, VIEW_DISTANCE, getChunkSpawnPoints } from "../terrain";
import TerrainChunk from "./TerrainChunk";
import ChunkTrees from "./ChunkTrees";
import ChunkDecorations from "./ChunkDecorations";
import GLBChunkTrees from "./GLBChunkTrees";
import { TREE_MODELS } from "../../data/worldModels";

// ── GLB model error boundary ───────────────────────────────────────────────────
// Catches 404s (models not yet downloaded) and permanent load failures.
// Renders the procedural ChunkTrees fallback so the world always looks correct.
class ModelErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Renders GLB tree models when available, falling back to procedural trees
 * during loading (Suspense) and permanently on load failure (ErrorBoundary).
 * If no TREE_MODELS are registered the procedural layer is used directly.
 */
function TreeLayer({ cx, cz, noise2D }) {
  const fallback = <ChunkTrees cx={cx} cz={cz} noise2D={noise2D} />;
  if (!TREE_MODELS.length) return fallback;
  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GLBChunkTrees cx={cx} cz={cz} noise2D={noise2D} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

function getInitialChunks() {
  const set = new Set();
  for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++)
    for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE; dz++)
      set.add(`${dx},${dz}`);
  return set;
}

export default function ChunkManager({ noise2D, onTap, onSpawnUpdate, playerPosRef }) {
  const [chunks, setChunks] = useState(getInitialChunks);
  const playerChunk = useRef({ cx: 0, cz: 0 });
  const onSpawnRef  = useRef(onSpawnUpdate);
  useEffect(() => { onSpawnRef.current = onSpawnUpdate; }, [onSpawnUpdate]);

  useFrame(() => {
    const px = playerPosRef?.current?.x ?? 0;
    const pz = playerPosRef?.current?.z ?? 0;
    const cx = Math.floor(px / CHUNK_SIZE);
    const cz = Math.floor(pz / CHUNK_SIZE);
    if (cx !== playerChunk.current.cx || cz !== playerChunk.current.cz) {
      playerChunk.current = { cx, cz };
      const next = new Set();
      for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++)
        for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE; dz++)
          next.add(`${cx + dx},${cz + dz}`);
      setChunks(next);
    }
  });

  useEffect(() => {
    const pts = [];
    for (const key of chunks) {
      const [cx, cz] = key.split(",").map(Number);
      pts.push(...getChunkSpawnPoints(cx, cz, noise2D));
    }
    onSpawnRef.current?.(pts);
  }, [chunks, noise2D]);

  return (
    <>
      {[...chunks].map((key) => {
        const [cx, cz] = key.split(",").map(Number);
        return (
          <React.Fragment key={key}>
            <TerrainChunk cx={cx} cz={cz} noise2D={noise2D} onTap={onTap} />
            <TreeLayer    cx={cx} cz={cz} noise2D={noise2D} />
            <ChunkDecorations cx={cx} cz={cz} noise2D={noise2D} />
          </React.Fragment>
        );
      })}
    </>
  );
}
