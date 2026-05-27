import type { GameObject } from "./Engine";

// ─── Tileset ──────────────────────────────────────────────────────────────

interface TilesetOptions {
  /** Pixel gap between tiles in the spritesheet. Default `0`. */
  spacing?: number;
  /** Pixel border around the entire spritesheet. Default `0`. */
  margin?: number;
}

/**
 * Describes the source image and tile dimensions for a {@link Tilemap}.
 * Pass a preloaded `HTMLImageElement` (e.g. from `engine.assets.get(key)`).
 */
export class Tileset {
  readonly image: HTMLImageElement;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly spacing: number;
  readonly margin: number;
  /** Number of tile columns in the spritesheet (derived from image width). */
  readonly cols: number;

  constructor(
    image: HTMLImageElement,
    tileWidth: number,
    tileHeight: number,
    options: TilesetOptions = {},
  ) {
    this.image = image;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.spacing = options.spacing ?? 0;
    this.margin = options.margin ?? 0;
    this.cols = Math.max(
      1,
      Math.floor(
        (image.naturalWidth - this.margin * 2 + this.spacing) /
          (tileWidth + this.spacing),
      ),
    );
  }

  /** @internal Returns the source rect (top-left pixel) for a 0-based tile index (row-major). */
  getSourceRect(index: number): { sx: number; sy: number } {
    const col = index % this.cols;
    const row = Math.floor(index / this.cols);
    return {
      sx: this.margin + col * (this.tileWidth + this.spacing),
      sy: this.margin + row * (this.tileHeight + this.spacing),
    };
  }
}

// ─── TileLayer ────────────────────────────────────────────────────────────

/**
 * A single grid of tiles within a {@link Tilemap}.
 * Layers are drawn bottom-to-top (index 0 is the bottommost).
 *
 * Do not construct directly — use {@link Tilemap.addLayer}.
 */
export class TileLayer {
  readonly name: string;
  /** Set to `false` to skip this layer during rendering and solid checks. */
  visible = true;

  private readonly data: Int16Array; // -1 = empty, ≥0 = tile index
  private readonly cols: number;
  private readonly rows: number;

  /** @internal */
  constructor(name: string, cols: number, rows: number) {
    this.name = name;
    this.cols = cols;
    this.rows = rows;
    this.data = new Int16Array(cols * rows).fill(-1);
  }

  /** Set the tile index at (`col`, `row`). Use `-1` to clear the cell. Out-of-bounds writes are ignored. */
  set(col: number, row: number, index: number): void {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    this.data[row * this.cols + col] = index;
  }

  /** Get the tile index at (`col`, `row`). Returns `-1` if empty or out of bounds. */
  get(col: number, row: number): number {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return -1;
    return this.data[row * this.cols + col]!;
  }

  /** Fill every cell with `index`. Use `-1` to clear the whole layer. */
  fill(index: number): void {
    this.data.fill(index);
  }

  /** Fill a rectangular region with `index`. */
  fillRect(col: number, row: number, cols: number, rows: number, index: number): void {
    for (let r = row; r < row + rows; r++) {
      for (let c = col; c < col + cols; c++) {
        this.set(c, r, index);
      }
    }
  }

  /**
   * Bulk-load tile indices from a row-major flat array.
   * Extra values beyond the layer size are ignored.
   *
   * @example
   * layer.setData([
   *   1, 1, 1, 1,
   *   1, 0, 0, 1,
   *   1, 1, 1, 1,
   * ]);
   */
  setData(data: ArrayLike<number>): void {
    const len = Math.min(data.length, this.data.length);
    for (let i = 0; i < len; i++) {
      this.data[i] = data[i]!;
    }
  }
}

// ─── Tilemap ──────────────────────────────────────────────────────────────

/**
 * A multi-layer tile map that implements {@link GameObject} so it can be
 * added directly to the engine with `engine.add(tilemap)`.
 *
 * Layers are rendered bottom-to-top. Tile collision is handled through the
 * `isSolid()` API — the tilemap does **not** participate in the AABB
 * `CollisionSystem`; query solid tiles manually in your `update()`.
 *
 * @example
 * ```ts
 * const ts  = new Tileset(engine.assets.get("tiles"), 16, 16);
 * const map = new Tilemap(ts, 40, 23);
 *
 * const bg = map.addLayer("bg");
 * bg.fill(0);                        // grass everywhere
 *
 * const walls = map.addLayer("walls");
 * walls.fillRect(0, 0, 40, 1, 2);   // top wall
 * map.setSolid(2);                   // tile index 2 is solid
 *
 * engine.add(map);
 * // later in player update:
 * if (map.isSolid(player.x, player.y + player.height)) { ... }
 * ```
 */
