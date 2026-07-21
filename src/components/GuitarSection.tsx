import { useCallback, useMemo, useState } from "react";
import Fretboard from "./Fretboard";
import TrackControls from "./TrackControls";
import TrackPanel from "./TrackPanel";
import VoicingsPanel from "./VoicingsPanel";
import { useTrackPlayer } from "../hooks/useTrackPlayer";
import { playNote, playStrum } from "../lib/audio";
import type { ChordSymbolInfo, Key } from "../lib/chords";
import { MEASURE_COUNT, type Track, type TrackCell } from "../lib/player";
import { getVoicings } from "../lib/voicings";

interface Props {
  selectedKey: Key;
  symbol: string;
  chord: ChordSymbolInfo;
  chordName: string; // 例如 "C 6/9"
  noteLabels: Map<number, string>; // chroma -> 依和弦拼寫的音名
}

// 吉他欄：指板圖 + 常用按法 + 音軌。和弦選擇由上層共用控制項驅動，
// 只保留音軌相關的本地狀態。
export default function GuitarSection({ selectedKey, symbol, chord, chordName, noteLabels }: Props) {
  const voicings = useMemo(() => getVoicings(selectedKey, symbol), [selectedKey, symbol]);
  const chordId = `${selectedKey}-${symbol}`;

  const [track, setTrack] = useState<Track>(() => Array(MEASURE_COUNT).fill(null));
  const [bpm, setBpm] = useState(90);
  const { isPlaying, currentMeasure, play, stop } = useTrackPlayer(track, bpm);

  const handleDropCell = useCallback((index: number, cell: TrackCell) => {
    setTrack((prev) => prev.map((c, i) => (i === index ? cell : c)));
  }, []);

  const handleClearCell = useCallback((index: number) => {
    setTrack((prev) => prev.map((c, i) => (i === index ? null : c)));
  }, []);

  return (
    <section className="instrument-col" aria-label="吉他">
      <section className="content-section" aria-labelledby="fretboard-title">
        <div className="section-heading">
          <h2 id="fretboard-title">指板上的和弦音</h2>
          <p className="legend">
            <span className="swatch swatch-root" aria-hidden="true" />
            根音
            <span className="swatch swatch-tone" aria-hidden="true" />
            和弦音
          </p>
        </div>
        <Fretboard
          key={chordId}
          chordChromas={chord.chromas}
          rootChroma={chord.rootChroma}
          noteLabels={noteLabels}
          onNotePlay={(position) => playNote(position.note)}
        />
      </section>

      <VoicingsPanel
        key={`voicings-${chordId}`}
        chordName={chordName}
        voicings={voicings}
        onPlay={(voicing) => playStrum(voicing.midi)}
      />

      <section className="content-section" aria-labelledby="track-title">
        <div className="section-heading">
          <h2 id="track-title">音軌</h2>
          <p className="section-note">把上方按法卡片拖進小節，按 Play 循環播放</p>
        </div>
        <TrackControls bpm={bpm} isPlaying={isPlaying} onBpmChange={setBpm} onPlay={play} onStop={stop} />
        <TrackPanel
          track={track}
          currentMeasure={currentMeasure}
          onDropCell={handleDropCell}
          onClearCell={handleClearCell}
        />
      </section>
    </section>
  );
}
