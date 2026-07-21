import { describe, expect, it } from "vitest";
import { CHORD_CATALOG } from "./chordCatalog";
import { KEYS } from "./chords";
import { getVoicings } from "./voicings";

// catalog 中沒有吉他指法的和弦（chords-db 無資料，getVoicings 回傳 []）
const NO_GUITAR_VOICING = ["m13", "13#11"];
const guitarSymbols = CHORD_CATALOG.map((c) => c.symbol).filter(
  (s) => !NO_GUITAR_VOICING.includes(s),
);

describe("getVoicings", () => {
  it("C major first voicing is the open-position shape", () => {
    const voicings = getVoicings("C", "major");
    expect(voicings.length).toBeGreaterThanOrEqual(1);
    expect(voicings[0].frets).toEqual([-1, 3, 2, 0, 1, 0]);
    expect(voicings[0].baseFret).toBe(1);
  });

  it("every voicing has 6 frets, 6 fingers, and non-empty midi", () => {
    for (const key of KEYS) {
      for (const symbol of guitarSymbols) {
        for (const v of getVoicings(key, symbol)) {
          expect(v.frets).toHaveLength(6);
          expect(v.fingers).toHaveLength(6);
          expect(v.midi.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("sharp keys map to flat data (D#, G#, A#)", () => {
    for (const key of ["D#", "G#", "A#"] as const) {
      expect(getVoicings(key, "major").length).toBeGreaterThanOrEqual(1);
    }
  });

  it("all 12 keys x guitar-supported chords have at least one voicing", () => {
    for (const key of KEYS) {
      for (const symbol of guitarSymbols) {
        expect(getVoicings(key, symbol).length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("沒有吉他指法的和弦回傳空陣列", () => {
    for (const symbol of NO_GUITAR_VOICING) {
      expect(getVoicings("C", symbol)).toEqual([]);
    }
  });
});