export class Tilemap implements GameObject {
  /** World-space X offset of the entire map. */
  x = 0;
  /** World-space Y offset of the entire map. */
  y = 0;
  zIndex = 0;
  tags: string[] = [];

  readonly tileset: Tileset;
  /** Map width in tiles. */
  readonly cols: number;
  /** Map height in tiles. */
  readonly rows: number;
  /** Ordered list of layers. Index 0 is drawn first (bottommost). */
  readonly layers: TileLayer[] = [];

  private solid = new Set<number>();

  constructor(tileset: Tileset, cols: number, rows: number) {
    this.tileset = tileset;
    this.cols = cols;
    this.rows = rows;
  }

  // ── Convenience getters ───────────────────────────────────────────────

  /** Tile width in pixels (from the tileset). */
  get tileWidth(): number { return this.tileset.tileWidth; }
  /** Tile height in pixels (from the tileset). */
  get tileHeight(): number { return this.tileset.tileHeight; }
  /** Total map width in pixels. */
  get width(): number { return this.cols * this.tileset.tileWidth; }
  /** Total map height in pixels. */
  get height(): number { return this.rows * this.tileset.tileHeight; }

  // ── Layer management ──────────────────────────────────────────────────

  /** Create a new layer on top of the existing ones and return it. */
  addLayer(name: string): TileLayer {
    const layer = new TileLayer(name, this.cols, this.rows);
    this.layers.push(layer);
    return layer;
  }

  /** Return a layer by name, or `undefined` if not found. */
  getLayer(name: string): TileLayer | undefined {
    return this.layers.find((l) => l.name === name);
  }

  /** Remove a layer by name. */
  removeLayer(name: string): void {
    const idx = this.layers.findIndex((l) => l.name === name);
    if (idx !== -1) this.layers.splice(idx, 1);
  }

  // ── Solid tiles ───────────────────────────────────────────────────────

  /**
   * Mark tile indices as solid.
   * `isSolid()` returns `true` for any cell that contains one of these indices.
   */
  setSolid(...indices: number[]): void {
    for (const i of indices) this.solid.add(i);
  }

  /**
   * Remove tile indices from the solid set.
   * Call with no arguments to clear all solid definitions.
   */
  clearSolid(...indices: number[]): void {
    if (indices.length === 0) {
      this.solid.clear();
    } else {
      for (const i of indices) this.solid.delete(i);
    }
  }

  /**
   * Returns `true` if the world-space point (`worldX`, `worldY`) falls on a
   * solid tile in any visible layer (checked bottom-to-top, first hit wins).
   */
  isSolid(worldX: number, worldY: number): boolean {
    const { col, row } = this.worldToTile(worldX, worldY);
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      const idx = layer.get(col, row);
      if (idx >= 0 && this.solid.has(idx)) return true;
    }
    return false;
  }

  // ── Coordinate conversion ─────────────────────────────────────────────

  /** Convert a world-space point to tile grid coordinates (floored). */
  worldToTile(worldX: number, worldY: number): { col: number; row: number } {
    return {
      col: Math.floor((worldX - this.x) / this.tileset.tileWidth),
      row: Math.floor((worldY - this.y) / this.tileset.tileHeight),
    };
  }

  /** Convert tile grid coordinates to the top-left world-space corner of that tile. */
  tileToWorld(col: number, row: number): { x: number; y: number } {
    return {
      x: this.x + col * this.tileset.tileWidth,
      y: this.y + row * this.tileset.tileHeight,
    };
  }

  // ── GameObject ────────────────────────────────────────────────────────

  update(_dt: number): void {}

  render(ctx: CanvasRenderingContext2D): void {
    const { tileWidth, tileHeight, image } = this.tileset;

    // Viewport culling — only draw tiles visible in the current camera view.
    // ctx.getTransform() gives the camera's accumulated scale+translate matrix:
    //   screenX = a * worldX + e
    //   screenY = d * worldY + f
    // Invert to find visible world bounds.
    const { a, d, e, f } = ctx.getTransform();
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;

    const c0 = Math.max(0, Math.floor(((0 - e) / a - this.x) / tileWidth));
    const c1 = Math.min(this.cols, Math.ceil(((cw - e) / a - this.x) / tileWidth));
    const r0 = Math.max(0, Math.floor(((0 - f) / d - this.y) / tileHeight));
    const r1 = Math.min(this.rows, Math.ceil(((ch - f) / d - this.y) / tileHeight));

    for (const layer of this.layers) {
      if (!layer.visible) continue;
      for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
          const idx = layer.get(c, r);
          if (idx < 0) continue;
          const { sx, sy } = this.tileset.getSourceRect(idx);
          ctx.drawImage(
            image,
            sx, sy, tileWidth, tileHeight,
            this.x + c * tileWidth, this.y + r * tileHeight,
            tileWidth, tileHeight,
          );
        }
      }
    }
  }
}
