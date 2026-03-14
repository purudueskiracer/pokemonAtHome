import Phaser from "phaser";
import { EventBus, EVENTS } from "../EventBus";
import { getRandomEncounter } from "../../data/worlds";

export class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: "WorldScene" });
    this.player = null;
    this.cursors = null;
    this.grassLayer = null;
    this.encounterCooldown = 0;
    this.worldId = "sunlit_meadow";
    this.inEncounter = false;
  }

  init(data) {
    this.worldId = data?.worldId ?? "sunlit_meadow";
  }

  preload() {
    // Placeholder colored rectangle tileset until real tiles are added
    // In production, replace with: this.load.tilemapTiledJSON('map', '/maps/meadow.json')
    // and: this.load.image('tiles', '/tilesets/meadow.png')
  }

  create() {
    const { width, height } = this.scale;

    // --- Background (placeholder until Tiled maps added) ---
    this.add.rectangle(width / 2, height / 2, width, height, 0x5aad3c);

    // Draw simple grass patches as encounter zones (placeholder)
    this.grassZones = this.physics.add.staticGroup();

    const grassPositions = [
      { x: 100, y: 150 }, { x: 200, y: 200 }, { x: 350, y: 120 },
      { x: 450, y: 250 }, { x: 150, y: 350 }, { x: 500, y: 350 },
      { x: 600, y: 180 }, { x: 80, y: 280 }, { x: 700, y: 300 },
    ];

    grassPositions.forEach(({ x, y }) => {
      const rect = this.add.rectangle(x, y, 60, 60, 0x2d8a10, 0.7);
      const zone = this.grassZones.create(x, y, null);
      zone.setSize(60, 60);
      zone.refreshBody();
    });

    // --- Player sprite (colored rectangle placeholder) ---
    const playerGraphic = this.add.rectangle(0, 0, 24, 32, 0xff6b35);
    this.player = this.physics.add.existing(
      this.add.container(width / 2, height / 2, [playerGraphic])
    );
    this.player.body.setSize(24, 32);
    this.player.body.setCollideWorldBounds(true);

    // --- Input ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D");

    // --- Overlap: player ↔ grass → possible encounter ---
    this.physics.add.overlap(this.player, this.grassZones, this.onGrassStep, null, this);

    // --- Listen for React telling us to resume ---
    EventBus.on(EVENTS.ENCOUNTER_RESOLVED, this.onEncounterResolved.bind(this));
    EventBus.on(EVENTS.RESUME_WORLD, this.resumeWorld.bind(this));

    // Notify React that the world is ready
    EventBus.emit(EVENTS.WORLD_LOADED, { worldId: this.worldId });
  }

  update(time, delta) {
    if (this.inEncounter || !this.player) return;

    const speed = 160;
    const body = this.player.body;
    body.setVelocity(0);

    const left  = this.cursors.left.isDown  || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up    = this.cursors.up.isDown    || this.wasd.W.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.S.isDown;

    if (left)  body.setVelocityX(-speed);
    if (right) body.setVelocityX(speed);
    if (up)    body.setVelocityY(-speed);
    if (down)  body.setVelocityY(speed);

    // Cooldown tick
    if (this.encounterCooldown > 0) this.encounterCooldown -= delta;
  }

  onGrassStep() {
    if (this.inEncounter || this.encounterCooldown > 0) return;

    // ~20% chance per overlap tick (controlled by cooldown)
    if (Math.random() > 0.02) return;

    const pokemon = getRandomEncounter(this.worldId);
    if (!pokemon) return;

    this.inEncounter = true;
    this.encounterCooldown = 3000; // 3 second cooldown after encounter resolves

    // Pause player movement
    this.player.body.setVelocity(0);

    // Tell React to show the encounter UI
    EventBus.emit(EVENTS.WILD_ENCOUNTER, { pokemon, worldId: this.worldId });
  }

  onEncounterResolved() {
    this.inEncounter = false;
  }

  resumeWorld() {
    this.inEncounter = false;
  }

  shutdown() {
    EventBus.off(EVENTS.ENCOUNTER_RESOLVED, this.onEncounterResolved.bind(this));
    EventBus.off(EVENTS.RESUME_WORLD, this.resumeWorld.bind(this));
  }
}
