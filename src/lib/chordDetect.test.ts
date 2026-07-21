import { describe, expect, it } from "vitest";
import { analyze } from "./chordDetect";

// MIDI 對照：C4 = 60，往上每半音 +1
const C4 = 60;

describe("analyze", () => {
  it("空輸入回傳 null", () => {
    expect(analyze([])).toBeNull();
  });

  it("單音標為 single note", () => {
    const res = analyze([C4]);
    expect(res).toMatchObject({ single: true, name: "C", full: "single note" });
    expect(res?.chips).toEqual(["C4"]);
    expect(res?.matches).toEqual([]);
  });

  it("C 大三和弦", () => {
    const res = analyze([C4, C4 + 4, C4 + 7]); // C E G
    expect(res?.name).toBe("C");
    expect(res?.full).toBe("C major");
    expect(res?.chips).toEqual(["C4", "E4", "G4"]);
    expect(res?.slash).toBeNull();
    expect(res?.matches).toHaveLength(1);
  });

  it("減七和弦用正確的重降記法（C°7 → C E♭ G♭ B♭♭）", () => {
    const res = analyze([C4, C4 + 3, C4 + 6, C4 + 9]);
    expect(res?.name).toBe("C°7");
    expect(res?.chips).toEqual(["C4", "E♭4", "G♭4", "B♭♭4"]);
    // 對稱和弦：四個音都能當根音
    expect(res?.matches).toHaveLength(4);
  });

  it("等音組 C6 = Am7 會同時列出", () => {
    const res = analyze([C4, C4 + 4, C4 + 7, C4 + 9]); // C E G A
    expect(res?.name).toBe("C6"); // 低音 C 為主判讀
    const labels = res?.matches.map((m) => m.label);
    expect(labels).toContain("C6");
    expect(labels).toContain("Am7");
  });

  it("轉位（低音非根音）標為斜線和弦 C/E", () => {
    const res = analyze([C4 + 4, C4 + 7, C4 + 12]); // E G C（E 在低音）
    expect(res?.name).toBe("C");
    expect(res?.slash).toBe("E");
  });

  it("無法辨識的音組標為 unknown", () => {
    const res = analyze([C4, C4 + 1]); // C + C♯
    expect(res).toMatchObject({ unknown: true, name: "?", full: "2 notes" });
    expect(res?.matches).toEqual([]);
  });
});
