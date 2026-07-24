import { describe, expect, it } from "vitest";
import {
  transitionMetronomePanel,
  wasCompactPanelDragged,
  type MetronomePanelMode,
} from "./metronomePanel";

describe("transitionMetronomePanel", () => {
  it.each([
    ["closed", "open", "expanded"],
    ["expanded", "minimize", "compact"],
    ["compact", "expand", "expanded"],
    ["expanded", "close", "closed"],
    ["compact", "close", "closed"],
  ] satisfies [MetronomePanelMode, "open" | "minimize" | "expand" | "close", MetronomePanelMode][])(
    "%s + %s → %s",
    (mode, action, expected) => {
      expect(transitionMetronomePanel(mode, action)).toBe(expected);
    },
  );
});

describe("wasCompactPanelDragged", () => {
  it("treats movement within 6px as a tap", () => {
    expect(wasCompactPanelDragged({ x: 10, y: 10 }, { x: 14, y: 14 })).toBe(false);
  });

  it("treats movement beyond 6px as a drag", () => {
    expect(wasCompactPanelDragged({ x: 10, y: 10 }, { x: 17, y: 10 })).toBe(true);
  });
});
