import { describe, expect, it } from "vitest";
import { shouldHandleGlobalShortcut, type ShortcutContext } from "./keyboard";

const BASE_CONTEXT: ShortcutContext = {
  defaultPrevented: false,
  isComposing: false,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  targetTagName: "DIV",
  targetIsContentEditable: false,
};

describe("shouldHandleGlobalShortcut", () => {
  it("一般頁面元素允許全域快捷鍵", () => {
    expect(shouldHandleGlobalShortcut(BASE_CONTEXT)).toBe(true);
  });

  it.each(["INPUT", "TEXTAREA", "SELECT"])("忽略 %s 的輸入事件", (targetTagName) => {
    expect(shouldHandleGlobalShortcut({ ...BASE_CONTEXT, targetTagName })).toBe(false);
  });

  it("忽略 contenteditable、IME、已處理事件與修飾鍵", () => {
    expect(
      shouldHandleGlobalShortcut({ ...BASE_CONTEXT, targetIsContentEditable: true }),
    ).toBe(false);
    expect(shouldHandleGlobalShortcut({ ...BASE_CONTEXT, isComposing: true })).toBe(false);
    expect(shouldHandleGlobalShortcut({ ...BASE_CONTEXT, defaultPrevented: true })).toBe(false);
    expect(shouldHandleGlobalShortcut({ ...BASE_CONTEXT, metaKey: true })).toBe(false);
    expect(shouldHandleGlobalShortcut({ ...BASE_CONTEXT, ctrlKey: true })).toBe(false);
    expect(shouldHandleGlobalShortcut({ ...BASE_CONTEXT, altKey: true })).toBe(false);
  });
});
