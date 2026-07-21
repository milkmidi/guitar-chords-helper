import { useCallback, useMemo, useState } from "react";
import ChordNotesDisplay from "./ChordNotesDisplay";
import ChordTypeSelector from "./ChordTypeSelector";
import Fretboard from "./Fretboard";
import KeySelector from "./KeySelector";
import TrackControls from "./TrackControls";
import TrackPanel from "./TrackPanel";
import VoicingsPanel from "./VoicingsPanel";
import { useTrackPlayer } from "../hooks/useTrackPlayer";
import { useRootShortcut } from "../hooks/useRootShortcut";
import { cycleIndex, useArrowCycle } from "../hooks/useArrowCycle";
import { CHORD_TYPES, getChordInfo, type ChordTypeId, type Key } from "../lib/chords";
import { MEASURE_COUNT, type Track, type TrackCell } from "../lib/player";
import { getVoicings } from "../lib/voicings";
import { playNote, playStrum } from "../lib/audio";

export default function ChordFinderView() {
  const [selectedKey, setSelectedKey] = useState<Key>("C");
  useRootShortcut(setSelectedKey);
  const [chordType, setChordType] = useState<ChordTypeId>("major");
  const cycleType = (dir: number) =>
    setChordType((prev) => {
      const i = CHORD_TYPES.findIndex((t) => t.id === prev);
      return CHORD_TYPES[cycleIndex(i, CHORD_TYPES.length, dir)].id;
    });
  useArrowCycle({ onLeft: () => cycleType(-1), onRight: () => cycleType(1) });

  const chord = useMemo(() => getChordInfo(selectedKey, chordType), [selectedKey, chordType]);
  const typeLabel = CHORD_TYPES.find((t) => t.id === chordType)?.label ?? chordType;
  const noteLabels = useMemo(() => {
    const labels = new Map<number, string>();
    chord.chromas.forEach((chroma, i) => labels.set(chroma, chord.notes[i]));
    return labels;
  }, [chord]);

  const voicings = useMemo(() => getVoicings(selectedKey, chordType), [selectedKey, chordType]);
  const chordId = `${selectedKey}-${chordType}`;

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
    <>
      <ChordNotesDisplay
        key={chordId}
        rootLabel={selectedKey}
        typeLabel={typeLabel}
        notes={chord.notes}
        root={chord.root}
      />

      <section className="controls" aria-label="建立和弦">
        <div className="selector-group">
          <p className="field-label">
            根音 <span className="field-hint">按 1–7 = C–B</span>
          </p>
          <KeySelector selected={selectedKey} onSelect={setSelectedKey} />
        </div>
        <div className="selector-group">
          <p className="field-label">
            和弦類型 <span className="field-hint">←/→ 切換</span>
          </p>
          <ChordTypeSelector selected={chordType} onSelect={setChordType} />
        </div>
      </section>

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
        chordName={`${selectedKey} ${typeLabel}`}
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
    </>
  );
}
