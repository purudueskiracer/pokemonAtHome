/**
 * Procedural terrain generation utilities.
 * Uses simplex-noise + FBM (Fractal Brownian Motion) for natural-looking worlds.
 */
import { createNoise2D } from "simplex-noise";
import alea from "alea";
import * as THREE from "three";
import { WORLD } from "../config/GameConfig";

// ─── Constants ────────────────────────────────────────────────────────────────
export const CHUNK_SIZE    = 64;   // world units per chunk
export const CHUNK_SEGS    = 16;   // geometry segments per side — 16 is plenty on flat terrain
export const VIEW_DISTANCE = 2;    // chunks loaded in each direction (5×5 grid)
export const TERRAIN_SCALE = 80;   // noise sampling scale (higher = gentler hills)
export const TERRAIN_HEIGHT = 18;  // max terrain height

// ─── Biome definitions ────────────────────────────────────────────────────────
// colorHex stores raw numbers — THREE.Color is constructed on demand in buildChunkGeometry
// to keep this pure service free of renderer types at module init (MVVM: M3)
export const BIOMES = {
  water:   { colorHex: 0x3a7bd5, minH: -99, maxH: -2 },
  beach:   { colorHex: 0xe8d5a3, minH: -2,  maxH:  1 },
  meadow:  { colorHex: 0x5a9e4b, minH:  1,  maxH:  5 },
  forest:  { colorHex: 0x2d6a2f, minH:  5,  maxH: 12 },
  rock:    { colorHex: 0x8d7b6a, minH: 12,  maxH: 16 },
  snow:    { colorHex: 0xf0f0f8, minH: 16,  maxH: 99 },
};

// Which biomes are "grass" / encounter zones
export const ENCOUNTER_BIOMES = new Set(["meadow", "forest"]);

// ─── Noise factory ───────────────────────────────────────────────────────────
export function makeNoise(seed) {
  return createNoise2D(alea(seed));
}

// ─── FBM height sampler ───────────────────────────────────────────────────────
export function fbm(noise2D, wx, wz, octaves = 6) {
  let value = 0, amplitude = 1, frequency = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    value     += noise2D((wx * frequency) / TERRAIN_SCALE, (wz * frequency) / TERRAIN_SCALE) * amplitude;
    max       += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return (value / max) * TERRAIN_HEIGHT;
}

// ─── Biome from height ────────────────────────────────────────────────────────
export function getBiomeByHeight(h) {
  for (const [name, def] of Object.entries(BIOMES)) {
    if (h >= def.minH && h < def.maxH) return name;
  }
  return "meadow";
}

// ─── Build chunk BufferGeometry ───────────────────────────────────────────────
/**
 * Returns a THREE.BufferGeometry for a terrain chunk at grid coords (cx, cz).
 * Includes vertex colors and normals. Ready for MeshLambertMaterial.
 */
export function buildChunkGeometry(cx, cz, noise2D) {
  const geo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SEGS, CHUNK_SEGS);
  geo.rotateX(-Math.PI / 2);

  const positions = geo.attributes.position.array;
  const vertCount = positions.length / 3;
  const colors = new Float32Array(vertCount * 3);

  // Compute world offset for this chunk
  const ox = cx * CHUNK_SIZE;
  const oz = cz * CHUNK_SIZE;

  for (let i = 0; i < vertCount; i++) {
    const xi = i * 3;
    const wx = positions[xi]     + ox;
    const wz = positions[xi + 2] + oz;
    const h  = fbm(noise2D, wx, wz);

    // Assign vertex color from biome
    const biome = getBiomeByHeight(h);

    // Land is flat (isometric look). Water vertices are slightly depressed so the
    // WaterPlane (at WORLD.waterY = -0.02) passes the depth test over water areas
    // but is hidden behind land (y=0) everywhere else.
    positions[xi + 1] = biome === "water" ? -0.06 : 0;
    const c = new THREE.Color(BIOMES[biome].colorHex);
    colors[xi]     = c.r;
    colors[xi + 1] = c.g;
    colors[xi + 2] = c.b;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.attributes.position.needsUpdate = true;
  // Terrain is flat (all y=0) — normals are trivially (0,1,0); skip expensive recompute.
  // Fill in-place to avoid the double-allocation TypedArray.map creates.
  const normals = new Float32Array(vertCount * 3);
  for (let i = 0; i < vertCount; i++) normals[i * 3 + 1] = 1;
  geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));

  return geo;
}

