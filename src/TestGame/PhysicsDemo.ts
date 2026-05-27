import type { GameObject } from "../engine/Engine";
import type { Engine } from "../engine/Engine";
import { PhysicsBody } from "../engine/Physics";

const MAP_W   = 60 * 16; // 960
const MAP_H   = 45 * 16; // 720
const MAX_BALLS = 50;
const BALL_RADIUS = 3; // world-space pixels

interface Ball {
  body: PhysicsBody;
  age: number;
  lifetime: number;
  hue: number; // 0-360
}

export class PhysicsDemo implements GameObject {
  zIndex = 3;

  private readonly engine: Engine;
  private balls: Ball[] = [];

  constructor(engine: Engine) {
    this.engine = engine;
  }

  get count(): number {
    return this.balls.length;
  }

  spawnAt(wx: number, wy: number): void {
    if (this.balls.length >= MAX_BALLS) return;
    const body = new PhysicsBody();
    body.x = wx;
    body.y = wy;
    body.gravityScale = 0; // top-down: no gravity per ball
    body.drag = 0.55;      // gradual slowdown

    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 160;
    body.applyImpulse(Math.cos(angle) * speed, Math.sin(angle) * speed);

    this.engine.physics.add(body);
    this.balls.push({
      body,
      age: 0,
      lifetime: 3 + Math.random() * 2,
      hue: Math.random() * 360,
    });
  }

  clearAll(): void {
    for (const b of this.balls) this.engine.physics.remove(b.body);
    this.balls = [];
  }

  update(dt: number): void {
    const { mouse, camera } = this.engine;

    // Mouse → spawn / clear
    if (mouse.isPressed("left")) {
      const w = mouse.toWorld(camera);
      this.spawnAt(w.x, w.y);
    }
    if (mouse.isPressed("right")) {
      this.clearAll();
    }

    // Per-ball update: age and boundary bounce
    for (const b of this.balls) {
      b.age += dt;

      const r = BALL_RADIUS;
      if (b.body.x < r)          { b.body.x = r;          b.body.vx =  Math.abs(b.body.vx) * 0.75; }
      if (b.body.x > MAP_W - r)  { b.body.x = MAP_W - r;  b.body.vx = -Math.abs(b.body.vx) * 0.75; }
      if (b.body.y < r)          { b.body.y = r;          b.body.vy =  Math.abs(b.body.vy) * 0.75; }
      if (b.body.y > MAP_H - r)  { b.body.y = MAP_H - r;  b.body.vy = -Math.abs(b.body.vy) * 0.75; }
    }

    // Remove expired balls
    const dead = this.balls.filter((b) => b.age >= b.lifetime);
    for (const b of dead) this.engine.physics.remove(b.body);
    this.balls = this.balls.filter((b) => b.age < b.lifetime);
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const b of this.balls) {
      const t = b.age / b.lifetime;
      const alpha = Math.max(0, 1 - t * t);

      ctx.save();
      ctx.globalAlpha = alpha;

      // Velocity trail
      const speed = Math.hypot(b.body.vx, b.body.vy);
      if (speed > 5) {
        const nx = b.body.vx / speed;
        const ny = b.body.vy / speed;
        const trailLen = Math.min(speed * 0.06, 12);
        ctx.strokeStyle = `hsla(${b.hue},100%,70%,0.35)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.body.x, b.body.y);
        ctx.lineTo(b.body.x - nx * trailLen, b.body.y - ny * trailLen);
        ctx.stroke();
      }

      // Ball
      ctx.fillStyle = `hsl(${b.hue},100%,65%)`;
      ctx.beginPath();
      ctx.arc(b.body.x, b.body.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}
