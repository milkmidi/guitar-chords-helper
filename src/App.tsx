import { useMemo, useState } from "react";
import ChordCatalogSelector from "./components/ChordCatalogSelector";
import ChordNotesDisplay from "./components/ChordNotesDisplay";
import GuitarSection from "./components/GuitarSection";
import KeySelector from "./components/KeySelector";
import PianoSection from "./components/PianoSection";
import { useChordCatalog } from "./hooks/useChordCatalog";
import { useRootShortcut } from "./hooks/useRootShortcut";
import { CHORD_CATALOG } from "./lib/chordCatalog";
import { getChordBySymbol, type Key } from "./lib/chords";

export default function App() {
  const [selectedKey, setSelectedKey] = useState<Key>("C");
  useRootShortcut(setSelectedKey);
  const { category, symbol, changeCategory, setSymbol } = useChordCatalog();

  const chord = useMemo(() => getChordBySymbol(selectedKey, symbol), [selectedKey, symbol]);
  // 英雄區類型標籤：大三和弦顯示空白（僅 "C"），其餘用 catalog label
  const typeLabel =
    symbol === "major" ? "" : (CHORD_CATALOG.find((c) => c.symbol === symbol)?.label ?? symbol);
  const chordName = `${selectedKey}${typeLabel ? ` ${typeLabel}` : ""}`;
  const noteLabels = useMemo(() => {
    const labels = new Map<number, string>();
    chord.chromas.forEach((chroma, i) => labels.set(chroma, chord.notes[i]));
    return labels;
  }, [chord]);

  return (
    <main className="page">
      <header className="masthead">
        <h1>Guitar Chords Helper</h1>
        <p className="masthead-subtitle">選根音與和弦類型，同時在吉他指板與鋼琴鍵盤上查看。</p>
      </header>

      <ChordNotesDisplay
        key={`${selectedKey}-${symbol}`}
        rootLabel={selectedKey}
        typeLabel={typeLabel}
        notes={chord.notes}
        root={chord.root}
      />

      <section className="controls" aria-label="建立和弦">
        <div className="selector-group">
          <p className="field-label">
            根音 <span className="field-hint">按 1–7 = C–B</span>
          </p>
          <KeySelector selected={selectedKey} onSelect={setSelectedKey} />
        </div>
        <div className="selector-group">
          <p className="field-label">
            和弦類型 <span className="field-hint">←/→ 切換，↑/↓ 分類</span>
          </p>
          <ChordCatalogSelector
            category={category}
            symbol={symbol}
            onCategoryChange={changeCategory}
            onSymbolChange={setSymbol}
          />
        </div>
      </section>

      <div className="instrument-grid">
        <GuitarSection
          selectedKey={selectedKey}
          symbol={symbol}
          chord={chord}
          chordName={chordName}
          noteLabels={noteLabels}
        />
        <PianoSection selectedKey={selectedKey} symbol={symbol} chord={chord} />
      </div>

      <footer className="page-footer">
        <span className="footer-brand">
          Guitar Chords Helper
          <a
            className="footer-link"
            href="https://github.com/milkmidi/guitar-chords-helper"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub repository"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            GitHub
          </a>
        </span>
        <span>點擊音符或按法即可播放，聲音由 Web Audio 即時合成</span>
      </footer>
    </main>
  );
}
