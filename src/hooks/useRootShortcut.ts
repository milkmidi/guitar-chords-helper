import { useEffect } from "react";
import type { Key } from "../lib/chords";

// 數字鍵 1–7 對應七個自然音根音（C D E F G A B）；升記號根音仍用點選。
const NUMBER_ROOTS: Key[] = ["C", "D", "E", "F", "G", "A", "B"];

export function rootForNumberKey(key: string): Key | null {
  const n = Number(key);
  if (!Number.isInteger(n) || n < 1 || n > NUMBER_ROOTS.length) return null;
  return NUMBER_ROOTS[n - 1];
}

// 監聽數字鍵切換根音。掛載此 hook 的元件在當前路由時才作用，
// 所以兩個分頁各自使用、互不干擾。事件監聽在瀏覽器手動驗證。
export function useRootShortcut(onSelect: (key: Key) => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      const root = rootForNumberKey(e.key);
      if (root) onSelect(root);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSelect]);
}
