import { KEYS, type Key } from "../lib/chords";

interface Props {
  selected: Key;
  onSelect: (key: Key) => void;
}

export default function KeySelector({ selected, onSelect }: Props) {
  return (
    <div className="key-selector" aria-label="選擇根音">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          aria-pressed={key === selected}
          className={`key-button ${key === selected ? "is-selected" : ""}`}
        >
          {key}
        </button>
      ))}
    </div>
  );
}
