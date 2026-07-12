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
    <section className="content-section" aria-labelledby="voicings-title">
      <div className="section-heading">
        <div>
          <div className="eyebrow">03 · Play a voicing</div>
          <h2 id="voicings-title">{chordName} 常用按法</h2>
        </div>
        <p className="section-note">點擊卡片播放刷弦</p>
      </div>
      <div className="voicings-list">
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
