import { useEffect, useRef } from "react";
import { shouldHandleShortcutEvent } from "./shortcutGuard";

export interface ArrowHandlers {
  onLeft?: () => void;
  onRight?: () => void;
  onUp?: () => void;
  onDown?: () => void;
}

// 方向鍵循環：←/→、↑/↓ 各綁一個 handler（可選）。忽略修飾鍵與輸入框中的按鍵；
// 有處理到就 preventDefault（避免 ↑/↓ 捲動頁面）。事件監聽在瀏覽器手動驗證。
export function useArrowCycle(handlers: ArrowHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers; // 保存最新 handler，避免每次 render 重新訂閱或抓到過期 closure

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!shouldHandleShortcutEvent(e)) return;
      const h = ref.current;
      const fn =
        e.key === "ArrowLeft"
          ? h.onLeft
          : e.key === "ArrowRight"
            ? h.onRight
            : e.key === "ArrowUp"
              ? h.onUp
              : e.key === "ArrowDown"
                ? h.onDown
                : undefined;
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
