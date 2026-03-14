import { useMart, usePurchaseFlow } from "../hooks/useMart";
import QuestionRenderer from "../components/QuestionRenderer";
import "./MartScreen.css";

/** Pure view — quiz sub-flow for purchasing a mart item */
function MartPurchase({ item, profile, onComplete, onCancel }) {
  const vm = usePurchaseFlow({ item, profile, onComplete });

  return (
    <div className="mart-purchase">
      <div className="purchase-header">
        <span className="purchase-icon">{item.icon}</span>
        <div>
          <div className="purchase-label">{item.label}</div>
          <div className="purchase-desc">{item.description}</div>
        </div>
        <button className="purchase-cancel" onClick={onCancel}>✕</button>
      </div>

      <div className="purchase-progress-wrap">
        <div className="purchase-progress-fill" style={{ width: `${vm.progress}%` }} />
      </div>
      <p className="purchase-counter">
        {vm.answered} / {item.questionCount} correct answers needed
      </p>

      {vm.currentQ && (
        <QuestionRenderer
          question={vm.currentQ}
          selectedAnswer={vm.selected}
          onAnswer={vm.handleAnswer}
        />
      )}
    </div>
  );
}

/** Pure view — Mart screen driven by useMart hook */
export default function MartScreen() {
  const vm = useMart();

  return (
    <div className="mart-screen">
      <div className="mart-header">
        <h2>🏪 Poké Mart</h2>
        <p className="mart-subtitle">Answer questions to earn Pokéballs!</p>
      </div>

      <div className="mart-inventory">
        <div className="inventory-label">Your Bag:</div>
        <div className="inventory-balls">
          <span>⚪ ×{vm.ballCounts.pokeball}</span>
          <span>🔵 ×{vm.ballCounts.greatball}</span>
          <span>🟡 ×{vm.ballCounts.ultraball}</span>
        </div>
      </div>

      {vm.lastPurchased && (
        <div className="purchase-success">
          ✅ Got {vm.lastPurchased.description}!
        </div>
      )}

      {vm.buying ? (
        <MartPurchase
          item={vm.buying}
          profile={vm.profile}
          onComplete={vm.handleComplete}
          onCancel={vm.handleCancel}
        />
      ) : (
        <div className="mart-shelves">
          {vm.items.map((item) => {
            const atLimit = vm.isAtLimit(item);
            const bagFull = vm.isBagFull(item);
            const todayCount = vm.purchasedToday[item.id] ?? 0;

            return (
              <div key={item.id} className={`mart-item ${atLimit || bagFull ? "disabled" : ""}`}>
                <div className="mart-item-icon">{item.icon}</div>
                <div className="mart-item-info">
                  <div className="mart-item-label">{item.label}</div>
                  <div className="mart-item-desc">{item.description}</div>
                  <div className="mart-item-cost">
                    Answer {item.questionCount} question{item.questionCount > 1 ? "s" : ""} correctly
                    {item.dailyLimit && (
                      <span className="daily-limit">
                        {" "}· {todayCount}/{item.dailyLimit} today
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="mart-buy-btn"
                  onClick={() => vm.handleBuy(item)}
                  disabled={atLimit || bagFull}
                >
                  {atLimit ? "Limit" : bagFull ? "Full" : "Buy"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
