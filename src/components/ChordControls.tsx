import type { Ref } from "react";
import type { ChordCategory } from "../lib/chordCatalog";
import type { Key } from "../lib/chords";
import ChordCatalogSelector from "./ChordCatalogSelector";
import KeySelector from "./KeySelector";

interface Props {
  controlsRef: Ref<HTMLElement>;
  selectedKey: Key;
  category: ChordCategory;
  symbol: string;
  onKeySelect: (key: Key) => void;
  onCategoryChange: (category: ChordCategory) => void;
  onSymbolChange: (symbol: string) => void;
  onSearchOpen: (trigger: HTMLButtonElement) => void;
}

export default function ChordControls({
  controlsRef,
  selectedKey,
  category,
  symbol,
  onKeySelect,
  onCategoryChange,
  onSymbolChange,
  onSearchOpen,
}: Props) {
  return (
    <section ref={controlsRef} className="controls" aria-label="建立和弦">
      <div className="selector-group controls-root flex flex-col">
        <p className="field-label">
          根音 <span className="field-hint">按 1-7 = C-B</span>
        </p>
        <div className="flex-1">
          <KeySelector selected={selectedKey} onSelect={onKeySelect} />
        </div>
      </div>

      <div className="selector-group controls-chord">
        <p className="field-label">
          和弦類型 <span className="field-hint">←/→ 切換，↑/↓ 分類</span>
        </p>
        <ChordCatalogSelector
          category={category}
          symbol={symbol}
          onCategoryChange={onCategoryChange}
          onSymbolChange={onSymbolChange}
          action={
            <button
              type="button"
              className="search-chords-button"
              onClick={(event) => onSearchOpen(event.currentTarget)}
            >
              全部和弦
              <kbd>/</kbd>
            </button>
          }
        />
      </div>
    </section>
  );
}
