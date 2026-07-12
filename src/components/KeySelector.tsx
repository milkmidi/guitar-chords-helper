import { KEYS, type Key } from "../lib/chords";

interface Props {
  selected: Key;
  onSelect: (key: Key) => void;
}

export default function KeySelector({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          aria-pressed={key === selected}
          className={`w-12 rounded-lg py-2 text-sm font-semibold transition-colors ${
            key === selected
              ? "bg-orange-500 text-white"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          {key}
        </button>
      ))}
    </div>
  );
}
