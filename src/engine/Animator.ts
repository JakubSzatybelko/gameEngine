export interface AnimationFrame {
  col: number;
  row: number;
}

export interface AnimationConfig {
  frames: AnimationFrame[];
  fps: number;
  loop?: boolean; // default true
}

export class Animator {
  private animations = new Map<string, AnimationConfig>();
  private current: AnimationConfig | null = null;
  private currentName = "";
  private frameIndex = 0;
  private elapsed = 0;

  /** Whether a non-looping animation has finished */
  done = false;

  add(name: string, config: AnimationConfig): this {
    this.animations.set(name, config);
    return this;
  }

  play(name: string): void {
    if (this.currentName === name) return;
    const anim = this.animations.get(name);
    if (!anim) throw new Error(`Animation not found: "${name}"`);
    this.current = anim;
    this.currentName = name;
    this.frameIndex = 0;
    this.elapsed = 0;
    this.done = false;
  }

  update(dt: number): void {
    if (!this.current || this.done) return;

    this.elapsed += dt;
    const frameDuration = 1 / this.current.fps;

    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.frameIndex++;

      if (this.frameIndex >= this.current.frames.length) {
        if (this.current.loop ?? true) {
          this.frameIndex = 0;
        } else {
          this.frameIndex = this.current.frames.length - 1;
          this.done = true;
          break;
        }
      }
    }
  }

  get frame(): AnimationFrame {
    return this.current?.frames[this.frameIndex] ?? { col: 0, row: 0 };
  }

  get name(): string {
    return this.currentName;
  }
}
