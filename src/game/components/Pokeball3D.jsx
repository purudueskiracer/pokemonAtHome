/**
 * Pokeball3D — procedural R3F Pokéball mesh.
 *
 * Fully geometry-based (no external GLB). All animation is driven by a
 * `tick` function (from useThrowPipeline) called every frame via useFrame.
 *
 * tick() returns { stage, t } where stage is the current animation phase
 * and t is the 0–1 normalised progress within that phase. The mesh
 * self-manages visibility: invisible when stage is null, visible otherwise.
 *
 * Supported ball types: pokeball | greatball | ultraball | masterball
 *
 * Each type renders accurate markings:
 *   pokeball  — clean red/white split
 *   greatball — two red swirl-spot discs on the blue top hemisphere
 *   ultraball — two yellow angled stripes across the dark top hemisphere
 *   masterball — M-logo arc + two accent dots on the purple top hemisphere
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { SphereGeometry, CylinderGeometry, TorusGeometry } from "three";
import { POKEBALL_ANIM, POKEBALL_COLORS, POKEBALL_CHROME } from "../../config/GameConfig";
import { easeOut, lerp } from "../../utils/mathUtils";

function cubicBezier(a, b, c, d, t) {
  const mt = 1 - t;
  return mt ** 3 * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t ** 3 * d;
}

function solveBallisticApexTime(startY, endY, apexY) {
  const rise = apexY - startY;
  const delta = endY - startY;
  if (rise <= 0) return 0.5;
  if (Math.abs(delta) < 0.0001) return 0.5;

  const disc = Math.max(rise * (rise - delta), 0);
  const tApex = (rise - Math.sqrt(disc)) / delta;
  return Math.min(0.85, Math.max(0.2, Number.isFinite(tApex) ? tApex : 0.5));
}

function buildBounceTrack(T) {
  const samples = [];
  const dt = 1 / 120;
  const duration = Math.max(T.bounceDuration, dt);
  const gravity = -T.bounceGravity;
  let x = T.impactSide;
  let y = T.groundY;
  let z = T.ballZ + T.impactForward;
  let vx = (-T.impactSide / duration) * 1.2;
  let vy = Math.sqrt(2 * T.bounceGravity * T.impactBounce);
  let vz = (-T.impactForward / duration) * 1.35;

  for (let elapsed = 0; elapsed <= duration; elapsed += dt) {
    const nt = Math.min(elapsed / duration, 1);
    const height = Math.max(0, y - T.groundY);
    const squash = height < 0.018 ? Math.min(T.impactSquash, Math.max(0, -vy) * 0.018) : 0;
    samples.push({ t: nt, x, y, z, squash });

    vy += gravity * dt;
    x += vx * dt;
    y += vy * dt;
    z += vz * dt;

    if (y <= T.groundY) {
      y = T.groundY;
      const impactSpeed = Math.abs(vy);
      if (impactSpeed < 0.28) {
        vy = 0;
        vx *= 0.6;
        vz *= 0.6;
      } else {
        vy = impactSpeed * T.bounceRestitution;
        vx *= T.bounceFriction;
        vz *= T.bounceFriction;
      }
    }
  }

  samples.push({ t: 1, x: 0, y: T.groundY, z: T.ballZ, squash: 0 });
  return samples;
}

function sampleBounceTrack(samples, t) {
  if (samples.length === 0) return null;
  if (t <= 0) return samples[0];
  if (t >= 1) return samples[samples.length - 1];

  const scaled = t * (samples.length - 1);
  const index = Math.floor(scaled);
  const next = Math.min(index + 1, samples.length - 1);
  const mix = scaled - index;
  const a = samples[index];
  const b = samples[next];

  return {
    x: lerp(a.x, b.x, mix),
    y: lerp(a.y, b.y, mix),
    z: lerp(a.z, b.z, mix),
    squash: lerp(a.squash, b.squash, mix),
  };
}

/* ── Module-level geometry singletons ───────────────────────────────────────────────────────
 * makeGeo returns a lazy factory. The cache is nulled via the geometry's
 * own 'dispose' event — correctly handles unmount + remount and Vite HMR.
 * Segment counts kept at mobile-appropriate levels.
 */
