import { CHORD_TYPES, type ChordTypeId } from "../lib/chords";

interface Props {
  selected: ChordTypeId;
  onSelect: (id: ChordTypeId) => void;
}

export default function ChordTypeSelector({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHORD_TYPES.map((type) => (
        <button
          key={type.id}
          type="button"
          onClick={() => onSelect(type.id)}
          aria-pressed={type.id === selected}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            type.id === selected
              ? "bg-blue-500 text-white"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
