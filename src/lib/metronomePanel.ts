export type MetronomePanelMode = "closed" | "expanded" | "compact";
export type MetronomePanelAction = "open" | "compact" | "expand" | "close";

export function transitionMetronomePanel(
  mode: MetronomePanelMode,
  action: MetronomePanelAction,
): MetronomePanelMode {
  if (action === "close") return "closed";
  if (action === "open" && mode === "closed") return "expanded";
  if (action === "compact" && mode === "expanded") return "compact";
  if (action === "expand" && mode === "compact") return "expanded";
  return mode;
}
