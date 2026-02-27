export class Camera {
  x = 0;
  y = 0;
  zoom = 1;
  lerp = 1; // 1 = instant snap, lower = smoother (e.g. 0.1)

  private target: (() => { x: number; y: number }) | null = null;

  follow(fn: () => { x: number; y: number }): void {
    this.target = fn;
  }

  unfollow(): void {
    this.target = null;
  }

  update(dt: number): void {
    if (!this.target) return;
    const t = this.target();
    // frame-rate independent lerp
    const alpha = 1 - Math.pow(1 - this.lerp, dt * 60);
    this.x += (t.x - this.x) * alpha;
    this.y += (t.y - this.y) * alpha;
  }

  apply(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.translate(
      Math.round(width / 2 - this.x * this.zoom),
      Math.round(height / 2 - this.y * this.zoom),
    );
    ctx.scale(this.zoom, this.zoom);
  }
}
