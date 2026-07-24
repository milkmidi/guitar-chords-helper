interface PointerPosition {
  x: number;
  y: number;
}

const DEFAULT_DRAG_THRESHOLD = 6;

export function wasPointerDragged(
  start: PointerPosition,
  current: PointerPosition,
  threshold = DEFAULT_DRAG_THRESHOLD,
): boolean {
  return Math.hypot(current.x - start.x, current.y - start.y) > threshold;
}
