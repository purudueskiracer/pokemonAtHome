import { useGameStore } from "../store/gameStore";
import { xpForLevel } from "../services/XPService";
import "./HUD.css";

export default function HUD() {
  const profile = useGameStore((s) => s.profile);
  const current = profile.xp;
  const needed = xpForLevel(profile.level);
  const percent = Math.floor((current / needed) * 100);

  return (
    <div className="hud">
      <div className="hud-left">
        <span className="hud-trainer">{profile.name}</span>
        <span className="hud-rank">{profile.trainerRank}</span>
        <div className="hud-xp-bar-wrap">
          <div className="hud-xp-bar" style={{ width: `${percent}%` }} />
        </div>
        <span className="hud-level">Lv.{profile.level} · {current}/{needed} XP</span>
      </div>

      <div className="hud-right">
        <span className="ball-count">⚪ ×{profile.balls?.pokeball ?? 0}</span>
        <span className="ball-count">🔵 ×{profile.balls?.greatball ?? 0}</span>
        <span className="ball-count">🟡 ×{profile.balls?.ultraball ?? 0}</span>
      </div>
    </div>
  );
}
