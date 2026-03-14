/**
 * ChunkDecorations — procedural rocks, flowers, and bushes per chunk.
 *
 * Uses the same InstancedMesh pattern as ChunkTrees for minimal draw calls.
 * Placement is seeded per-chunk for deterministic results across reloads.
 *
 * Object types are biome-aware:
 *   - Flowers → meadow only
 *   - Bushes  → meadow + forest
 *   - Rocks   → rock + beach + forest edges
 */

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import alea from "alea";
import { CHUNK_SIZE, fbm, getBiomeByHeight } from "../terrain";

// ── Shared geometry singletons ────────────────────────────────────────────────

// Rock: irregular dodecahedron, slightly squashed
const ROCK_GEO = (() => {
  const g = new THREE.DodecahedronGeometry(0.5, 0);
  g.scale(1, 0.6, 1); // flatten
  return g;
})();

// Small rock variant
const PEBBLE_GEO = (() => {
  const g = new THREE.DodecahedronGeometry(0.25, 0);
  g.scale(1.2, 0.5, 0.9);
  return g;
})();

// Flower: flat disc for the head (will be billboard-ish from above)
const FLOWER_STEM_GEO = new THREE.CylinderGeometry(0.02, 0.03, 0.4, 4);
const FLOWER_HEAD_GEO = (() => {
  const g = new THREE.SphereGeometry(0.12, 6, 4);
  g.scale(1, 0.4, 1);
  return g;
})();

// Bush: squashed sphere
const BUSH_GEO = (() => {
  const g = new THREE.IcosahedronGeometry(0.6, 1);
  g.scale(1.2, 0.7, 1.1);
  return g;
})();

// Tall grass: 3-segment cone reads as organic vegetation from above
const GRASS_TUFT_GEO = new THREE.ConeGeometry(0.15, 0.7, 3);

// ── Shared materials ──────────────────────────────────────────────────────────
const ROCK_MAT      = new THREE.MeshLambertMaterial({ color: 0x7a7062, flatShading: true });
const PEBBLE_MAT    = new THREE.MeshLambertMaterial({ color: 0x9a9082, flatShading: true });
const BUSH_MAT      = new THREE.MeshLambertMaterial({ color: 0x3a8a3a, flatShading: true });
const GRASS_MAT     = new THREE.MeshLambertMaterial({ color: 0x4a9a3a, flatShading: true });
const STEM_MAT      = new THREE.MeshLambertMaterial({ color: 0x3a7030, flatShading: true });

// Flower colors — randomly selected per instance
const FLOWER_COLORS = [0xff6b8a, 0xffcc44, 0xff9944, 0xaa66ff, 0x66bbff, 0xff66aa];
// Single base material; per-instance color is applied via InstancedMesh.setColorAt
const FLOWER_HEAD_MAT = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });

// ── Placement sampler ─────────────────────────────────────────────────────────
function getChunkDecorations(cx, cz, noise2D) {
  const rng = alea(`${cx},${cz}_deco`);
  const rocks = [];
  const pebbles = [];
  const bushes = [];
  const flowers = [];
  const grass = [];

  const MAX_TRIES = 200;

  for (let i = 0; i < MAX_TRIES; i++) {
    const lx = (rng() - 0.5) * CHUNK_SIZE * 0.92;
    const lz = (rng() - 0.5) * CHUNK_SIZE * 0.92;
    const wx = cx * CHUNK_SIZE + lx;
    const wz = cz * CHUNK_SIZE + lz;
    const h  = fbm(noise2D, wx, wz);
    const biome = getBiomeByHeight(h);

    const data = {
      x: wx, y: 0, z: wz,
      scale: 0.5 + rng() * 1.0,
      rotY: rng() * Math.PI * 2,
    };

    switch (biome) {
      case "meadow":
        if (flowers.length < 25 && rng() < 0.35) {
          flowers.push({ ...data, scale: 0.6 + rng() * 0.5, colorIdx: Math.floor(rng() * FLOWER_COLORS.length) });
        } else if (grass.length < 30 && rng() < 0.4) {
          grass.push({ ...data, scale: 0.5 + rng() * 0.6 });
        } else if (bushes.length < 8 && rng() < 0.15) {
          bushes.push({ ...data, scale: 0.5 + rng() * 0.6 });
        }
        break;

      case "forest":
        if (bushes.length < 15 && rng() < 0.3) {
          bushes.push({ ...data, scale: 0.6 + rng() * 0.8 });
        } else if (grass.length < 20 && rng() < 0.25) {
          grass.push({ ...data, scale: 0.4 + rng() * 0.5 });
        }
        break;

      case "rock":
        if (rocks.length < 12 && rng() < 0.4) {
          rocks.push({ ...data, scale: 0.6 + rng() * 1.2 });
        } else if (pebbles.length < 15 && rng() < 0.35) {
          pebbles.push({ ...data, scale: 0.4 + rng() * 0.6 });
        }
        break;

      case "beach":
        if (pebbles.length < 10 && rng() < 0.25) {
          pebbles.push({ ...data, scale: 0.3 + rng() * 0.5 });
        } else if (rocks.length < 4 && rng() < 0.1) {
          rocks.push({ ...data, scale: 0.5 + rng() * 0.8 });
        }
        break;

      case "snow":
        if (rocks.length < 6 && rng() < 0.2) {
          rocks.push({ ...data, scale: 0.5 + rng() * 1.0 });
        }
        break;

      default: break;
    }
  }

  return { rocks, pebbles, bushes, flowers, grass };
}