function makeGeo(factory) {
  let cache = null;
  return () => {
    if (!cache) {
      cache = factory();
      cache.addEventListener("dispose", () => { cache = null; });
    }
    return cache;
  };
}
const getHalfSphereGeo  = makeGeo(() => new SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2 + 0.04));
const getCylinderGeo    = makeGeo(() => new CylinderGeometry(1.018, 1.018, 0.13, 32));
const getTorusGeo       = makeGeo(() => new TorusGeometry(0.19, 0.055, 12, 32));
const getButtonGeo      = makeGeo(() => new SphereGeometry(0.13, 16, 10));
// Marking geometry — flat discs and thin arcs used for per-type decorations
const getMarkDiscGeo    = makeGeo(() => new SphereGeometry(0.26, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2 + 0.04));
const getStripeGeo      = makeGeo(() => new CylinderGeometry(1.022, 1.022, 0.09, 32));
const getMArcGeo        = makeGeo(() => new TorusGeometry(0.38, 0.055, 10, 24, Math.PI * 0.8));
const getMArcSmallGeo   = makeGeo(() => new TorusGeometry(0.22, 0.048, 10, 20, Math.PI * 0.8));
const getDotGeo         = makeGeo(() => new SphereGeometry(0.09, 12, 8));

// Local alias so animation code reads `T.tossSpin` etc. All values live in GameConfig.
const T = POKEBALL_ANIM;

/**
 * @param {{
 *   ballType?: 'pokeball'|'greatball'|'ultraball'|'masterball',
 *   tick: () => { stage: string|null, t: number },
 * }} props
 */
