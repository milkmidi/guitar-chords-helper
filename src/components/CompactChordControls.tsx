import { chordsInCategory, type ChordCategory } from "../lib/chordCatalog";
import type { CompactSelector, CycleDirection } from "../lib/chordControls";
import type { Key } from "../lib/chords";
import ChordTypeGrid from "./ChordTypeGrid";
import KeySelector from "./KeySelector";

interface Props {
  visible: boolean;
  selectedKey: Key;
  category: ChordCategory;
  symbol: string;
  symbolLabel: string;
  openSelector: CompactSelector;
  onKeySelect: (key: Key) => void;
  onSymbolChange: (symbol: string) => void;
  onCycleSymbol: (direction: CycleDirection) => void;
  onToggleSelector: (selector: "root" | "chord") => void;
  onCloseSelector: () => void;
  onSearchOpen: (trigger: HTMLButtonElement) => void;
}

export default function CompactChordControls({
  visible,
  selectedKey,
  category,
  symbol,
  symbolLabel,
  openSelector,
  onKeySelect,
  onSymbolChange,
  onCycleSymbol,
  onToggleSelector,
  onCloseSelector,
  onSearchOpen,
}: Props) {
  return (
    <aside
      className={`compact-controls ${visible ? "is-visible" : ""} ${
        openSelector ? "is-selector-open" : ""
      }`}
      aria-label="快速切換和弦"
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className="compact-controls-inner" inert={Boolean(openSelector)}>
        <button
          type="button"
          className="compact-current-button"
          onClick={() => onToggleSelector("root")}
          aria-expanded={openSelector === "root"}
        >
          <span>根音</span>
          <strong>{selectedKey}</strong>
        </button>
        <button
          type="button"
          className="compact-current-button compact-chord-button"
          onClick={() => onToggleSelector("chord")}
          aria-expanded={openSelector === "chord"}
        >
          <span>類型</span>
          <strong>{symbolLabel}</strong>
        </button>
        <button
          type="button"
          className="compact-step-button"
          onClick={() => onCycleSymbol(-1)}
          aria-label="上一個同分類和弦"
        >
          ←
        </button>
        <button
          type="button"
          className="compact-step-button"
          onClick={() => onCycleSymbol(1)}
          aria-label="下一個同分類和弦"
        >
          →
        </button>
        <button
          type="button"
          className="compact-search-button"
          onClick={(event) => onSearchOpen(event.currentTarget)}
        >
          搜尋
        </button>
      </div>

      {openSelector && (
        <>
          <button
            type="button"
            className="compact-selector-backdrop"
            onClick={onCloseSelector}
            aria-label="關閉快速選擇"
          />
          <section className="compact-selector" aria-label="快速選擇">
            <div className="compact-selector-heading">
              <strong>{openSelector === "root" ? "選擇根音" : "選擇和弦類型"}</strong>
              <button type="button" autoFocus onClick={onCloseSelector}>
                完成
              </button>
            </div>
            {openSelector === "root" ? (
              <KeySelector selected={selectedKey} onSelect={onKeySelect} />
            ) : (
              <ChordTypeGrid
                chords={chordsInCategory(category)}
                symbol={symbol}
                onSymbolChange={onSymbolChange}
              />
            )}
          </section>
        </>
      )}
    </aside>
  );
}
