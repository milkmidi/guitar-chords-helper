import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

export interface Position {
  x: number;
  y: number;
}

interface DragOrigin {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

// 以 header 為把手拖曳浮動面板；限制在視窗範圍內。
export function useDraggable<T extends HTMLElement>(initial: Position, panelRef: RefObject<T | null>) {
  const [position, setPosition] = useState<Position>(initial);
  const origin = useRef<DragOrigin | null>(null);
  const moveRef = useRef<(e: PointerEvent) => void>(() => {});
  const upRef = useRef<() => void>(() => {});

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
      origin.current = { startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y };

      const onMove = (ev: PointerEvent) => {
        const o = origin.current;
        if (!o) return;
        setPosition(clamp(o.originX + (ev.clientX - o.startX), o.originY + (ev.clientY - o.startY)));
      };
      const onUp = () => {
        origin.current = null;
        document.removeEventListener("pointermove", moveRef.current);
        document.removeEventListener("pointerup", upRef.current);
      };
      moveRef.current = onMove;
      upRef.current = onUp;
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [position.x, position.y, clamp],
  );

  return { position, setPosition, dragHandleProps: { onPointerDown } };
}
