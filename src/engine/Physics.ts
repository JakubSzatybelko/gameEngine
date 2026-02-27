export interface Vec2 {
  x: number;
  y: number;
}

export class PhysicsBody {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;

  mass = 1;         // kg (game units)
  gravityScale = 1; // 0 = weightless, 1 = normal, <0 = floats upward
  drag = 0;         // velocity damping per second (0 = none, e.g. 0.5 = 50%/s)
  restitution = 0;  // bounciness (0 = no bounce, 1 = perfect elastic)

  private _fx = 0;  // accumulated force X this frame (cleared after step)
  private _fy = 0;  // accumulated force Y this frame

  /**
   * Apply a continuous force (Newtons). Accumulates until end of frame.
   * Good for: thrust, wind, springs. Call every frame to sustain the force.
   */
  applyForce(fx: number, fy: number): void {
    this._fx += fx;
    this._fy += fy;
  }

  /**
   * Apply an instantaneous impulse. Directly changes velocity (impulse / mass).
   * Good for: jumps, explosions, collisions.
   */
  applyImpulse(ix: number, iy: number): void {
    this.vx += ix / this.mass;
    this.vy += iy / this.mass;
  }

  /**
   * Apply a raw acceleration (no mass division).
   * Good for: steering behaviours, direct velocity nudges.
   */
  applyAcceleration(ax: number, ay: number): void {
    this.vx += ax;
    this.vy += ay;
  }

  /** Called by PhysicsWorld.step() — do not call manually. */
  step(dt: number, gravity: Vec2): void {
    // gravity
    this.vx += gravity.x * this.gravityScale * dt;
    this.vy += gravity.y * this.gravityScale * dt;

    // accumulated forces  (a = F / m)
    this.vx += (this._fx / this.mass) * dt;
    this.vy += (this._fy / this.mass) * dt;

    // drag  (exponential decay approximation)
    if (this.drag > 0) {
      const factor = Math.max(0, 1 - this.drag * dt);
      this.vx *= factor;
      this.vy *= factor;
    }

    // integrate position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // clear per-frame force accumulator
    this._fx = 0;
    this._fy = 0;
  }
}

export class PhysicsWorld {
  /** Global gravity in px/s². Default is Earth-like downward acceleration. */
  gravity: Vec2 = { x: 0, y: 980 };

  private bodies = new Set<PhysicsBody>();

  /** Register a body with the world. Returns the body for convenience. */
  add(body: PhysicsBody): PhysicsBody {
    this.bodies.add(body);
    return body;
  }

  remove(body: PhysicsBody): void {
    this.bodies.delete(body);
  }

  /** Advance all registered bodies by dt seconds. Called by Engine each frame. */
  step(dt: number): void {
    for (const body of this.bodies) {
      body.step(dt, this.gravity);
    }
  }
}
