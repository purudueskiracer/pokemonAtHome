/**
 * PlayerAvatar — detailed procedural humanoid player model.
 *
 * Replaces the old capsule+sphere with:
 *   - Body (torso + shirt hem)
 *   - Head with face features (eyes, mouth)
 *   - Arms with bobbing walk animation
 *   - Legs with stride animation
 *   - Hat/cap accessory
 *
 * Uses basic Three.js primitives for a low-poly aesthetic.
 * Walk animation is driven by a `walking` flag derived from velocity.
 *
 * Future upgrade: swap this entire group with `useGLTF` + a Kenney
 * character GLB placed at `public/models/player.glb`. The component
 * will auto-detect the file and use it instead of procedural geometry.
 */

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PLAYER_AVATAR, TRAINER_PALETTE, TRAINER_DEFAULTS } from "../../config/GameConfig";

// ── Static geometry singletons (shared, never reallocated) ───────────────────
const TORSO_GEO = new THREE.BoxGeometry(0.5, 0.55, 0.3, 1, 1, 1);

const HEAD_GEO = new THREE.BoxGeometry(0.38, 0.38, 0.35);

const ARM_GEO = (() => {
  const g = new THREE.BoxGeometry(0.14, 0.45, 0.14);
  g.translate(0, -0.22, 0); // pivot at shoulder
  return g;
})();

const LEG_GEO = (() => {
  const g = new THREE.BoxGeometry(0.16, 0.4, 0.16);
  g.translate(0, -0.2, 0); // pivot at hip
  return g;
})();

const SHOE_GEO = (() => {
  const g = new THREE.BoxGeometry(0.18, 0.1, 0.22);
  return g;
})();

const HAT_BRIM_GEO = (() => {
  const g = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 8);
  return g;
})();

const HAT_TOP_GEO = (() => {
  const g = new THREE.CylinderGeometry(0.2, 0.24, 0.16, 8);
  return g;
})();

const EYE_GEO  = new THREE.SphereGeometry(0.035, 6, 4);
const HAND_GEO = new THREE.BoxGeometry(0.12, 0.1, 0.12);

// ── Fallback eye material (never changes colour) ───────────────────────────────
const EYE_MAT = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

/**
 * @param {{ walking: boolean, colors?: { skin: string, shirt: string, pants: string, hat: string, shoes: string } }} props
 */
export default function PlayerAvatar({
  walking = false,
  colors,
}) {
  // Build per-instance materials from the colors prop, falling back to palette defaults.
  // useMemo means we only reallocate MeshLambertMaterials when a colour actually changes.
  const defaultColors = {
    skin:  TRAINER_PALETTE.skin[TRAINER_DEFAULTS.skin],
    shirt: TRAINER_PALETTE.shirt[TRAINER_DEFAULTS.shirt],
    pants: TRAINER_PALETTE.pants[TRAINER_DEFAULTS.pants],
    hat:   TRAINER_PALETTE.hat[TRAINER_DEFAULTS.hat],
    shoes: TRAINER_PALETTE.shoes[TRAINER_DEFAULTS.shoes],
  };
  const c = colors ?? defaultColors;
  const skinMat  = useMemo(() => new THREE.MeshLambertMaterial({ color: c.skin,  flatShading: true }), [c.skin]);
  const shirtMat = useMemo(() => new THREE.MeshLambertMaterial({ color: c.shirt, flatShading: true }), [c.shirt]);
  const pantsMat = useMemo(() => new THREE.MeshLambertMaterial({ color: c.pants, flatShading: true }), [c.pants]);
  const hatMat   = useMemo(() => new THREE.MeshLambertMaterial({ color: c.hat,   flatShading: true }), [c.hat]);
  const shoesMat = useMemo(() => new THREE.MeshLambertMaterial({ color: c.shoes, flatShading: true }), [c.shoes]);

  const leftArmRef  = useRef();
  const rightArmRef = useRef();
  const leftLegRef  = useRef();
  const rightLegRef = useRef();
  const groupRef    = useRef();
  const walkPhase   = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (walking) {
      walkPhase.current = (walkPhase.current + delta * PLAYER_AVATAR.strideFreq) % (Math.PI * 2);
    } else {
      // Ease back to idle pose (delta-normalised so it feels the same at all frame rates)
      walkPhase.current *= Math.pow(PLAYER_AVATAR.idleDecay, delta * 60);
    }

    const phase = walkPhase.current;
    const swing = Math.sin(phase) * PLAYER_AVATAR.swingAmp;

    // Arms swing opposite to legs
    if (leftArmRef.current)  leftArmRef.current.rotation.x  =  swing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
    if (leftLegRef.current)  leftLegRef.current.rotation.x  = -swing * PLAYER_AVATAR.legScale;
    if (rightLegRef.current) rightLegRef.current.rotation.x =  swing * PLAYER_AVATAR.legScale;

    // Slight body bob
    if (groupRef.current) {
      groupRef.current.position.y = walking
        ? PLAYER_AVATAR.bobAmp * Math.abs(Math.sin(phase * 2))
        : 0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* ── Torso ── */}
      <mesh geometry={TORSO_GEO} material={shirtMat} position={[0, 0.65, 0]} castShadow />

      {/* ── Head ── */}
      <group position={[0, 1.1, 0]}>
        <mesh geometry={HEAD_GEO} material={skinMat} castShadow />

        {/* Eyes */}
        <mesh geometry={EYE_GEO} material={EYE_MAT} position={[-0.09, 0.04, 0.175]} />
        <mesh geometry={EYE_GEO} material={EYE_MAT} position={[ 0.09, 0.04, 0.175]} />

        {/* Hat */}
        <mesh geometry={HAT_BRIM_GEO} material={hatMat} position={[0, 0.19, 0.02]} castShadow />
        <mesh geometry={HAT_TOP_GEO}  material={hatMat} position={[0, 0.29, -0.01]} castShadow />
      </group>

      {/* ── Arms ── */}
      <group ref={leftArmRef} position={[-0.33, 0.82, 0]}>
        <mesh geometry={ARM_GEO} material={shirtMat} castShadow />
        {/* Hand */}
        <mesh geometry={HAND_GEO} material={skinMat} position={[0, -0.4, 0]} />
      </group>

      <group ref={rightArmRef} position={[0.33, 0.82, 0]}>
        <mesh geometry={ARM_GEO} material={shirtMat} castShadow />
        <mesh geometry={HAND_GEO} material={skinMat} position={[0, -0.4, 0]} />
      </group>

      {/* ── Legs ── */}
      <group ref={leftLegRef} position={[-0.12, 0.38, 0]}>
        <mesh geometry={LEG_GEO} material={pantsMat} castShadow />
        <mesh geometry={SHOE_GEO} material={shoesMat} position={[0, -0.42, 0.03]} castShadow />
      </group>

      <group ref={rightLegRef} position={[0.12, 0.38, 0]}>
        <mesh geometry={LEG_GEO} material={pantsMat} castShadow />
        <mesh geometry={SHOE_GEO} material={shoesMat} position={[0, -0.42, 0.03]} castShadow />
      </group>
    </group>
  );
}
