import { describe, test, expect, beforeEach } from "vitest";
import { Tileset, Tilemap, TileLayer } from "../../src/engine/Tilemap";

/** Minimal HTMLImageElement stub — only the properties Tileset reads. */
function mockImage(w = 16, h = 16): HTMLImageElement {
  return { naturalWidth: w, naturalHeight: h } as HTMLImageElement;
}

function makeTileset(cols = 4, tileSize = 16): Tileset {
  const img = mockImage(cols * tileSize, tileSize);
  return new Tileset(img, tileSize, tileSize);
}

// ── TileLayer ─────────────────────────────────────────────────────────────────

describe("TileLayer", () => {
  let map: Tilemap;
  let layer: TileLayer;

  beforeEach(() => {
    map = new Tilemap(makeTileset(), 10, 8);
    layer = map.addLayer("base");
  });

  test("cells start as -1 (empty)", () => {
    expect(layer.get(0, 0)).toBe(-1);
    expect(layer.get(9, 7)).toBe(-1);
  });

  test("set() writes and get() reads back", () => {
    layer.set(3, 2, 5);
    expect(layer.get(3, 2)).toBe(5);
  });

  test("set() with -1 clears a cell", () => {
    layer.set(1, 1, 3);
    layer.set(1, 1, -1);
    expect(layer.get(1, 1)).toBe(-1);
  });

  test("out-of-bounds get() returns -1", () => {
    expect(layer.get(-1, 0)).toBe(-1);
    expect(layer.get(0, -1)).toBe(-1);
    expect(layer.get(10, 0)).toBe(-1);
    expect(layer.get(0, 8)).toBe(-1);
  });

  test("out-of-bounds set() is ignored", () => {
    layer.set(-1, 0, 1); // should not throw
    layer.set(99, 99, 1);
    expect(layer.get(0, 0)).toBe(-1); // nothing changed
  });

  test("fill() sets every cell to the given index", () => {
    layer.fill(2);
    expect(layer.get(0, 0)).toBe(2);
    expect(layer.get(5, 4)).toBe(2);
    expect(layer.get(9, 7)).toBe(2);
  });

  test("fillRect() fills a rectangular region", () => {
    layer.fillRect(1, 1, 3, 2, 7); // col=1..3, row=1..2
    expect(layer.get(1, 1)).toBe(7);
    expect(layer.get(3, 2)).toBe(7);
    expect(layer.get(0, 0)).toBe(-1); // outside
    expect(layer.get(4, 3)).toBe(-1); // outside
  });

  test("setData() bulk-loads row-major data", () => {
    // 2×2 region in a 10×8 layer using setData on the first 4 cells
    layer.setData([0, 1, 2, 3]);
    expect(layer.get(0, 0)).toBe(0);
    expect(layer.get(1, 0)).toBe(1);
    expect(layer.get(0, 1)).toBe(2);
    expect(layer.get(1, 1)).toBe(3);
  });
});

// ── Tilemap ───────────────────────────────────────────────────────────────────

describe("Tilemap", () => {
  let map: Tilemap;

  beforeEach(() => {
    map = new Tilemap(makeTileset(4, 16), 10, 8);
  });

  test("width and height derive from cols/rows × tileSize", () => {
    expect(map.width).toBe(160);  // 10 * 16
    expect(map.height).toBe(128); // 8  * 16
  });

  test("addLayer returns a TileLayer and tracks it", () => {
    const l = map.addLayer("bg");
    expect(map.layers).toHaveLength(1);
    expect(map.getLayer("bg")).toBe(l);
  });

  test("getLayer returns undefined for unknown name", () => {
    expect(map.getLayer("missing")).toBeUndefined();
  });

  test("removeLayer deletes a layer by name", () => {
    map.addLayer("a");
    map.addLayer("b");
    map.removeLayer("a");
    expect(map.layers).toHaveLength(1);
    expect(map.getLayer("a")).toBeUndefined();
    expect(map.getLayer("b")).toBeDefined();
  });

  // ── Solid tiles ───────────────────────────────────────────────────────

  test("isSolid() returns false when no tile placed", () => {
    map.setSolid(0);
    expect(map.isSolid(8, 8)).toBe(false); // tile at (0,0) is -1
  });

  test("isSolid() returns true when solid tile is under point", () => {
    const layer = map.addLayer("walls");
    layer.set(2, 3, 0); // tile at col=2, row=3 → world (32..47, 48..63)
    map.setSolid(0);
    expect(map.isSolid(40, 52)).toBe(true); // point inside that tile
  });

  test("isSolid() returns false for non-solid tile index", () => {
    const layer = map.addLayer("bg");
    layer.set(0, 0, 1); // tile index 1
    map.setSolid(0);    // only index 0 is solid
    expect(map.isSolid(8, 8)).toBe(false);
  });

  test("isSolid() returns false on invisible layer", () => {
    const layer = map.addLayer("hidden");
    layer.set(0, 0, 0);
    layer.visible = false;
    map.setSolid(0);
    expect(map.isSolid(8, 8)).toBe(false);
  });

  test("clearSolid() removes specific indices", () => {
    const layer = map.addLayer("walls");
    layer.set(0, 0, 0);
    map.setSolid(0);
    map.clearSolid(0);
    expect(map.isSolid(8, 8)).toBe(false);
  });

  test("clearSolid() with no args clears all solid definitions", () => {
    const layer = map.addLayer("walls");
    layer.set(0, 0, 0);
    map.setSolid(0, 1, 2);
    map.clearSolid();
    expect(map.isSolid(8, 8)).toBe(false);
  });

  // ── Coordinate conversion ─────────────────────────────────────────────

  test("worldToTile() converts world coords to tile grid", () => {
    const { col, row } = map.worldToTile(33, 17);
    expect(col).toBe(2); // floor(33/16) = 2
    expect(row).toBe(1); // floor(17/16) = 1
  });

  test("tileToWorld() returns top-left pixel of tile", () => {
    const { x, y } = map.tileToWorld(3, 2);
    expect(x).toBe(48); // 3 * 16
    expect(y).toBe(32); // 2 * 16
  });

  test("worldToTile and tileToWorld are inverse operations", () => {
    const { x, y } = map.tileToWorld(5, 4);
    const { col, row } = map.worldToTile(x + 1, y + 1); // +1 to stay inside tile
    expect(col).toBe(5);
    expect(row).toBe(4);
  });

  // ── Tileset ───────────────────────────────────────────────────────────

  test("Tileset.cols is derived from image width", () => {
    const ts = new Tileset(mockImage(64, 16), 16, 16);
    expect(ts.cols).toBe(4); // 64 / 16 = 4
  });

  test("Tileset.getSourceRect returns correct pixel offset", () => {
    const ts = new Tileset(mockImage(64, 32), 16, 16);
    // index 5 → col=1, row=1  (4 cols per row)
    const { sx, sy } = ts.getSourceRect(5);
    expect(sx).toBe(16); // col=1 → 1*16
    expect(sy).toBe(16); // row=1 → 1*16
  });
});
