/**
 * PokemonDetailModal — immersive full-screen 3D Pokémon viewer.
 *
 * The 3D canvas fills the entire viewport. Stats float as a translucent
 * overlay panel that slides up from the bottom and can be hidden so kids
 * can view the Pokémon as large as they want.
 *
 * Interactions:
 *   - Drag to rotate (touch & mouse)
 *   - Pinch to zoom (touch)
 *   - Scroll wheel to zoom (mouse)
 */

import React, { Suspense, useState, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Pokemon3D from "../game/components/Pokemon3D";
import "./PokemonDetailModal.css";

const TYPE_COLORS = {
  electric: "#f4d03f", normal: "#aab0a0", flying: "#90caf9", grass: "#66bb6a",
  bug: "#aed581", fairy: "#f48fb1", fire: "#ff7043", water: "#42a5f5",
  rock: "#bcaaa4", ghost: "#ab47bc", dark: "#78909c", psychic: "#ec407a",
  ice: "#80deea", dragon: "#7e57c2", steel: "#b0bec5", poison: "#ce93d8",
  ground: "#ffcc80", fighting: "#ef9a9a",
};

/** IV bar (0-15) rendered as a colored progress bar */
function IVBar({ label, value, max = 15 }) {
  const pct = (value / max) * 100;
  const color = pct >= 93 ? "#ff8a65" : pct >= 66 ? "#ffd54f" : pct >= 33 ? "#81c784" : "#90a4ae";
  return (
    <div className="detail-iv-row">
      <span className="detail-iv-label">{label}</span>
      <div className="detail-iv-bar-track">
        <div className="detail-iv-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="detail-iv-value">{value}</span>
    </div>
  );
}

/** Zoom step factor for +/- buttons (1.2 = 20% per click). */
const ZOOM_STEP = 1.2;

export default function PokemonDetailModal({ mon, starString, getStarRating, onClose }) {
  const [showStats, setShowStats] = useState(false);
  const controlsRef = useRef();

  const handleZoom = useCallback((direction) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    // OrbitControls exposes the camera's distance via its object
    const cam = ctrl.object;
    const target = ctrl.target;
    const dir = cam.position.clone().sub(target).normalize();
    const dist = cam.position.distanceTo(target);
    const newDist = Math.max(
      ctrl.minDistance,
      Math.min(ctrl.maxDistance, dist * (direction === "in" ? 1 / ZOOM_STEP : ZOOM_STEP))
    );
    cam.position.copy(target).addScaledVector(dir, newDist);
    cam.updateProjectionMatrix();
  }, []);

  if (!mon) return null;

  const displayName = mon.name.charAt(0).toUpperCase() + mon.name.slice(1);
  const ivs = mon.ivs ?? { attack: 0, defense: 0, stamina: 0 };
  const stars = mon.stars ?? (mon.ivs ? getStarRating(mon.ivs) : 0);
  const typeColor = TYPE_COLORS[mon.type] ?? "#aaa";
  const variant = mon.variant ?? "regular";

  return (
    <div className="detail-fullscreen">
      {/* 3D canvas — fills entire screen */}
      <div className="detail-canvas-fill">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ antialias: true }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#0a0a14"]} />
          <ambientLight intensity={1.6} />
          <directionalLight position={[3, 5, 4]} intensity={1.2} />
          <directionalLight position={[-3, -2, 2]} intensity={0.4} color="#aaddff" />
          <Suspense fallback={<mesh><sphereGeometry args={[0.5, 8, 8]} /><meshLambertMaterial color="#e94560" /></mesh>}>
            <Pokemon3D
              pokemonId={mon.pokemonId}
              variant={variant}
              scale={1.5}
              autoFit
              animState="idle"
            />
          </Suspense>
          <OrbitControls
            ref={controlsRef}
            enableZoom
            enablePan={false}
            minDistance={2}
            maxDistance={12}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI * 5 / 6}
            rotateSpeed={0.8}
            zoomSpeed={0.8}
            dampingFactor={0.1}
            enableDamping
          />
        </Canvas>
      </div>

      {/* Top bar — name + close button */}
      <div className="detail-topbar">
        <div className="detail-topbar-info">
          <span className="detail-name">{displayName}</span>
          <span className="detail-id">#{String(mon.pokemonId).padStart(3, "0")}</span>
          {mon.isShiny && <span className="detail-badge shiny">✨</span>}
          {variant === "alolan" && <span className="detail-badge alolan">A</span>}
          {variant === "galar" && <span className="detail-badge galar">G</span>}
          {variant === "hisuian" && <span className="detail-badge hisuian">H</span>}
          {(variant === "mega" || variant === "megaShiny") && <span className="detail-badge mega">M</span>}
        </div>
        <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>
      </div>

      {/* Interaction hint */}
      <div className="detail-hint">Drag to rotate · Pinch to zoom</div>

      {/* Zoom +/- buttons — right edge */}
      <div className="detail-zoom-controls">
        <button className="detail-zoom-btn" onClick={() => handleZoom("in")} aria-label="Zoom in">＋</button>
        <button className="detail-zoom-btn" onClick={() => handleZoom("out")} aria-label="Zoom out">＿</button>
      </div>

      {/* Stats toggle button — bottom center */}
      <button
        className={`detail-toggle-stats${showStats ? " open" : ""}`}
        onClick={() => setShowStats((s) => !s)}
      >
        {showStats ? "Hide Stats ▼" : "Show Stats ▲"}
      </button>

      {/* Floating stats panel — slides up from bottom */}
      <div className={`detail-stats-panel${showStats ? " visible" : ""}`}>
        {/* Type + rarity */}
        <div className="detail-meta">
          <span className="detail-type" style={{ background: typeColor, color: "#111" }}>{mon.type}</span>
          <span className={`detail-rarity rarity-${mon.rarity}`}>{mon.rarity}</span>
        </div>

        {/* Star rating */}
        <div className={`detail-stars stars-${stars}`}>{starString(stars)}</div>

        {/* IVs */}
        <div className="detail-ivs">
          <IVBar label="ATK" value={ivs.attack} />
          <IVBar label="DEF" value={ivs.defense} />
          <IVBar label="STA" value={ivs.stamina} />
        </div>

        {/* Caught date */}
        {mon.caughtAt && (
          <div className="detail-caught-date">
            Caught {new Date(mon.caughtAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
