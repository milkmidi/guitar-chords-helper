import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  transitionMetronomePanel,
  type MetronomePanelAction,
  type MetronomePanelMode,
} from "../lib/metronomePanel";
import { type PointerPosition } from "../lib/pointerGesture";
import { useDraggable } from "./useDraggable";

interface UseMetronomePanelResult {
  panelRef: RefObject<HTMLDivElement | null>;
  position: PointerPosition;
  open: boolean;
  compact: boolean;
  dragHandleProps: {
    onPointerDown: (event: ReactPointerEvent) => void;
  };
  closePanel: () => void;
  enterCompactMode: () => void;
  toggleFromFab: () => void;
  handleCompactActivate: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function useMetronomePanel(): UseMetronomePanelResult {
  const [mode, setMode] = useState<MetronomePanelMode>("closed");
  const panelRef = useRef<HTMLDivElement>(null);
  const placed = useRef(false);
  const compactWasDragged = useRef(false);
  const transition = useCallback((action: MetronomePanelAction) => {
    setMode((current) => transitionMetronomePanel(current, action));
  }, []);
  const { position, setPosition, reclamp, dragHandleProps } = useDraggable(
    { x: 24, y: 24 },
    panelRef,
    {
      onDragEnd: (didDrag) => {
        compactWasDragged.current = didDrag;
      },
    },
  );
  const open = mode !== "closed";
  const compact = mode === "compact";

  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;

    if (!placed.current) {
      const { width, height } = panelRef.current.getBoundingClientRect();
      setPosition({
        x: Math.max(16, window.innerWidth - width - 24),
        y: Math.max(16, window.innerHeight - height - 96),
      });
      placed.current = true;
      return;
    }

    reclamp();
  }, [mode, open, reclamp, setPosition]);

  const closePanel = useCallback(() => transition("close"), [transition]);
  const openPanel = useCallback(() => transition("open"), [transition]);
  const enterCompactMode = useCallback(() => transition("compact"), [transition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePanel, open]);

  const toggleFromFab = useCallback(() => {
    if (open) {
      closePanel();
      return;
    }
    openPanel();
  }, [closePanel, open, openPanel]);

  const handleCompactActivate = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const activatedByKeyboard = event.detail === 0;
      if (activatedByKeyboard || !compactWasDragged.current) {
        transition("expand");
      }
      compactWasDragged.current = false;
    },
    [transition],
  );

  return {
    panelRef,
    position,
    open,
    compact,
    dragHandleProps,
    closePanel,
    enterCompactMode,
    toggleFromFab,
    handleCompactActivate,
  };
}
