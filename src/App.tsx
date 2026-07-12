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

  return (
    <main className="page">
      <header className="hero">
        <div>
          <div className="eyebrow">Chord desk · Interactive fretboard</div>
          <h1>Guitar Chords Helper</h1>
          <p className="hero-subtitle">選一個根音與和弦類型，立即查看組成音、指板位置與實用按法。</p>
        </div>
        <div className="hero-mark" aria-hidden="true">
          <span>♩</span>
        </div>
      </header>

      <section className="control-panel" aria-labelledby="chord-builder-title">
        <div className="section-heading compact">
          <div>
            <div className="eyebrow">01 · Build a chord</div>
            <h2 id="chord-builder-title">建立和弦</h2>
          </div>
          <span className="status-badge"><span className="status-dot" />可互動播放</span>
        </div>
        <div className="selector-group">
          <p className="field-label">根音</p>
          <KeySelector selected={selectedKey} onSelect={setSelectedKey} />
        </div>
        <div className="selector-group">
          <p className="field-label">和弦類型</p>
          <ChordTypeSelector selected={chordType} onSelect={setChordType} />
        </div>
      </section>

      <ChordNotesDisplay chordName={`${selectedKey} ${typeLabel}`} notes={chord.notes} root={chord.root} />

      <section className="content-section" aria-labelledby="fretboard-title">
        <div className="section-heading">
          <div>
            <div className="eyebrow">02 · Explore notes</div>
            <h2 id="fretboard-title">指板上的和弦音</h2>
          </div>
          <p className="section-note">點擊音符即可試聽</p>
        </div>
        <Fretboard
          chordChromas={chord.chromas}
          rootChroma={chord.rootChroma}
          noteLabels={noteLabels}
          onNotePlay={(position) => playNote(position.note)}
        />
      </section>

      <VoicingsPanel
        chordName={`${selectedKey} ${typeLabel}`}
        voicings={voicings}
        onPlay={(voicing) => playStrum(voicing.midi)}
      />

      <footer className="page-footer">
        <span>Guitar Chords Helper</span>
        <span>點擊音符或按法即可播放</span>
      </footer>
    </main>
  );
}
