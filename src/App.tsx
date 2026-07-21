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
        <span>Guitar Chords Helper</span>
        <span>點擊音符或按法即可播放，聲音由 Web Audio 即時合成</span>
      </footer>
    </main>
  );
}
