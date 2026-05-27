type TimerCallback = () => void;

interface TimerEntry {
  id: number;
  elapsed: number;
  duration: number;
  repeat: boolean;
  callback: TimerCallback;
}

export class Timer {
  private entries: TimerEntry[] = [];
  private nextId = 1;

  /**
   * Fire `callback` once after `seconds` of game time.
   * Returns an ID that can be passed to `cancel()`.
   */
  after(seconds: number, callback: TimerCallback): number {
    const id = this.nextId++;
    this.entries.push({ id, elapsed: 0, duration: seconds, repeat: false, callback });
    return id;
  }

  /**
   * Fire `callback` every `seconds` of game time, indefinitely.
   * Returns an ID that can be passed to `cancel()`.
   */
  every(seconds: number, callback: TimerCallback): number {
    const id = this.nextId++;
    this.entries.push({ id, elapsed: 0, duration: seconds, repeat: true, callback });
    return id;
  }

  /** Cancel a timer by its ID. */
  cancel(id: number): void {
    this.entries = this.entries.filter((e) => e.id !== id);
  }

  /** Cancel all active timers. */
  clear(): void {
    this.entries = [];
  }

  /** Called automatically by the engine each frame. Do not call manually. */
  update(dt: number): void {
    const done: number[] = [];

    for (const entry of this.entries) {
      entry.elapsed += dt;
      if (entry.elapsed >= entry.duration) {
        entry.callback();
        if (entry.repeat) {
          entry.elapsed -= entry.duration; // carry over excess time
        } else {
          done.push(entry.id);
        }
      }
    }

    if (done.length > 0) {
      const remove = new Set(done);
      this.entries = this.entries.filter((e) => !remove.has(e.id));
    }
  }
}
