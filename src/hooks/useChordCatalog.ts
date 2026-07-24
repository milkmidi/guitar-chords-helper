import { useCallback, useState } from "react";
import type { ChordCategory } from "../lib/chordCatalog";
import type { CycleDirection } from "../lib/chordControls";
import {
  cycleChordCategory,
  cycleChordSymbol,
  initialChordSelection,
  selectChordCategory,
  selectChordSymbol,
  type ChordSelection,
} from "../lib/chordSelection";
import { useArrowCycle } from "./useArrowCycle";

// 和弦目錄選擇的共用狀態：分類 filter + 目前和弦 symbol，兩分頁共用。
// ←/→ 在目前分類內循環和弦；↑/↓ 循環分類。切分類時若目前和弦不在新分類內，
// 自動選該分類第一個（鍵盤與點擊共用此行為）。
export interface ChordCatalogControls extends ChordSelection {
  changeCategory: (category: ChordCategory) => void;
  selectSymbol: (symbol: string) => void;
  cycleSymbol: (direction: CycleDirection) => void;
  cycleCategory: (direction: CycleDirection) => void;
}

export function useChordCatalog(initialSymbol = "major"): ChordCatalogControls {
  const [selection, setSelection] = useState<ChordSelection>(() =>
    initialChordSelection(initialSymbol),
  );

  const changeCategory = useCallback((category: ChordCategory) => {
    setSelection((current) => selectChordCategory(current, category));
  }, []);
  const selectSymbol = useCallback((symbol: string) => {
    setSelection((current) => selectChordSymbol(current, symbol));
  }, []);
  const cycleSymbol = useCallback((direction: CycleDirection) => {
    setSelection((current) => cycleChordSymbol(current, direction));
  }, []);
  const cycleCategory = useCallback((direction: CycleDirection) => {
    setSelection((current) => cycleChordCategory(current, direction));
  }, []);

  useArrowCycle({
    onLeft: () => cycleSymbol(-1),
    onRight: () => cycleSymbol(1),
    onUp: () => cycleCategory(-1),
    onDown: () => cycleCategory(1),
  });

  return {
    ...selection,
    changeCategory,
    selectSymbol,
    cycleSymbol,
    cycleCategory,
  };
}
