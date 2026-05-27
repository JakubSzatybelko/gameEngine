import { Input } from "./Input";
import { SceneManager } from "./Scene";
import type { UIElement } from "./UIElement";
import { Camera } from "./Camera";
import { AssetLoader } from "./AssetLoader";
import { AudioManager } from "./AudioManager";
import { PhysicsWorld } from "./Physics";
import { CollisionSystem } from "./CollisionSystem";
import { ClickHandler } from "./ClickHandler";
import { Mouse } from "./Mouse";
import { Timer } from "./Timer";
import { TweenManager } from "../core/Tween";

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
  tags?: string[];
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  onClick?(): void;
  onCollide?(other: GameObject): void;
}

/** Returns `true` if `obj` has the given tag. Safe to call when `tags` is undefined. */
export function hasTag(obj: GameObject, tag: string): boolean {
  return obj.tags !== undefined && obj.tags.includes(tag);
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
  readonly mouse: Mouse;
  readonly timer: Timer = new Timer();
  readonly tween: TweenManager = new TweenManager();

  private readonly collisions = new CollisionSystem();
  private clickHandler!: ClickHandler;

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

    this.mouse = new Mouse(canvas);
    this.clickHandler = new ClickHandler(canvas, this.mouse, () => this.camera, () => this.renderOrder);

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

  removeAll(objs: GameObject[]): void {
    const toRemove = new Set(objs);
    this.objects = this.objects.filter((o) => !toRemove.has(o));
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

  private loop = (timestamp: number): void => {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    this.timer.update(dt);
    this.tween.update(dt);
    this.physics.step(dt);
    this.camera.update(dt, this.width, this.height);
    for (const obj of this.objects) obj.update(dt);

    this.collisions.check(this.collidables);

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
    this.mouse.flush();
    requestAnimationFrame(this.loop);
  };
}
