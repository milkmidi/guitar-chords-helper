import type { CSSProperties } from "react";

interface Props {
  rootLabel: string; // 例如 "C"
  typeLabel: string; // 例如 "Major"
  notes: string[]; // 例如 ["C", "E", "G"]
  root: string; // 例如 "C"
}

export default function ChordNotesDisplay({ rootLabel, typeLabel, notes, root }: Props) {
  return (
    <section className="chord-stage" aria-label={`${rootLabel} ${typeLabel} 組成音`}>
      <h2 className="chord-title">
        {rootLabel} <em className="chord-type">{typeLabel}</em>
      </h2>
      <div className="note-formula" role="list" aria-label="組成音">
        {notes.map((note, i) => (
          <span
            key={note}
            role="listitem"
            className={`note-pill pop-in ${note === root ? "is-root" : ""}`}
            style={{ "--i": i } as CSSProperties}
          >
            {note}
          </span>
        ))}
      </div>
    </section>
  );
}
