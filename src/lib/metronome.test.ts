import { describe, expect, it } from "vitest";
import { BPM_MAX, BPM_MIN, bpmFromAngle, bpmFromTaps, clampBpm, getDegree } from "./metronome";

describe("clampBpm", () => {
  it("clamps below the minimum", () => expect(clampBpm(10)).toBe(BPM_MIN));
  it("clamps above the maximum", () => expect(clampBpm(500)).toBe(BPM_MAX));
  it("passes through an in-range value", () => expect(clampBpm(120)).toBe(120));
});

describe("bpmFromAngle", () => {
  it("maps the start angle (45) to BPM_MIN", () => expect(bpmFromAngle(45)).toBe(30));
  it("maps the end angle (315) to BPM_MAX", () => expect(bpmFromAngle(315)).toBe(300));
  it("maps the mid angle (180) to the midpoint BPM", () => expect(bpmFromAngle(180)).toBe(165));
  it("clamps angles below the start", () => expect(bpmFromAngle(0)).toBe(30));
  it("clamps angles above the end", () => expect(bpmFromAngle(400)).toBe(300));
});

describe("getDegree", () => {
  // center at (100, 100)
  it("returns 270 for a point directly to the right", () =>
    expect(getDegree(200, 100, 100, 100)).toBe(270));
  it("returns 90 for a point directly to the left", () =>
    expect(getDegree(0, 100, 100, 100)).toBe(90));
  it("returns 180 for a point directly above", () =>
    expect(getDegree(100, 0, 100, 100)).toBe(180));
});

describe("bpmFromTaps", () => {
  it("returns null with fewer than 2 taps", () => expect(bpmFromTaps([1000])).toBeNull());
  it("averages even intervals to a BPM", () =>
    expect(bpmFromTaps([0, 500, 1000, 1500])).toBe(120));
  it("rejects a result above the range", () => expect(bpmFromTaps([0, 100])).toBeNull());
  it("rejects a result below the range", () => expect(bpmFromTaps([0, 3000])).toBeNull());
});
