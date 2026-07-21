import { useMemo, useState } from "react";
import { useMidiInput } from "../hooks/useMidiInput";
import { analyze, chordTonesToMidi } from "../lib/chordDetect";
import { getChordInfo, type ChordTypeId, type Key } from "../lib/chords";
import ChordReadout from "./ChordReadout";
import ChordTypeSelector from "./ChordTypeSelector";
import KeySelector from "./KeySelector";
import MidiKeyboard from "./MidiKeyboard";

export default function MidiDetectorView() {
  const { litMidis, lampState, statusText, deviceName, started, start } = useMidiInput();

  const [selectedKey, setSelectedKey] = useState<Key>("C");
  const [chordType, setChordType] = useState<ChordTypeId>("major");
  const chord = useMemo(() => getChordInfo(selectedKey, chordType), [selectedKey, chordType]);
  const selectedMidis = useMemo(() => chordTonesToMidi(chord.chromas), [chord]);

  // 有實體 MIDI 輸入時以彈奏為準，否則顯示選取的和弦
  const isLive = litMidis.length > 0;
  const displayMidis = isLive ? litMidis : selectedMidis;
  // 選取的和弦沿用選擇器的升降拼法（D# 顯示 D♯m 而非等音 E♭m）；彈奏時用偵測器自己的拼法。
  // 讀出面板一律用 ♯ 字型符號，故把選擇器的 "#" 正規化為 "♯"。
  const result = useMemo(() => {
    const hint = isLive ? undefined : { pc: chord.rootChroma, name: selectedKey.replace("#", "♯") };
    return analyze(displayMidis, hint);
  }, [displayMidis, isLive, chord.rootChroma, selectedKey]);

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
          <ChordTypeSelector selected={chordType} onSelect={setChordType} />
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
        用上方選擇器挑和弦，鍵盤會即時點亮該和弦音；接上 MIDI 鍵盤按 Start 彈奏則以實際彈奏為準。
        音名會依和弦品質做正確的升降記法（例如 C°7 → C–E♭–G♭–B♭♭），對稱和弦與等音組（如 C6 = Am7）
        會在上方列出其他根音的命名。需要用 <b>Chrome / Edge</b> 才能使用 MIDI。
      </p>
    </section>
  );
}
