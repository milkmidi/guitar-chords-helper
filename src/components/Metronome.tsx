import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useMetronome } from "../hooks/useMetronome";
import { BPM_MAX, BPM_MIN, bpmFromAngle, bpmFromTaps, clampBpm, getDegree } from "../lib/metronome";
import { Pie } from "./Pie";

const BEAT_OPTIONS = [3, 4, 5];

const PlayIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
  </svg>
);
const VolumeIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M3 9v6h4l5 5V4L7 9H3z" />
  </svg>
);
const MutedIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor" />
    <path d="M16 8l5 8M21 8l-5 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

export default function Metronome() {
  const [bpm, setBpm] = useState(75);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beats, setBeats] = useState(4);
  const [muted, setMuted] = useState(false);

  const dialRef = useRef<HTMLDivElement>(null);
  const tapsRef = useRef<number[]>([]);
  const draggingDial = useRef(false);

  useMetronome({ isPlaying, bpm, beats, muted, onBeat: setCurrentBeat });

  const setBpmFromPointer = useCallback((clientX: number, clientY: number) => {
    const el = dialRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setBpm(bpmFromAngle(getDegree(clientX, clientY, cx, cy)));
  }, []);

  const onDialPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      draggingDial.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setBpmFromPointer(e.clientX, e.clientY);
    },
    [setBpmFromPointer],
  );

  const onDialPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingDial.current) return;
      setBpmFromPointer(e.clientX, e.clientY);
    },
    [setBpmFromPointer],
  );

  const onDialPointerUp = useCallback(() => {
    draggingDial.current = false;
  }, []);

  const handleTap = useCallback(() => {
    tapsRef.current = [...tapsRef.current, Date.now()].slice(-4);
    const next = bpmFromTaps(tapsRef.current);
    if (next !== null) setBpm(next);
  }, []);

  const changeBeats = (n: number) => {
    setBeats(n);
    setCurrentBeat(0);
  };

  const progress = (bpm - BPM_MIN) / (BPM_MAX - BPM_MIN);

  return (
    <div className="metronome">
      <div className="metronome-timesig">{beats}/4</div>

      <div className="metronome-dots">
        {Array.from({ length: beats }, (_, i) => (
          <span
            key={i}
            className={`metronome-dot${i === 0 ? " is-downbeat" : ""}${
              i === currentBeat && isPlaying ? " is-active" : ""
            }`}
          />
        ))}
      </div>

      <div className="metronome-meters" role="group" aria-label="拍號">
        {BEAT_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            className={`metronome-meter${beats === n ? " is-selected" : ""}`}
            aria-pressed={beats === n}
            onClick={() => changeBeats(n)}
          >
            {n}/4
          </button>
        ))}
      </div>

      <div className="metronome-bpm">
        <button
          type="button"
          className="metronome-step"
          onClick={() => setBpm((b) => clampBpm(b - 1))}
          aria-label="降低 BPM"
        >
          −
        </button>
        <div className="metronome-bpm-value">
          {bpm}
          <span className="metronome-bpm-unit">BPM</span>
        </div>
        <button
          type="button"
          className="metronome-step"
          onClick={() => setBpm((b) => clampBpm(b + 1))}
          aria-label="提高 BPM"
        >
          +
        </button>
      </div>

      <div
        ref={dialRef}
        className="metronome-dial"
        onPointerDown={onDialPointerDown}
        onPointerMove={onDialPointerMove}
        onPointerUp={onDialPointerUp}
      >
        <Pie value={progress} />
        <button
          type="button"
          className="metronome-tap"
          onClick={handleTap}
          onPointerDown={(e) => e.stopPropagation()}
        >
          TAP
        </button>
      </div>

      <div className="metronome-controls">
        <button
          type="button"
          className={`metronome-mute${muted ? " is-muted" : ""}`}
          onClick={() => setMuted((m) => !m)}
          aria-pressed={muted}
          aria-label={muted ? "取消靜音" : "靜音"}
        >
          {muted ? MutedIcon : VolumeIcon}
        </button>
        <button
          type="button"
          className="metronome-play"
          onClick={() => setIsPlaying((p) => !p)}
          aria-label={isPlaying ? "暫停" : "播放"}
        >
          {isPlaying ? PauseIcon : PlayIcon}
        </button>
        <span className="metronome-controls-spacer" aria-hidden="true" />
      </div>
    </div>
  );
}
