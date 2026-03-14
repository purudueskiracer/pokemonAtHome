/**
 * TrainerDesignerScreen
 *
 * Full-screen overlay that lets the player customise their trainer's colours.
 * Live 3D preview (isolated Canvas) + colour-swatch pickers for each body part.
 * Changes are saved immediately to the Zustand store (persisted).
 */
import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useGameStore } from "../store/gameStore";
import PlayerAvatar from "../game/components/PlayerAvatar";
import { TRAINER_PALETTE } from "../config/GameConfig";
import "./TrainerDesignerScreen.css";

const PARTS = [
  { key: "skin",  label: "Skin"   },
  { key: "shirt", label: "Shirt"  },
  { key: "pants", label: "Pants"  },
  { key: "hat",   label: "Hat"    },
  { key: "shoes", label: "Shoes"  },
];

export default function TrainerDesignerScreen({ onClose }) {
  const trainerColors    = useGameStore((s) => s.profile.trainerColors);
  const setTrainerColors = useGameStore((s) => s.setTrainerColors);

  // Local draft so the user can cancel
  const [draft, setDraft] = useState({ ...trainerColors });
  const [activePart, setActivePart] = useState("shirt");

  const handleSwatch = (part, hex) => {
    const next = { ...draft, [part]: hex };
    setDraft(next);
    setTrainerColors(next); // live preview persists immediately
  };

  return (
    <div className="trainer-designer-overlay">
      <div className="trainer-designer-panel">
        {/* Header */}
        <div className="td-header">
          <span className="td-title">Design Trainer</span>
          <button className="td-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* 3D Preview */}
        <div className="td-preview">
          <Canvas
            camera={{ position: [0, 1.1, 3.5], fov: 45 }}
            gl={{ antialias: true }}
            style={{ width: "100%", height: "100%" }}
          >
            <ambientLight intensity={1.4} />
            <directionalLight position={[3, 5, 2]} intensity={1.0} />
            <Suspense fallback={null}>
              <group position={[0, -0.9, 0]}>
                <PlayerAvatar walking={false} colors={draft} />
              </group>
            </Suspense>
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.8}
              target={[0, 0.3, 0]}
            />
          </Canvas>
        </div>

        {/* Part selector tabs */}
        <div className="td-parts">
          {PARTS.map(({ key, label }) => (
            <button
              key={key}
              className={`td-part-btn${activePart === key ? " active" : ""}`}
              onClick={() => setActivePart(key)}
              style={{ borderBottomColor: activePart === key ? draft[key] : "transparent" }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Colour swatches for the active part */}
        <div className="td-swatches">
          {TRAINER_PALETTE[activePart].map((hex) => (
            <button
              key={hex}
              className={`td-swatch${draft[activePart] === hex ? " selected" : ""}`}
              style={{ background: hex }}
              onClick={() => handleSwatch(activePart, hex)}
              aria-label={hex}
            />
          ))}
        </div>

        {/* Done button */}
        <button className="td-done-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
