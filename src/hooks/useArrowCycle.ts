import { useEffect, useRef } from "react";

// 在長度為 length 的清單中，從 current 往 dir 方向移動並首尾循環。
export function cycleIndex(current: number, length: number, dir: number): number {
  if (length <= 0) return 0;
  return (((current + dir) % length) + length) % length;
}

export interface ArrowHandlers {
  onLeft?: () => void;
  onRight?: () => void;
  onUp?: () => void;
  onDown?: () => void;
}

// 方向鍵循環：←/→、↑/↓ 各綁一個 handler（可選）。忽略修飾鍵與輸入框中的按鍵；
// 有處理到就 preventDefault（避免 ↑/↓ 捲動頁面）。事件監聽在瀏覽器手動驗證。
export function useArrowCycle(handlers: ArrowHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers; // 保存最新 handler，避免每次 render 重新訂閱或抓到過期 closure

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
