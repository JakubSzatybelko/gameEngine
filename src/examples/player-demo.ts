import { Engine, type Bounds, type GameObject } from "../engine/Engine";

export const title = "Player Demo";

export function run(engine: Engine): void {
  const SPEED = 250;

  class Player implements GameObject {
    x = engine.width / 2 - 30;
    y = engine.height / 2 - 30;
    size = 60;
    collidable = true;

    get bounds(): Bounds {
      return { x: this.x, y: this.y, width: this.size, height: this.size };
    }

    update(dt: number) {
      if (engine.input.isDown("ArrowRight")) this.x += SPEED * dt;
      if (engine.input.isDown("ArrowLeft"))  this.x -= SPEED * dt;
      if (engine.input.isDown("ArrowDown"))  this.y += SPEED * dt;
      if (engine.input.isDown("ArrowUp"))    this.y -= SPEED * dt;
      this.x = Math.max(0, Math.min(engine.width  - this.size, this.x));
      this.y = Math.max(0, Math.min(engine.height - this.size, this.y));
    }

    render(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = "#4fc3f7";
      ctx.fillRect(this.x, this.y, this.size, this.size);
    }
  }

  engine.add(new Player());
}
