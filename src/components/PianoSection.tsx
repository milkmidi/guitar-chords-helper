import { lazy, Suspense, useMemo } from "react";
import { Note } from "tonal";
import { useMidiInput } from "../hooks/useMidiInput";
import { playNote, playStrum } from "../lib/audio";
import { toGlyph } from "../lib/chordCatalog";
import { analyze, chordTonesToMidi, type DetectionResult } from "../lib/chordDetect";
import type { ChordSymbolInfo, Key } from "../lib/chords";
import ChordReadout from "./ChordReadout";
import MidiKeyboard from "./MidiKeyboard";

// 五線譜用到 VexFlow（較大），延後載入讓初始包更輕
const Staff = lazy(() => import("./Staff"));

const octaveOf = (m: number) => Math.floor(m / 12) - 1;

interface Props {
  selectedKey: Key;
  symbol: string;
  chord: ChordSymbolInfo;
}

// 鋼琴欄：五線譜 + 鍵盤。和弦選擇由上層共用控制項驅動；只保留 MIDI 輸入狀態。
// 有實體 MIDI 彈奏時以彈奏為準（此時才顯示讀出面板的辨識名稱／等音別名），
// 否則顯示上層選取的和弦。
export default function PianoSection({ selectedKey, symbol, chord }: Props) {
  const { supported, litMidis, lampState, statusText, deviceName, started, start } = useMidiInput();

  const selectedMidis = useMemo(() => chordTonesToMidi(chord.chromas), [chord]);
  const isLive = litMidis.length > 0;
  const displayMidis = isLive ? litMidis : selectedMidis;

  const result = useMemo<DetectionResult | null>(() => {
    if (isLive) return analyze(litMidis);
    const rawName = chord.symbol === `${selectedKey}M` ? selectedKey : chord.symbol;
    const trimmed = chord.fullName.trim();
    const full = trimmed && trimmed !== selectedKey ? chord.fullName : `${selectedKey} ${toGlyph(symbol)}`;
    return {
      name: toGlyph(rawName),
      full,
      chips: chord.notes.map((n, i) => toGlyph(n) + octaveOf(selectedMidis[i])),
      slash: null,
      matches: [],
    };
  }, [isLive, litMidis, chord, selectedMidis, selectedKey, symbol]);

  const staffNotes = useMemo(
    () => (result ? displayMidis.map((midi, i) => ({ midi, name: result.chips[i] })) : []),
    [displayMidis, result],
  );

  return (
    <section className="instrument-col" aria-labelledby="piano-title">
      <div className="section-heading">
        <h2 id="piano-title">鋼琴鍵盤</h2>
        {supported && (
          <span className="midi-status">
            <span className={`lamp lamp-${lampState}`} aria-hidden="true" />
            {statusText}
          </span>
        )}
      </div>

      {isLive && <ChordReadout result={result} placeholder="彈奏 MIDI 鍵盤" />}

      <Suspense fallback={<div className="staff-wrap staff-fallback">載入五線譜…</div>}>
        <Staff notes={staffNotes} onPlay={() => playStrum(displayMidis)} />
      </Suspense>

      <MidiKeyboard litMidis={displayMidis} onKeyPlay={(midi) => playNote(Note.fromMidi(midi))} />

      {supported && (
        <div className="midi-bar">
          <button type="button" className="transport-button is-play" onClick={start} disabled={started}>
            Start MIDI
          </button>
          <span className="midi-device">
            裝置：<b>{deviceName}</b>
          </span>
          {isLive && <span className="midi-source">來源：MIDI 彈奏</span>}
        </div>
      )}

      <p className="section-note midi-hint">
        {supported ? (
          <>
            點鍵盤琴鍵或五線譜即可發聲；接上 MIDI 鍵盤按 Start 彈奏會即時辨識和弦（對稱和弦與等音組
            如 C6 = Am7 會列出其他根音）。
          </>
        ) : (
          <>
            點鍵盤琴鍵或五線譜即可發聲。接上 MIDI 鍵盤即時辨識和弦的功能需要 <b>Chrome / Edge</b>，
            此瀏覽器不支援。
          </>
        )}
      </p>
    </section>
  );
}
