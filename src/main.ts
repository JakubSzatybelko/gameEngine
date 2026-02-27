import { Engine, type Bounds, type GameObject } from "./engine/Engine";
import { Scene } from "./engine/Scene";
import type { UIElement } from "./engine/UIElement";
import { Sprite } from "./engine/Sprite";
import { Animator } from "./engine/Animator";

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, 800, 600);

const SPEED = 300;
const WORLD_W = 1600;
const WORLD_H = 1200;
const WALL = 20;

class Box implements GameObject {
  zIndex: number;
  collidable = true;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  colliding = false;

  constructor(x: number, y: number, vx: number, vy: number, size: number, color: string, zIndex = 0) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.size = size; this.color = color; this.zIndex = zIndex;
  }

  get bounds(): Bounds {
    return { x: this.x, y: this.y, width: this.size, height: this.size };
  }

  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x <= WALL || this.x + this.size >= WORLD_W - WALL) this.vx *= -1;
    if (this.y <= WALL || this.y + this.size >= WORLD_H - WALL) this.vy *= -1;
    this.colliding = false;
  }

  onCollide(_other: GameObject) { this.colliding = true; }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.colliding ? "#fff" : this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

class PlayerBox implements GameObject {
  zIndex = 1;
  collidable = true;
  x: number;
  y: number;
  size: number;
  colliding = false;
  private sprite: Sprite;
  private animator: Animator;

  constructor(x: number, y: number, size: number) {
    this.x = x; this.y = y; this.size = size;
    this.sprite = new Sprite(engine.assets.get("player-sheet"), 60, 60);
    this.animator = new Animator()
      .add("idle", { frames: [{col:0,row:0},{col:1,row:0},{col:2,row:0},{col:3,row:0}], fps: 4 })
      .add("run",  { frames: [{col:0,row:1},{col:1,row:1},{col:2,row:1},{col:3,row:1}], fps: 10 });
    this.animator.play("idle");
  }

  get bounds(): Bounds {
    return { x: this.x, y: this.y, width: this.size, height: this.size };
  }

  update(dt: number) {
    const { input } = engine;
    const moving =
      input.isDown("ArrowRight") || input.isDown("ArrowLeft") ||
      input.isDown("ArrowDown")  || input.isDown("ArrowUp");

    this.animator.play(moving ? "run" : "idle");
    this.animator.update(dt);

    if (input.isDown("ArrowRight")) this.x += SPEED * dt;
    if (input.isDown("ArrowLeft"))  this.x -= SPEED * dt;
    if (input.isDown("ArrowDown"))  this.y += SPEED * dt;
    if (input.isDown("ArrowUp"))    this.y -= SPEED * dt;
    this.x = Math.max(WALL, Math.min(WORLD_W - WALL - this.size, this.x));
    this.y = Math.max(WALL, Math.min(WORLD_H - WALL - this.size, this.y));
    this.colliding = false;
  }

  onCollide(_other: GameObject) { this.colliding = true; }

  render(ctx: CanvasRenderingContext2D) {
    if (this.colliding) ctx.globalAlpha = 0.5;
    const { col, row } = this.animator.frame;
    this.sprite.draw(ctx, this.x, this.y, col, row, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

class Wall implements GameObject {
  collidable = true;
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x; this.y = y; this.width = width; this.height = height;
  }

  get bounds(): Bounds {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  update(_dt: number) {}

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#444";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// --- ui ---

class ScoreHUD implements UIElement {
  score = 0;

  addPoint() { this.score++; }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(8, 8, 160, 36);
    ctx.fillStyle = "#fff";
    ctx.font = "18px monospace";
    ctx.fillText(`score: ${this.score}`, 18, 32);
  }
}

// --- scenes ---

class GameScene extends Scene {
  onEnter(eng: Engine) {
    const hud = new ScoreHUD();
    eng.addUI(hud);

    const player = new PlayerBox(360, 260, 60);
    player.onCollide = () => {
      if (!player.colliding) {
        hud.addPoint();
        eng.audio.tone(440, 0.1, 0.2, "sine");
      }
      player.colliding = true;
    };

    // level border walls
    eng.add(new Wall(0,            0,             WORLD_W, WALL));     // top
    eng.add(new Wall(0,            WORLD_H - WALL, WORLD_W, WALL));    // bottom
    eng.add(new Wall(0,            0,             WALL,    WORLD_H));  // left
    eng.add(new Wall(WORLD_W - WALL, 0,           WALL,    WORLD_H)); // right

    eng.add(new Box(100, 100, 200, 150, 50, "#e94560", 0));
    eng.add(player);

    eng.camera.lerp = 0.08;
    eng.camera.follow(() => ({ x: player.x + player.size / 2, y: player.y + player.size / 2 }));
  }
}

class MenuScene extends Scene {
  onEnter(eng: Engine) {
    eng.addUI({
      update(_dt) {
        if (eng.input.isPressed("Enter")) {
          eng.audio.tone(220, 0.15, 0.3, "square");
          eng.scenes.load(new GameScene());
        }
      },
      render(ctx) {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, eng.width, eng.height);
        ctx.fillStyle = "#fff";
        ctx.font = "32px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Press Enter to start", eng.width / 2, eng.height / 2);
        ctx.textAlign = "left";
      },
    });
  }
}

engine.assets
  .image("player-sheet", "/sprites/player-sheet.svg")
  .loadAll()
  .then(() => {
    engine.scenes.load(new MenuScene());
    engine.start();
  });
