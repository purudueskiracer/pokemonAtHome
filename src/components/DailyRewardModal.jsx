import { useGameStore } from "../store/gameStore";
import "./DailyRewardModal.css";

export default function DailyRewardModal({ reward, streak, onClose }) {
  const ballLabels = [
    reward.pokeball  > 0 && `⚪ ×${reward.pokeball} Pokéballs`,
    reward.greatball > 0 && `🔵 ×${reward.greatball} Great Balls`,
    reward.ultraball > 0 && `🟡 ×${reward.ultraball} Ultra Ball`,
  ].filter(Boolean);

  const isStreakDay = streak % 7 === 0;

  return (
    <div className="reward-overlay">
      <div className="reward-modal">
        <div className="reward-stars">⭐ ⭐ ⭐</div>

        <h2 className="reward-title">
          {isStreakDay ? "🎉 7-Day Streak!" : "Daily Reward!"}
        </h2>

        <p className="reward-streak">
          Day <strong>{streak}</strong> streak
          {streak >= 3 && " 🔥"}
        </p>

        <div className="reward-items">
          {ballLabels.map((label, i) => (
            <div key={i} className="reward-item">{label}</div>
          ))}
        </div>

        {isStreakDay && (
          <p className="streak-bonus-msg">
            Keep it up for another 7 days for an even bigger reward!
          </p>
        )}

        <button className="reward-btn" onClick={onClose}>
          Let's Go! 🚀
        </button>
      </div>
    </div>
  );
}
