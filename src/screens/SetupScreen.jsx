import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import "./SetupScreen.css";

const AVATARS = ["🧒", "👧", "🧑", "👦"];

export default function SetupScreen() {
  const setupProfile = useGameStore((s) => s.setupProfile);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🧒");

  function handleStart() {
    if (!name.trim()) return;
    setupProfile(name.trim(), avatar);
  }

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1 className="setup-title">⚾ Akademia</h1>
        <p className="setup-subtitle">Your Pokémon learning adventure awaits!</p>

        <label className="setup-label">What's your name, Trainer?</label>
        <input
          className="setup-input"
          type="text"
          placeholder="Enter your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleStart()}
          maxLength={20}
          autoFocus
        />

        <label className="setup-label">Pick your trainer look:</label>
        <div className="avatar-grid">
          {AVATARS.map((a) => (
            <button
              key={a}
              className={`avatar-btn ${avatar === a ? "selected" : ""}`}
              onClick={() => setAvatar(a)}
            >
              {a}
            </button>
          ))}
        </div>

        <button
          className="start-btn"
          onClick={handleStart}
          disabled={!name.trim()}
        >
          Start Adventure!
        </button>
      </div>
    </div>
  );
}
