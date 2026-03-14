import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { fbm, getBiomeByHeight, ENCOUNTER_BIOMES, findSpawnPoint, nearestLand } from "../terrain";
import { held } from "../input";
import { getRandomEncounter } from "../../data/worlds";
import PlayerAvatar from "./PlayerAvatar";
import { WORLD } from "../../config/GameConfig";
import { useGameStore } from "../../store/gameStore";

const _cam  = new THREE.Vector3();
const _look = new THREE.Vector3();

/** Pure utility — hoisted above component to avoid re-allocating every useFrame tick. */
function isWaterAt(noise2D, x, z) {
  return getBiomeByHeight(fbm(noise2D, x, z)) === "water";
}

export default function PlayerController({ targetRef, noise2D, spawnPointsRef, playerPosRef, worldId, encounterActive = false, onEncounter }) {
  const meshRef    = useRef();
  const [walking, setWalking] = useState(false);
  const trainerColors = useGameStore((s) => s.profile.trainerColors);
  const walkingRef  = useRef(false);  // mirrors walking state — safe to read inside useFrame
  const facingRef   = useRef(0);      // Y-rotation toward movement direction
  const prevXRef    = useRef(null);   // previous frame X position for velocity detection
  const prevZRef    = useRef(null);   // previous frame Z position for velocity detection
  // Find a non-water spawn on first mount
  const pos        = useRef(null);
  if (pos.current === null) {
    pos.current = findSpawnPoint(noise2D);
    // Also push targetRef to the same spot so tap-move starts correctly
    targetRef.current.set(pos.current.x, pos.current.z);
  }
  const cooldown   = useRef(0);
  const inited     = useRef(false);
  const wasActive  = useRef(false);
  const postEncounterPos = useRef(null);   // position when encounter ended
  const { camera } = useThree();

  // Reset movement guard when the world changes so stale coordinates
  // from the previous world can't suppress encounters in the new one.
  useEffect(() => { postEncounterPos.current = null; }, [worldId]);

  useFrame((_, delta) => {
    // ── Movement ──────────────────────────────────────────────────────

    // Safety rescue: if the player is already on water (e.g. stale state),
    // immediately push them to the nearest land tile.
    if (isWaterAt(noise2D, pos.current.x, pos.current.z)) {
      const [lx, lz] = nearestLand(noise2D, pos.current.x, pos.current.z);
      pos.current.x = lx;
      pos.current.z = lz;
      targetRef.current.set(lx, lz);
    }

    // Try to move by (dx, dz); slides along edges if one axis is blocked
    const tryMove = (dx, dz) => {
      const nx = pos.current.x + dx;
      const nz = pos.current.z + dz;
      if (!isWaterAt(noise2D, nx, nz)) {
        pos.current.x = nx;
        pos.current.z = nz;
      } else if (!isWaterAt(noise2D, nx, pos.current.z)) {
        pos.current.x = nx;   // slide along Z edge
      } else if (!isWaterAt(noise2D, pos.current.x, nz)) {
        pos.current.z = nz;   // slide along X edge
      }
      // else fully blocked — don't move
    };

    const anyHeld = held.up || held.down || held.left || held.right;

    if (anyHeld) {
      let vx = 0, vz = 0;
      if (held.up)    vz = -1;
      if (held.down)  vz =  1;
      if (held.left)  vx = -1;
      if (held.right) vx =  1;
      const len = Math.sqrt(vx * vx + vz * vz);
      if (len > 0) { vx /= len; vz /= len; }
      tryMove(vx * WORLD.walkSpeed * delta, vz * WORLD.walkSpeed * delta);
      targetRef.current.set(pos.current.x, pos.current.z);
    } else {
      const dx   = targetRef.current.x - pos.current.x;
      const dz   = targetRef.current.y - pos.current.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.15) {
      const move = Math.min(dist, WORLD.walkSpeed * delta);
        tryMove((dx / dist) * move, (dz / dist) * move);
      }
    }

    // ── Snap Y to flat terrain surface ───────────────────────────────
    const groundY = WORLD.groundY; // terrain is flat (y=0), player sits just above
    pos.current.y = groundY;

    if (meshRef.current) {
      meshRef.current.position.copy(pos.current);
      // Smoothly rotate to face movement direction
      const mvx = pos.current.x - (prevXRef.current ?? pos.current.x);
      const mvz = pos.current.z - (prevZRef.current ?? pos.current.z);
      prevXRef.current = pos.current.x;
      prevZRef.current = pos.current.z;

      const speed = Math.sqrt(mvx * mvx + mvz * mvz);
      const isMoving = speed > 0.001;

      if (isMoving) {
        const targetAngle = Math.atan2(mvx, mvz);
        // Smooth rotation — delta-normalised so turning speed is frame-rate independent
        let diff = targetAngle - facingRef.current;
        // Wrap to [-π, π]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        facingRef.current += diff * Math.min(1.0, delta * WORLD.turnSpeed);
        meshRef.current.rotation.y = facingRef.current;
      }

      // Update walking state — compare against ref (not stale closure) to avoid excess re-renders
      if (isMoving !== walkingRef.current) {
        walkingRef.current = isMoving;
        setWalking(isMoving);
      }
    }

    // Sync player position ref for WaterPlane tracking
    if (playerPosRef) {
      playerPosRef.current.x = pos.current.x;
      playerPosRef.current.z = pos.current.z;
    }

    // ── Camera: isometric overhead tilt (Diablo-style) ───────────────
    _cam.set(pos.current.x, groundY + WORLD.camHeight, pos.current.z + WORLD.camBack);
    _look.set(pos.current.x, groundY, pos.current.z);

    if (!inited.current) {
      // First frame: teleport camera instantly so there's no long lerp
      camera.position.copy(_cam);
      camera.lookAt(_look);
      inited.current = true;
    } else {
      camera.position.lerp(_cam, WORLD.camLerp);
      camera.lookAt(_look);
    }

    // ── Encounter detection ───────────────────────────────────────────
    // Reset cooldown when modal closes so player can't be instantly re-triggered
    if (wasActive.current && !encounterActive) {
      cooldown.current = WORLD.encountCd;
      // Record where the player was when the encounter ended
      postEncounterPos.current = { x: pos.current.x, z: pos.current.z };
    }
    wasActive.current = encounterActive;

    if (encounterActive) return; // pause all detection while modal is open

    cooldown.current -= delta;
    if (cooldown.current > 0) return;

    // Require the player to move before the next encounter can trigger
    if (postEncounterPos.current) {
      const mx = pos.current.x - postEncounterPos.current.x;
      const mz = pos.current.z - postEncounterPos.current.z;
      if (mx * mx + mz * mz < WORLD.minMoveDist * WORLD.minMoveDist) return;
      postEncounterPos.current = null; // movement threshold met
    }

    // Check if player is in an encounter-friendly biome
    const biome = getBiomeByHeight(fbm(noise2D, pos.current.x, pos.current.z));
    if (!ENCOUNTER_BIOMES.has(biome)) return;

    // Check proximity to any spawn point
    const pts = spawnPointsRef?.current;
    if (!pts || pts.length === 0) return;

    for (const pt of pts) {
      const pdx = pt.x - pos.current.x;
      const pdz = pt.z - pos.current.z;
      if (pdx * pdx + pdz * pdz < WORLD.encountRadius * WORLD.encountRadius) {
        if (Math.random() < WORLD.encountP) {
          cooldown.current = WORLD.encountCd;
          const pokemon = getRandomEncounter(worldId);
          if (pokemon) onEncounter?.({ pokemon, worldId, biome });
        }
        break;
      }
    }
  });

  return (
    <group ref={meshRef}>
      <PlayerAvatar walking={walking} colors={trainerColors} />
    </group>
  );
}
