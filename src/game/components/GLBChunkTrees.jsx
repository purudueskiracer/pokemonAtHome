/**
 * GLBChunkTrees — drop-in replacement for ChunkTrees that renders
 * loaded GLB models instead of procedural geometry.
 *
 * Architecture
 * ─────────────────────────────────────────────────────────────────────────────
 * Each GLB file may contain multiple meshes (e.g. trunk + canopy). We extract
 * every mesh with its local transform, then create one InstancedMesh per mesh —
 * exactly the same strategy as ChunkTrees, but driven by loaded geometry instead
 * of hand-crafted primitives.
 *
 * The component suspends (via useGLTF) until all models are loaded. The parent
 * ChunkManager wraps it in <Suspense fallback={<ChunkTrees/>}> so procedural
 * trees are shown during loading, and the GLB versions replace them once ready.
 * An error boundary in ChunkManager catches 404s (models not yet downloaded)
 * and permanently shows the procedural fallback instead.
 *
 * Pending download
 * ─────────────────────────────────────────────────────────────────────────────
 * See public/models/DOWNLOAD_HERE.md for direct links to free CC0 GLB packs.
 */

import { useRef, useMemo, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { getChunkTreePositions } from "../terrain";
import { TREE_MODELS } from "../../data/worldModels";

// ── Preload all registered tree models at module init ─────────────────────────
// useGLTF.preload fires the fetch immediately — by the time the first chunk
// mounts, the GLBs are already in the cache (or are still loading, which
// triggers Suspense). Either way, the fallback procedural trees are shown
// at most once, not repeatedly per chunk unmount/remount.
TREE_MODELS.forEach(({ path }) => useGLTF.preload(path));

// ── GLB mesh extraction ───────────────────────────────────────────────────────

/**
 * Walk the GLB scene graph and return one descriptor per mesh, including the
 * mesh's world-space matrix relative to the scene root.  This lets us recreate
 * multi-part models (trunk + canopy, etc.) with correct offsets per instance.
 *
 * @param {THREE.Object3D} scene  Root object from useGLTF().scene
 * @returns {{ geo: THREE.BufferGeometry, mat: THREE.Material, localMatrix: THREE.Matrix4 }[]}
 */
function extractMeshes(scene) {
  scene.updateMatrixWorld(true);
  const meshes = [];
  scene.traverse((obj) => {
    if (!obj.isMesh) return;
    meshes.push({
      geo:         obj.geometry,
      mat:         Array.isArray(obj.material) ? obj.material[0] : obj.material,
      localMatrix: obj.matrixWorld.clone(),
    });
  });
  return meshes;
}

// ── Scratch objects (reused in useEffect — safe in commit phase) ──────────────
const _pos   = new THREE.Vector3();
const _quat  = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _euler = new THREE.Euler();
const _tree  = new THREE.Matrix4();
const _inst  = new THREE.Matrix4();

// ── Inner renderer for a single GLB model ────────────────────────────────────

/**
 * Renders one InstancedMesh per sub-mesh found in the GLB, filling matrices
 * from the provided `trees` placement array.
 */
function MultiInstancedModel({ glbPath, trees, scaleMultiplier, yOffset }) {
  const { scene } = useGLTF(glbPath);
  const meshInfos = useMemo(() => extractMeshes(scene), [scene]);

  // Array of refs, one per mesh in the GLB — reset when mesh count changes.
  const instRefsArr = useRef([]);

  useEffect(() => {
    if (!trees.length || !meshInfos.length) return;

    meshInfos.forEach((info, meshIdx) => {
      const inst = instRefsArr.current[meshIdx];
      if (!inst) return;

      trees.forEach(({ x, y, z, scale, rotY }, treeIdx) => {
        _euler.set(0, rotY, 0);
        _quat.setFromEuler(_euler);
        _pos.set(x, y + yOffset, z);
        _scale.setScalar(scale * scaleMultiplier);
        _tree.compose(_pos, _quat, _scale);

        // Combine tree world-transform with the mesh's local position in the GLB
        _inst.copy(_tree).multiply(info.localMatrix);
        inst.setMatrixAt(treeIdx, _inst);
      });

      inst.instanceMatrix.needsUpdate = true;
    });
  }, [trees, meshInfos, scaleMultiplier, yOffset]);

  if (!trees.length || !meshInfos.length) return null;

  return (
    <>
      {meshInfos.map((info, i) => (
        <instancedMesh
          key={i}
          ref={(el) => { instRefsArr.current[i] = el; }}
          args={[info.geo, info.mat, trees.length]}
          frustumCulled={false}
          castShadow
        />
      ))}
    </>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

/**
 * @param {{ cx: number, cz: number, noise2D: Function }} props
 */
export default function GLBChunkTrees({ cx, cz, noise2D }) {
  const trees = useMemo(
    () => getChunkTreePositions(cx, cz, noise2D),
    [cx, cz, noise2D]
  );

  if (!trees.length) return null;

  return (
    <>
      {TREE_MODELS.map((model) => {
        const candidates = trees.filter((t) => model.biomes.includes(t.biome));
        if (!candidates.length) return null;
        return (
          <MultiInstancedModel
            key={model.path}
            glbPath={model.path}
            trees={candidates}
            scaleMultiplier={model.scale ?? 1}
            yOffset={model.yOffset ?? 0}
          />
        );
      })}
    </>
  );
}
