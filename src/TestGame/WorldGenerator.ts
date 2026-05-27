/**
 * Simple procedural world generator.
 * Returns a 2D boolean grid where `true` = water, `false` = grass.
 *
 * Algorithm:
 *  - Fill with grass
 *  - Place N random circular water blobs with slight noise on radius
 *  - Clear a safe spawn zone around the map center
 */

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

export function generateWorld(cols: number, rows: number, seed = 42): boolean[][] {
  const rng = seededRng(seed);
  // Allocate grid (false = grass)
  const water: boolean[][] = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false));

  const lakeCount = 18;
  const minR = 3;
  const maxR = 6;

  for (let i = 0; i < lakeCount; i++) {
    // Keep lake centers away from the edges
    const cx = Math.floor(rng() * (cols - 12)) + 6;
    const cy = Math.floor(rng() * (rows - 12)) + 6;
    const r = minR + rng() * (maxR - minR);

    for (let row = Math.floor(cy - r - 1); row <= Math.ceil(cy + r + 1); row++) {
      for (let col = Math.floor(cx - r - 1); col <= Math.ceil(cx + r + 1); col++) {
        if (col < 1 || col >= cols - 1 || row < 1 || row >= rows - 1) continue;
        // Slightly noisy circle
        const dist = Math.sqrt((col - cx) ** 2 + (row - cy) ** 2);
        if (dist < r + rng() * 1.2 - 0.6) {
          water[row]![col] = true;
        }
      }
    }
  }

  // Guarantee a clear spawn zone at the map centre
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  for (let row = cy - 3; row <= cy + 3; row++) {
    for (let col = cx - 3; col <= cx + 3; col++) {
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        water[row]![col] = false;
      }
    }
  }

  return water;
}

/** Find the world-space centre of the nearest non-water tile to the given tile coords. */
export function findSpawn(
  isWater: boolean[][],
  startCol: number,
  startRow: number,
  tileSize: number,
): { x: number; y: number } {
  const rows = isWater.length;
  const cols = isWater[0]?.length ?? 0;
  if (!isWater[startRow]?.[startCol]) {
    return { x: startCol * tileSize + tileSize / 2, y: startRow * tileSize + tileSize / 2 };
  }
  // Spiral search outward
  for (let radius = 1; radius < Math.max(rows, cols); radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
        const r = startRow + dr;
        const c = startCol + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols && !isWater[r]![c]) {
          return { x: c * tileSize + tileSize / 2, y: r * tileSize + tileSize / 2 };
        }
      }
    }
  }
  return { x: startCol * tileSize + tileSize / 2, y: startRow * tileSize + tileSize / 2 };
}
