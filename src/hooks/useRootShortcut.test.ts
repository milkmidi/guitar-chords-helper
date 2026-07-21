import { describe, expect, it } from "vitest";
import { rootForNumberKey } from "./useRootShortcut";

describe("rootForNumberKey", () => {
  it("1–7 對應 C D E F G A B", () => {
    expect(["1", "2", "3", "4", "5", "6", "7"].map(rootForNumberKey)).toEqual([
      "C", "D", "E", "F", "G", "A", "B",
    ]);
  });

  it("範圍外的數字回傳 null", () => {
    expect(rootForNumberKey("0")).toBeNull();
    expect(rootForNumberKey("8")).toBeNull();
    expect(rootForNumberKey("9")).toBeNull();
  });

  it("非數字鍵回傳 null", () => {
    expect(rootForNumberKey("a")).toBeNull();
    expect(rootForNumberKey("Enter")).toBeNull();
    expect(rootForNumberKey("")).toBeNull();
    expect(rootForNumberKey(" ")).toBeNull();
  });
});
