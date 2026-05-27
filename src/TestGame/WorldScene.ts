import { Scene } from "../engine/Scene";
import type { Engine } from "../engine/Engine";
import { Tileset, Tilemap } from "../engine/Tilemap";
import { Player } from "./Player";
import { generateWorld, findSpawn } from "./WorldGenerator";
import { PhysicsDemo } from "./PhysicsDemo";
import { HUD } from "./HUD";

const MAP_COLS  = 60;
const MAP_ROWS  = 45;
const TILE_SIZE = 16; // matches grass.png / water.png pixel dimensions

export class WorldScene extends Scene {
  onEnter(engine: Engine): void {
    const grassImg  = engine.assets.get("grass");
    const waterImg  = engine.assets.get("water");
    const playerImg = engine.assets.get("player");

    // ── Ground layer (grass everywhere) ──────────────────────────────────
    const grassTileset = new Tileset(grassImg, TILE_SIZE, TILE_SIZE);
    const groundMap    = new Tilemap(grassTileset, MAP_COLS, MAP_ROWS);
    groundMap.zIndex   = 0;
    groundMap.addLayer("ground").fill(0);

    // ── Water layer (sparse tiles; tile 0 = water, -1 = transparent) ─────
    const waterTileset = new Tileset(waterImg, TILE_SIZE, TILE_SIZE);
    const waterMap     = new Tilemap(waterTileset, MAP_COLS, MAP_ROWS);
    waterMap.zIndex    = 1;
    waterMap.setSolid(0); // index 0 blocks movement
    const waterLayer   = waterMap.addLayer("water");

    // ── Generate world ────────────────────────────────────────────────────
    const isWater = generateWorld(MAP_COLS, MAP_ROWS, 42);
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        if (isWater[row]![col]) {
          waterLayer.set(col, row, 0);
        }
      }
    }

    // ── Spawn player at a grass tile near the centre ──────────────────────
    const spawn  = findSpawn(isWater, Math.floor(MAP_COLS / 2), Math.floor(MAP_ROWS / 2), TILE_SIZE);
    const player = new Player(engine, spawn.x, spawn.y, playerImg, waterMap);

    // ── Register everything with the engine ───────────────────────────────
    engine.add(groundMap);
    engine.add(waterMap);
    engine.add(player);

    // ── Physics demo (mouse click → spawn balls) ──────────────────────────
    const physicsDemo = new PhysicsDemo(engine);
    engine.add(physicsDemo);

    // ── HUD (screen-space overlay) ────────────────────────────────────────
    const hud = new HUD(engine);
    hud.getBallCount = () => physicsDemo.count;
    engine.addUI(hud);

    // ── Timer: fire every 3 s → pulse the HUD ────────────────────────────
    engine.timer.every(3, () => hud.triggerPulse());

    // ── Camera: follow player, smooth lerp, zoom 3× for pixel art ────────
    engine.camera.zoom  = 3;
    engine.camera.lerp  = 0.1;
    engine.camera.follow(() => player);
  }

  onExit(engine: Engine): void {
    engine.camera.unfollow();
    engine.camera.zoom = 1;
    engine.timer.clear();
  }
}
