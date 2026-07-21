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

  const handleCategory = (id: CategoryFilter) => {
    onCategoryChange(id);
    // 切到不含目前和弦的分類時，自動選該分類第一個，維持「反白＝鍵盤上顯示」一致
    if (id !== "all") {
      const list = chordsInCategory(id);
      if (!list.some((c) => c.symbol === symbol)) onSymbolChange(list[0].symbol);
    }
  };

  return (
    <div className="chord-catalog">
      <div className="category-filter" role="group" aria-label="和弦分類">
        {CHORD_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleCategory(cat.id)}
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
