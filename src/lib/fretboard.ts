import { Interval, Note } from "tonal";

export const TUNING = ["E4", "B3", "G3", "D3", "A2", "E2"] as const;
export const FRET_COUNT = 12;

export interface FretPosition {
  string: number; // 1（最高音，畫面最上）～ 6（最低音，畫面最下）
  fret: number; // 0 = 空弦 ～ 12
  note: string; // 含八度的音高，如 "C4"，播音用
  chroma: number; // 半音類別 0-11，比對用
}

export function buildFretboard(): FretPosition[] {
  const positions: FretPosition[] = [];
  TUNING.forEach((open, i) => {
    for (let fret = 0; fret <= FRET_COUNT; fret++) {
      const note = Note.transpose(open, Interval.fromSemitones(fret));
      positions.push({
        string: i + 1,
        fret,
        note,
        chroma: Note.chroma(note) ?? 0,
      });
    }
  });
  return positions;
}

export const FRETBOARD = buildFretboard();
