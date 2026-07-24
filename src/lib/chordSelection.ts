import {
  CHORD_CATEGORIES,
  categoryForSymbol,
  chordsInCategory,
  type ChordCategory,
} from "./chordCatalog";
import { cycleIndex, type CycleDirection } from "./chordControls";

export interface ChordSelection {
  category: ChordCategory;
  symbol: string;
}

export function initialChordSelection(initialSymbol = "major"): ChordSelection {
  const category = categoryForSymbol(initialSymbol);
  return category ? { category, symbol: initialSymbol } : { category: "major", symbol: "major" };
}

export function selectChordCategory(
  selection: ChordSelection,
  category: ChordCategory,
): ChordSelection {
  if (selection.category === category) return selection;

  const firstChord = chordsInCategory(category)[0];
  if (!firstChord) throw new Error(`和弦分類沒有項目：${category}`);
  return { category, symbol: firstChord.symbol };
}

export function selectChordSymbol(selection: ChordSelection, symbol: string): ChordSelection {
  const category = categoryForSymbol(symbol);
  return category ? { category, symbol } : selection;
}

export function cycleChordSymbol(
  selection: ChordSelection,
  direction: CycleDirection,
): ChordSelection {
  const chords = chordsInCategory(selection.category);
  const current = chords.findIndex((chord) => chord.symbol === selection.symbol);
  const index = cycleIndex(current < 0 ? 0 : current, chords.length, direction);
  return { category: selection.category, symbol: chords[index].symbol };
}

export function cycleChordCategory(
  selection: ChordSelection,
  direction: CycleDirection,
): ChordSelection {
  const current = CHORD_CATEGORIES.findIndex((entry) => entry.id === selection.category);
  const index = cycleIndex(
    current < 0 ? 0 : current,
    CHORD_CATEGORIES.length,
    direction,
  );
  return selectChordCategory(selection, CHORD_CATEGORIES[index].id);
}
