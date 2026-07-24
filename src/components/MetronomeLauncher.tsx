import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDraggable } from "../hooks/useDraggable";
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
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const placed = useRef(false);
  const { position, setPosition, dragHandleProps } = useDraggable({ x: 24, y: 24 }, panelRef);

  // 第一次開啟時，量測面板尺寸並放到右下角（FAB 附近）。
  useLayoutEffect(() => {
    if (open && !placed.current && panelRef.current) {
      const w = panelRef.current.offsetWidth;
      const h = panelRef.current.offsetHeight;
      setPosition({
        x: Math.max(16, window.innerWidth - w - 24),
        y: Math.max(16, window.innerHeight - h - 96),
      });
      placed.current = true;
    }
  }, [open, setPosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          className="metronome-panel"
          style={{ left: position.x, top: position.y }}
          role="dialog"
          aria-label="節拍器"
        >
          <div className="metronome-panel-header" {...dragHandleProps}>
            <span className="metronome-panel-grip" aria-hidden="true">
              ⠿
            </span>
            <span className="metronome-panel-title">節拍器</span>
            <button
              type="button"
              className="metronome-panel-close"
              onClick={() => setOpen(false)}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="關閉節拍器"
            >
              {CloseIcon}
            </button>
          </div>
          <Metronome />
        </div>
      )}
      <button
        type="button"
        className="metronome-fab"
        onClick={() => setOpen((o) => !o)}
        aria-pressed={open}
        aria-label={open ? "關閉節拍器" : "開啟節拍器"}
      >
        {MusicIcon}
      </button>
    </>
  );
}
