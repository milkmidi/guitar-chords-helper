import { Chord, Note } from "tonal";

export const KEYS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;
export type Key = (typeof KEYS)[number];

export const CHORD_TYPES = [
  { id: "major", label: "Major" },
  { id: "minor", label: "Minor" },
  { id: "7", label: "7" },
  { id: "maj7", label: "Maj7" },
  { id: "m7", label: "m7" },
  { id: "sus2", label: "Sus2" },
  { id: "sus4", label: "Sus4" },
  { id: "dim", label: "Dim" },
  { id: "aug", label: "Aug" },
] as const;
export type ChordTypeId = (typeof CHORD_TYPES)[number]["id"];

export interface ChordInfo {
  root: string;
  rootChroma: number;
  notes: string[];
  chromas: number[];
}

export function getChordInfo(key: Key, typeId: ChordTypeId): ChordInfo {
  const chord = Chord.getChord(typeId, key);
  const notes = chord.notes;
  return {
    root: key,
    rootChroma: Note.chroma(key) ?? 0,
    notes,
    chromas: notes.map((n) => Note.chroma(n) ?? 0),
  };
}

export interface ChordSymbolInfo extends ChordInfo {
  symbol: string; // tonal 給的和弦符號，例如 "C6/9"
  fullName: string; // tonal 給的全名，例如 "C sixth added ninth"
}

// 用任意 tonal 符號（例如 "6/9"、"7b9"）取得和弦資訊，供 MIDI tab 的策展目錄使用。
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
