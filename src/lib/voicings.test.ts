import { describe, expect, it } from "vitest";
import { CHORD_TYPES, KEYS } from "./chords";
import { getVoicings } from "./voicings";

describe("getVoicings", () => {
  it("C major first voicing is the open-position shape", () => {
    const voicings = getVoicings("C", "major");
    expect(voicings.length).toBeGreaterThanOrEqual(1);
    expect(voicings[0].frets).toEqual([-1, 3, 2, 0, 1, 0]);
    expect(voicings[0].baseFret).toBe(1);
  });

  it("every voicing has 6 frets, 6 fingers, and non-empty midi", () => {
    for (const key of KEYS) {
      for (const type of CHORD_TYPES) {
        for (const v of getVoicings(key, type.id)) {
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

  it("all 12 keys x 9 types have at least one voicing", () => {
    for (const key of KEYS) {
      for (const type of CHORD_TYPES) {
        expect(getVoicings(key, type.id).length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
