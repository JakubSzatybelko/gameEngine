import { describe, test, expect, beforeEach, vi } from "vitest";
import { Timer } from "../../src/engine/Timer";

describe("Timer", () => {
  let timer: Timer;

  beforeEach(() => {
    timer = new Timer();
  });

  // ── after() ────────────────────────────────────────────────────────────

  test("after() fires callback once at the correct time", () => {
    const fn = vi.fn();
    timer.after(1, fn);
    timer.update(0.9);
    expect(fn).not.toHaveBeenCalled();
    timer.update(0.1); // exactly 1s elapsed
    expect(fn).toHaveBeenCalledOnce();
  });

  test("after() does not fire again after triggering", () => {
    const fn = vi.fn();
    timer.after(0.5, fn);
    timer.update(1);  // well past the deadline
    timer.update(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("after() fires immediately if dt >= duration on first update", () => {
    const fn = vi.fn();
    timer.after(0.1, fn);
    timer.update(0.5);
    expect(fn).toHaveBeenCalledOnce();
  });

  // ── every() ────────────────────────────────────────────────────────────

  test("every() fires repeatedly at the given interval", () => {
    const fn = vi.fn();
    timer.every(1, fn);
    timer.update(1);
    expect(fn).toHaveBeenCalledTimes(1);
    timer.update(1);
    expect(fn).toHaveBeenCalledTimes(2);
    timer.update(1);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test("every() carries over excess time to next interval", () => {
    const fn = vi.fn();
    timer.every(1, fn);
    timer.update(2.5); // should fire at t=1 and t=2 → 2 times
    expect(fn).toHaveBeenCalledTimes(2);
    timer.update(0.6); // 0.5 carry-over + 0.6 = 1.1 → fires once more
    expect(fn).toHaveBeenCalledTimes(3);
  });

  // ── cancel() ───────────────────────────────────────────────────────────

  test("cancel() prevents a pending after() from firing", () => {
    const fn = vi.fn();
    const id = timer.after(1, fn);
    timer.cancel(id);
    timer.update(2);
    expect(fn).not.toHaveBeenCalled();
  });

  test("cancel() stops a repeating every() timer", () => {
    const fn = vi.fn();
    const id = timer.every(0.5, fn);
    timer.update(0.5);
    expect(fn).toHaveBeenCalledTimes(1);
    timer.cancel(id);
    timer.update(1);
    expect(fn).toHaveBeenCalledTimes(1); // no more calls
  });

  // ── clear() ────────────────────────────────────────────────────────────

  test("clear() removes all timers", () => {
    const a = vi.fn();
    const b = vi.fn();
    timer.after(1, a);
    timer.every(0.5, b);
    timer.clear();
    timer.update(2);
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  // ── multiple timers ────────────────────────────────────────────────────

  test("multiple independent timers fire at their own times", () => {
    const order: string[] = [];
    timer.after(0.5, () => order.push("A"));
    timer.after(1.0, () => order.push("B"));
    timer.after(1.5, () => order.push("C"));
    timer.update(0.6);
    timer.update(0.6);
    timer.update(0.6);
    expect(order).toEqual(["A", "B", "C"]);
  });
});
