import { describe, test, expect, beforeEach } from "vitest";
import { Input } from "../../src/engine/Input";

function keyDown(code: string): void {
  window.dispatchEvent(new KeyboardEvent("keydown", { code, bubbles: true }));
}
function keyUp(code: string): void {
  window.dispatchEvent(new KeyboardEvent("keyup", { code, bubbles: true }));
}

describe("Input", () => {
  let input: Input;

  beforeEach(() => {
    input = new Input();
  });

  test("isDown() returns true while key is held", () => {
    keyDown("KeyA");
    expect(input.isDown("KeyA")).toBe(true);
  });

  test("isDown() returns false after key is released", () => {
    keyDown("KeyA");
    keyUp("KeyA");
    expect(input.isDown("KeyA")).toBe(false);
  });

  test("isPressed() is true only on the first frame of a keydown", () => {
    keyDown("KeyW");
    expect(input.isPressed("KeyW")).toBe(true);
    input.flush();
    expect(input.isPressed("KeyW")).toBe(false); // second frame
    expect(input.isDown("KeyW")).toBe(true);     // still held
  });

  test("isReleased() is true only on the frame of keyup", () => {
    keyDown("Space");
    input.flush();
    keyUp("Space");
    expect(input.isReleased("Space")).toBe(true);
    input.flush();
    expect(input.isReleased("Space")).toBe(false);
  });

  test("flush() clears pressed and released sets", () => {
    keyDown("ArrowLeft");
    keyUp("ArrowLeft");
    input.flush();
    expect(input.isPressed("ArrowLeft")).toBe(false);
    expect(input.isReleased("ArrowLeft")).toBe(false);
  });

  test("multiple keys tracked independently", () => {
    keyDown("KeyA");
    keyDown("KeyD");
    expect(input.isDown("KeyA")).toBe(true);
    expect(input.isDown("KeyD")).toBe(true);
    expect(input.isDown("KeyW")).toBe(false);
    keyUp("KeyA");
    expect(input.isDown("KeyA")).toBe(false);
    expect(input.isDown("KeyD")).toBe(true);
  });

  test("isPressed() is false for a key that was never pressed", () => {
    expect(input.isPressed("KeyZ")).toBe(false);
  });

  test("rapid keydown+keyup marks both pressed and released in the same frame", () => {
    keyDown("KeyS");
    keyUp("KeyS");
    expect(input.isPressed("KeyS")).toBe(true);
    expect(input.isReleased("KeyS")).toBe(true);
    expect(input.isDown("KeyS")).toBe(false);
  });

  test("holding a key does not re-add it to pressed set", () => {
    keyDown("KeyE");
    input.flush();
    keyDown("KeyE"); // OS key repeat — already in held set
    expect(input.isPressed("KeyE")).toBe(false); // NOT re-pressed
  });
});