export default function Pokeball3D({ ballType = "pokeball", tick }) {
  const groupRef      = useRef();
  const buttonMatRef  = useRef();
  const rotYRef       = useRef(0);
  const prevStageRef  = useRef(null);
  const lerpTargetRef = useRef(0);

  // Per-part refs for burst break-apart animation
  const topRef       = useRef();
  const bottomRef    = useRef();
  const bandRef      = useRef();
  const ringRef      = useRef();
  const buttonRef    = useRef();

  const palette   = POKEBALL_COLORS[ballType] ?? POKEBALL_COLORS.pokeball;
  const { top, bottom, captureGlow } = palette;
  const bounceTrack = useMemo(() => buildBounceTrack(T), []);
  // Per-type overrides for band and button chrome, falling back to shared defaults
  const bandColor   = palette.band   ?? POKEBALL_CHROME.band;
  const buttonColor = palette.button ?? POKEBALL_CHROME.button;

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const { stage, t } = tick();

    // Detect stage transitions
    if (stage !== prevStageRef.current) {
      if (stage === "tossing") rotYRef.current = 0;
      if (stage === "wobbling" || stage === "locked") {
        const fullRots = rotYRef.current / (Math.PI * 2);
        const nearest  = Math.round(fullRots) * (Math.PI * 2);
        const alt      = Math.floor(fullRots)  * (Math.PI * 2);
        lerpTargetRef.current =
          Math.abs(rotYRef.current - alt) < Math.abs(rotYRef.current - nearest) ? alt : nearest;
      }
      prevStageRef.current = stage;
    }

    // Hide when no active throw
    if (!stage) {
      g.visible = false;
      return;
    }
    g.visible = true;

    // Clear emissive each frame; individual cases re-enable as needed
    if (buttonMatRef.current) buttonMatRef.current.emissiveIntensity = 0;

    // Reset part transforms when NOT bursting
    if (stage !== "burst") {
      if (topRef.current)    { topRef.current.position.set(0, 0, 0);    topRef.current.rotation.set(0, 0, 0); }
      if (bottomRef.current) { bottomRef.current.position.set(0, 0, 0); bottomRef.current.rotation.set(Math.PI, 0, 0); }
      if (bandRef.current)   { bandRef.current.position.set(0, 0, 0); }
      if (ringRef.current)   { ringRef.current.position.set(0, 0, 1.0); }
      if (buttonRef.current) { buttonRef.current.position.set(0, 0, 1.01); }
    }

    switch (stage) {

      // ── Tossing: arc from off-screen bottom up to Pokémon (centre) ──
      case "tossing": {
        const pathT = t;
        const poseT = easeOut(Math.min(t / 0.82, 1));
        const apexY = Math.max(T.tossStartY, T.tossCatchY) + T.tossArcHeight;
        const tApex = solveBallisticApexTime(T.tossStartY, T.tossCatchY, apexY);
        const gravity = (-2 * (apexY - T.tossStartY)) / Math.max(tApex * tApex, 0.0001);
        const vy = -gravity * tApex;
        const vx = T.tossCatchX - T.tossStartX;
        const vz = T.tossCatchZ - T.tossStartZ;
        const x = T.tossStartX + vx * pathT;
        const y = T.tossStartY + vy * pathT + 0.5 * gravity * pathT * pathT;
        const z = T.tossStartZ + vz * pathT;
        const velY = vy + gravity * pathT;
        const pitch = Math.atan2(velY, Math.hypot(vx, vz)) * 0.75;
        const bank = lerp(-0.24, -0.03, poseT);
        g.position.set(x, y, z);
        g.scale.setScalar(lerp(T.tossStartScale, T.tossCatchScale, poseT));
        rotYRef.current += (T.tossSpin + 0.03 * Math.sin(t * Math.PI)) * delta * 60;
        g.rotation.x = pitch;
        g.rotation.y = rotYRef.current;
        g.rotation.z = bank;
        break;
      }

      // ── Capturing: ball bounces at the feet, then pulls the Pokémon in ──
      case "capturing": {
        const DROP = T.dropPct;
        const bounceWindow = DROP;
        const descendCutoff = DROP * 0.8;
        if (t <= descendCutoff) {
          const d = easeOut(t / Math.max(descendCutoff, 0.0001));
          g.position.set(
            lerp(T.tossCatchX, T.impactSide, d),
            lerp(T.tossCatchY, T.groundY, d),
            lerp(T.tossCatchZ, T.ballZ + T.impactForward, d)
          );
          g.scale.setScalar(lerp(T.tossCatchScale, T.groundScale, d));
          rotYRef.current += T.dropSpin * (1.2 - d * 0.4) * delta * 60;
          g.rotation.x = lerp(-0.22, 0, d);
          g.rotation.y = rotYRef.current;
          g.rotation.z = lerp(-0.1, 0, d);
        } else if (t <= bounceWindow) {
          const bt = (t - descendCutoff) / Math.max(bounceWindow - descendCutoff, 0.0001);
          const sample = sampleBounceTrack(bounceTrack, bt);
          const squash = sample?.squash ?? 0;

          g.position.set(sample?.x ?? 0, sample?.y ?? T.groundY, sample?.z ?? T.ballZ);
          g.scale.set(
            T.groundScale * (1 + squash * 0.65),
            T.groundScale * (1 - squash),
            T.groundScale * (1 + squash * 0.65)
          );
          rotYRef.current += T.dropSpin * 0.32 * delta * 60;
          g.rotation.x = -0.035;
          g.rotation.y = rotYRef.current;
          g.rotation.z = -(sample?.x ?? 0) * 0.12;
        } else {
          g.position.set(0, T.groundY, T.ballZ);
          g.scale.setScalar(T.groundScale);
          g.rotation.x = 0;
          g.rotation.y = rotYRef.current;
          g.rotation.z = 0;
          if (buttonMatRef.current && t > T.captureHoldPct) {
            const st = (t - T.captureHoldPct) / Math.max(1 - T.captureHoldPct, 0.0001);
            buttonMatRef.current.emissiveIntensity = st < 0.5 ? st * T.glowIntensity : (1 - st) * T.glowIntensity;
            buttonMatRef.current.emissive.setRGB(...captureGlow);
          }
        }
        break;
      }

      // ── Wobbling: Z-axis rocking at feet, front facing camera ──
      case "wobbling": {
        g.position.set(0, T.groundY, T.ballZ);
        g.scale.setScalar(T.groundScale);
        g.rotation.x = 0;
        rotYRef.current = lerp(rotYRef.current, lerpTargetRef.current, 1 - Math.pow(T.wobbleLerpAlpha, delta * 60));
        g.rotation.y = rotYRef.current;
        g.rotation.z = Math.sin(t * Math.PI * T.wobbleHalfCycles) * T.wobbleAmp;
        break;
      }

      // ── Locked: at feet, front facing, golden button pulse ──
      case "locked": {
        g.position.set(0, T.groundY, T.ballZ);
        g.scale.setScalar(T.groundScale * (1 + T.lockedPulseAmp * Math.sin(t * Math.PI)));
        g.rotation.x = 0;
        rotYRef.current = lerp(rotYRef.current, lerpTargetRef.current, 1 - Math.pow(T.lockedLerpAlpha, delta * 60));
        g.rotation.y = rotYRef.current;
        g.rotation.z *= Math.pow(T.wobbleDecayAlpha, delta * 60);
        if (buttonMatRef.current) {
          // heat curve: rises 0→1 over first 30%, then decays to 0 at t=1
          const heat = t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.7;
          buttonMatRef.current.emissiveIntensity = heat * T.lockedGlowMax;
          buttonMatRef.current.emissive.setRGB(...T.lockedGlowRGB);
        }
        break;
      }

      // ── Burst: ball breaks apart, Pokémon escapes ──
      case "burst": {
        g.position.set(0, T.groundY, T.ballZ);
        g.rotation.x = 0;
        g.rotation.y = rotYRef.current;

        if (t < 0.3) {
          const shake = t / 0.3;
          const intensity = shake * 0.4;
          const freq = T.burstShakeFreq;
          g.rotation.z = Math.sin(t * Math.PI * freq) * intensity;
          g.scale.setScalar(T.groundScale * lerp(1, T.burstPeak, Math.sin(shake * Math.PI)));
        } else {
          const bt = (t - 0.3) / 0.7;
          const et = easeOut(bt);

          g.scale.setScalar(T.groundScale);
          g.rotation.z *= Math.pow(T.burstDecayAlpha, delta * 60);

          if (topRef.current) {
            topRef.current.position.set(0, et * 2.8, -et * 0.5);
            topRef.current.rotation.set(-et * 1.2, 0, et * 0.3);
          }
          if (bottomRef.current) {
            bottomRef.current.position.set(0, -et * 1.2, et * 0.3);
            bottomRef.current.rotation.set(Math.PI + et * 0.6, 0, -et * 0.2);
          }
          // Band flies to the left/right symmetrically (was always +X only)
          if (bandRef.current) {
            bandRef.current.position.set(et * 0.8 - 0.4, -et * 0.3, 0);
          }
          if (ringRef.current) {
            ringRef.current.position.set(-et * 0.4, et * 1.5, 1.0 + et * 2.0);
          }
          if (buttonRef.current) {
            buttonRef.current.position.set(et * 0.2, et * 1.8, 1.01 + et * 2.5);
          }
          if (buttonMatRef.current) {
            buttonMatRef.current.emissiveIntensity = (1 - bt) * 4;
            buttonMatRef.current.emissive.setRGB(...captureGlow);
          }
        }
        break;
      }

      default: break;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Top hemisphere group — contains hemisphere + any top markings */}
      <group ref={topRef}>
        <mesh>
          <primitive object={getHalfSphereGeo()} attach="geometry" />
          <meshStandardMaterial color={top} roughness={0.25} metalness={0.12} />
        </mesh>
        <BallMarkings ballType={ballType} palette={palette} />
      </group>

      {/* Bottom hemisphere */}
      <mesh ref={bottomRef} rotation={[Math.PI, 0, 0]}>
        <primitive object={getHalfSphereGeo()} attach="geometry" />
        <meshStandardMaterial color={bottom} roughness={0.25} metalness={0.08} />
      </mesh>

      {/* Equatorial band — per-type color override supported */}
      <mesh ref={bandRef}>
        <primitive object={getCylinderGeo()} attach="geometry" />
        <meshStandardMaterial color={bandColor} roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Button outer ring */}
      <mesh ref={ringRef} position={[0, 0, 1.0]}>
        <primitive object={getTorusGeo()} attach="geometry" />
        <meshStandardMaterial color={bandColor} roughness={0.4} />
      </mesh>

      {/* Button inner — emissive ref drives glow effects */}
      <mesh ref={buttonRef} position={[0, 0, 1.01]}>
        <primitive object={getButtonGeo()} attach="geometry" />
        <meshStandardMaterial
          ref={buttonMatRef}
          color={buttonColor}
          roughness={0.2}
          metalness={0.2}
          emissive="#ffffff"
          emissiveIntensity={0}
        />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * BallMarkings — renders the type-specific decorations on the top hemisphere.
 * These are pure geometry mounted as siblings inside the top group, so they
 * participate in the burst animation automatically at no extra cost.
 *
 * All positions are in the ball's local space (radius ≈ 1).
 * Z > 1 = in front of the surface (facing camera in encounter view).
 * ───────────────────────────────────────────────────────────────────────────*/
