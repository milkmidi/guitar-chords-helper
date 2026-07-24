import type { KeyboardEventHandler, RefObject } from "react";
import type { CatalogChord, ChordCategory } from "../lib/chordCatalog";

interface CategoryLabel {
  id: ChordCategory;
  label: string;
}

interface Props {
  dialogRef: RefObject<HTMLDialogElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  results: CatalogChord[];
  categories: CategoryLabel[];
  onQueryChange: (query: string) => void;
  onSelect: (symbol: string) => void;
  onClose: () => void;
}

export default function ChordSearchDialog({
  dialogRef,
  inputRef,
  query,
  results,
  categories,
  onQueryChange,
  onSelect,
  onClose,
}: Props) {
  const handleInputKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Escape") {
      if (event.defaultPrevented || event.nativeEvent.isComposing) return;
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const buttons = event.currentTarget
      .closest(".chord-search-dialog")
      ?.querySelectorAll<HTMLButtonElement>(".search-result-button");
    if (!buttons?.length) return;
    buttons[event.key === "ArrowDown" ? 0 : buttons.length - 1].focus();
  };

  const handleResultKeyDown: KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const buttons = Array.from(
      event.currentTarget
        .closest(".chord-search-dialog")
        ?.querySelectorAll<HTMLButtonElement>(".search-result-button") ?? [],
    );
    const current = buttons.indexOf(event.currentTarget);
    const direction = event.key === "ArrowDown" ? 1 : -1;
    buttons[(current + direction + buttons.length) % buttons.length]?.focus();
  };

  return (
    <dialog
      ref={dialogRef}
      className="chord-search-dialog"
      aria-labelledby="chord-search-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <div className="search-dialog-header">
        <div>
          <p className="search-dialog-eyebrow">ALL CHORDS</p>
          <h2 id="chord-search-title">尋找和弦類型</h2>
        </div>
        <button type="button" className="dialog-close-button" onClick={onClose}>
          關閉
        </button>
      </div>

      <label className="search-field">
        <span className="visually-hidden">搜尋和弦名稱、符號或分類</span>
        <input
          ref={inputRef}
          value={query}
          type="search"
          placeholder="搜尋 maj7、♭9、altered..."
          autoComplete="off"
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        <kbd>ESC</kbd>
      </label>

      <div className="search-results" aria-live="polite">
        {results.length === 0 ? (
          <div className="search-empty">
            <strong>找不到符合的和弦</strong>
            <span>試試 maj、minor、♯5 或 altered。</span>
          </div>
        ) : (
          categories.map((category) => {
            const categoryResults = results.filter((chord) => chord.category === category.id);
            if (!categoryResults.length) return null;
            return (
              <section className="search-result-group" key={category.id}>
                <h3>{category.label}</h3>
                <div className="search-result-grid">
                  {categoryResults.map((chord) => (
                    <button
                      key={chord.symbol}
                      type="button"
                      className="search-result-button"
                      onClick={() => onSelect(chord.symbol)}
                      onKeyDown={handleResultKeyDown}
                    >
                      <span>{chord.label}</span>
                      <small>{chord.symbol}</small>
                    </button>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </dialog>
  );
}