/**
 * Returns the raw vertex + index arrays needed for a Rapier TrimeshCollider.
 * Must be called AFTER buildChunkGeometry so positions include terrain height.
 * Reserved for Rapier physics integration — not yet called by any live code.
 */
export function buildChunkCollisionData(cx, cz, noise2D) {
  const geo = buildChunkGeometry(cx, cz, noise2D);
  // toNonIndexed bakes indices into sequential vertices — most reliable with Rapier
  const flat = geo.toNonIndexed();
  const vertices = Float32Array.from(flat.attributes.position.array);
  const indices  = Uint32Array.from(
    { length: vertices.length / 3 },
    (_, i) => i
  );
  flat.dispose();
  geo.dispose();
  return { vertices, indices };
}

// ─── Spawn point sampling ─────────────────────────────────────────────────────
/**
 * Generate a list of spawn point world positions within a chunk.
 * Uses seeded RNG so placement is identical every time the chunk loads.
 */
export function getChunkSpawnPoints(cx, cz, noise2D, count = 6) {
  const rng    = alea(`${cx},${cz}_spawns`);
  const points = [];
  let   tries  = 0;

  while (points.length < count && tries < count * 10) {
    tries++;
    const lx = (rng() - 0.5) * CHUNK_SIZE * 0.85;
    const lz = (rng() - 0.5) * CHUNK_SIZE * 0.85;
    const wx = cx * CHUNK_SIZE + lx;
    const wz = cz * CHUNK_SIZE + lz;
    const h  = fbm(noise2D, wx, wz);
    const biome = getBiomeByHeight(h);

    if (ENCOUNTER_BIOMES.has(biome)) {
      points.push({ x: wx, y: 0.1, z: wz, biome });
    }
  }
  return points;
}

// ─── Player spawn helpers ────────────────────────────────────────────────────
const _DIRS_8 = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];

/** Scan outward from origin to find the nearest non-water tile.
 *  Returns a plain {x, y, z} object — callers construct THREE.Vector3 as needed. */
export function findSpawnPoint(noise2D) {
  for (let r = 0; r <= 400; r += 2) {
    for (const [dx, dz] of _DIRS_8) {
      const x = dx * r, z = dz * r;
      if (getBiomeByHeight(fbm(noise2D, x, z)) !== "water")
        return { x, y: WORLD.groundY, z };
    }
    for (const [x, z] of [[r,0],[-r,0],[0,r],[0,-r]]) {
      if (r > 0 && getBiomeByHeight(fbm(noise2D, x, z)) !== "water")
        return { x, y: WORLD.groundY, z };
    }
  }
  return { x: 8, y: WORLD.groundY, z: 0 };
}

/** Nearest non-water tile from (x,z) within 24 units (used for rescue). */
export function nearestLand(noise2D, x, z) {
  for (let r = 1; r <= 24; r++) {
    for (const [dx, dz] of _DIRS_8) {
      const tx = x + dx * r, tz = z + dz * r;
      if (getBiomeByHeight(fbm(noise2D, tx, tz)) !== "water") return [tx, tz];
    }
  }
  return [x, z];
}

// ─── Tree placement ───────────────────────────────────────────────────────────
export function getChunkTreePositions(cx, cz, noise2D, count = 20) {
  const rng   = alea(`${cx},${cz}_trees`);
  const trees = [];

  for (let i = 0; i < count * 4 && trees.length < count; i++) {
    const lx = (rng() - 0.5) * CHUNK_SIZE * 0.9;
    const lz = (rng() - 0.5) * CHUNK_SIZE * 0.9;
    const wx = cx * CHUNK_SIZE + lx;
    const wz = cz * CHUNK_SIZE + lz;
    const h  = fbm(noise2D, wx, wz);
    const biome = getBiomeByHeight(h);

    if (ENCOUNTER_BIOMES.has(biome)) {
      trees.push({
        x: wx,
        y: 0,
        z: wz,
        scale: 0.7 + rng() * 0.8,
        rotY: rng() * Math.PI * 2,
        biome,
      });
    }
  }
  return trees;
}
