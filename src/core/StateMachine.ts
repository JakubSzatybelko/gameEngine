export interface State<T> {
  enter?(ctx: T): void;
  update?(ctx: T, dt: number): void;
  exit?(ctx: T): void;
}

export class StateMachine<T> {
  private readonly ctx: T;
  private states      = new Map<string, State<T>>();
  private current: State<T> | null = null;
  private currentName = "";

  constructor(ctx: T) {
    this.ctx = ctx;
  }

  /** Register a named state. Returns `this` for chaining. */
  add(name: string, state: State<T>): this {
    this.states.set(name, state);
    return this;
  }

  /**
   * Transition to a state by name.
   * Calls `exit` on the current state and `enter` on the next.
   * No-op if already in that state. Throws if the name is not registered.
   */
  setState(name: string): void {
    if (this.currentName === name) return;
    const next = this.states.get(name);
    if (!next) throw new Error(`StateMachine: unknown state "${name}"`);
    this.current?.exit?.(this.ctx);
    this.current = next;
    this.currentName = name;
    this.current.enter?.(this.ctx);
  }

  /** Advance the current state. Call once per frame inside GameObject.update(). */
  update(dt: number): void {
    this.current?.update?.(this.ctx, dt);
  }

  /** The name of the currently active state, or empty string if none set. */
  get state(): string {
    return this.currentName;
  }
}
