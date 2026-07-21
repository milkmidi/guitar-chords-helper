import { describe, expect, it } from "vitest";
import { CHORD_CATALOG } from "./chordCatalog";
import { getChordBySymbol, KEYS } from "./chords";

describe("KEYS", () => {
  it("has 12 keys from C to B", () => {
    expect(KEYS).toEqual(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]);
  });
});

describe("getChordBySymbol", () => {
  it("C major = C E G", () => {
    const info = getChordBySymbol("C", "major");
    expect(info.notes).toEqual(["C", "E", "G"]);
    expect(info.chromas).toEqual([0, 4, 7]);
    expect(info.root).toBe("C");
    expect(info.rootChroma).toBe(0);
  });

  it("C minor spells Eb (not D#)", () => {
    expect(getChordBySymbol("C", "minor").notes).toEqual(["C", "Eb", "G"]);
  });

  it("A 7 = A C# E G", () => {
    expect(getChordBySymbol("A", "7").notes).toEqual(["A", "C#", "E", "G"]);
  });

  it("C maj7 = C E G B", () => {
    expect(getChordBySymbol("C", "maj7").notes).toEqual(["C", "E", "G", "B"]);
  });

  it("C 6/9 = C E G A D", () => {
    expect(getChordBySymbol("C", "6/9").notes).toEqual(["C", "E", "G", "A", "D"]);
  });

  it("C dim = C Eb Gb", () => {
    expect(getChordBySymbol("C", "dim").notes).toEqual(["C", "Eb", "Gb"]);
  });

  it("每個 key × catalog 和弦都能解出音（≥2 音、chroma 合法）", () => {
    for (const key of KEYS) {
      for (const { symbol } of CHORD_CATALOG) {
        const info = getChordBySymbol(key, symbol);
        expect(info.notes.length).toBeGreaterThanOrEqual(2);
        for (const c of info.chromas) {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(11);
        }
      }
    }
  });
});
