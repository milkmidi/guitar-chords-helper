import { useCallback, useMemo, useState } from "react";
import ChordCatalogSelector from "./ChordCatalogSelector";
import ChordNotesDisplay from "./ChordNotesDisplay";
import Fretboard from "./Fretboard";
import KeySelector from "./KeySelector";
import TrackControls from "./TrackControls";
import TrackPanel from "./TrackPanel";
import VoicingsPanel from "./VoicingsPanel";
import { useChordCatalog } from "../hooks/useChordCatalog";
import { useRootShortcut } from "../hooks/useRootShortcut";
import { useTrackPlayer } from "../hooks/useTrackPlayer";
import { CHORD_CATALOG } from "../lib/chordCatalog";
import { getChordBySymbol, type Key } from "../lib/chords";
import { MEASURE_COUNT, type Track, type TrackCell } from "../lib/player";
import { getVoicings } from "../lib/voicings";
import { playNote, playStrum } from "../lib/audio";

export default function ChordFinderView() {
  const [selectedKey, setSelectedKey] = useState<Key>("C");
  useRootShortcut(setSelectedKey);
  const { category, symbol, changeCategory, setSymbol } = useChordCatalog();

  const chord = useMemo(() => getChordBySymbol(selectedKey, symbol), [selectedKey, symbol]);
  // 英雄區類型標籤：大三和弦顯示空白（僅 "C"），其餘用 catalog label（如 "6/9"、"m7"）
  const typeLabel =
    symbol === "major" ? "" : (CHORD_CATALOG.find((c) => c.symbol === symbol)?.label ?? symbol);
  const chordName = `${selectedKey}${typeLabel ? ` ${typeLabel}` : ""}`;
  const noteLabels = useMemo(() => {
    const labels = new Map<number, string>();
    chord.chromas.forEach((chroma, i) => labels.set(chroma, chord.notes[i]));
    return labels;
  }, [chord]);

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
            和弦類型 <span className="field-hint">←/→ 切換，↑/↓ 分類</span>
          </p>
          <ChordCatalogSelector
            category={category}
            symbol={symbol}
            onCategoryChange={changeCategory}
            onSymbolChange={setSymbol}
          />
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
    </>
  );
}
