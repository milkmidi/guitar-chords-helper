import { KEYS, type Key } from "../lib/chords";

const PIANO_KEY_LAYOUT = {
  C: { left: "0%", tone: "white" },
  "C#": { left: "14.2857%", tone: "black" },
  D: { left: "14.2857%", tone: "white" },
  "D#": { left: "28.5714%", tone: "black" },
  E: { left: "28.5714%", tone: "white" },
  F: { left: "42.8571%", tone: "white" },
  "F#": { left: "57.1429%", tone: "black" },
  G: { left: "57.1429%", tone: "white" },
  "G#": { left: "71.4286%", tone: "black" },
  A: { left: "71.4286%", tone: "white" },
  "A#": { left: "85.7143%", tone: "black" },
  B: { left: "85.7143%", tone: "white" },
} as const satisfies Record<Key, { left: string; tone: "black" | "white" }>;

interface Props {
  selected: Key;
  onSelect: (key: Key) => void;
}

export default function KeySelector({ selected, onSelect }: Props) {
  return (
    <div className="key-selector" role="group" aria-label="選擇根音">
      {KEYS.map((key) => {
        const layout = PIANO_KEY_LAYOUT[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={key === selected}
            className={`key-button is-${layout.tone}-key${key === selected ? " is-selected" : ""}`}
            style={{ left: layout.left }}
          >
            {key.replace("#", "♯")}
          </button>
        );
      })}
    </div>
  );
}
