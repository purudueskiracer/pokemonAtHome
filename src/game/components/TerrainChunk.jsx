import React, { useMemo } from "react";
import { buildChunkGeometry, CHUNK_SIZE } from "../terrain";

export default function TerrainChunk({ cx, cz, noise2D, onTap }) {
  const geometry = useMemo(
    () => buildChunkGeometry(cx, cz, noise2D),
    [cx, cz, noise2D]
  );

  return (
    <mesh
      geometry={geometry}
      position={[cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE]}
      receiveShadow
      onPointerDown={(e) => { e.stopPropagation(); onTap?.(e.point.x, e.point.z); }}
    >
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  );
}
