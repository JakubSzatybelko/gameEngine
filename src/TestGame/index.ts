import { Engine } from "../engine/Engine";
import { WorldScene } from "./WorldScene";

export function startTestGame(canvas: HTMLCanvasElement): void {
  const engine = new Engine(canvas, 800, 600);

  engine.assets
    .image("grass",  "/sprites/grass.png")
    .image("water",  "/sprites/water.png")
    .image("player", "/sprites/player-sheet.svg");

  engine.assets.loadAll().then(() => {
    engine.scenes.load(new WorldScene());
    engine.start();
  }).catch((err: unknown) => {
    console.error("Failed to load assets:", err);
  });
}
