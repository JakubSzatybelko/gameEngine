export type EasingFn = (t: number) => number;

export const Easing: Readonly<Record<string, EasingFn>> = {
  linear:         (t) => t,
  easeIn:         (t) => t * t,
  easeOut:        (t) => t * (2 - t),
  easeInOut:      (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic:    (t) => t * t * t,
  easeOutCubic:   (t) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  bounce: (t) => {
    if (t < 1 / 2.75)  return 7.5625 * t * t;
    if (t < 2 / 2.75)  { t -= 1.5   / 2.75; return 7.5625 * t * t + 0.75;    }
    if (t < 2.5 / 2.75){ t -= 2.25  / 2.75; return 7.5625 * t * t + 0.9375;  }
    t -= 2.625 / 2.75;  return 7.5625 * t * t + 0.984375;
  },
};

interface TweenEntry {
  id: number;
  target: Record<string, number>;
  from:   Record<string, number>;
  to:     Record<string, number>;
  duration: number;
  elapsed:  number;
  easing:   EasingFn;
  onComplete?: () => void;
}

export class TweenManager {
  private entries: TweenEntry[] = [];
  private nextId = 1;

  /**
   * Animate numeric properties of `target` toward the values in `props`
   * over `duration` seconds.
   *
   * @returns An ID that can be passed to `cancel()`.
   *
   * @example
   * engine.tween.to(player, { x: 400, alpha: 0 }, 0.5, { easing: Easing.easeOut });
   */
  to(
    target: object,
    props: Record<string, number>,
    duration: number,
    options: { easing?: EasingFn; onComplete?: () => void } = {},
  ): number {
    const t = target as Record<string, number>;
    const from: Record<string, number> = {};
    const to:   Record<string, number> = {};

    for (const key of Object.keys(props)) {
      from[key] = t[key] ?? 0;
      to[key]   = props[key]!;
    }

    const id = this.nextId++;
    this.entries.push({
      id, target: t, from, to, duration,
      elapsed: 0,
      easing: options.easing ?? Easing.linear,
      onComplete: options.onComplete,
    });
    return id;
  }

  /** Cancel a tween by its ID. The target properties stay at their current interpolated values. */
  cancel(id: number): void {
    this.entries = this.entries.filter((e) => e.id !== id);
  }

  /** Cancel all active tweens. */
  clear(): void {
    this.entries = [];
  }

  /** Called automatically by the engine each frame. Do not call manually. */
  update(dt: number): void {
    const done: number[] = [];

    for (const entry of this.entries) {
      entry.elapsed = Math.min(entry.elapsed + dt, entry.duration);
      const t = entry.duration > 0 ? entry.easing(entry.elapsed / entry.duration) : 1;

      for (const key of Object.keys(entry.to)) {
        entry.target[key] = entry.from[key]! + (entry.to[key]! - entry.from[key]!) * t;
      }

      if (entry.elapsed >= entry.duration) {
        entry.onComplete?.();
        done.push(entry.id);
      }
    }

    if (done.length > 0) {
      const remove = new Set(done);
      this.entries = this.entries.filter((e) => !remove.has(e.id));
    }
  }
}
