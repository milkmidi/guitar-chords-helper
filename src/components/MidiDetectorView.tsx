import { useMemo, useState } from "react";
import { useMidiInput } from "../hooks/useMidiInput";
import { toGlyph, type CategoryFilter } from "../lib/chordCatalog";
import { analyze, chordTonesToMidi, type DetectionResult } from "../lib/chordDetect";
import { getChordBySymbol, type Key } from "../lib/chords";
import ChordCatalogSelector from "./ChordCatalogSelector";
import ChordReadout from "./ChordReadout";
import KeySelector from "./KeySelector";
import MidiKeyboard from "./MidiKeyboard";

const octaveOf = (m: number) => Math.floor(m / 12) - 1;

export default function MidiDetectorView() {
  const { litMidis, lampState, statusText, deviceName, started, start } = useMidiInput();

  const [selectedKey, setSelectedKey] = useState<Key>("C");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [symbol, setSymbol] = useState("major");

  const info = useMemo(() => getChordBySymbol(selectedKey, symbol), [selectedKey, symbol]);
  const selectedMidis = useMemo(() => chordTonesToMidi(info.chromas), [info]);

  // 有實體 MIDI 輸入時以彈奏為準（用偵測器 analyze 反推），否則顯示選取的和弦（直接用 tonal 命名）
  const isLive = litMidis.length > 0;
  const displayMidis = isLive ? litMidis : selectedMidis;
  const result = useMemo<DetectionResult | null>(() => {
    if (isLive) return analyze(litMidis);
    // tonal 大三和弦 symbol 為 "CM"，慣例顯示為 "C"
    const rawName = info.symbol === `${selectedKey}M` ? selectedKey : info.symbol;
    // 有些和弦（7♭5、13♯11）tonal 給不出描述性全名（只有根音），改用「根音 + 符號」
    const trimmed = info.fullName.trim();
    const full = trimmed && trimmed !== selectedKey ? info.fullName : `${selectedKey} ${toGlyph(symbol)}`;
    return {
      name: toGlyph(rawName),
      full,
      chips: info.notes.map((n, i) => toGlyph(n) + octaveOf(selectedMidis[i])),
      slash: null,
      matches: [],
    };
  }, [isLive, litMidis, info, selectedMidis, selectedKey, symbol]);

  return (
    <section className="midi-detector" aria-labelledby="midi-title">
      <div className="section-heading">
        <h2 id="midi-title">MIDI 和弦偵測器</h2>
        <span className="midi-status">
          <span className={`lamp lamp-${lampState}`} aria-hidden="true" />
          {statusText}
        </span>
      </div>

      <section className="controls" aria-label="選擇和弦">
        <div className="selector-group">
          <p className="field-label">根音</p>
          <KeySelector selected={selectedKey} onSelect={setSelectedKey} />
        </div>
        <div className="selector-group">
          <p className="field-label">和弦類型</p>
          <ChordCatalogSelector
            category={category}
            symbol={symbol}
            onCategoryChange={setCategory}
            onSymbolChange={setSymbol}
          />
        </div>
      </section>

      <ChordReadout result={result} placeholder="選擇和弦或彈奏 MIDI 鍵盤" />

      <MidiKeyboard litMidis={displayMidis} />

      <div className="midi-bar">
        <button type="button" className="transport-button is-play" onClick={start} disabled={started}>
          Start MIDI
        </button>
        <span className="midi-device">
          裝置：<b>{deviceName}</b>
        </span>
        <span className="midi-source">{isLive ? "來源：MIDI 彈奏" : "來源：選取的和弦"}</span>
      </div>

      <p className="section-note midi-hint">
        用上方分類與和弦鈕挑和弦，鍵盤會即時點亮該和弦音；接上 MIDI 鍵盤按 Start 彈奏則以實際彈奏為準
        （彈奏時會用偵測器辨識，對稱和弦與等音組如 C6 = Am7 會列出其他根音的命名）。需要用
        <b> Chrome / Edge</b> 才能使用 MIDI。
      </p>
    </section>
  );
}
