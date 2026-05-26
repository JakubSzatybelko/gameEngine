import type { Bounds, GameObject } from "./Engine";

function intersects(a: Bounds, b: Bounds): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export class CollisionSystem {
  check(collidables: GameObject[]): void {
    for (let i = 0; i < collidables.length; i++) {
      for (let j = i + 1; j < collidables.length; j++) {
        const a = collidables[i]!;
        const b = collidables[j]!;
        if (intersects(a.bounds!, b.bounds!)) {
          a.onCollide?.(b);
          b.onCollide?.(a);
        }
      }
    }
  }
}
