import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { useDraggable } from "../hooks/useDraggable";
import {
  transitionMetronomePanel,
  type MetronomePanelAction,
  type MetronomePanelMode,
} from "../lib/metronomePanel";
import Metronome from "./Metronome";

const MusicIcon = (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path
      d="M9 18V5l10-2v13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6" cy="18" r="3" fill="currentColor" />
    <circle cx="16" cy="16" r="3" fill="currentColor" />
  </svg>
);
const CloseIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export default function MetronomeLauncher() {
  const [mode, setMode] = useState<MetronomePanelMode>("closed");
  const panelRef = useRef<HTMLDivElement>(null);
  const placed = useRef(false);
  const compactDragEnded = useRef(false);
  const transition = useCallback((action: MetronomePanelAction) => {
    setMode((current) => transitionMetronomePanel(current, action));
  }, []);
  const { position, setPosition, reclamp, dragHandleProps } = useDraggable(
    { x: 24, y: 24 },
    panelRef,
    {
      onDragEnd: (didDrag) => {
        compactDragEnded.current = didDrag;
      },
    },
  );
  const open = mode !== "closed";
  const compact = mode === "compact";

  // 第一次開啟時，量測面板尺寸並放到右下角（FAB 附近）。
  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;

    if (!placed.current) {
      const { width: w, height: h } = panelRef.current.getBoundingClientRect();
      setPosition({
        x: Math.max(16, window.innerWidth - w - 24),
        y: Math.max(16, window.innerHeight - h - 96),
      });
      placed.current = true;
      return;
    }

    reclamp();
  }, [mode, open, reclamp, setPosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") transition("close");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, transition]);

  const handleCompactActivate = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const activatedByKeyboard = event.detail === 0;
      if (activatedByKeyboard || !compactDragEnded.current) {
        transition("expand");
      }
      compactDragEnded.current = false;
    },
    [transition],
  );

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          className={`metronome-panel${compact ? " is-compact" : ""}`}
          style={{ left: position.x, top: position.y }}
          role={compact ? undefined : "dialog"}
          aria-label={compact ? undefined : "節拍器"}
        >
          <div className="metronome-panel-header" hidden={compact} {...dragHandleProps}>
            <span className="metronome-panel-grip" aria-hidden="true">
              ⠿
            </span>
            <span className="metronome-panel-title">節拍器</span>
            <button
              type="button"
              className="metronome-panel-minimize"
              onClick={() => transition("minimize")}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="縮小節拍器"
            >
              <span aria-hidden="true">−</span>
            </button>
            <button
              type="button"
              className="metronome-panel-close"
              onClick={() => transition("close")}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="關閉節拍器"
            >
              {CloseIcon}
            </button>
          </div>
          <Metronome
            compact={compact}
            onCompactActivate={handleCompactActivate}
            compactDragHandleProps={dragHandleProps}
          />
        </div>
      )}
      {!compact && (
        <button
          type="button"
          className="metronome-fab"
          onClick={() => transition(open ? "close" : "open")}
          aria-pressed={open}
          aria-label={open ? "關閉節拍器" : "開啟節拍器"}
        >
          {MusicIcon}
        </button>
      )}
    </>
  );
}
