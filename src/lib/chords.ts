import { Chord, Note } from "tonal";

export const KEYS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;
export type Key = (typeof KEYS)[number];

export interface ChordInfo {
  root: string;
  rootChroma: number;
  notes: string[];
  chromas: number[];
}

export interface ChordSymbolInfo extends ChordInfo {
  symbol: string; // tonal 給的和弦符號，例如 "C6/9"
  fullName: string; // tonal 給的全名，例如 "C sixth added ninth"
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
    symbol: chord.symbol,
    fullName: chord.name,
  };
}
