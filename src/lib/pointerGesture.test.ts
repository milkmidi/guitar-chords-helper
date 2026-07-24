import { describe, expect, it } from "vitest";
import { wasPointerDragged } from "./pointerGesture";

describe("wasPointerDragged", () => {
  it("treats movement within 6px as a tap", () => {
    expect(wasPointerDragged({ x: 10, y: 10 }, { x: 14, y: 14 })).toBe(false);
  });

  it("treats movement beyond 6px as a drag", () => {
    expect(wasPointerDragged({ x: 10, y: 10 }, { x: 17, y: 10 })).toBe(true);
  });
});