function BallMarkings({ ballType, palette }) {
  switch (ballType) {
    case "greatball":
      return <GreatBallMarkings palette={palette} />;
    case "ultraball":
      return <UltraBallMarkings palette={palette} />;
    case "masterball":
      return <MasterBallMarkings palette={palette} />;
    default:
      return null;
  }
}

/**
 * Great Ball — two red circular swoosh-spots on the blue top half.
 * Placed at ±45° around the equator, slightly inset below the top to mimic
 * the swoosh arcs seen on the official design.
 */
function GreatBallMarkings({ palette }) {
  const color = palette.marking ?? "#e8302a";
  return (
    <>
      {/* Left swirl disc — sits on the surface at ~40° from forward, 30° down */}
      <mesh position={[-0.6, 0.35, 0.72]} rotation={[0.5, -0.55, 0.1]}>
        <primitive object={getMarkDiscGeo()} attach="geometry" />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} />
      </mesh>
      {/* Right swirl disc — mirror */}
      <mesh position={[0.6, 0.35, 0.72]} rotation={[0.5, 0.55, -0.1]}>
        <primitive object={getMarkDiscGeo()} attach="geometry" />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} />
      </mesh>
    </>
  );
}

/**
 * Ultra Ball — two prominent yellow angled stripes crossing the dark top half.
 * Implemented as thin cylinders (same radius as the equatorial band) rotated
 * so they cross the top hemisphere as diagonal highlights.
 */
