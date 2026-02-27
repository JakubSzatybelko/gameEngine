import { Input } from "./Input";
import { SceneManager } from "./Scene";
import type { UIElement } from "./UIElement";
import { Camera } from "./Camera";
import { AssetLoader } from "./AssetLoader";
import { AudioManager } from "./AudioManager";
import { PhysicsWorld } from "./Physics";

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameObject {
  zIndex?: number;
  collidable?: boolean;
  bounds?: Bounds;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  onClick?(): void;
  onCollide?(other: GameObject): void;
}

function intersects(a: Bounds, b: Bounds): boolean {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

function hitTest(bounds: Bounds, x: number, y: number): boolean {
  return x >= bounds.x && x <= bounds.x + bounds.width &&
    y >= bounds.y && y <= bounds.y + bounds.height;
}

export class Engine {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;

  readonly input: Input = new Input();
  readonly scenes: SceneManager = new SceneManager(this);
  readonly camera: Camera = new Camera();
  readonly assets: AssetLoader = new AssetLoader();
  readonly audio: AudioManager = new AudioManager();
  readonly physics: PhysicsWorld = new PhysicsWorld();

  private objects: GameObject[] = [];
  private renderOrder: GameObject[] = [];
  private collidables: GameObject[] = [];
  private ui: UIElement[] = [];
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
    this.ctx = ctx;

    this.canvas.addEventListener("click", this.handleClick);

    // unlock AudioContext on first user gesture
    const resume = () => { void this.audio.resume(); window.removeEventListener("keydown", resume); };
    window.addEventListener("keydown", resume);
  }

  add(obj: GameObject): void {
    this.objects.push(obj);
    this.rebuildRenderOrder();
  }

  remove(obj: GameObject): void {
    this.objects = this.objects.filter((o) => o !== obj);
    this.rebuildRenderOrder();
  }

  clearObjects(): void {
    this.objects = [];
    this.renderOrder = [];
    this.collidables = [];
    this.ui = [];
  }

  addUI(el: UIElement): void {
    this.ui.push(el);
  }

  removeUI(el: UIElement): void {
    this.ui = this.ui.filter((e) => e !== el);
  }

  private rebuildRenderOrder(): void {
    this.renderOrder = [...this.objects].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    this.collidables = this.objects.filter((o) => o.collidable && o.bounds);
  }

  start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  private checkCollisions(): void {
    const objs = this.collidables;
    for (let i = 0; i < objs.length; i++) {
      for (let j = i + 1; j < objs.length; j++) {
        const a = objs[i]!;
        const b = objs[j]!;
        if (intersects(a.bounds!, b.bounds!)) {
          a.onCollide?.(b);
          b.onCollide?.(a);
        }
      }
    }
  }

  private handleClick = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // iterate topmost first, stop at first hit
    for (let i = this.renderOrder.length - 1; i >= 0; i--) {
      const obj = this.renderOrder[i]!;
      if (obj.bounds && obj.onClick && hitTest(obj.bounds, x, y)) {
        obj.onClick();
        break;
      }
    }
  };

  private loop = (timestamp: number): void => {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    this.physics.step(dt);
    this.camera.update(dt);
    for (const obj of this.objects) obj.update(dt);

    this.checkCollisions();

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.camera.apply(this.ctx, this.width, this.height);
    for (const obj of this.renderOrder) obj.render(this.ctx);
    this.ctx.restore();

    for (const el of this.ui) {
      el.update?.(dt);
      el.render(this.ctx);
    }

    this.input.flush();
    requestAnimationFrame(this.loop);
  };
}
