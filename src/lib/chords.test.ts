import { describe, expect, it } from "vitest";
import { CHORD_TYPES, getChordInfo, KEYS } from "./chords";

describe("KEYS / CHORD_TYPES", () => {
  it("has 12 keys from C to B", () => {
    expect(KEYS).toEqual(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]);
  });

  it("has the 9 chord types", () => {
    expect(CHORD_TYPES.map((t) => t.id)).toEqual([
      "major", "minor", "7", "maj7", "m7", "sus2", "sus4", "dim", "aug",
    ]);
  });
});

describe("getChordInfo", () => {
  it("C major = C E G", () => {
    const info = getChordInfo("C", "major");
    expect(info.notes).toEqual(["C", "E", "G"]);
    expect(info.chromas).toEqual([0, 4, 7]);
    expect(info.root).toBe("C");
    expect(info.rootChroma).toBe(0);
  });

  it("C minor spells Eb (not D#)", () => {
    expect(getChordInfo("C", "minor").notes).toEqual(["C", "Eb", "G"]);
  });

  it("A 7 = A C# E G", () => {
    expect(getChordInfo("A", "7").notes).toEqual(["A", "C#", "E", "G"]);
  });

  it("C maj7 = C E G B", () => {
    expect(getChordInfo("C", "maj7").notes).toEqual(["C", "E", "G", "B"]);
  });

  it("C sus4 = C F G", () => {
    expect(getChordInfo("C", "sus4").notes).toEqual(["C", "F", "G"]);
  });

  it("C dim = C Eb Gb", () => {
    expect(getChordInfo("C", "dim").notes).toEqual(["C", "Eb", "Gb"]);
  });

  it("C aug = C E G#", () => {
    expect(getChordInfo("C", "aug").notes).toEqual(["C", "E", "G#"]);
  });

  it("every key × type produces at least 3 notes with valid chromas", () => {
    for (const key of KEYS) {
      for (const type of CHORD_TYPES) {
        const info = getChordInfo(key, type.id);
        expect(info.notes.length).toBeGreaterThanOrEqual(3);
        for (const c of info.chromas) {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(11);
        }
      }
    }
  });
});
