import test from "node:test";
import assert from "node:assert/strict";
import { NavigationGuard } from "../src/systems/NavigationGuard.ts";

test("Back preserves a running game, retries reuse history, and leaving releases the guard", () => {
  const win = new EventTarget();
  const doc = new EventTarget();
  const entries: unknown[] = [{ source: "original" }];
  let index = 0;
  const history = {
    get state() { return entries[index]; },
    pushState(state: unknown) { entries.splice(++index, entries.length, state); },
    back() { if (index > 0) { index--; win.dispatchEvent(new Event("popstate")); } },
  };
  Object.assign(win, { history, location: { href: "https://example.test/game" }, innerWidth: 390 });
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "window", { configurable: true, value: win });
  Object.defineProperty(globalThis, "document", { configurable: true, value: doc });
  let guard: NavigationGuard | undefined;
  try {
    let pauses = 0;
    guard = new NavigationGuard(() => pauses++);
    assert.equal(entries.length, 2);
    for (let i = 0; i < 5; i++) history.back();
    assert.equal(pauses, 5);
    assert.equal(index, 1);
    assert.equal(entries.length, 2);
    assert.deepEqual(entries[0], { source: "original" });

    const touch = (x: number, cancelable = true) => {
      const event = new Event("touchstart", { cancelable });
      Object.assign(event, { touches: [{ clientX: x }] });
      doc.dispatchEvent(event);
      return event.defaultPrevented;
    };
    assert.equal(touch(5), true);
    assert.equal(touch(385), true);
    assert.equal(touch(195), false);
    assert.equal(touch(5, false), false);

    guard.destroy();
    guard = new NavigationGuard(() => pauses++);
    assert.equal(entries.length, 2);
    history.back();
    assert.equal(pauses, 6, "only the new scene handles Back");
    guard.destroy();
    history.back();
    assert.equal(index, 0);
    assert.equal(pauses, 6);
    assert.equal(touch(5), false, "edge gestures are released outside gameplay");
  } finally {
    guard?.destroy();
    if (windowDescriptor) Object.defineProperty(globalThis, "window", windowDescriptor);
    else Reflect.deleteProperty(globalThis, "window");
    if (documentDescriptor) Object.defineProperty(globalThis, "document", documentDescriptor);
    else Reflect.deleteProperty(globalThis, "document");
  }
});
