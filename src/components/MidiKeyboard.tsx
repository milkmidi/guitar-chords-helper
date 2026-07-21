// 鋼琴鍵盤（C2–C7），純渲染：依 litMidis 點亮被按住的鍵。
// 版面於模組載入時算好，與 props 無關。

const LOW = 36; // C2
const HIGH = 96; // C7
const BLACK = new Set([1, 3, 6, 8, 10]);

const octaveOf = (m: number) => Math.floor(m / 12) - 1;
const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const noteLabel = (m: number) => NOTE_NAMES[m % 12] + octaveOf(m);

const whiteMidis: number[] = [];
for (let m = LOW; m <= HIGH; m++) {
  if (!BLACK.has(m % 12)) whiteMidis.push(m);
}
const wWidth = 100 / whiteMidis.length;

interface BlackKey {
  midi: number;
  left: number;
  width: number;
}
const blackKeys: BlackKey[] = [];
for (let m = LOW; m <= HIGH; m++) {
  if (!BLACK.has(m % 12)) continue;
  let whiteBelow = 0;
  for (let i = 0; i < whiteMidis.length; i++) {
    if (whiteMidis[i] < m) whiteBelow = i;
    else break;
  }
  blackKeys.push({
    midi: m,
    left: (whiteBelow + 1) * wWidth - wWidth * 0.3,
    width: wWidth * 0.6,
  });
}

interface Props {
  litMidis: number[];
  onKeyPlay?: (midi: number) => void; // 點擊琴鍵時發聲
}

export default function MidiKeyboard({ litMidis, onKeyPlay }: Props) {
  const lit = new Set(litMidis);
  return (
    <div className="keyboard-wrap">
      <div className="keyboard" role="group" aria-label="MIDI 鍵盤，點擊琴鍵可發聲">
        {whiteMidis.map((m) => (
          <button
            key={m}
            type="button"
            className={`wkey${lit.has(m) ? " lit" : ""}`}
            aria-label={noteLabel(m)}
            onClick={() => onKeyPlay?.(m)}
          >
            {m % 12 === 0 && <span className="klabel">C{octaveOf(m)}</span>}
          </button>
        ))}
        {blackKeys.map(({ midi, left, width }) => (
          <button
            key={midi}
            type="button"
            className={`bkey${lit.has(midi) ? " lit" : ""}`}
            aria-label={noteLabel(midi)}
            style={{ left: `${left}%`, width: `${width}%` }}
            onClick={() => onKeyPlay?.(midi)}
          />
        ))}
      </div>
    </div>
  );
}
