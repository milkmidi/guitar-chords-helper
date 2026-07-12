import { CHORD_TYPES, type ChordTypeId } from "../lib/chords";

interface Props {
  selected: ChordTypeId;
  onSelect: (id: ChordTypeId) => void;
}

export default function ChordTypeSelector({ selected, onSelect }: Props) {
  return (
    <div className="type-selector" aria-label="選擇和弦類型">
      {CHORD_TYPES.map((type) => (
        <button
          key={type.id}
          type="button"
          onClick={() => onSelect(type.id)}
          aria-pressed={type.id === selected}
          className={`type-button ${type.id === selected ? "is-selected" : ""}`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
