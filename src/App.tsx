import { useMemo, useState } from "react";
import ChordNotesDisplay from "./components/ChordNotesDisplay";
import ChordTypeSelector from "./components/ChordTypeSelector";
import Fretboard from "./components/Fretboard";
import KeySelector from "./components/KeySelector";
import VoicingsPanel from "./components/VoicingsPanel";
import { CHORD_TYPES, getChordInfo, type ChordTypeId, type Key } from "./lib/chords";
import { getVoicings } from "./lib/voicings";
import { playNote, playStrum } from "./lib/audio";

export default function App() {
  const [selectedKey, setSelectedKey] = useState<Key>("C");
  const [chordType, setChordType] = useState<ChordTypeId>("major");

  const chord = useMemo(() => getChordInfo(selectedKey, chordType), [selectedKey, chordType]);
  const typeLabel = CHORD_TYPES.find((t) => t.id === chordType)?.label ?? chordType;
  const noteLabels = useMemo(() => {
    const labels = new Map<number, string>();
    chord.chromas.forEach((chroma, i) => labels.set(chroma, chord.notes[i]));
    return labels;
  }, [chord]);

  const voicings = useMemo(() => getVoicings(selectedKey, chordType), [selectedKey, chordType]);
  const chordId = `${selectedKey}-${chordType}`;

  return (
    <main className="page">
      <header className="masthead">
        <h1>Guitar Chords Helper</h1>
        <p className="masthead-subtitle">選根音與和弦類型，查看組成音、指板位置與常用按法。</p>
      </header>

      <ChordNotesDisplay
        key={chordId}
        rootLabel={selectedKey}
        typeLabel={typeLabel}
        notes={chord.notes}
        root={chord.root}
      />

      <section className="controls" aria-label="建立和弦">
        <div className="selector-group">
          <p className="field-label">根音</p>
          <KeySelector selected={selectedKey} onSelect={setSelectedKey} />
        </div>
        <div className="selector-group">
          <p className="field-label">和弦類型</p>
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

      <footer className="page-footer">
        <span>Guitar Chords Helper</span>
        <span>點擊音符或按法即可播放，聲音由 Web Audio 即時合成</span>
      </footer>
    </main>
  );
}
