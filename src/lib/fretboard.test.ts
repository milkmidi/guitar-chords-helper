import { describe, expect, it } from "vitest";
import { FRET_COUNT, FRETBOARD, TUNING } from "./fretboard";

const at = (string: number, fret: number) => {
  const pos = FRETBOARD.find((p) => p.string === string && p.fret === fret);
  if (!pos) throw new Error(`no position at string ${string} fret ${fret}`);
  return pos;
};

describe("FRETBOARD", () => {
  it("has 6 strings x 13 frets (0-12) = 78 positions", () => {
    expect(FRETBOARD).toHaveLength(78);
  });

  it("open strings match standard tuning", () => {
    expect(TUNING).toEqual(["E4", "B3", "G3", "D3", "A2", "E2"]);
    expect(at(1, 0).note).toBe("E4");
    expect(at(6, 0).note).toBe("E2");
  });

  it("string 2 fret 1 is C4 (chroma 0)", () => {
    expect(at(2, 1).note).toBe("C4");
    expect(at(2, 1).chroma).toBe(0);
  });

  it("fret 12 is the octave of the open string", () => {
    expect(at(1, FRET_COUNT).note).toBe("E5");
    expect(at(6, FRET_COUNT).note).toBe("E3");
  });

  it("string 3 fret 2 is A3", () => {
    expect(at(3, 2).chroma).toBe(9);
  });

  it("all chromas are 0-11", () => {
    for (const p of FRETBOARD) {
      expect(p.chroma).toBeGreaterThanOrEqual(0);
      expect(p.chroma).toBeLessThanOrEqual(11);
    }
  });
});
