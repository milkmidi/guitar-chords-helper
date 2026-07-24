import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

export interface Position {
  x: number;
  y: number;
}

// 以 header 為把手拖曳浮動面板；限制在視窗範圍內。
export function useDraggable<T extends HTMLElement>(initial: Position, panelRef: RefObject<T | null>) {
  const [position, setPosition] = useState<Position>(initial);
  // 記住目前這段拖曳的清理函式，元件卸載或下一次拖曳開始前用來移除殘留 listener。
  const cleanupRef = useRef<(() => void) | null>(null);

  const clamp = useCallback(
    (x: number, y: number): Position => {
      const el = panelRef.current;
      const w = el?.offsetWidth ?? 0;
      const h = el?.offsetHeight ?? 0;
      const maxX = Math.max(0, window.innerWidth - w);
      const maxY = Math.max(0, window.innerHeight - h);
      return { x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) };
    },
    [panelRef],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault();
      // 上一段拖曳若未正常結束（多指、pointercancel 遺漏），先清乾淨再開始。
      cleanupRef.current?.();

      const startX = e.clientX;
      const startY = e.clientY;
      const originX = position.x;
      const originY = position.y;

      const onMove = (ev: PointerEvent) => {
        setPosition(clamp(originX + (ev.clientX - startX), originY + (ev.clientY - startY)));
      };
      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        cleanupRef.current = null;
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
      cleanupRef.current = onUp;
    },
    [position.x, position.y, clamp],
  );

  // 元件卸載時若仍在拖曳中，移除殘留的 document listener。
  useEffect(() => () => cleanupRef.current?.(), []);

  return { position, setPosition, dragHandleProps: { onPointerDown } };
}
