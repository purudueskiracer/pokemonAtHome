import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { easeOutBack, easeOutQuad, lerp } from "../../utils/mathUtils";
import { ANIMATION, POKEMON_CAPTURE_ANIM } from "../../config/GameConfig";
import { SPECIES_IDLE, DEFAULT_IDLE } from "../../data/worlds";

/** Set to false to hide Leva panels in production. */
const DEV_TUNING = false;

const API_BASE =
  "https://raw.githubusercontent.com/Pokemon-3D-api/assets/refs/heads/main/models/opt";

/** Build GLB URL for a given pokemonId + variant folder name. */
export function pokemonModelUrl(pokemonId, variant = "regular") {
  return `${API_BASE}/${variant}/${pokemonId}.glb`;
}

// ── Fuzzy clip matching ────────────────────────────────────────────────────────
// Maps animState → regex patterns to search clip names
const CLIP_PATTERNS = {
  idle:    /idle|wait|defaultwait/i,
  faint:   /ko|faint|down|damage/i,
  flee:    /run|walk/i,
  attack:  /attack|fight|buturi|tokusyu/i,
};

function findClipForState(animations, state) {
  const pattern = CLIP_PATTERNS[state];
  if (!pattern) return null;
  return animations.find((c) => pattern.test(c.name)) ?? null;
}

// ── Animation durations (seconds) ──────────────────────────────────────────────
const ATTACK_DUR   = 0.4;
const FAINT_DUR    = 0.8;
const CAPTURE_DUR  = ANIMATION.capture / 1000;   // matches throw timeline capture stage
const BREAK_DUR    = 0.4;
const FLEE_DUR     = 0.6;

/**
 * Compute procedural transform for a given state + elapsed seconds.
 * Returns additive deltas for position/rotation, multiplicative for scale.
 */
function getProceduralTransform(state, elapsed, idleParams) {
  const { bobSpeed, bobAmp, rotSpeed, rotAmp } = idleParams;
  const rotAmpRad = THREE.MathUtils.degToRad(rotAmp);

  switch (state) {
    case "idle": {
      const y = Math.sin(elapsed * bobSpeed * Math.PI * 2) * bobAmp;
      const ry = Math.sin(elapsed * rotSpeed) * rotAmpRad;
      return { px: 0, py: y, pz: 0, rx: 0, ry, sx: 1, sy: 1, sz: 1, op: 1 };
    }

    case "attack": {
      const t = Math.min(elapsed / ATTACK_DUR, 1);
      let pz = 0, sx = 1, sy = 1;
      if (t < 0.3) {
        const p = t / 0.3;
        pz = lerp(0, 0.5, p);
        sx = lerp(1, 1.1, p);
        sy = lerp(1, 0.9, p);
      } else if (t < 0.5) {
        const p = (t - 0.3) / 0.2;
        pz = lerp(0.5, 0, p);
        sx = lerp(1.1, 1, p);
        sy = lerp(0.9, 1, p);
      }
      const y = Math.sin(elapsed * bobSpeed * Math.PI * 2) * bobAmp;
      return { px: 0, py: y, pz, rx: 0, ry: 0, sx, sy, sz: 1, op: 1 };
    }

    case "faint": {
      const t = easeOutQuad(Math.min(elapsed / FAINT_DUR, 1));
      const rx = lerp(0, -Math.PI / 6, t);   // ~30° backward tilt
      const py = lerp(0, -0.8, t);
      const s  = lerp(1, 0.85, t);
      return { px: 0, py, pz: 0, rx, ry: 0, sx: s, sy: s, sz: s, op: lerp(1, 0.6, t) };
    }

    case "breakFree": {
      const t = Math.min(elapsed / BREAK_DUR, 1);
      const burst = easeOutBack(t);
      const y = Math.sin(elapsed * bobSpeed * Math.PI * 2) * bobAmp;
      const py = lerp(idleParams.breakOutY, y, burst);
      const pz = lerp(idleParams.breakOutZ, 0, burst);
      const scale = lerp(idleParams.breakOutScale, 1, burst);
      const rx = lerp(-idleParams.breakOutTilt, 0, burst);
      const ry = lerp(0.28, 0, burst);
      const opacity = Math.min(1, 0.25 + t * 2.2);
      return { px: 0, py, pz, rx, ry, sx: scale, sy: scale, sz: scale, op: opacity };
    }

    // ── Capture: ball lands first, then Pokémon sucks in ──
    case "capture": {
      const t = Math.min(elapsed / CAPTURE_DUR, 1);
      const HOLD = idleParams.captureHoldPct;
      if (t <= HOLD) {
        const hold = t / Math.max(HOLD, 0.0001);
        const y = Math.sin(elapsed * bobSpeed * Math.PI * 2) * bobAmp;
        const s = lerp(1, idleParams.capturePreScale, hold);
        return { px: 0, py: y, pz: 0, rx: 0, ry: 0, sx: s, sy: s, sz: s, op: 1 };
      }
      const st = (t - HOLD) / (1 - HOLD);
      const suck = easeOutQuad(st);
      const stretchT = Math.min(st / idleParams.captureStretchPct, 1);
      const stretch = Math.sin(stretchT * Math.PI) * idleParams.captureStretchAmp * (1 - suck * 0.45);
      const baseScale = Math.max(0.01, lerp(idleParams.capturePreScale, 0.02, suck));
      const sx = Math.max(0.01, baseScale * (1 - stretch * 0.32));
      const sy = Math.max(0.01, baseScale * (1 - stretch * 0.12));
      const sz = Math.max(0.01, baseScale * (1 + stretch * 0.75));
      const py = lerp(0, idleParams.captureTargetY, suck) + Math.sin(st * Math.PI) * idleParams.captureLiftAmp;
      const pz = lerp(0, idleParams.captureTargetZ, suck);
      const rx = -stretch * 0.16;
      const ry = suck * idleParams.captureSpinSpeed;
      const opacity = st < idleParams.captureFadeStartPct
        ? 1
        : 1 - easeOutQuad((st - idleParams.captureFadeStartPct) / (1 - idleParams.captureFadeStartPct));
      return { px: 0, py, pz, rx, ry, sx, sy, sz, op: opacity };
    }

    case "flee": {
      const t = easeOutQuad(Math.min(elapsed / FLEE_DUR, 1));
      return {
        px: lerp(0, 5, t), py: 0, pz: 0,
        rx: 0, ry: lerp(0, Math.PI / 4, t),
        sx: 1, sy: 1, sz: 1,
        op: lerp(1, 0, t),
      };
    }

    default:
      return { px: 0, py: 0, pz: 0, rx: 0, ry: 0, sx: 1, sy: 1, sz: 1, op: 1 };
  }
}

