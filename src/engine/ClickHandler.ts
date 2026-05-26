import type { Bounds, GameObject } from "./Engine";

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
  private readonly getObjects: () => GameObject[];
  private readonly listener: (e: MouseEvent) => void;

  constructor(canvas: HTMLCanvasElement, getObjects: () => GameObject[]) {
    this.canvas = canvas;
    this.getObjects = getObjects;
    this.listener = this.handleClick.bind(this);
    canvas.addEventListener("click", this.listener);
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
