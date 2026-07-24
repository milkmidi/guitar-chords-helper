export type MetronomePanelMode = "closed" | "expanded" | "compact";
export type MetronomePanelAction = "open" | "minimize" | "expand" | "close";

interface PointerPosition {
  x: number;
  y: number;
}

const COMPACT_DRAG_THRESHOLD = 6;

export function transitionMetronomePanel(
  mode: MetronomePanelMode,
  action: MetronomePanelAction,
): MetronomePanelMode {
  if (action === "close") return "closed";
  if (action === "open" && mode === "closed") return "expanded";
  if (action === "minimize" && mode === "expanded") return "compact";
  if (action === "expand" && mode === "compact") return "expanded";
  return mode;
}

export function wasCompactPanelDragged(
  start: PointerPosition,
  current: PointerPosition,
): boolean {
  return Math.hypot(current.x - start.x, current.y - start.y) > COMPACT_DRAG_THRESHOLD;
}
