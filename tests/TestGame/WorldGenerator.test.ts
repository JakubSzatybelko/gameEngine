import { describe, test, expect } from "vitest";
import { generateWorld, findSpawn } from "../../src/TestGame/WorldGenerator";

describe("generateWorld", () => {
  test("returns a grid with the correct number of rows and columns", () => {
    const grid = generateWorld(40, 30);
    expect(grid).toHaveLength(30);
    for (const row of grid) {
      expect(row).toHaveLength(40);
    }
  });

  test("all cells are boolean", () => {
    const grid = generateWorld(20, 15);
    for (const row of grid) {
      for (const cell of row) {
        expect(typeof cell).toBe("boolean");
      }
    }
  });

  test("not every cell is water (map is mostly walkable)", () => {
    const grid = generateWorld(60, 45);
    const waterCount = grid.flat().filter(Boolean).length;
    const total = 60 * 45;
    expect(waterCount).toBeLessThan(total * 0.6); // < 60% water
  });

  test("centre spawn zone is guaranteed clear of water", () => {
    const cols = 60;
    const rows = 45;
    const grid = generateWorld(cols, rows, 42);
    const cx = Math.floor(cols / 2);
    const cy = Math.floor(rows / 2);
    // 7×7 safe zone centred on (cx, cy)
    for (let r = cy - 3; r <= cy + 3; r++) {
      for (let c = cx - 3; c <= cx + 3; c++) {
        expect(grid[r]![c]).toBe(false);
      }
    }
  });

  test("is deterministic: same seed produces the same output", () => {
    const a = generateWorld(30, 20, 99);
    const b = generateWorld(30, 20, 99);
    expect(a).toEqual(b);
  });

  test("different seeds produce different worlds", () => {
    const a = generateWorld(30, 20, 1);
    const b = generateWorld(30, 20, 2);
    expect(a).not.toEqual(b);
  });

  test("edge tiles (border) are never water", () => {
    const cols = 30;
    const rows = 20;
    const grid = generateWorld(cols, rows, 7);
    for (let c = 0; c < cols; c++) {
      expect(grid[0]![c]).toBe(false);           // top edge
      expect(grid[rows - 1]![c]).toBe(false);    // bottom edge
    }
    for (let r = 0; r < rows; r++) {
      expect(grid[r]![0]).toBe(false);           // left edge
      expect(grid[r]![cols - 1]).toBe(false);    // right edge
    }
  });
});

describe("findSpawn", () => {
  const TILE = 16;

  test("returns world-centre of the given tile when it is grass", () => {
    const grid = generateWorld(60, 45, 42);
    const cx = 30;
    const cy = 22; // inside the cleared spawn zone
    const spawn = findSpawn(grid, cx, cy, TILE);
    expect(spawn.x).toBe(cx * TILE + TILE / 2);
    expect(spawn.y).toBe(cy * TILE + TILE / 2);
  });

  test("returns a grass tile when the start tile is water", () => {
    // Build a map that is all water except (0,0)
    const grid: boolean[][] = Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 5 }, (_, c) => !(r === 0 && c === 0)),
    );
    const spawn = findSpawn(grid, 2, 2, TILE); // start in water
    expect(spawn.x).toBe(0 * TILE + TILE / 2);
    expect(spawn.y).toBe(0 * TILE + TILE / 2);
  });

  test("spawn coordinates land inside map bounds", () => {
    const cols = 60;
    const rows = 45;
    const grid = generateWorld(cols, rows, 13);
    const spawn = findSpawn(grid, Math.floor(cols / 2), Math.floor(rows / 2), TILE);
    expect(spawn.x).toBeGreaterThanOrEqual(0);
    expect(spawn.y).toBeGreaterThanOrEqual(0);
    expect(spawn.x).toBeLessThan(cols * TILE);
    expect(spawn.y).toBeLessThan(rows * TILE);
  });
});
