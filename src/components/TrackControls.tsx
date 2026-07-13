interface Props {
  bpm: number;
  isPlaying: boolean;
  onBpmChange: (bpm: number) => void;
  onPlay: () => void;
  onStop: () => void;
}

export default function TrackControls({ bpm, isPlaying, onBpmChange, onPlay, onStop }: Props) {
  return (
    <div className="track-controls">
      <label className="bpm-control">
        <span className="bpm-label">BPM</span>
        <input
          type="range"
          min={50}
          max={150}
          step={1}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="bpm-slider"
        />
        <span className="bpm-value">{bpm}</span>
      </label>
      <div className="transport-buttons">
        <button type="button" className="transport-button is-play" onClick={onPlay} disabled={isPlaying}>
          ▶ Play
        </button>
        <button type="button" className="transport-button" onClick={onStop} disabled={!isPlaying}>
          ■ Stop
        </button>
      </div>
    </div>
  );
}
