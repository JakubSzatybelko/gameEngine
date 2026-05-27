import type { Engine } from "../engine/Engine";
import type { GameObject } from "../engine/Engine";
import { Sprite } from "../engine/Sprite";
import type { Tilemap } from "../engine/Tilemap";

// ── Constants ────────────────────────────────────────────────────────────────

/** World-space pixels the player moves per second. */
const SPEED = 80;

/** Player is rendered as a TILE_SIZE × TILE_SIZE square in world space. */
const TILE_SIZE = 16;
const HALF = TILE_SIZE / 2;

/** Half-size of the collision hitbox (centred on player x/y). */
const HIT_HALF = 5;

/** Sprite sheet: 4 columns × 2 rows, each frame 60 × 60 px. */
const FRAME_COLS = 4;
const FRAME_DURATION = 0.15; // seconds per frame

const ROW_IDLE = 0;
const ROW_RUN  = 1;

// ── Player ───────────────────────────────────────────────────────────────────

export class Player implements GameObject {
  x: number;
  y: number;
  zIndex = 2;
  tags = ["player"];

  private readonly engine: Engine;
  private readonly waterMap: Tilemap;
  private readonly sprite: Sprite;

  private frame = 0;
  private frameTimer = 0;
  private animRow = ROW_IDLE;

  constructor(
    engine: Engine,
    x: number,
    y: number,
    spriteImg: HTMLImageElement,
    waterMap: Tilemap,
  ) {
    this.engine = engine;
    this.x = x;
    this.y = y;
    this.sprite = new Sprite(spriteImg, 60, 60);
    this.waterMap = waterMap;
  }

  update(dt: number): void {
    const { input } = this.engine;

    let dx = 0;
    let dy = 0;
    if (input.isDown("ArrowLeft")  || input.isDown("KeyA")) dx -= 1;
    if (input.isDown("ArrowRight") || input.isDown("KeyD")) dx += 1;
    if (input.isDown("ArrowUp")    || input.isDown("KeyW")) dy -= 1;
    if (input.isDown("ArrowDown")  || input.isDown("KeyS")) dy += 1;

    // Normalise diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    const moving = dx !== 0 || dy !== 0;

    // Axis-separated movement + tilemap collision
    const newX = this.x + dx * SPEED * dt;
    if (!this.collidesAt(newX, this.y)) this.x = newX;

    const newY = this.y + dy * SPEED * dt;
    if (!this.collidesAt(this.x, newY)) this.y = newY;

    // Animation
    this.animRow = moving ? ROW_RUN : ROW_IDLE;
    if (moving) {
      this.frameTimer += dt;
      if (this.frameTimer >= FRAME_DURATION) {
        this.frameTimer -= FRAME_DURATION;
        this.frame = (this.frame + 1) % FRAME_COLS;
      }
    } else {
      this.frame = 0;
      this.frameTimer = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.imageSmoothingEnabled = false;
    this.sprite.draw(
      ctx,
      Math.round(this.x - HALF),
      Math.round(this.y - HALF),
      this.frame,
      this.animRow,
      TILE_SIZE,
      TILE_SIZE,
    );
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private collidesAt(x: number, y: number): boolean {
    return (
      this.waterMap.isSolid(x - HIT_HALF, y - HIT_HALF) ||
      this.waterMap.isSolid(x + HIT_HALF, y - HIT_HALF) ||
      this.waterMap.isSolid(x - HIT_HALF, y + HIT_HALF) ||
      this.waterMap.isSolid(x + HIT_HALF, y + HIT_HALF)
    );
  }
}
