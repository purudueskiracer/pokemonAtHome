import React, { Suspense, useMemo, useCallback, useRef, useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { makeNoise } from "./terrain";
import { WORLD } from "../config/GameConfig";
import ChunkManager from "./components/ChunkManager";
import PlayerController from "./components/PlayerController";
import WaterPlane from "./components/WaterPlane";
import DPad from "./components/DPad";

// ─── Camera zoom driver ────────────────────────────────────────────────────────
// Lives inside the Canvas so it has access to useThree; imperatively updates
// camera.zoom so we don't have to remount the whole camera object.
function CameraZoom({ zoom }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }, [camera, zoom]);
  return null;
}

// ─── Context menu styles ───────────────────────────────────────────────────────
const FAB_BTN = {
  width: 48, height: 48,
  borderRadius: 14,
  background: "rgba(0,0,0,0.60)",
  border: "2px solid rgba(255,255,255,0.30)",
  color: "#fff",
  fontSize: "1.5rem",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};
const MENU_PANEL = {
  position: "absolute", bottom: "calc(100% + 8px)", right: 0,
  background: "rgba(0,0,0,0.75)",
  border: "1px solid rgba(255,255,255,0.20)",
  borderRadius: 14,
  padding: "6px 0",
  display: "flex", flexDirection: "column",
  minWidth: 160,
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
};
const MENU_ITEM = {
  background: "none", border: "none",
  color: "#fff", fontSize: "0.95rem",
  padding: "10px 16px", textAlign: "left",
  cursor: "pointer", borderRadius: 8,
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};

export default function World3D({ worldId = "sunlit_meadow", encounterActive = false, onEncounter, onDesignTrainer }) {
  const noise2D        = useMemo(() => makeNoise(worldId), [worldId]);
  const targetRef      = useRef(new THREE.Vector2(0, 0));
  const spawnPointsRef = useRef([]);
  const playerPosRef   = useRef({ x: 0, y: 0.9, z: 0 });

  // ── Zoom state ──────────────────────────────────────────────────────────────
  const [zoom, setZoom]         = useState(WORLD.defaultZoom);
  const [menuOpen, setMenuOpen] = useState(false);
  const pinchRef                = useRef(null); // tracks initial pinch distance + zoom

  const clampZoom = useCallback((z) =>
    Math.min(WORLD.zoomMax, Math.max(WORLD.zoomMin, z)), []);

  const zoomIn    = useCallback(() => setZoom(z => clampZoom(z + WORLD.zoomStep)), [clampZoom]);
  const zoomOut   = useCallback(() => setZoom(z => clampZoom(z - WORLD.zoomStep)), [clampZoom]);
  const zoomReset = useCallback(() => setZoom(WORLD.defaultZoom), []);

  // ── Pinch-to-zoom touch handlers ────────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), zoom };
    }
  }, [zoom]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length !== 2 || !pinchRef.current) return;
    e.preventDefault(); // stop page scroll during pinch
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const newDist = Math.hypot(dx, dy);
    const scale   = newDist / pinchRef.current.dist;
    setZoom(clampZoom(pinchRef.current.zoom * scale));
  }, [clampZoom]);

  const handleTouchEnd = useCallback(() => {
    pinchRef.current = null;
  }, []);

  // ── Tap / encounter forwarding ──────────────────────────────────────────────
  const handleTap = useCallback((worldX, worldZ) => {
    targetRef.current.set(worldX, worldZ);
  }, []);

  const handleSpawnUpdate = useCallback((pts) => {
    spawnPointsRef.current = pts;
  }, []);

  const handleEncounter = useCallback((data) => {
    onEncounter?.(data);
  }, [onEncounter]);

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Canvas
        shadows={false}
        orthographic
        camera={{ zoom: WORLD.defaultZoom, position: [0, WORLD.camHeight, WORLD.camBack], near: 0.1, far: 1000 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Drives camera.zoom without remounting the camera */}
        <CameraZoom zoom={zoom} />

        <Sky sunPosition={[100, 80, -100]} turbidity={8} rayleigh={2} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[50, 80, -30]} intensity={1.4} />

        <WaterPlane playerRef={playerPosRef} />

        <Suspense fallback={null}>
          <ChunkManager
            noise2D={noise2D}
            onTap={handleTap}
            onSpawnUpdate={handleSpawnUpdate}
            playerPosRef={playerPosRef}
          />
          <PlayerController
            targetRef={targetRef}
            noise2D={noise2D}
            spawnPointsRef={spawnPointsRef}
            playerPosRef={playerPosRef}
            worldId={worldId}
            encounterActive={encounterActive}
            onEncounter={handleEncounter}
          />
        </Suspense>
      </Canvas>

      {/* DPad — bottom-left */}
      <DPad hidden={encounterActive} />

      {/* Context menu FAB — bottom-right, menu opens upward */}
      {!encounterActive && (
        <div style={{ position: "absolute", bottom: 80, right: 16, zIndex: 110 }}>
          {menuOpen && (
            <div style={MENU_PANEL}>
              <button style={MENU_ITEM} onClick={() => { zoomIn();    setMenuOpen(false); }}>
                🔍&nbsp; Zoom In
              </button>
              <button style={MENU_ITEM} onClick={() => { zoomOut();   setMenuOpen(false); }}>
                🔭&nbsp; Zoom Out
              </button>
              <button style={MENU_ITEM} onClick={() => { zoomReset(); setMenuOpen(false); }}>
                ↺&nbsp; Reset Zoom
              </button>
              <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.15)", margin: "4px 8px" }} />
              <button style={MENU_ITEM} onClick={() => { onDesignTrainer?.(); setMenuOpen(false); }}>
                👕&nbsp; Design Trainer
              </button>
            </div>
          )}
          <button
            style={FAB_BTN}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Map options"
          >
            ⚙️
          </button>
        </div>
      )}
    </div>
  );
}

