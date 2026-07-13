import { describe, expect, it } from "vitest";
import { MEASURE_COUNT, measureDuration, nextMeasureIndex } from "./player";

describe("measureDuration", () => {
  it("BPM 60 時一小節（4 拍）為 4 秒", () => {
    expect(measureDuration(60)).toBe(4);
  });

  it("BPM 120 時為 2 秒", () => {
    expect(measureDuration(120)).toBe(2);
  });

  it("涵蓋拉桿邊界 50 與 150", () => {
    expect(measureDuration(50)).toBeCloseTo(4.8);
    expect(measureDuration(150)).toBeCloseTo(1.6);
  });
});

describe("nextMeasureIndex", () => {
  it("依序推進", () => {
    expect(nextMeasureIndex(0, MEASURE_COUNT)).toBe(1);
    expect(nextMeasureIndex(2, MEASURE_COUNT)).toBe(3);
  });

  it("最後一小節回到 0（循環）", () => {
    expect(nextMeasureIndex(3, MEASURE_COUNT)).toBe(0);
  });
});