// ── Instancer helper ──────────────────────────────────────────────────────────
// useEffect (not useMemo) so ref.current is populated during the commit phase.
// A local Object3D per call avoids the shared-singleton concurrency hazard.
function useInstances(ref, items, yOffset = 0) {
  useEffect(() => {
    if (!items.length || !ref.current) return;
    const d = new THREE.Object3D();
    items.forEach(({ x, y, z, scale, rotY }, i) => {
      d.position.set(x, y + yOffset, z);
      d.rotation.set(0, rotY, 0);
      d.scale.setScalar(scale);
      d.updateMatrix();
      ref.current.setMatrixAt(i, d.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [items, yOffset]);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ChunkDecorations({ cx, cz, noise2D }) {
  const deco = useMemo(
    () => getChunkDecorations(cx, cz, noise2D),
    [cx, cz, noise2D]
  );

  const rockRef   = useRef();
  const pebbleRef = useRef();
  const bushRef   = useRef();
  const grassRef  = useRef();
  const stemRef   = useRef();
  const headRef   = useRef(); // single InstancedMesh for all flower head colors

  // Rocks & pebbles
  useInstances(rockRef, deco.rocks, 0.15);
  useInstances(pebbleRef, deco.pebbles, 0.08);

  // Bushes
  useInstances(bushRef, deco.bushes, 0.25);

  // Grass tufts
  useInstances(grassRef, deco.grass, 0.2);

  // Flower stems
  useInstances(stemRef, deco.flowers, 0.2);

  // Flower heads — single InstancedMesh with per-instance color (one draw call)
  useEffect(() => {
    if (!deco.flowers.length || !headRef.current) return;
    const d = new THREE.Object3D();
    const tempColor = new THREE.Color();
    deco.flowers.forEach(({ x, y, z, scale, rotY, colorIdx }, i) => {
      d.position.set(x, y + 0.2 + 0.32 * scale, z);
      d.rotation.set(0, rotY, 0);
      d.scale.setScalar(scale);
      d.updateMatrix();
      headRef.current.setMatrixAt(i, d.matrix);
      headRef.current.setColorAt(i, tempColor.setHex(FLOWER_COLORS[colorIdx]));
    });
    headRef.current.instanceMatrix.needsUpdate = true;
    if (headRef.current.instanceColor) headRef.current.instanceColor.needsUpdate = true;
  }, [deco.flowers]);

  return (
    <>
      {deco.rocks.length > 0 && (
        <instancedMesh ref={rockRef} args={[ROCK_GEO, ROCK_MAT, deco.rocks.length]} frustumCulled={false} />
      )}
      {deco.pebbles.length > 0 && (
        <instancedMesh ref={pebbleRef} args={[PEBBLE_GEO, PEBBLE_MAT, deco.pebbles.length]} frustumCulled={false} />
      )}
      {deco.bushes.length > 0 && (
        <instancedMesh ref={bushRef} args={[BUSH_GEO, BUSH_MAT, deco.bushes.length]} frustumCulled={false} />
      )}
      {deco.grass.length > 0 && (
        <instancedMesh ref={grassRef} args={[GRASS_TUFT_GEO, GRASS_MAT, deco.grass.length]} frustumCulled={false} />
      )}
      {deco.flowers.length > 0 && (
        <instancedMesh ref={stemRef} args={[FLOWER_STEM_GEO, STEM_MAT, deco.flowers.length]} frustumCulled={false} />
      )}
      {deco.flowers.length > 0 && (
        <instancedMesh ref={headRef} args={[FLOWER_HEAD_GEO, FLOWER_HEAD_MAT, deco.flowers.length]} frustumCulled={false} />
      )}
    </>
  );
}
