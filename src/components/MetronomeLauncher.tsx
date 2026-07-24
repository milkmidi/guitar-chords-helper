import { GripVertical, PanelTopClose, X } from "lucide-react";
import { useMetronomePanel } from "../hooks/useMetronomePanel";
import Metronome from "./Metronome";
import { Metronome as MetronomeIcon } from 'lucide-react';

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
              <GripVertical size={16} strokeWidth={1.8} />
            </span>
            <span className="metronome-panel-title">節拍器</span>
            <button
              type="button"
              className="metronome-panel-compact"
              onClick={enterCompactMode}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="切換至精簡模式"
              title="只顯示節拍點"
            >
              <PanelTopClose size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="metronome-panel-close"
              onClick={closePanel}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="關閉節拍器"
            >
              <X size={18} strokeWidth={1.8} aria-hidden="true" />
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
          <MetronomeIcon />
        </button>
      )}
    </>
  );
}
