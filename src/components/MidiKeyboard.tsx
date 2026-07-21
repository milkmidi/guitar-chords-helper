// 鋼琴鍵盤（C2–C7），純渲染：依 litMidis 點亮被按住的鍵。
// 版面於模組載入時算好，與 props 無關。

const LOW = 36; // C2
const HIGH = 96; // C7
const BLACK = new Set([1, 3, 6, 8, 10]);

const octaveOf = (m: number) => Math.floor(m / 12) - 1;

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
}

export default function MidiKeyboard({ litMidis }: Props) {
  const lit = new Set(litMidis);
  return (
    <div className="keyboard-wrap">
      <div className="keyboard" role="img" aria-label="MIDI 鍵盤，亮起的鍵為目前按下的音">
        {whiteMidis.map((m) => (
          <div key={m} className={`wkey${lit.has(m) ? " lit" : ""}`}>
            {m % 12 === 0 && <span className="klabel">C{octaveOf(m)}</span>}
          </div>
        ))}
        {blackKeys.map(({ midi, left, width }) => (
          <div
            key={midi}
            className={`bkey${lit.has(midi) ? " lit" : ""}`}
            style={{ left: `${left}%`, width: `${width}%` }}
          />
        ))}
      </div>
    </div>
  );
}
