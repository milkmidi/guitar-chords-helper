// MIDI（鋼琴）tab 用的策展和弦目錄。symbol 交給 tonal 解析取得音高與拼寫，
// label 用 ♯/♭ 字型符號顯示，category 供上方分類 filter 使用。
// 吉他「和弦查詢」tab 不用這份（它受 voicings 按法資料限制，維持 chords.ts 的 CHORD_TYPES）。

export type ChordCategory =
  | "major"
  | "minor"
  | "dominant"
  | "diminished"
  | "augmented"
  | "altered";

export type CategoryFilter = "all" | ChordCategory;

export const CHORD_CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Show All" },
  { id: "major", label: "Major" },
  { id: "minor", label: "Minor" },
  { id: "dominant", label: "Dominant" },
  { id: "diminished", label: "Diminished" },
  { id: "augmented", label: "Augmented" },
  { id: "altered", label: "Altered" },
];

export interface CatalogChord {
  symbol: string; // tonal 可解析的和弦符號，例如 "maj7"、"6/9"、"7b9"
  label: string; // 按鈕顯示文字（升降用字型符號）
  category: ChordCategory;
}

// 把 tonal 的 ASCII 升降（#/b）換成字型符號。音名字母皆大寫，故替換小寫 b 安全。
export const toGlyph = (s: string): string => s.replace(/#/g, "♯").replace(/b/g, "♭");

export const CHORD_CATALOG: CatalogChord[] = [
  // ---- Major ----
  { symbol: "major", label: "maj", category: "major" },
  { symbol: "6", label: "6", category: "major" },
  { symbol: "6/9", label: "6/9", category: "major" },
  { symbol: "maj7", label: "maj7", category: "major" },
  { symbol: "maj9", label: "maj9", category: "major" },
  { symbol: "maj13", label: "maj13", category: "major" },
  { symbol: "add9", label: "add9", category: "major" },
  { symbol: "sus2", label: "sus2", category: "major" },
  { symbol: "sus4", label: "sus4", category: "major" },

  // ---- Minor ----
  { symbol: "minor", label: "min", category: "minor" },
  { symbol: "m6", label: "m6", category: "minor" },
  { symbol: "m7", label: "m7", category: "minor" },
  { symbol: "m9", label: "m9", category: "minor" },
  { symbol: "m11", label: "m11", category: "minor" },
  { symbol: "m13", label: "m13", category: "minor" },
  { symbol: "mMaj7", label: "mMaj7", category: "minor" },
  { symbol: "madd9", label: "madd9", category: "minor" },
  { symbol: "m69", label: "m6/9", category: "minor" },

  // ---- Dominant ----
  { symbol: "7", label: "7", category: "dominant" },
  { symbol: "9", label: "9", category: "dominant" },
  { symbol: "11", label: "11", category: "dominant" },
  { symbol: "13", label: "13", category: "dominant" },
  { symbol: "7sus4", label: "7sus4", category: "dominant" },

  // ---- Diminished ----
  { symbol: "dim", label: "dim", category: "diminished" },
  { symbol: "dim7", label: "dim7", category: "diminished" },
  { symbol: "m7b5", label: "m7♭5", category: "diminished" },

  // ---- Augmented ----
  { symbol: "aug", label: "aug", category: "augmented" },
  { symbol: "aug7", label: "aug7", category: "augmented" },
  { symbol: "maj7#5", label: "maj7♯5", category: "augmented" },

  // ---- Altered ----
  { symbol: "7b5", label: "7♭5", category: "altered" },
  { symbol: "7#5", label: "7♯5", category: "altered" },
  { symbol: "7b9", label: "7♭9", category: "altered" },
  { symbol: "7#9", label: "7♯9", category: "altered" },
  { symbol: "9#5", label: "9♯5", category: "altered" },
  { symbol: "13#11", label: "13♯11", category: "altered" },
  { symbol: "alt7", label: "alt", category: "altered" },
];

export function chordsInCategory(filter: CategoryFilter): CatalogChord[] {
  return filter === "all" ? CHORD_CATALOG : CHORD_CATALOG.filter((c) => c.category === filter);
}
