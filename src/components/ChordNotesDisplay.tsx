interface Props {
  chordName: string; // 例如 "C Major"
  notes: string[]; // 例如 ["C", "E", "G"]
  root: string; // 例如 "C"
}

export default function ChordNotesDisplay({ chordName, notes, root }: Props) {
  return (
    <p className="text-lg text-slate-700">
      <span className="font-bold">{chordName}</span>
      {" = "}
      {notes.map((note, i) => (
        <span key={note}>
          {i > 0 && <span className="text-slate-400"> - </span>}
          <span className={note === root ? "font-bold text-orange-500" : "font-semibold text-blue-600"}>
            {note}
          </span>
        </span>
      ))}
    </p>
  );
}
