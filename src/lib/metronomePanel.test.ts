import { describe, expect, it } from "vitest";
import {
  transitionMetronomePanel,
  type MetronomePanelMode,
} from "./metronomePanel";

describe("transitionMetronomePanel", () => {
  it.each([
    ["closed", "open", "expanded"],
    ["expanded", "compact", "compact"],
    ["compact", "expand", "expanded"],
    ["expanded", "close", "closed"],
    ["compact", "close", "closed"],
  ] satisfies [MetronomePanelMode, "open" | "compact" | "expand" | "close", MetronomePanelMode][])(
    "%s + %s → %s",
    (mode, action, expected) => {
      expect(transitionMetronomePanel(mode, action)).toBe(expected);
    },
  );
});
