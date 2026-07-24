import { Chord, Interval, Note } from "tonal";

export const KEYS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;
export type Key = (typeof KEYS)[number];

export interface ChordInfo {
  root: string;
  rootChroma: number;
  notes: string[];
  chromas: number[];
  degrees: string[];
}

export interface ChordSymbolInfo extends ChordInfo {
  symbol: string; // tonal 給的和弦符號，例如 "C6/9"
  fullName: string; // tonal 給的全名，例如 "C sixth added ninth"
}

const NATURAL_INTERVAL_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

// 將 tonal 音程（例如 7m、11A、7d）轉成和弦級數（♭7、♯11、♭♭7）。
export function intervalToDegree(interval: string): string {
  const match = interval.match(/^(\d+)/);
  const degree = Number(match?.[1]);
  const semitones = Interval.semitones(interval);

  if (!degree || semitones === undefined) return interval;

  const octave = Math.floor((degree - 1) / 7);
  const naturalSemitones = NATURAL_INTERVAL_SEMITONES[(degree - 1) % 7] + octave * 12;
  const alteration = semitones - naturalSemitones;
  const accidental =
    alteration < 0 ? "♭".repeat(-alteration) : alteration > 0 ? "♯".repeat(alteration) : "";

  return `${accidental}${degree}`;
}

// 用 catalog 的和弦符號（例如 "6/9"、"7b9"）取得和弦資訊，兩分頁共用。
export function getChordBySymbol(key: Key, symbol: string): ChordSymbolInfo {
  const chord = Chord.getChord(symbol, key);
  const notes = chord.notes;
  return {
    root: key,
    rootChroma: Note.chroma(key) ?? 0,
    notes,
    chromas: notes.map((n) => Note.chroma(n) ?? 0),
    degrees: chord.intervals.map(intervalToDegree),
    symbol: chord.symbol,
    fullName: chord.name,
  };
}
