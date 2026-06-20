import { describe, test, expect, beforeEach } from "vitest";
import { Camera } from "../../src/engine/Camera";

const W = 800;
const H = 600;

describe("Camera – zoom-aware follow", () => {
  let cam: Camera;

  beforeEach(() => {
    cam = new Camera();
    cam.lerp = 1; // instant snap — no interpolation, easier to assert
  });

  test("zoom=1: centres target on canvas", () => {
    cam.follow(() => ({ x: 400, y: 300 }));
    cam.update(1 / 60, W, H);
    // viewport half = 800/2=400, 600/2=300  →  cam offset = target - half
    expect(cam.x).toBeCloseTo(400 - W / 2);
    expect(cam.y).toBeCloseTo(300 - H / 2);
  });

  test("zoom=3: centres target on canvas (regression for zoom bug)", () => {
    cam.zoom = 3;
    cam.follow(() => ({ x: 300, y: 240 }));
    cam.update(1 / 60, W, H);
    // viewport half in world-units = canvas / (2 * zoom)
    expect(cam.x).toBeCloseTo(300 - W / (2 * 3));
    expect(cam.y).toBeCloseTo(240 - H / (2 * 3));
  });

  test("zoom=2: centres target on canvas", () => {
    cam.zoom = 2;
    cam.follow(() => ({ x: 200, y: 150 }));
    cam.update(1 / 60, W, H);
    expect(cam.x).toBeCloseTo(200 - W / 4);
    expect(cam.y).toBeCloseTo(150 - H / 4);
  });

  test("unfollow() stops tracking the target", () => {
    cam.follow(() => ({ x: 500, y: 400 }));
    cam.update(1 / 60, W, H);
    const xAfterFollow = cam.x;

    cam.unfollow();
    cam.update(1 / 60, W, H); // camera should not move
    expect(cam.x).toBe(xAfterFollow);
  });

  test("lerp=1 snaps immediately to target", () => {
    cam.lerp = 1;
    cam.follow(() => ({ x: 100, y: 100 }));
    cam.update(1 / 60, W, H);
    const expectedX = 100 - W / 2;
    expect(cam.x).toBeCloseTo(expectedX);
  });

  test("lerp < 1 interpolates toward target over multiple frames", () => {
    cam.lerp = 0.1;
    const target = { x: 800, y: 600 };
    cam.follow(() => target);

    // After many frames the camera should converge
    for (let i = 0; i < 300; i++) cam.update(1 / 60, W, H);

    expect(cam.x).toBeCloseTo(800 - W / 2, 0);
    expect(cam.y).toBeCloseTo(600 - H / 2, 0);
  });

  test("camera stays stationary when no target set", () => {
    cam.x = 50;
    cam.y = 75;
    cam.update(1 / 60, W, H);
    expect(cam.x).toBe(50);
    expect(cam.y).toBe(75);
  });
});
