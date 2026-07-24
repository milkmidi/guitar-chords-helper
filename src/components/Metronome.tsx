import {
  useCallback,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Minus, Pause, Play, Plus, Volume2, VolumeX } from "lucide-react";
import { useMetronome } from "../hooks/useMetronome";
import { BPM_MAX, BPM_MIN, bpmFromAngle, bpmFromTaps, clampBpm, getDegree } from "../lib/metronome";
import { Pie } from "./Pie";

const BEAT_OPTIONS = [3, 4, 5];

interface Props {
  compact: boolean;
  onCompactActivate: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  compactDragHandleProps: {
    onPointerDown: (event: ReactPointerEvent) => void;
  };
}

interface BeatDotsProps {
  beats: number;
  currentBeat: number;
  isPlaying: boolean;
}

function BeatDots({ beats, currentBeat, isPlaying }: BeatDotsProps) {
  return (
    <div className="metronome-dots" aria-hidden="true">
      {Array.from({ length: beats }, (_, i) => (
        <span
          key={i}
          className={`metronome-dot${i === 0 ? " is-downbeat" : ""}${
            i === currentBeat && isPlaying ? " is-active" : ""
          }`}
        />
      ))}
    </div>
  );
}

export default function Metronome({
  compact,
  onCompactActivate,
  compactDragHandleProps,
}: Props) {
  const [bpm, setBpm] = useState(120);
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
      if (e.button !== 0) return;
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

  if (compact) {
    return (
      <div className="metronome is-compact">
        <button
          type="button"
          className="metronome-compact"
          onClick={onCompactActivate}
          aria-label="展開節拍器"
          {...compactDragHandleProps}
        >
          <BeatDots beats={beats} currentBeat={currentBeat} isPlaying={isPlaying} />
        </button>
      </div>
    );
  }

  return (
    <div className="metronome">
      <div className="metronome-timesig">{beats}/4</div>

      <BeatDots beats={beats} currentBeat={currentBeat} isPlaying={isPlaying} />

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
          <Minus size={20} strokeWidth={2} aria-hidden="true" />
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
          <Plus size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <div
        ref={dialRef}
        className="metronome-dial"
        onPointerDown={onDialPointerDown}
        onPointerMove={onDialPointerMove}
        onPointerUp={onDialPointerUp}
        onPointerCancel={onDialPointerUp}
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
          {muted ? (
            <VolumeX size={20} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Volume2 size={20} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          className="metronome-play"
          onClick={() => setIsPlaying((p) => !p)}
          aria-pressed={isPlaying}
          aria-label={isPlaying ? "暫停" : "播放"}
        >
          {isPlaying ? (
            <Pause size={22} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Play size={22} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
        <span className="metronome-controls-spacer" aria-hidden="true" />
      </div>
    </div>
  );
}
