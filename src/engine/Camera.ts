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

  update(dt: number, width = 0, height = 0): void {
    if (!this.target) return;
    const t = this.target();
    // center the target on screen: camera offset = target pos - half canvas
    const targetX = t.x - width / 2;
    const targetY = t.y - height / 2;
    // frame-rate independent lerp
    const alpha = 1 - Math.pow(1 - this.lerp, dt * 60);
    this.x += (targetX - this.x) * alpha;
    this.y += (targetY - this.y) * alpha;
  }

  apply(ctx: CanvasRenderingContext2D, _width: number, _height: number): void {
    // camera.x/y = world-space top-left corner shown at screen origin
    // default (0,0) = no transform; follow() offsets to center the target
    ctx.translate(
      Math.round(-this.x * this.zoom),
      Math.round(-this.y * this.zoom),
    );
    ctx.scale(this.zoom, this.zoom);
  }
}
