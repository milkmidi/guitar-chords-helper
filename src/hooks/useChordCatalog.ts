import { useCallback, useState } from "react";
import { CHORD_CATEGORIES, chordsInCategory, type CategoryFilter } from "../lib/chordCatalog";
import { cycleIndex, useArrowCycle } from "./useArrowCycle";

// 和弦目錄選擇的共用狀態：分類 filter + 目前和弦 symbol，兩分頁共用。
// ←/→ 在目前分類內循環和弦；↑/↓ 循環分類。切分類時若目前和弦不在新分類內，
// 自動選該分類第一個（鍵盤與點擊共用此行為）。
export function useChordCatalog(initialSymbol = "major") {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [symbol, setSymbol] = useState(initialSymbol);

  const changeCategory = useCallback(
    (next: CategoryFilter) => {
      setCategory(next);
      if (next !== "all") {
        const list = chordsInCategory(next);
        if (!list.some((c) => c.symbol === symbol)) setSymbol(list[0].symbol);
      }
    },
    [symbol],
  );

  const cycleSymbol = (dir: number) => {
    const list = chordsInCategory(category);
    const i = list.findIndex((c) => c.symbol === symbol);
    setSymbol(list[cycleIndex(i < 0 ? 0 : i, list.length, dir)].symbol);
  };
  const cycleCategory = (dir: number) => {
    const i = CHORD_CATEGORIES.findIndex((c) => c.id === category);
    changeCategory(CHORD_CATEGORIES[cycleIndex(i, CHORD_CATEGORIES.length, dir)].id);
  };
  useArrowCycle({
    onLeft: () => cycleSymbol(-1),
    onRight: () => cycleSymbol(1),
    onUp: () => cycleCategory(-1),
    onDown: () => cycleCategory(1),
  });

  return { category, symbol, changeCategory, setSymbol };
}
