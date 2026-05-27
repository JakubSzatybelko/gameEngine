import type { Bounds, GameObject } from "./Engine";
import type { Mouse } from "./Mouse";
import type { Camera } from "./Camera";

function hitTest(bounds: Bounds, x: number, y: number): boolean {
  return (
    x >= bounds.x &&
    x <= bounds.x + bounds.width &&
    y >= bounds.y &&
    y <= bounds.y + bounds.height
  );
}

export class ClickHandler {
  private readonly canvas: HTMLCanvasElement;
  private readonly mouse: Mouse;
  private readonly getCamera: () => Camera;
  private readonly getObjects: () => GameObject[];
  private readonly listener: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    mouse: Mouse,
    getCamera: () => Camera,
    getObjects: () => GameObject[],
  ) {
    this.canvas = canvas;
    this.mouse = mouse;
    this.getCamera = getCamera;
    this.getObjects = getObjects;
    this.listener = this.handleClick.bind(this);
    canvas.addEventListener("click", this.listener);
  }

  private handleClick(): void {
    // Convert screen-space mouse position to world space so bounds
    // (which live in world space) are compared correctly even when the camera is scrolled.
    const { x, y } = this.mouse.toWorld(this.getCamera());
    const objects = this.getObjects();
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i]!;
      if (obj.bounds && obj.onClick && hitTest(obj.bounds, x, y)) {
        obj.onClick();
        break;
      }
    }
  }

  dispose(): void {
    this.canvas.removeEventListener("click", this.listener);
  }
}
