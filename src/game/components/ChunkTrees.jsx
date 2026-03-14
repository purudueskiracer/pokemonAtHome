import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { getChunkTreePositions } from "../terrain";

// Shared geometry and materials for all trees (created once)
const TRUNK_GEO  = new THREE.CylinderGeometry(0.15, 0.2, 1.2, 6);
const CANOPY_GEO = new THREE.ConeGeometry(1.1, 2.5, 6);
const TRUNK_MAT  = new THREE.MeshLambertMaterial({ color: 0x6b4c2a, flatShading: true });
const CANOPY_MAT = new THREE.MeshLambertMaterial({ color: 0x2d6a2f, flatShading: true });

/**
 * Renders all trees for a single chunk as two InstancedMeshes (trunks + canopies).
 * One draw call each — no per-tree overhead.
 */
export default function ChunkTrees({ cx, cz, noise2D }) {
  const trees = useMemo(
    () => getChunkTreePositions(cx, cz, noise2D),
    [cx, cz, noise2D]
  );

  const trunkRef  = useRef();
  const canopyRef = useRef();

  useEffect(() => {
    if (!trees.length) return;
    if (!trunkRef.current || !canopyRef.current) return;
    const d = new THREE.Object3D(); // local — safe under concurrent rendering
    trees.forEach(({ x, y, z, scale, rotY }, i) => {
      d.position.set(x, y + scale * 0.6, z);
      d.rotation.set(0, rotY, 0);
      d.scale.setScalar(scale);
      d.updateMatrix();
      trunkRef.current.setMatrixAt(i, d.matrix);

      d.position.set(x, y + scale * 1.8, z);
      d.rotation.set(0, rotY, 0);
      d.scale.setScalar(scale);
      d.updateMatrix();
      canopyRef.current.setMatrixAt(i, d.matrix);
    });
    trunkRef.current.instanceMatrix.needsUpdate  = true;
    canopyRef.current.instanceMatrix.needsUpdate = true;
  }, [trees]);

  if (!trees.length) return null;

  return (
    <>
      <instancedMesh ref={trunkRef}  args={[TRUNK_GEO,  TRUNK_MAT,  trees.length]} frustumCulled={false} castShadow />
      <instancedMesh ref={canopyRef} args={[CANOPY_GEO, CANOPY_MAT, trees.length]} frustumCulled={false} castShadow />
    </>
  );
}
