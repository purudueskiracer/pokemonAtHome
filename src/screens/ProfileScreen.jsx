import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { xpForLevel } from "../services/XPService";
import "./ProfileScreen.css";

const SUBJECTS = [
  { key: "reading", label: "Reading", icon: "📖" },
  { key: "math",    label: "Math",    icon: "🔢" },
];
const GRADE_RANGE = [1, 2, 3, 4, 5];

export default function ProfileScreen() {
  const profile = useGameStore((s) => s.profile);
  const resetProfile = useGameStore((s) => s.resetProfile);
  const setSubjectGrade = useGameStore((s) => s.setSubjectGrade);
  const [pendingReset, setPendingReset] = useState(false);

  if (!profile) return null;

  const needed = xpForLevel(profile.level);
  const current = profile.xp;
  const level = profile.level;
  const pct = Math.min(100, Math.round((current / needed) * 100));
  const totalCaught = Object.values(profile.pokedex ?? {}).filter((p) => p.caught).length;
  const rank = profile.trainerRank || "Youngster";
  const streak = profile.loginStreak || 0;

  function handleReset() {
    setPendingReset(true);
  }

  function confirmReset() {
    resetProfile();
    setPendingReset(false);
  }

  function cancelReset() {
    setPendingReset(false);
  }

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <span className="profile-avatar">{profile.avatar}</span>
        <div>
          <h2 className="profile-name">{profile.name}</h2>
          <p className="profile-rank">{rank}</p>
        </div>
      </div>

      {/* Level & XP */}
      <div className="profile-card">
        <p className="stat-label">Level {level}</p>
        <div className="xp-bar-wrap">
          <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="stat-sub">{current} / {needed} XP</p>
      </div>

      {/* Stats grid */}
      <div className="profile-stats">
        <div className="stat-box">
          <div className="stat-val">{totalCaught}</div>
          <div className="stat-key">Caught</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{profile.balls?.pokeball ?? 0}</div>
          <div className="stat-key">⚪ Balls</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{profile.balls?.greatball ?? 0}</div>
          <div className="stat-key">🔵 Great</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{profile.balls?.ultraball ?? 0}</div>
          <div className="stat-key">🟡 Ultra</div>
        </div>
      </div>

      {/* Unlocked worlds */}
      <div className="profile-card">
        <p className="stat-label">Unlocked Areas</p>
        <ul className="world-list">
          {(profile.worldsUnlocked || []).map((w) => (
            <li key={w}>🌍 {w.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</li>
          ))}
        </ul>
      </div>

      {/* Streak */}
      <div className="profile-card">
        <p className="stat-label">Daily Streak</p>
        <p className="streak-count">
          {streak >= 3 ? "🔥" : "📅"} {streak} day{streak !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Grade level settings */}
      <div className="profile-card">
        <p className="stat-label">Grade Level</p>
        {SUBJECTS.map(({ key, label, icon }) => {
          const current = profile.subjects?.[key]?.grade ?? 1;
          return (
            <div key={key} className="grade-row">
              <span className="grade-subject">{icon} {label}</span>
              <div className="grade-pills">
                {GRADE_RANGE.map((g) => (
                  <button
                    key={g}
                    className={`grade-pill${g === current ? " active" : ""}`}
                    onClick={() => setSubjectGrade(key, g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button className="reset-btn" onClick={handleReset}>
        🗑 Reset Progress
      </button>

      {/* State-driven confirmation modal (no window.confirm) */}
      {pendingReset && (
        <div className="confirm-overlay" onClick={cancelReset}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-msg">Reset all progress? This cannot be undone.</p>
            <div className="confirm-actions">
              <button className="confirm-yes" onClick={confirmReset}>Confirm</button>
              <button className="confirm-no" onClick={cancelReset}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
