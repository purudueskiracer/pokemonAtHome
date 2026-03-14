import { useState } from "react";
import { useGameStore } from "./store/gameStore";
import ErrorBoundary from "./components/ErrorBoundary";
import SetupScreen from "./screens/SetupScreen";
import GameScreen from "./screens/GameScreen";
import PokedexScreen from "./screens/PokedexScreen";
import MartScreen from "./screens/MartScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AdminScreen from "./screens/AdminScreen";
import CardsScreen from "./screens/CardsScreen";
import BottomNav from "./components/BottomNav";
import { useCatchRewards } from "./hooks/useCatchRewards";
import { usePendingCardCount } from "./hooks/useCards";
import "./App.css";

function App() {
  const isSetup = useGameStore((s) => s.isSetup);
  const [activeTab, setActiveTab] = useState("game");

  // Must be called unconditionally (Rules of Hooks) — runs even before setup
  useCatchRewards();
  const pendingCardCount = usePendingCardCount();

  if (!isSetup) return <SetupScreen />;

  return (
    <ErrorBoundary>
      <div className="app-root">
        {activeTab === "game"    && <GameScreen />}
        {activeTab === "pokedex" && <PokedexScreen />}
        {activeTab === "mart"    && <MartScreen />}
        {activeTab === "profile" && <ProfileScreen />}
        {activeTab === "admin"   && <AdminScreen />}
        {activeTab === "cards"   && <CardsScreen />}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          badges={{ cards: pendingCardCount }}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
