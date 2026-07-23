import { useEffect, useRef } from "react";
import {
  CHORD_CATEGORIES,
  chordsInCategory,
  type CategoryFilter,
} from "../lib/chordCatalog";

interface Props {
  category: CategoryFilter;
  symbol: string; // 目前選取的和弦符號
  onCategoryChange: (category: CategoryFilter) => void;
  onSymbolChange: (symbol: string) => void;
}

export default function ChordCatalogSelector({
  category,
  symbol,
  onCategoryChange,
  onSymbolChange,
}: Props) {
  const visible = chordsInCategory(category);

  // 手機上這兩排是橫向捲動的，用鍵盤或切分類時把選中項捲回視野。
  // block: "nearest" 不可省略，否則整頁會跟著垂直捲動。
  // 不指定 behavior：smooth 在這種巢狀捲動容器上會靜默失效，交給 CSS 決定即可。
  const selectedType = useRef<HTMLButtonElement>(null);
  const activeCategory = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedType.current?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [symbol, category]);

  useEffect(() => {
    activeCategory.current?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [category]);

  return (
    <div className="chord-catalog">
      <div className="category-filter" role="group" aria-label="和弦分類">
        {CHORD_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            ref={cat.id === category ? activeCategory : undefined}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            aria-pressed={cat.id === category}
            className={`category-button ${cat.id === category ? "is-active" : ""}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="type-selector" aria-label="選擇和弦類型">
        {visible.map((chord) => (
          <button
            key={chord.symbol}
            ref={chord.symbol === symbol ? selectedType : undefined}
            type="button"
            onClick={() => onSymbolChange(chord.symbol)}
            aria-pressed={chord.symbol === symbol}
            className={`type-button ${chord.symbol === symbol ? "is-selected" : ""}`}
          >
            {chord.label}
          </button>
        ))}
      </div>
    </div>
  );
}
