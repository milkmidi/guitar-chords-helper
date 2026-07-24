import type { CSSProperties } from "react";

interface Props {
  rootLabel: string; // 例如 "C"
  typeLabel: string; // 例如 "Major"
  notes: string[]; // 例如 ["C", "E", "G"]
  degrees: string[]; // 例如 ["1", "3", "5"]
  root: string; // 例如 "C"
}

export default function ChordNotesDisplay({ rootLabel, typeLabel, notes, degrees, root }: Props) {
  return (
    <section className="chord-stage" aria-label={`${rootLabel} ${typeLabel} 組成音與級數`}>
      <h2 className="chord-title">
        {rootLabel} <em className="chord-type">{typeLabel}</em>
      </h2>
      <div className="chord-formula">
        <p className="formula-label">組成音 / 級數</p>
        <div className="note-formula" role="list" aria-label="組成音與級數">
          {notes.map((note, i) => (
            <span
              key={`${note}-${degrees[i]}`}
              role="listitem"
              aria-label={`${note}，級數 ${degrees[i]}`}
              className="note-item pop-in"
              style={{ "--i": i } as CSSProperties}
            >
              <span className={`note-pill ${note === root ? "is-root" : ""}`} aria-hidden="true">
                {note}
              </span>
              <span className="note-degree" aria-hidden="true">
                {degrees[i]}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
