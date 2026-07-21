import { useState } from "react";
import type { Track, TrackCell } from "../lib/player";
import ChordDiagram from "./ChordDiagram";

interface Props {
  track: Track;
  currentMeasure: number | null; // null = 未播放，不高亮
  onDropCell: (index: number, cell: TrackCell) => void;
  onClearCell: (index: number) => void;
}

// 解析 dataTransfer 的 JSON payload；外部拖入的東西一律忽略
function parseCell(data: string): TrackCell | null {
  try {
    const parsed: unknown = JSON.parse(data);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as TrackCell).chordName === "string" &&
      Array.isArray((parsed as TrackCell).voicing?.midi)
    ) {
      return parsed as TrackCell;
    }
  } catch {
    // 非 JSON，忽略
  }
  return null;
}

export default function TrackPanel({ track, currentMeasure, onDropCell, onClearCell }: Props) {
  const [dragOver, setDragOver] = useState<number | null>(null);

  return (
    <div className="track-grid">
      {track.map((cell, i) => (
        <div
          key={i}
          className={[
            "track-cell",
            cell == null ? "is-empty" : "",
            currentMeasure === i ? "is-current" : "",
            dragOver === i ? "is-drag-over" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragEnter={() => setDragOver(i)}
          onDragLeave={(e) => {
            // 進入子元素也會觸發 dragleave，只在真正離開格子時清除
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(null);
            const dropped = parseCell(e.dataTransfer.getData("application/json"));
            if (dropped) onDropCell(i, dropped);
          }}
        >
          <p className="track-cell-number">{i + 1}</p>
          {cell == null ? (
            <p className="track-cell-hint">拖曳按法到這裡</p>
          ) : (
            <>
              <ChordDiagram voicing={cell.voicing} label={cell.chordName} />
              <button
                type="button"
                className="track-cell-clear"
                aria-label={`清除第 ${i + 1} 小節`}
                onClick={() => onClearCell(i)}
              >
                ✕
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