/**
 * Loads a Pokémon's 3D GLB model from the community Pokémon 3D API.
 * Plays embedded animations when available, plus procedural animation for all models.
 */
function PokemonModel({ pokemonId, variant = "regular", scale = 1, animState = "idle", autoFit = false }) {
  const url = pokemonModelUrl(pokemonId, variant);
  const { scene, animations } = useGLTF(url);

  // Per-species idle parameters (static defaults — no leva overhead in production)
  const defaults = SPECIES_IDLE[pokemonId] ?? DEFAULT_IDLE;
  const idleParams = useMemo(() => ({
    bobSpeed: defaults.bobSpeed,
    bobAmp:   defaults.bobAmp,
    rotSpeed: defaults.rotSpeed,
    rotAmp:   defaults.rotAmp,
    captureTargetY:      POKEMON_CAPTURE_ANIM.targetY,
    captureTargetZ:      POKEMON_CAPTURE_ANIM.targetZ,
    captureSpinSpeed:    12,
    captureHoldPct:      POKEMON_CAPTURE_ANIM.holdPct,
    captureStretchPct:   POKEMON_CAPTURE_ANIM.stretchPct,
    captureStretchAmp:   POKEMON_CAPTURE_ANIM.stretchAmp,
    captureLiftAmp:      POKEMON_CAPTURE_ANIM.liftAmp,
    captureFadeStartPct: POKEMON_CAPTURE_ANIM.fadeStartPct,
    capturePreScale:     POKEMON_CAPTURE_ANIM.preScale,
    breakOutY:           POKEMON_CAPTURE_ANIM.breakOutY,
    breakOutZ:           POKEMON_CAPTURE_ANIM.breakOutZ,
    breakOutScale:       POKEMON_CAPTURE_ANIM.breakOutScale,
    breakOutTilt:        POKEMON_CAPTURE_ANIM.breakOutTilt,
  }), [defaults]);

  // Refs for procedural animation groups
  const outerRef = useRef();        // additive position + rotation
  const scaleRef = useRef();        // additive scale
  const opacityMeshes = useRef([]); // for fading
  const stateRef = useRef({ state: animState, startTime: -1 });

  // ── Embedded animation mixer — memoized to avoid render-body side effects ──
  const mixer = useMemo(() => {
    if (animations.length === 0) return null;
    return new THREE.AnimationMixer(scene);
  }, [scene, animations]);

  // Tick embedded mixer each frame; strip root motion so model stays centered
  useFrame((_, delta) => {
    if (mixer) {
      mixer.update(delta);
      // Some GLB clips embed root motion that displaces the entire model.
      // Reset scene root position/rotation each frame to keep it centered.
      scene.position.set(0, 0, 0);
      scene.rotation.set(0, 0, 0);
    }
  });

  // Cleanup mixer on unmount or when scene changes
  useEffect(() => () => {
    if (mixer) {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    }
  }, [mixer, scene]);

  // Play an embedded clip that fuzzy-matches the current animState
  useEffect(() => {
    if (!mixer || animations.length === 0) return;
    if (animState === "capture") {
      mixer.stopAllAction();
      return;
    }
    const clip = findClipForState(animations, animState)
              ?? findClipForState(animations, "idle")
              ?? animations[0];
    if (!clip) return;
    mixer.stopAllAction();
    const action = mixer.clipAction(clip);
    action.reset().play();
    return () => {
      action.stop();
      mixer.uncacheAction(clip);
    };
  }, [mixer, animations, animState]);

  // ── Clone materials so the shared GLTF cache is never mutated ─────────────
  useEffect(() => {
    const meshes = [];
    const originals = [];      // for restoring on unmount
    scene.traverse((child) => {
      if (child.isMesh) {
        const isArr = Array.isArray(child.material);
        const mats = isArr ? child.material : [child.material];
        // Save references to the original shared materials
        originals.push({ child, material: child.material });
        // Clone each material so mutations are local to this component.
        // Preserve the original `side` — forcing DoubleSide breaks models
        // with intentional back-face culling (e.g. Meowth's face geometry).
        // Do NOT enable transparent by default — it causes z-ordering
        // issues that make parts of the model see-through.
        const cloned = mats.map((m) => {
          if (!m) return m;
          const c = m.clone();
          // keep c.side as-is from the source material
          return c;
        });
        child.material = isArr ? cloned : cloned[0];
        meshes.push(child);
      }
    });
    opacityMeshes.current = meshes;

    // On unmount: restore original shared materials & dispose clones
    return () => {
      for (const mesh of meshes) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => m?.dispose());
      }
      for (const { child, material } of originals) {
        child.material = material;
      }
      opacityMeshes.current = [];
    };
  }, [scene]);

  // ── Track animState changes ──────────────────────────────────────────────
  useEffect(() => {
    stateRef.current = { state: animState, startTime: -1 };
  }, [animState]);

  // ── Procedural animation loop ────────────────────────────────────────────
  useFrame((state) => {
    const now = state.clock.elapsedTime;

    // Lazy-init start time on first frame after state change
    if (stateRef.current.startTime < 0) stateRef.current.startTime = now;

    const elapsed = now - stateRef.current.startTime;
    let currentState = stateRef.current.state;

    // Auto-revert timed states to idle after they finish
    let effectiveElapsed = elapsed;
    if (currentState === "attack" && elapsed > ATTACK_DUR) {
      currentState = "idle";
      effectiveElapsed = elapsed - ATTACK_DUR;
    }
    if (currentState === "breakFree" && elapsed > BREAK_DUR) {
      currentState = "idle";
      effectiveElapsed = elapsed - BREAK_DUR;
    }

    const t = getProceduralTransform(currentState, effectiveElapsed, idleParams);

    // Apply additive transforms
    if (outerRef.current) {
      outerRef.current.position.set(t.px, t.py, t.pz);
      outerRef.current.rotation.set(t.rx, t.ry, 0);
    }
    if (scaleRef.current) {
      scaleRef.current.scale.set(t.sx, t.sy, t.sz);
    }

    // Apply opacity to all meshes.
    // Only enable transparent when opacity < 1 to avoid z-ordering artifacts.
    const needsTransparency = t.op < 1;
    const isCapturing = currentState === "capture";
    for (const mesh of opacityMeshes.current) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (!m) continue;
        m.transparent = needsTransparency;
        m.opacity = t.op;
        // Red energy glow during capture (like Pokémon converting to energy)
        if (isCapturing && m.emissive) {
          m.emissiveIntensity = Math.min(effectiveElapsed * 3, 2.5);
          m.emissive.setRGB(1, 0.15, 0.1);
        } else if (m.emissive) {
          m.emissiveIntensity = 0;
        }
      }
    }
  });

  // ── AutoFit bounding box (deferred until animation settles) ──────────────
  // We wait a few frames so the mixer plays the idle clip and bone transforms
  // reflect the true animated pose. Computing from the bind/rest pose produces
  // incorrect centering for species whose idle animation displaces the mesh
  // (e.g. Pikachu's hopping idle shifts the visual center upward).
  const fitGroupRef = useRef();
  const fitScaleGroupRef = useRef();
  const fitState = useRef({ done: false, frames: 0 });
  // Reusable scratch objects — avoids GC pressure in useFrame
  const fitBox = useRef(new THREE.Box3());
  const fitSize = useRef(new THREE.Vector3());
  const fitCenter = useRef(new THREE.Vector3());

  // Reset whenever the scene changes (new Pokémon loaded)
  useEffect(() => {
    fitState.current = { done: false, frames: 0 };
    // Hide the model until autoFit measures it (avoid a flash at wrong size)
    if (fitGroupRef.current) fitGroupRef.current.visible = autoFit ? false : true;
    if (fitScaleGroupRef.current) fitScaleGroupRef.current.scale.setScalar(autoFit ? 1 : scale);
  }, [scene, scale, autoFit]);

  useFrame(() => {
    if (!autoFit || fitState.current.done) return;
    fitState.current.frames++;
    if (fitState.current.frames < 4) return; // wait for animation to settle

    // Temporarily ensure the scene is at unit scale for accurate measurement.
    // The fitScaleGroupRef starts at scale=1 (set in the useEffect above)
    // so scene.updateMatrixWorld() produces correct local-space bounds.
    scene.updateMatrixWorld(true);

    const box = fitBox.current.setFromObject(scene);
    const size = fitSize.current;
    const center = fitCenter.current;
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const TARGET = 2.5;
    let fs = scale;
    if (maxDim > 0 && isFinite(maxDim)) {
      fs = scale * (TARGET / maxDim);
    }

    // Offset is applied in the fit-group's space (outside the scale group),
    // so multiply center by the computed scale factor.
    if (fitGroupRef.current) {
      fitGroupRef.current.position.set(-center.x * fs, -center.y * fs, -center.z * fs);
      fitGroupRef.current.visible = true;
    }
    if (fitScaleGroupRef.current) {
      fitScaleGroupRef.current.scale.setScalar(fs);
    }
    fitState.current.done = true;
  });

  // Fallback scale when autoFit is disabled
  const staticScale = autoFit ? 1 : scale;

  return (
    /* Baseline position from autoFit (set imperatively via fitGroupRef) */
    <group ref={fitGroupRef}>
      {/* Procedural additive: position + rotation */}
      <group ref={outerRef}>
        {/* Procedural additive: scale */}
        <group ref={scaleRef}>
          {/* autoFit scale (set imperatively via fitScaleGroupRef) */}
          <group ref={fitScaleGroupRef} scale={staticScale} dispose={null}>
            <primitive object={scene} />
          </group>
        </group>
      </group>
    </group>
  );
}

function FallbackSphere({ color = "#e94560" }) {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 8, 8]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

/**
 * Wrapper with Suspense + error boundary fallback.
 * Safe to render even if the API is down or the model is missing.
 */
export default function Pokemon3D({ pokemonId, variant = "regular", scale = 1, animState = "idle", autoFit = false, visible = true }) {
  return (
    <group visible={visible}>
      <Suspense fallback={<FallbackSphere />}>
        <PokemonModel
          pokemonId={pokemonId}
          variant={variant}
          scale={scale}
          autoFit={autoFit}
          animState={animState}
        />
      </Suspense>
    </group>
  );
}

// Preload a list of Pokémon ahead of time (accepts { id, variant } objects or plain ids)
export function preloadPokemon(entries) {
  entries.forEach((entry) => {
    const id      = typeof entry === "object" ? entry.id : entry;
    const variant = typeof entry === "object" ? (entry.variant ?? "regular") : "regular";
    useGLTF.preload(pokemonModelUrl(id, variant));
  });
}
