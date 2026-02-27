import { Engine, type GameObject } from "../engine/Engine";
import { PhysicsBody } from "../engine/Physics";

export const title = "Bouncing Ball";

export function run(engine: Engine): void {
  const FLOOR  = engine.height - 40;
  const RADIUS = 24;

  class Ball implements GameObject {
    body: PhysicsBody;

    constructor() {
      this.body = engine.physics.add(new PhysicsBody());
      this.body.x = engine.width / 2;
      this.body.y = 100;
      this.body.restitution = 0.65;
    }

    update(_dt: number) {
      if (this.body.y >= FLOOR) {
        this.body.y  = FLOOR;
        this.body.vy = -Math.abs(this.body.vy) * this.body.restitution;
      }
      if (engine.input.isPressed("Space")) {
        this.body.y  = FLOOR;
        this.body.vy = 0;
        this.body.applyImpulse(0, -700);
      }
    }

    render(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = "#ff7043";
      ctx.beginPath();
      ctx.arc(this.body.x, this.body.y, RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  engine.add(new Ball());

  engine.addUI({
    render(ctx) {
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, FLOOR + RADIUS);
      ctx.lineTo(engine.width, FLOOR + RADIUS);
      ctx.stroke();

      ctx.fillStyle = "#aaa";
      ctx.font = "14px monospace";
      ctx.fillText("Space — launch", 16, engine.height - 12);
    },
  });
}
