import type { ReactNode } from "react";
import { CHORD_CATEGORIES, chordsInCategory, type ChordCategory } from "../lib/chordCatalog";
import ChordTypeGrid from "./ChordTypeGrid";

interface Props {
  category: ChordCategory;
  symbol: string; // 目前選取的和弦符號
  onCategoryChange: (category: ChordCategory) => void;
  onSymbolChange: (symbol: string) => void;
  action?: ReactNode;
}

export default function ChordCatalogSelector({
  category,
  symbol,
  onCategoryChange,
  onSymbolChange,
  action,
}: Props) {
  const visible = chordsInCategory(category);
  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
    const nextIndex =
      (currentIndex + direction + CHORD_CATEGORIES.length) % CHORD_CATEGORIES.length;
    onCategoryChange(CHORD_CATEGORIES[nextIndex].id);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [nextIndex]?.focus();
  };

  return (
    <div className="chord-catalog">
      <div className="category-row">
        <div className="category-filter" role="tablist" aria-label="和弦分類">
          {CHORD_CATEGORIES.map((cat, index) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              role="tab"
              aria-selected={cat.id === category}
              aria-controls={`chord-panel-${cat.id}`}
              id={`chord-tab-${cat.id}`}
              tabIndex={cat.id === category ? 0 : -1}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`category-button ${cat.id === category ? "is-active" : ""}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {action}
      </div>

      <ChordTypeGrid
        chords={visible}
        symbol={symbol}
        id={`chord-panel-${category}`}
        labelledBy={`chord-tab-${category}`}
        onSymbolChange={onSymbolChange}
      />
    </div>
  );
}
