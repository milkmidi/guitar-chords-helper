import { Chord } from "tonal";
import { describe, expect, it } from "vitest";
import {
  CHORD_CATALOG,
  CHORD_CATEGORIES,
  chordsInCategory,
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
  it("'all' 回傳全部", () => {
    expect(chordsInCategory("all")).toHaveLength(CHORD_CATALOG.length);
  });

  it("指定分類只回傳該分類", () => {
    const dom = chordsInCategory("dominant");
    expect(dom.every((c) => c.category === "dominant")).toBe(true);
  });
});

describe("CHORD_CATEGORIES", () => {
  it("第一個是 Show All", () => {
    expect(CHORD_CATEGORIES[0]).toEqual({ id: "all", label: "Show All" });
  });
});

describe("toGlyph", () => {
  it("把 ASCII 升降換成字型符號", () => {
    expect(toGlyph("C7b5")).toBe("C7♭5");
    expect(toGlyph("C7#9")).toBe("C7♯9");
    expect(toGlyph("Cmaj7")).toBe("Cmaj7");
  });
});
