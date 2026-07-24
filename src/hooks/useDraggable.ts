import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SetStateAction,
} from "react";
import { wasPointerDragged, type PointerPosition } from "../lib/pointerGesture";

interface UseDraggableOptions {
  onDragEnd?: (didDrag: boolean) => void;
}

interface UseDraggableResult {
  position: PointerPosition;
  setPosition: Dispatch<SetStateAction<PointerPosition>>;
  reclamp: () => void;
  dragHandleProps: {
    onPointerDown: (event: ReactPointerEvent) => void;
  };
}

// 以指定把手拖曳浮動面板；限制在視窗範圍內。
export function useDraggable<T extends HTMLElement>(
  initial: PointerPosition,
  panelRef: RefObject<T | null>,
  { onDragEnd }: UseDraggableOptions = {},
): UseDraggableResult {
  const [position, setPosition] = useState<PointerPosition>(initial);
  // 記住目前這段拖曳的清理函式，元件卸載或下一次拖曳開始前用來移除殘留 listener。
  const cleanupRef = useRef<(() => void) | null>(null);
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  const clamp = useCallback(
    (x: number, y: number): PointerPosition => {
      const el = panelRef.current;
      const rect = el?.getBoundingClientRect();
      const w = rect?.width ?? 0;
      const h = rect?.height ?? 0;
      const maxX = Math.max(0, window.innerWidth - w);
      const maxY = Math.max(0, window.innerHeight - h);
      return { x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) };
    },
    [panelRef],
  );

  const reclamp = useCallback(() => {
    setPosition((current) => clamp(current.x, current.y));
  }, [clamp]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      // 上一段拖曳若未正常結束（多指、pointercancel 遺漏），先清乾淨再開始。
      cleanupRef.current?.();

      const startX = e.clientX;
      const startY = e.clientY;
      const originX = position.x;
      const originY = position.y;
      let didDrag = false;

      const onMove = (ev: PointerEvent) => {
        if (wasPointerDragged({ x: startX, y: startY }, { x: ev.clientX, y: ev.clientY })) {
          didDrag = true;
        }
        setPosition(clamp(originX + (ev.clientX - startX), originY + (ev.clientY - startY)));
      };
      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        cleanupRef.current = null;
        onDragEndRef.current?.(didDrag);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
      cleanupRef.current = onUp;
    },
    [position.x, position.y, clamp],
  );

  useEffect(() => {
    window.addEventListener("resize", reclamp);
    return () => window.removeEventListener("resize", reclamp);
  }, [reclamp]);

  // 元件卸載時若仍在拖曳中，移除殘留的 document listener。
  useEffect(() => () => cleanupRef.current?.(), []);

  return { position, setPosition, reclamp, dragHandleProps: { onPointerDown } };
}
