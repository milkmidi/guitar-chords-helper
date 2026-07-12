interface Props {
  chordName: string; // 例如 "C Major"
  notes: string[]; // 例如 ["C", "E", "G"]
  root: string; // 例如 "C"
}

export default function ChordNotesDisplay({ chordName, notes, root }: Props) {
  return (
    <section className="chord-summary" aria-label={`${chordName} 組成音`}>
      <div>
        <div className="eyebrow light">Current chord</div>
        <p className="chord-name">{chordName}</p>
      </div>
      <div className="note-formula">
        {notes.map((note, i) => (
          <span key={note} className="note-item">
            {i > 0 && <span className="formula-divider">—</span>}
            <span className={note === root ? "note-pill is-root" : "note-pill"}>{note}</span>
          </span>
        ))}
      </div>
      <p className="summary-caption"><span className="legend-dot root" />根音 <span className="legend-dot chord" />和弦音</p>
    </section>
  );
}
