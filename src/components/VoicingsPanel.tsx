import type { Voicing } from "../lib/voicings";
import ChordDiagram from "./ChordDiagram";

interface Props {
  chordName: string; // 例如 "C Major"
  voicings: Voicing[];
  onPlay?: (voicing: Voicing) => void;
}

export default function VoicingsPanel({ chordName, voicings, onPlay }: Props) {
  if (voicings.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-slate-700">{chordName} 按法</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {voicings.map((voicing, i) => (
          <ChordDiagram
            key={i}
            voicing={voicing}
            label={`v${i + 1}`}
            onPlay={onPlay ? () => onPlay(voicing) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
