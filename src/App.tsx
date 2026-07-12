import { useMemo, useState } from "react";
import ChordNotesDisplay from "./components/ChordNotesDisplay";
import ChordTypeSelector from "./components/ChordTypeSelector";
import Fretboard from "./components/Fretboard";
import KeySelector from "./components/KeySelector";
import VoicingsPanel from "./components/VoicingsPanel";
import { CHORD_TYPES, getChordInfo, type ChordTypeId, type Key } from "./lib/chords";
import { getVoicings } from "./lib/voicings";
import { playNote } from "./lib/audio";


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
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-slate-800">Guitar Chords Helper</h1>
      <KeySelector selected={selectedKey} onSelect={setSelectedKey} />
      <ChordTypeSelector selected={chordType} onSelect={setChordType} />
      <ChordNotesDisplay chordName={`${selectedKey} ${typeLabel}`} notes={chord.notes} root={chord.root} />
      <Fretboard chordChromas={chord.chromas} rootChroma={chord.rootChroma} noteLabels={noteLabels} onNotePlay={(position) => playNote(position.note)} />
      <VoicingsPanel chordName={`${selectedKey} ${typeLabel}`} voicings={voicings} />
    </div>
  );
}
