import { useMemo } from "react";
import { useMidiInput } from "../hooks/useMidiInput";
import { analyze } from "../lib/chordDetect";
import ChordReadout from "./ChordReadout";
import MidiKeyboard from "./MidiKeyboard";

export default function MidiDetectorView() {
  const { litMidis, lampState, statusText, deviceName, started, start } = useMidiInput();

  const result = useMemo(() => analyze(litMidis), [litMidis]);
  const placeholder = started ? "開始彈奏你的鍵盤 🎹" : "按下 START 授權後開始彈奏";

  return (
    <section className="midi-detector" aria-labelledby="midi-title">
      <div className="section-heading">
        <h2 id="midi-title">MIDI 和弦偵測器</h2>
        <span className="midi-status">
          <span className={`lamp lamp-${lampState}`} aria-hidden="true" />
          {statusText}
        </span>
      </div>

      <ChordReadout result={result} placeholder={placeholder} />

      <MidiKeyboard litMidis={litMidis} />

      <div className="midi-bar">
        <button type="button" className="transport-button is-play" onClick={start} disabled={started}>
          Start MIDI
        </button>
        <span className="midi-device">
          裝置：<b>{deviceName}</b>
        </span>
      </div>

      <p className="section-note midi-hint">
        需要用 <b>Chrome / Edge</b> 開啟。音名會依和弦品質做正確的升降記法（例如 C°7 → C–E♭–G♭–B♭♭），
        支援三／七和弦、sus、add、6，以及延伸和弦 9 / 11 / 13。對稱和弦與等音組（如 C6 = Am7）
        會在上方列出其他根音的命名。
      </p>
    </section>
  );
}
