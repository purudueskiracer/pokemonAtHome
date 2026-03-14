import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { useEncounter } from "../hooks/useEncounter";
import { BALL_EMOJI } from "../hooks/useBallSelection";
import Pokemon3D from "../game/components/Pokemon3D";
import Pokeball3D from "../game/components/Pokeball3D";
import QuestionRenderer from "./QuestionRenderer";
import { EventBus, EVENTS } from '../game/EventBus';
import "./EncounterModal.css";

/** Falls back to a red sphere if the GLB fails to fetch/parse */
class ModelBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return (
        <mesh>
          <sphereGeometry args={[0.7, 16, 16]} />
          <meshLambertMaterial color="#e94560" />
        </mesh>
      );
    }
    return this.props.children;
  }
}

function EncounterCameraRig({ tick }) {
  useFrame(({ camera }, delta) => {
    const { stage, t } = tick();

    let targetX = 0;
    let targetY = 1.0;
    let targetZ = 9.0;
    let lookY = 0;

    if (stage === "capturing") {
      const focus = t < 0.4 ? t / 0.4 : 1;
      targetY = 1.0 - 0.08 * focus;
      targetZ = 9.0 - 0.8 * focus;
      lookY = -0.1 * focus;
    } else if (stage === "wobbling") {
      const beat = Math.abs(Math.sin(t * Math.PI * 6));
      targetY = 0.93;
      targetZ = 8.28 + beat * 0.08;
      lookY = -0.12;
    } else if (stage === "locked") {
      const settle = Math.sin(t * Math.PI) * 0.06;
      targetY = 0.92;
      targetZ = 8.2 - settle;
      lookY = -0.12;
    } else if (stage === "burst") {
      const shakeWindow = Math.max(0, 1 - t / 0.38);
      targetX = Math.sin(t * Math.PI * 34) * 0.18 * shakeWindow;
      targetY = 0.95 + Math.sin(t * Math.PI * 22) * 0.04 * shakeWindow;
      targetZ = 8.55 + Math.sin(t * Math.PI) * 0.12 * shakeWindow;
      lookY = -0.08;
    }

    const alpha = 1 - Math.pow(0.82, delta * 60);
    camera.position.x = camera.position.x + (targetX - camera.position.x) * alpha;
    camera.position.y = camera.position.y + (targetY - camera.position.y) * alpha;
    camera.position.z = camera.position.z + (targetZ - camera.position.z) * alpha;
    camera.lookAt(0, lookY, 0);
  });

  return null;
}

