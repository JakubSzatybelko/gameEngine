export class Input {
  private held = new Set<string>();
  private pressed = new Set<string>();
  private released = new Set<string>();

  constructor() {
    window.addEventListener("keydown", (e) => {
      if (!this.held.has(e.code)) this.pressed.add(e.code);
      this.held.add(e.code);
    });
    window.addEventListener("keyup", (e) => {
      this.held.delete(e.code);
      this.released.add(e.code);
    });
  }

  /** held every frame the key is down */
  isDown(code: string): boolean {
    return this.held.has(code);
  }

  /** true only on the first frame the key is pressed */
  isPressed(code: string): boolean {
    return this.pressed.has(code);
  }

  /** true only on the frame the key is released */
  isReleased(code: string): boolean {
    return this.released.has(code);
  }

  /** call at the end of each frame to clear single-frame states */
  flush(): void {
    this.pressed.clear();
    this.released.clear();
  }
}
