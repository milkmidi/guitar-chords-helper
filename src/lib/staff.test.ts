import { describe, expect, it } from "vitest";
import { isTrebleClef, parseSpelledNote } from "./staff";

describe("parseSpelledNote", () => {
  it("自然音沒有臨時記號", () => {
    expect(parseSpelledNote("C4")).toEqual({ key: "c/4", accidental: null });
  });

  it("升記號", () => {
    expect(parseSpelledNote("F♯4")).toEqual({ key: "f#/4", accidental: "#" });
  });

  it("降記號", () => {
    expect(parseSpelledNote("E♭4")).toEqual({ key: "eb/4", accidental: "b" });
  });

  it("重降記號（B♭♭ → bbb/4, 臨時記號 bb）", () => {
    expect(parseSpelledNote("B♭♭4")).toEqual({ key: "bbb/4", accidental: "bb" });
  });

  it("保留八度數字", () => {
    expect(parseSpelledNote("G♯5")).toEqual({ key: "g#/5", accidental: "#" });
    expect(parseSpelledNote("A2")).toEqual({ key: "a/2", accidental: null });
  });
});

describe("isTrebleClef", () => {
  it("中央 C（60）以上為高音譜", () => {
    expect(isTrebleClef(60)).toBe(true);
    expect(isTrebleClef(72)).toBe(true);
  });

  it("中央 C 以下為低音譜", () => {
    expect(isTrebleClef(59)).toBe(false);
    expect(isTrebleClef(36)).toBe(false);
  });
});