export default function EncounterModal({ encounter, onClose }) {
  const vm = useEncounter(encounter, onClose);

  // ── Card earned micro-moment ─────────────────────────────────────────────
  const [showCardFloat, setShowCardFloat] = useState(false);
  const cardFloatTimerRef = useRef(null);

  useEffect(() => {
    const handleCardEarned = () => {
      setShowCardFloat(true);
      cardFloatTimerRef.current = setTimeout(() => setShowCardFloat(false), 1500);
    };
    EventBus.on(EVENTS.CARD_EARNED, handleCardEarned);
    return () => {
      EventBus.off(EVENTS.CARD_EARNED, handleCardEarned);
      if (cardFloatTimerRef.current) clearTimeout(cardFloatTimerRef.current);
    };
  }, []);
  const isQuestion = vm.phase === "question";
  const is3D = !isQuestion; // encounter, throwing, or result

  const p = vm.typePalette;
  // Sky-only gradient — the 3D ground plane handles the bottom half
  const bgStyle = {
    background: `linear-gradient(to bottom, ${p.skyZenith ?? '#103880'} 0%, ${p.skyHorizon ?? '#4890c8'} 100%)`,
  };

  return (
    <div className="encounter-screen" style={bgStyle}>
      {/* ── Question overlay (full-screen, sits ABOVE the 3D scene) ── */}
      {isQuestion && (
        <div
          className="question-phase-overlay"
          style={{ '--bg1': vm.typePalette.skyHorizon, '--bg2': vm.typePalette.skyZenith }}
        >
          {/* Header */}
          <div className="question-header">
            <div className="question-header-left">
              <span className="encounter-title">
                A wild <strong>{vm.displayName}</strong> appeared!
              </span>
              {vm.isShiny && <span className="shiny-badge">✨</span>}
              <span className={`rarity-badge rarity-${vm.pokemon.rarity}`}>{vm.pokemon.rarity}</span>
              {(vm.variant === "mega" || vm.variant === "megaShiny") && <span className="mega-badge">MEGA</span>}
              {vm.variant === "alolan" && <span className="region-badge alolan">Alolan</span>}
              {vm.variant === "galar" && <span className="region-badge galar">Galarian</span>}
              {vm.variant === "hisuian" && <span className="region-badge hisuian">Hisuian</span>}
            </div>
            <button className="flee-btn" onClick={vm.handleFlee}>
              <span className="flee-label">Run Away</span> 🏃
            </button>
          </div>

          {/* Question body */}
          {vm.question && (
            <div className="question-body">
              <QuestionRenderer
                question={vm.question}
                selectedAnswer={vm.selectedAnswer}
                onAnswer={vm.handleAnswer}
              />
              {!vm.hasBalls && <p className="no-balls-warning">⚠️ No Pokéballs left! Visit the Mart.</p>}
            </div>
          )}

          {/* Active ball pill */}
          <button className="active-ball-overlay" onClick={vm.cycleBall} title="Click to switch ball">
            <span className="active-ball-icon">{BALL_EMOJI[vm.selectedBall]}</span>
            <span className="active-ball-count">×{vm.ballCount}</span>
          </button>
        </div>
      )}

      {/* ── 3D scene (always mounted — never destroyed/recreated) ──── */}
      <div className={`encounter-canvas-section${isQuestion ? " offscreen" : ""}`}>
        {/* Header overlay */}
        {is3D && (
          <div className="encounter-pokemon-header">
            <span className="pokemon-name">
              Wild <strong>{vm.displayName}</strong>
              {vm.isShiny && <span className="shiny-badge" title="Shiny!">✨</span>}
            </span>
            <div className="header-right">
              <span className={`rarity-badge rarity-${vm.pokemon.rarity}`}>{vm.pokemon.rarity}</span>
              {(vm.variant === "mega" || vm.variant === "megaShiny") && <span className="mega-badge">MEGA</span>}
              {vm.variant === "alolan" && <span className="region-badge alolan">Alolan</span>}
              {vm.variant === "galar" && <span className="region-badge galar">Galarian</span>}
              {vm.variant === "hisuian" && <span className="region-badge hisuian">Hisuian</span>}
              {vm.phase === "encounter" && (
                <button className="flee-btn" onClick={vm.handleFlee}>
                  <span className="flee-label">Run Away</span> 🏃
                </button>
              )}
            </div>
          </div>
        )}

        {/* Single shared Canvas — Pokémon + Pokéball in one WebGL context */}
        <div className="pokemon-canvas-wrap">
          {/*
           * Non-AR Pokémon GO style:
           *  - CSS sky gradient shows through the transparent canvas top
           *  - 3D ground plane (y = -1.25, matching autoFit TARGET=2.5 center) fills bottom
           *  - Fog fades the far ground edge into skyHorizon, creating a natural horizon line
           *  - Camera at knee-height (y=1.0) looking at Pokémon center-of-mass
           */}
          <Canvas
            camera={{ position: [0, 1.0, 9], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
            onCreated={({ gl, camera }) => {
              gl.setClearColor(0x000000, 0);
              camera.lookAt(0, 0, 0);
            }}
            style={{ width: "100%", height: "100%" }}
          >
            {/* Fog fades ground into the sky horizon color — creates the horizon line */}
            <fog attach="fog" args={[p.skyHorizon ?? '#4890c8', 10, 32]} />

            {/* Ground plane — sits at Pokémon feet height (autoFit centers at origin, target=2.5) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.26, -5]}>
              <planeGeometry args={[60, 60]} />
              <meshLambertMaterial color={p.groundNear ?? '#48901a'} fogColor={p.skyHorizon} />
            </mesh>

            <EncounterCameraRig tick={vm.throwTick} />

            {/* Keep lighting simple and even — avoids heavy shadowing and reduces work. */}
            <ambientLight intensity={1.15} />
            <Suspense fallback={null}>
              <Environment preset="city" background={false} envMapIntensity={0.45} />
            </Suspense>
            <Suspense fallback={<mesh><sphereGeometry args={[0.6, 8, 8]} /><meshLambertMaterial color="#e94560" /></mesh>}>
              <ModelBoundary>
                <Pokemon3D pokemonId={vm.pokemon.pokemonId} variant={vm.variant} scale={1.0} autoFit animState={vm.animState} visible={!vm.pokemonHidden} />
              </ModelBoundary>
            </Suspense>
            {/* Pokéball lives in the same Canvas — self-manages visibility via tick() */}
            <Pokeball3D ballType={vm.selectedBall} tick={vm.throwTick} />
          </Canvas>
        </div>

        {/* Throw button */}
        {vm.phase === "encounter" && !vm.throwStage && (
          <button className="throw-ball-btn" onClick={vm.handleThrow} aria-label="Throw Pokéball">
            <span className="throw-ball-icon">{BALL_EMOJI[vm.selectedBall]}</span>
            <span className="throw-label">Throw!</span>
          </button>
        )}

        {/* Throwing status text */}
        {vm.phase === "throwing" && (
          <div className="throw-status">
            <p className="throw-status-text">
              {vm.throwStage === "tossing"   && "Throwing Pokéball..."}
              {vm.throwStage === "capturing" && "Pokémon is being pulled in!"}
              {vm.throwStage === "wobbling"  && "Shake... shake..."}
              {vm.throwStage === "locked"    && "⭐ Gotcha!"}
              {vm.throwStage === "burst"     && "Oh no! It broke free!"}
            </p>
          </div>
        )}

        {/* Active ball pill */}
        {vm.phase === "encounter" && (
          <button className="active-ball-overlay" onClick={vm.cycleBall} title="Click to switch ball">
            <span className="active-ball-icon">{BALL_EMOJI[vm.selectedBall]}</span>
            <span className="active-ball-count">×{vm.ballCount}</span>
          </button>
        )}
      </div>

      {/* Result overlay — appears over the 3D view */}
      {vm.phase === "result" && (
        <div className="result-overlay">
          <div className="result-card">
            {vm.catchResult === "caught" && (
              <>
                <p className="result-text caught">⭐ Gotcha! <strong>{vm.displayName}</strong> was caught!</p>
                {vm.isShiny && <p className="shiny-caught">✨ It's a Shiny! ✨</p>}
                {vm.catchDetails?.isNew && <p className="new-badge">🆕 New Pokémon!</p>}
                <div className="catch-stats">
                  <p className="star-rating">
                    <span className="stars">{vm.starString(vm.catchDetails?.stars ?? 0)}</span>
                  </p>
                  <div className="iv-bars">
                    <span className="iv-stat">ATK <strong>{vm.catchDetails?.ivs?.attack ?? 0}</strong></span>
                    <span className="iv-stat">DEF <strong>{vm.catchDetails?.ivs?.defense ?? 0}</strong></span>
                    <span className="iv-stat">STA <strong>{vm.catchDetails?.ivs?.stamina ?? 0}</strong></span>
                  </div>
                </div>
                <p className="xp-gained">+{vm.catchDetails?.xpGained ?? 0} XP</p>
                <p className="candy-gained">+{vm.catchDetails?.candyEarned ?? 0} 🍬 {vm.candySpeciesName} Candy</p>
                {vm.catchDetails?.didLevelUp && <p className="level-up">⬆️ Level Up! Now Level {vm.catchDetails.newLevel}!</p>}
              </>
            )}
            {vm.catchResult === "fled"         && <p className="result-text fled">💨 {vm.displayName} fled!</p>}
            {vm.catchResult === "failed_wrong" && <p className="result-text failed">❌ Wrong answer — {vm.displayName} got away!</p>}
            <button className="done-btn" onClick={vm.handleDone}>Continue</button>
          </div>
        </div>
      )}

      {/* Card earned float */}
      {showCardFloat && (
        <div className="card-earned-float" aria-hidden="true">
          🃏 +1
        </div>
      )}
    </div>
  );
}
