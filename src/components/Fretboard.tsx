import { FRET_COUNT, FRETBOARD, type FretPosition } from "../lib/fretboard";

const NUT_X = 70;
const FRET_W = 76;
const TOP = 28;
const STRING_GAP = 36;
const BOARD_W = NUT_X + FRET_W * FRET_COUNT;
const WIDTH = BOARD_W + 24;
const HEIGHT = TOP + STRING_GAP * 5 + 44;
const SINGLE_MARKER_FRETS = [3, 5, 7, 9];

const stringY = (s: number) => TOP + (s - 1) * STRING_GAP;
const fretCenterX = (f: number) => (f === 0 ? 36 : NUT_X + (f - 0.5) * FRET_W);

interface Props {
  chordChromas: number[];
  rootChroma: number;
  noteLabels: ReadonlyMap<number, string>;
  onNotePlay?: (position: FretPosition) => void;
}

export default function Fretboard({ chordChromas, rootChroma, noteLabels, onNotePlay }: Props) {
  const activePositions = FRETBOARD.filter((p) => chordChromas.includes(p.chroma));

  return (
    <div className="fretboard-shell">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="fretboard-canvas">
        <rect
          x={NUT_X}
          y={TOP - 14}
          width={FRET_W * FRET_COUNT}
          height={STRING_GAP * 5 + 28}
          rx={4}
          className="fretboard-wood"
        />
        <rect
          x={NUT_X - 6}
          y={TOP - 14}
          width={6}
          height={STRING_GAP * 5 + 28}
          className="fretboard-nut"
        />
        {Array.from({ length: FRET_COUNT }, (_, i) => i + 1).map((f) => (
          <line
            key={f}
            x1={NUT_X + f * FRET_W}
            y1={TOP - 14}
            x2={NUT_X + f * FRET_W}
            y2={TOP + STRING_GAP * 5 + 14}
            strokeWidth={2}
            className="fret-wire"
          />
        ))}
        {SINGLE_MARKER_FRETS.map((f) => (
          <circle key={f} cx={fretCenterX(f)} cy={TOP + 2.5 * STRING_GAP} r={7} className="fret-marker" />
        ))}
        <circle cx={fretCenterX(12)} cy={TOP + 1.5 * STRING_GAP} r={7} className="fret-marker" />
        <circle cx={fretCenterX(12)} cy={TOP + 3.5 * STRING_GAP} r={7} className="fret-marker" />
        {Array.from({ length: 6 }, (_, i) => i + 1).map((s) => (
          <line
            key={s}
            x1={28}
            y1={stringY(s)}
            x2={BOARD_W}
            y2={stringY(s)}
            strokeWidth={0.8 + s * 0.35}
            className="guitar-string"
          />
        ))}
        {Array.from({ length: FRET_COUNT }, (_, i) => i + 1).map((f) => (
          <text
            key={f}
            x={fretCenterX(f)}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fret-number"
          >
            {f}
          </text>
        ))}
        {activePositions.map((p) => {
          const isRoot = p.chroma === rootChroma;
          return (
            <g
              key={`${p.string}-${p.fret}`}
              onClick={onNotePlay ? () => onNotePlay(p) : undefined}
              className={onNotePlay ? "fret-note is-playable" : "fret-note"}
            >
              <circle
                cx={fretCenterX(p.fret)}
                cy={stringY(p.string)}
                r={13}
                className={isRoot ? "note-circle root" : "note-circle chord"}
              />
              <text
                x={fretCenterX(p.fret)}
                y={stringY(p.string) + 4}
                textAnchor="middle"
                className="note-circle-label"
              >
                {noteLabels.get(p.chroma) ?? ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
