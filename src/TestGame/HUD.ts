import type { UIElement } from "../engine/UIElement";
import type { Engine } from "../engine/Engine";

const PULSE_INTERVAL = 3; // seconds, must match engine.timer.every() call

export class HUD implements UIElement {
  /** Injected after construction so PhysicsDemo can be wired in. */
  getBallCount: () => number = () => 0;

  private readonly engine: Engine;

  // FPS tracking
  private fps = 0;
  private frameCount = 0;
  private fpsTimer = 0;

  // Timer progress (counts down from PULSE_INTERVAL to 0, resets on pulse)
  private timerPhase = PULSE_INTERVAL;

  // Pulse flash state
  private pulseAlpha = 0;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  /** Called by engine.timer.every() each time the timer fires. */
  triggerPulse(): void {
    this.timerPhase = PULSE_INTERVAL;
    this.pulseAlpha = 1;
  }

  update(dt: number): void {
    // FPS
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // Timer countdown bar
    this.timerPhase = Math.max(0, this.timerPhase - dt);

    // Pulse fade-out
    if (this.pulseAlpha > 0) this.pulseAlpha = Math.max(0, this.pulseAlpha - dt * 2);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { camera, mouse } = this.engine;
    const world = mouse.toWorld(camera);

    ctx.save();

    // ── Info panel (top-left) ─────────────────────────────────────────────
    const px = 10;
    const py = 10;
    const pw = 220;
    const ph = 130;
    ctx.fillStyle = "rgba(0,0,0,0.60)";
    roundRect(ctx, px, py, pw, ph, 5);
    ctx.fill();

    ctx.font = "bold 12px monospace";
    const lh = 18;
    let ty = py + 20;

    // FPS
    const fpsColor = this.fps >= 55 ? "#6aff6a" : this.fps >= 30 ? "#ffe06a" : "#ff6a6a";
    ctx.fillStyle = fpsColor;
    ctx.fillText(`FPS:    ${this.fps}`, px + 12, ty); ty += lh;

    // Mouse world pos
    ctx.fillStyle = "#cccccc";
    ctx.fillText(`Mouse:  ${Math.round(world.x)}, ${Math.round(world.y)}`, px + 12, ty); ty += lh;

    // Ball count
    ctx.fillStyle = "#88ccff";
    ctx.fillText(`Balls:  ${this.getBallCount()} / 50`, px + 12, ty); ty += lh;

    // Timer bar
    const barX = px + 12;
    const barW = pw - 24;
    const fill = this.timerPhase / PULSE_INTERVAL;
    ctx.fillStyle = "#333";
    ctx.fillRect(barX, ty, barW, 8);
    ctx.fillStyle = "#ff9944";
    ctx.fillRect(barX, ty, Math.round(barW * fill), 8);
    ctx.fillStyle = "#aaaaaa";
    ctx.fillText(`Timer:  ${this.timerPhase.toFixed(1)}s`, px + 12, ty + 20); ty += lh + 14;

    // System badges
    ctx.font = "10px monospace";
    ctx.fillStyle = "#66ff99";
    ctx.fillText("UI[OK] Mouse[OK] Timer[OK] Physics[OK]", px + 12, ty);

    // ── Pulse flash (centre screen) ───────────────────────────────────────
    if (this.pulseAlpha > 0) {
      ctx.globalAlpha = this.pulseAlpha;
      ctx.font = "bold 32px monospace";
      ctx.fillStyle = "#ff9944";
      ctx.textAlign = "center";
      ctx.fillText("TIMER PULSE!", 400, 80);
      ctx.textAlign = "left";
    }

    // ── Controls hint (bottom) ────────────────────────────────────────────
    ctx.globalAlpha = 0.65;
    ctx.font = "10px monospace";
    ctx.fillStyle = "#aaaaaa";
    ctx.fillText("WASD/Arrows: move   LClick: spawn ball   RClick: clear balls", 10, 590);

    ctx.restore();
  }
}

/** Draw a rounded rectangle path (no fill/stroke — caller does that). */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
