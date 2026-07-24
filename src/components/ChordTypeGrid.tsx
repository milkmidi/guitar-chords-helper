import type { CatalogChord } from "../lib/chordCatalog";

interface Props {
  chords: CatalogChord[];
  symbol: string;
  id?: string;
  labelledBy?: string;
  onSymbolChange: (symbol: string) => void;
}

export default function ChordTypeGrid({
  chords,
  symbol,
  id,
  labelledBy,
  onSymbolChange,
}: Props) {
  return (
    <div
      className="type-selector"
      id={id}
      role={labelledBy ? "tabpanel" : undefined}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : "選擇和弦類型"}
    >
      {chords.map((chord) => (
        <button
          key={chord.symbol}
          type="button"
          onClick={() => onSymbolChange(chord.symbol)}
          aria-pressed={chord.symbol === symbol}
          className={`type-button ${chord.symbol === symbol ? "is-selected" : ""}`}
        >
          {chord.label}
        </button>
      ))}
    </div>
  );
}
