# 吉他分頁共用和弦目錄選擇器

## 目標

讓吉他「和弦查詢」分頁與 MIDI 分頁共用同一套控制項（`ChordCatalogSelector`：分類 filter +
約 36 個和弦），取代目前只有 9 型的 `ChordTypeSelector`。兩分頁的和弦清單一致。

## 背景與限制

- MIDI（鋼琴）分頁只需 tonal 的音高，任何和弦都能點亮鍵盤／畫五線譜。
- 吉他分頁的「常用按法」與音軌依賴 `voicings.json`（由 `@tombatossals/chords-db` v0.5.1
  產生），目前只收 9 型。
- 實查 chords-db：吉他有 44 種 suffix；我們的 36 個 catalog 和弦中，**32 個在 12 key 全有**
  指法。完全沒有的只有 `m13`、`7#5`、`9#5`、`13#11`；其中 `7#5`/`9#5` 與 `aug7`/`aug9`
  為等音（相同音），可對到既有指法。真正無吉他資料的只剩 `m13`、`13#11`。
- 音軌 `TrackCell` 只存 `chordName: string` + `voicing` 快照，不引用型別，不受影響。
- `VoicingsPanel` 在 `voicings.length === 0` 時回傳 `null`，空按法已優雅隱藏。

## 決定（已與使用者確認）

1. **兩分頁一致的 36 個和弦**。`7#5→aug7`、`9#5→aug9` 對到等音指法；`m13`/`13#11` 保留
   （指板圖正常），但「常用按法」區自動隱藏。
2. **統一用 catalog 字串 `symbol`**。退休 `ChordTypeId` / `CHORD_TYPES` / `getChordInfo` /
   `ChordTypeSelector`；`getVoicings` / 兩分頁都改用 `symbol: string`。`voicings.json` 改以
   我們的 catalog symbol 當 key。矩陣測試改跑 catalog。

## 設計

### 資料管線

- `scripts/extract-voicings.mjs`：以一張 **catalog symbol → chords-db suffix** 對照表取代
  9 型清單（34 個 guitar-supported）。JSON key 用我們的 symbol。
  - 等音對應：`"7#5":"aug7"`、`"9#5":"aug9"`。
  - `m13`、`13#11` 不在表內（無 chords-db 資料）。
  - 完整性檢查：表內每個 symbol 在 12 key 都要有 positions，否則 `exit 1`。
- 重生 `src/data/voicings.json`（9 型 → 34 型）。

### 純邏輯

- `voicings.ts`：`getVoicings(key: Key, symbol: string): Voicing[]`。
- `chords.ts`：移除 `CHORD_TYPES`、`ChordTypeId`、`getChordInfo`；保留 `getChordBySymbol`
  （回傳 `ChordSymbolInfo`，是 `ChordInfo` 超集）、`KEYS`、`Key`、`ChordInfo`。

### 共用 hook `useChordCatalog`

抽出 MIDI 分頁的 `{category, symbol, changeCategory, setSymbol}` 狀態與 `←/→`（分類內循環
和弦）、`↑/↓`（循環分類）邏輯，兩分頁共用。內部用 `useArrowCycle` + `cycleIndex`。

### 元件

- `ChordFinderView`：改用 `useChordCatalog` + `ChordCatalogSelector` + `getChordBySymbol` +
  `getVoicings(key, symbol)`。指板圖、音軌不動。英雄區標題改用 catalog label（大三和弦顯示
  `C`，其餘如 `C 6/9`、`C m7`）。
- `MidiDetectorView`：改用 `useChordCatalog`（移除自身重複的 category/cycle 邏輯）。
- 刪除 `ChordTypeSelector.tsx`。

### 測試

- `chords.test.ts`：矩陣改用 `getChordBySymbol` 跑 catalog symbols，斷言 notes/chromas 非空。
- `voicings.test.ts`：改跑 guitar-supported 清單，斷言 12 key × 這些 symbol 都 ≥1 voicing；
  斷言 `m13`/`13#11` 回傳 `[]`。
- 新增守門測試：`voicings.json` 每個 key 的和弦 key 集合 = 預期 guitar symbol 集合（防漂移）。
- `useChordCatalog` 的純部分已由 `cycleIndex` 測試覆蓋；事件監聽瀏覽器手動驗證。

### 文件

- 更新 `CLAUDE.md`：反映統一 catalog symbol、吉他改用 `ChordCatalogSelector`、voicings 涵蓋
  約 34 個吉他和弦、extract 腳本改用對照表等。

## 驗證

`npm test`、`npm run build`、`npm run lint`、`npm run extract-voicings` 皆須通過；瀏覽器手動
確認吉他分頁分類切換、延伸和弦指板圖、`m13`/`13#11` 無按法區、音軌仍可用。
