import React, { useState, useCallback, useEffect, useRef } from "react";
import "./BottomNav.css";

const ALL_TABS = [
  { id: "game",    icon: "🌍", label: "Explore"  },
  { id: "pokedex", icon: "📖", label: "Pokédex"  },
  { id: "mart",    icon: "🏪", label: "Mart"     },
  { id: "cards",   icon: "🃏", label: "Cards"    },
  { id: "profile", icon: "👤", label: "Profile"  },
  // Admin tab only available in dev builds — never ship to children.
  ...(import.meta.env.DEV ? [{ id: "admin", icon: "🔧", label: "Admin" }] : []),
];

export default function BottomNav({ activeTab, onTabChange, badges = {} }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  const pick = useCallback(
    (id) => {
      onTabChange(id);
      setOpen(false);
    },
    [onTabChange]
  );

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [open]);

  const activeIcon = ALL_TABS.find((t) => t.id === activeTab)?.icon ?? "☰";
  const totalBadges = Object.values(badges).reduce((sum, v) => sum + (v ?? 0), 0);

  return (
    <div className={`fab-menu${open ? " open" : ""}`} ref={menuRef}>
      {/* Expanded items — rendered in reverse so the first item is closest to the FAB */}
      <div className="fab-items">
        {ALL_TABS.filter((t) => t.id !== activeTab).map((tab) => (
          <button
            key={tab.id}
            className="fab-item"
            onClick={() => pick(tab.id)}
          >
            <span className="fab-item-icon">
              {tab.icon}
              {(badges[tab.id] ?? 0) > 0 && (
                <span className="fab-badge">{badges[tab.id]}</span>
              )}
            </span>
            <span className="fab-item-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* FAB toggle */}
      <button className="fab-toggle" onClick={toggle} aria-label="Menu">
        <span className={`fab-icon${open ? " open" : ""}`}>{open ? "✕" : activeIcon}</span>
        {!open && totalBadges > 0 && <span className="fab-toggle-badge" aria-label={`${totalBadges} notifications`} />}
      </button>
    </div>
  );
}
