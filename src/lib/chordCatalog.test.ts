import { Chord } from "tonal";
import { describe, expect, it } from "vitest";
import {
  CHORD_CATALOG,
  CHORD_CATEGORIES,
  categoryForSymbol,
  chordsInCategory,
  normalizeChordQuery,
  searchChordCatalog,
  toGlyph,
  type ChordCategory,
} from "./chordCatalog";

describe("CHORD_CATALOG", () => {
  it("每個 symbol 都能被 tonal 解析（不是空和弦）", () => {
    const unresolved = CHORD_CATALOG.filter((c) => Chord.getChord(c.symbol, "C").empty);
    expect(unresolved.map((c) => c.symbol)).toEqual([]);
  });

  it("symbol 不重複", () => {
    const symbols = CHORD_CATALOG.map((c) => c.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it("每個分類都至少有一個和弦", () => {
    const cats: ChordCategory[] = ["major", "minor", "dominant", "diminished", "augmented", "altered"];
    for (const cat of cats) {
      expect(chordsInCategory(cat).length).toBeGreaterThan(0);
    }
  });

  it("label 只用字型升降符號，不含 ASCII 的 # 或 b 當升降", () => {
    for (const c of CHORD_CATALOG) {
      expect(c.label).not.toContain("#");
    }
  });
});

describe("chordsInCategory", () => {
  it("指定分類只回傳該分類", () => {
    const dom = chordsInCategory("dominant");
    expect(dom.every((c) => c.category === "dominant")).toBe(true);
  });
});

describe("categoryForSymbol", () => {
  it("每個 catalog symbol 都能找出正確所屬分類", () => {
    for (const chord of CHORD_CATALOG) {
      expect(categoryForSymbol(chord.symbol)).toBe(chord.category);
    }
    expect(categoryForSymbol("missing")).toBeUndefined();
  });
});

describe("searchChordCatalog", () => {
  it("正規化大小寫與升降符號後依 catalog 順序搜尋", () => {
    expect(normalizeChordQuery("  ♭9 ")).toBe("b9");
    expect(searchChordCatalog("b9").map((chord) => chord.symbol)).toEqual(["7b9"]);
    expect(searchChordCatalog("♭9").map((chord) => chord.symbol)).toEqual(["7b9"]);
    expect(searchChordCatalog("MMAJ").map((chord) => chord.symbol)).toEqual(["mMaj7"]);
    expect(searchChordCatalog("sus").map((chord) => chord.symbol)).toEqual([
      "sus2",
      "sus4",
      "7sus4",
    ]);
    expect(searchChordCatalog("not-a-chord")).toEqual([]);
  });
});

describe("CHORD_CATEGORIES", () => {
  it("只包含六個正式分類，不把 Show All 當成狀態", () => {
    expect(CHORD_CATEGORIES).toEqual([
      { id: "major", label: "Major" },
      { id: "minor", label: "Minor" },
      { id: "dominant", label: "Dominant" },
      { id: "diminished", label: "Diminished" },
      { id: "augmented", label: "Augmented" },
      { id: "altered", label: "Altered" },
    ]);
  });
});

describe("toGlyph", () => {
  it("把 ASCII 升降換成字型符號", () => {
    expect(toGlyph("C7b5")).toBe("C7♭5");
    expect(toGlyph("C7#9")).toBe("C7♯9");
    expect(toGlyph("Cmaj7")).toBe("Cmaj7");
  });
});
