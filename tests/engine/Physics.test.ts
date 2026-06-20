import { describe, test, expect, beforeEach } from "vitest";
import { PhysicsBody, PhysicsWorld } from "../../src/engine/Physics";

const NO_GRAVITY = { x: 0, y: 0 };

describe("PhysicsBody", () => {
  let body: PhysicsBody;

  beforeEach(() => {
    body = new PhysicsBody();
  });

  test("starts at origin with zero velocity", () => {
    expect(body.x).toBe(0);
    expect(body.y).toBe(0);
    expect(body.vx).toBe(0);
    expect(body.vy).toBe(0);
  });

  test("applyImpulse changes velocity immediately (divided by mass)", () => {
    body.mass = 2;
    body.applyImpulse(20, 10);
    // impulse / mass = velocity change
    body.step(0, NO_GRAVITY);
    expect(body.vx).toBeCloseTo(10);
    expect(body.vy).toBeCloseTo(5);
  });

  test("applyForce integrates into velocity over time (F=ma)", () => {
    body.mass = 2;
    body.applyForce(20, 0); // a = 10 px/s²
    body.step(1, NO_GRAVITY);
    expect(body.vx).toBeCloseTo(10); // a * dt = 10 * 1
    expect(body.x).toBeCloseTo(10);  // x += vx * dt
  });

  test("force accumulator is cleared after each step", () => {
    body.applyForce(100, 0);
    body.step(1, NO_GRAVITY);
    const vxAfterFirstStep = body.vx;
    body.step(1, NO_GRAVITY); // no force applied this step
    expect(body.vx).toBeCloseTo(vxAfterFirstStep); // velocity unchanged (no force, no drag, no gravity)
  });

  test("applyAcceleration bypasses mass", () => {
    body.mass = 5;
    body.applyAcceleration(10, 0);
    body.step(0, NO_GRAVITY);
    expect(body.vx).toBeCloseTo(10); // raw acceleration, not divided by mass
  });

  test("drag decays velocity each step", () => {
    body.drag = 1; // 100% per second
    body.applyImpulse(100, 0);
    body.step(0.016, NO_GRAVITY); // ~1 frame at 60fps
    expect(body.vx).toBeLessThan(100);
    expect(body.vx).toBeGreaterThan(0);
  });

  test("drag = 0 leaves velocity unchanged", () => {
    body.drag = 0;
    body.applyImpulse(50, 0);
    body.step(1, NO_GRAVITY);
    expect(body.vx).toBeCloseTo(50);
  });

  test("gravity is scaled by gravityScale", () => {
    body.gravityScale = 2;
    body.step(1, { x: 0, y: 100 });
    expect(body.vy).toBeCloseTo(200); // 100 * 2 * 1s
  });

  test("gravityScale = 0 ignores gravity", () => {
    body.gravityScale = 0;
    body.step(1, { x: 0, y: 980 });
    expect(body.vy).toBeCloseTo(0);
    expect(body.y).toBeCloseTo(0);
  });

  test("position integrates correctly over multiple steps", () => {
    body.applyImpulse(60, 0); // vx = 60
    body.step(0.5, NO_GRAVITY); // x += 60 * 0.5 = 30
    body.step(0.5, NO_GRAVITY); // x += 60 * 0.5 = 60
    expect(body.x).toBeCloseTo(60);
  });
});

describe("PhysicsWorld", () => {
  test("step advances all registered bodies", () => {
    const world = new PhysicsWorld();
    world.gravity = NO_GRAVITY;
    const a = world.add(new PhysicsBody());
    const b = world.add(new PhysicsBody());
    a.applyImpulse(10, 0);
    b.applyImpulse(0, 20);
    world.step(1);
    expect(a.x).toBeCloseTo(10);
    expect(b.y).toBeCloseTo(20);
  });

  test("remove() stops stepping the body", () => {
    const world = new PhysicsWorld();
    world.gravity = NO_GRAVITY;
    const body = world.add(new PhysicsBody());
    body.applyImpulse(100, 0);
    world.remove(body);
    world.step(1);
    expect(body.x).toBe(0); // body was removed before step
  });

  test("default gravity pulls bodies downward", () => {
    const world = new PhysicsWorld();
    const body = world.add(new PhysicsBody());
    world.step(1);
    expect(body.vy).toBeGreaterThan(0); // fell downward
  });
});
