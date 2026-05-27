export type MouseButton = "left" | "middle" | "right";

const BUTTON_MAP: Readonly<Record<number, MouseButton>> = {
  0: "left",
  1: "middle",
  2: "right",
};

export class Mouse {
  /** Canvas-space X position. */
  x = 0;
  /** Canvas-space Y position. */
  y = 0;
  /** Accumulated scroll delta this frame. Positive = scroll down. */
  scrollDelta = 0;

  private held     = new Set<MouseButton>();
  private pressed  = new Set<MouseButton>();
  private released = new Set<MouseButton>();

  constructor(canvas: HTMLCanvasElement) {
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this.x = e.clientX - rect.left;
      this.y = e.clientY - rect.top;
    });

    canvas.addEventListener("mousedown", (e) => {
      const btn = BUTTON_MAP[e.button];
      if (!btn) return;
      if (!this.held.has(btn)) this.pressed.add(btn);
      this.held.add(btn);
    });

    canvas.addEventListener("mouseup", (e) => {
      const btn = BUTTON_MAP[e.button];
      if (!btn) return;
      this.held.delete(btn);
      this.released.add(btn);
    });

    canvas.addEventListener("wheel", (e) => {
      this.scrollDelta += e.deltaY;
    }, { passive: true });

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  /** True every frame the button is held. Defaults to left button. */
  isDown(button: MouseButton = "left"): boolean {
    return this.held.has(button);
  }

  /** True only on the first frame the button is pressed. */
  isPressed(button: MouseButton = "left"): boolean {
    return this.pressed.has(button);
  }

  /** True only on the frame the button is released. */
  isReleased(button: MouseButton = "left"): boolean {
    return this.released.has(button);
  }

  /**
   * Converts the current canvas-space mouse position to world space
   * using the provided camera. Call inside update() or render().
   */
  toWorld(camera: { x: number; y: number; zoom: number }): { x: number; y: number } {
    return {
      x: this.x / camera.zoom + camera.x,
      y: this.y / camera.zoom + camera.y,
    };
  }

  /** Called automatically by the engine at the end of each frame. */
  flush(): void {
    this.pressed.clear();
    this.released.clear();
    this.scrollDelta = 0;
  }
}
