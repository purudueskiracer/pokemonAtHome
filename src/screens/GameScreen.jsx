import { useState, useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import World3D from "../game/World3D";
import EncounterModal from "../components/EncounterModal";
import DailyRewardModal from "../components/DailyRewardModal";
import HUD from "../components/HUD";
import TrainerDesignerScreen from "./TrainerDesignerScreen";
import "./GameScreen.css";

export default function GameScreen() {
  const profile = useGameStore((s) => s.profile);
  const claimDailyReward = useGameStore((s) => s.claimDailyReward);
  const [encounter, setEncounter] = useState(null);
  const encounterCount = useRef(0);
  const [dailyReward, setDailyReward] = useState(null);
  const [designerOpen, setDesignerOpen] = useState(false);

  // Show daily reward once per session on first mount
  useEffect(() => {
    const result = claimDailyReward();
    if (result) setDailyReward(result);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="game-screen">
      {/* 3D world fills the screen */}
      <div className="canvas-wrapper">
        <HUD />
        <World3D
          worldId={profile.currentWorld}
          encounterActive={!!encounter}
          onEncounter={(data) => { encounterCount.current += 1; setEncounter(data); }}
          onDesignTrainer={() => setDesignerOpen(true)}
        />
      </div>

      {dailyReward && !encounter && (
        <DailyRewardModal
          reward={dailyReward.reward}
          streak={dailyReward.streak}
          onClose={() => setDailyReward(null)}
        />
      )}

      {encounter && (
        <EncounterModal
          key={encounterCount.current}
          encounter={encounter}
          onClose={() => setEncounter(null)}
        />
      )}

      {designerOpen && (
        <TrainerDesignerScreen onClose={() => setDesignerOpen(false)} />
      )}
    </div>
  );
}
