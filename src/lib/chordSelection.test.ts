import { describe, expect, it } from "vitest";
import {
  cycleChordCategory,
  cycleChordSymbol,
  initialChordSelection,
  selectChordCategory,
  selectChordSymbol,
} from "./chordSelection";

describe("initialChordSelection", () => {
  it("由 initial symbol 建立一致的分類與和弦狀態", () => {
    expect(initialChordSelection()).toEqual({ category: "major", symbol: "major" });
    expect(initialChordSelection("7b9")).toEqual({ category: "altered", symbol: "7b9" });
    expect(initialChordSelection("missing")).toEqual({ category: "major", symbol: "major" });
  });
});

describe("selection transitions", () => {
  it("切分類時選第一個和弦，選 symbol 時同步分類", () => {
    const initial = initialChordSelection();
    expect(selectChordCategory(initial, "minor")).toEqual({
      category: "minor",
      symbol: "minor",
    });
    expect(selectChordSymbol(initial, "7b9")).toEqual({
      category: "altered",
      symbol: "7b9",
    });
    expect(selectChordSymbol(initial, "missing")).toEqual(initial);
  });

  it("循環和弦與分類時不會進入 all 狀態", () => {
    const altered = initialChordSelection("alt7");
    expect(cycleChordSymbol(altered, 1)).toEqual({ category: "altered", symbol: "7b5" });
    expect(cycleChordCategory(initialChordSelection(), -1)).toEqual({
      category: "altered",
      symbol: "7b5",
    });
  });
});
