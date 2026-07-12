import type { Voicing } from "../lib/voicings";

const STRING_GAP = 20;
const FRET_GAP = 26;
const LEFT = 30;
const GRID_TOP = 40;
const STRING_COUNT = 6;
const FRET_WINDOW = 5;
const GRID_W = STRING_GAP * (STRING_COUNT - 1);
const GRID_H = FRET_GAP * FRET_WINDOW;
const WIDTH = LEFT + GRID_W + 14;
const HEIGHT = GRID_TOP + GRID_H + 24;
const STRING_LABELS = ["E2", "A2", "D3", "G3", "B3", "E4"];

const stringX = (i: number) => LEFT + i * STRING_GAP;
const fretY = (f: number) => GRID_TOP + (f - 0.5) * FRET_GAP;

interface Props {
  voicing: Voicing;
  label: string; // 例如 "v1"
  onPlay?: () => void;
}

export default function ChordDiagram({ voicing, label, onPlay }: Props) {
  const { frets, fingers, baseFret, barres } = voicing;
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`播放按法 ${label}`}
      className={`shrink-0 rounded-lg bg-white p-2 shadow ${
        onPlay ? "cursor-pointer transition-shadow hover:shadow-md" : ""
      }`}
    >
      <p className="mb-1 text-center text-sm font-semibold text-slate-600">{label}</p>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH * 1.2} height={HEIGHT * 1.2}>
        {Array.from({ length: FRET_WINDOW + 1 }, (_, f) => (
          <line
            key={f}
            x1={LEFT}
            y1={GRID_TOP + f * FRET_GAP}
            x2={LEFT + GRID_W}
            y2={GRID_TOP + f * FRET_GAP}
            strokeWidth={1}
            className="stroke-slate-400"
          />
        ))}
        {Array.from({ length: STRING_COUNT }, (_, i) => (
          <line
            key={i}
            x1={stringX(i)}
            y1={GRID_TOP}
            x2={stringX(i)}
            y2={GRID_TOP + GRID_H}
            strokeWidth={1}
            className="stroke-slate-500"
          />
        ))}
        {baseFret === 1 ? (
          <rect x={LEFT - 1} y={GRID_TOP - 4} width={GRID_W + 2} height={4} className="fill-slate-800" />
        ) : (
          <text x={LEFT - 6} y={fretY(1) + 4} textAnchor="end" className="fill-slate-500 text-[11px]">
            {baseFret}fr
          </text>
        )}
        {frets.map((f, i) =>
          f === -1 ? (
            <text
              key={i}
              x={stringX(i)}
              y={GRID_TOP - 10}
              textAnchor="middle"
              className="fill-slate-600 text-[12px] font-bold"
            >
              ✕
            </text>
          ) : f === 0 ? (
            <circle
              key={i}
              cx={stringX(i)}
              cy={GRID_TOP - 14}
              r={4.5}
              strokeWidth={1.5}
              className="fill-none stroke-slate-600"
            />
          ) : null
        )}
        {barres.map((b) => {
          const covered = frets.map((f, i) => (f === b ? i : -1)).filter((i) => i >= 0);
          if (covered.length < 2) return null;
          const from = covered[0];
          const to = covered[covered.length - 1];
          return (
            <rect
              key={b}
              x={stringX(from) - 8}
              y={fretY(b) - 8}
              width={stringX(to) - stringX(from) + 16}
              height={16}
              rx={8}
              className="fill-slate-800"
            />
          );
        })}
        {frets.map((f, i) =>
          f > 0 ? (
            <g key={i}>
              <circle cx={stringX(i)} cy={fretY(f)} r={8} className="fill-slate-800" />
              {fingers[i] > 0 && (
                <text
                  x={stringX(i)}
                  y={fretY(f) + 3.5}
                  textAnchor="middle"
                  className="fill-white text-[10px] font-semibold"
                >
                  {fingers[i]}
                </text>
              )}
            </g>
          ) : null
        )}
        {STRING_LABELS.map((s, i) => (
          <text key={s} x={stringX(i)} y={HEIGHT - 6} textAnchor="middle" className="fill-slate-500 text-[9px]">
            {s}
          </text>
        ))}
      </svg>
    </button>
  );
}
