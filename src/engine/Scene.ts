import type { Engine } from "./Engine";

export abstract class Scene {
  onEnter(_engine: Engine): void {}
  onExit(_engine: Engine): void {}
}

export class SceneManager {
  private engine: Engine;
  private current: Scene | null = null;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  get active(): Scene | null {
    return this.current;
  }

  load(scene: Scene): void {
    if (this.current) {
      this.current.onExit(this.engine);
      this.engine.clearObjects();
    }

    this.current = scene;
    this.current.onEnter(this.engine);
  }
}
