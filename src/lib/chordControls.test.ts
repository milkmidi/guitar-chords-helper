import { describe, expect, it } from "vitest";
import { cycleIndex } from "./chordControls";

describe("cycleIndex", () => {
  it("往後移動", () => {
    expect(cycleIndex(2, 9, 1)).toBe(3);
  });

  it("往前移動", () => {
    expect(cycleIndex(2, 9, -1)).toBe(1);
  });

  it("超過尾端回到開頭", () => {
    expect(cycleIndex(8, 9, 1)).toBe(0);
  });

  it("超過開頭回到尾端", () => {
    expect(cycleIndex(0, 9, -1)).toBe(8);
  });

  it("長度為 0 時回傳 0", () => {
    expect(cycleIndex(0, 0, 1)).toBe(0);
  });
});