function UltraBallMarkings({ palette }) {
  const color = palette.marking ?? "#f9c846";
  return (
    <>
      {/* Left stripe — tilted left */}
      <mesh rotation={[0, 0, 0.52]}>
        <primitive object={getStripeGeo()} attach="geometry" />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
      </mesh>
      {/* Right stripe — tilted right (symmetric V shape) */}
      <mesh rotation={[0, 0, -0.52]}>
        <primitive object={getStripeGeo()} attach="geometry" />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
      </mesh>
    </>
  );
}

/**
 * Master Ball — an M-shaped marking on the purple top half, plus two accent dots.
 * Approximated with two overlapping torus arcs (forming the M legs) and two
 * small sphere dots above the equator.
 */
function MasterBallMarkings({ palette }) {
  const gold = palette.marking    ?? "#f5d800";
  const red  = palette.markingAlt ?? "#ff3366";
  return (
    <>
      {/* Outer M arc (larger, gold) */}
      <mesh position={[0, 0.1, 0.96]} rotation={[0, 0, Math.PI]}>
        <primitive object={getMArcGeo()} attach="geometry" />
        <meshStandardMaterial color={gold} roughness={0.25} metalness={0.3} />
      </mesh>
      {/* Inner M arc (smaller, sits inside outer arc) */}
      <mesh position={[0, -0.08, 0.97]} rotation={[0, 0, 0]}>
        <primitive object={getMArcSmallGeo()} attach="geometry" />
        <meshStandardMaterial color={gold} roughness={0.25} metalness={0.3} />
      </mesh>
      {/* Left accent dot */}
      <mesh position={[-0.55, 0.55, 0.65]}>
        <primitive object={getDotGeo()} attach="geometry" />
        <meshStandardMaterial color={red} roughness={0.3} />
      </mesh>
      {/* Right accent dot */}
      <mesh position={[0.55, 0.55, 0.65]}>
        <primitive object={getDotGeo()} attach="geometry" />
        <meshStandardMaterial color={red} roughness={0.3} />
      </mesh>
    </>
  );
}
