import { useMetronomePanel } from "../hooks/useMetronomePanel";
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
  const {
    panelRef,
    position,
    open,
    compact,
    dragHandleProps,
    closePanel,
    enterCompactMode,
    toggleFromFab,
    handleCompactActivate,
  } = useMetronomePanel();

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
              onClick={enterCompactMode}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="切換至精簡模式"
            >
              <span aria-hidden="true">−</span>
            </button>
            <button
              type="button"
              className="metronome-panel-close"
              onClick={closePanel}
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
          onClick={toggleFromFab}
          aria-pressed={open}
          aria-label={open ? "關閉節拍器" : "開啟節拍器"}
        >
          {MusicIcon}
        </button>
      )}
    </>
  );
}
