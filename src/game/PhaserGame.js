import Phaser from "phaser";
import { WorldScene } from "./scenes/WorldScene";

export function createPhaserGame(containerId, worldId = "sunlit_meadow") {
  const config = {
    type: Phaser.AUTO,
    parent: containerId,
    width: 800,
    height: 500,
    backgroundColor: "#5aad3c",
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 0 }, debug: false },
    },
    scene: [WorldScene],
  };

  const game = new Phaser.Game(config);

  // Start the world scene with the correct worldId
  game.events.once("ready", () => {
    game.scene.start("WorldScene", { worldId });
  });

  return game;
}
