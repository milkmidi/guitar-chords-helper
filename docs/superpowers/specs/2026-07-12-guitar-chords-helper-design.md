# Guitar Chords Helper — Design Spec

Date: 2026-07-12
Status: Approved

## 目的

吉他學習用 Web App：選調性 + 和弦類型後，在橫式指板上顯示該和弦的所有組成音位置，幫助學習者理解組成音在指板上的分布。

## 需求

1. 橫式吉他指板：6 弦（標準調音 EADGBE，畫面上第 1 弦在上、第 6 弦在下）× 12 琴格，外加第 0 格（空弦）。
2. 12 個調可選：C, C#, D, D#, E, F, F#, G, G#, A, A#, B。
3. 和弦類型 9 種：major, minor, 7, maj7, m7, sus2, sus4, dim, aug。
4. 顯示方式：指板上**所有**組成音位置全部亮起（非特定按法 voicing）。
   - 根音：橘色實心圓
   - 其他組成音：藍色圓
   - 圓內顯示音名（C、E、G…）
5. 組成音列表：指板上方顯示文字，例如「C major = C - E - G」，根音以橘色標示。
6. 點擊指板上亮起的音，以 Web Audio API 合成播放該音高（無音檔）。
7. 指板有 3/5/7/9/12 格位置記號點（12 格為雙點）。

## 技術選擇

- Vite + React + TypeScript + Tailwind CSS
- 樂理計算：**tonal**（v6，活躍維護、零依賴）
  - `Chord.get()` 取得組成音
  - `Note` 模組計算每弦每格音名與 chroma
- 指板：自繪 SVG（React 元件），不使用現成指板套件
- 聲音：Web Audio API `OscillatorNode`，音名 → 頻率 → 播放短音

### 已評估並排除的套件

| 套件 | 排除原因 |
|---|---|
| @tombatossals/react-chords | 畫的是直式和弦按法圖（chord box），非橫式全指板組成音；2019 後未維護 |
| @moonwave99/fretboard.js | vanilla JS + D3，React 整合彆扭；2022 後未更新 |
| react-guitar | 資料模型為按法互動導向，客製組成音顯示需繞路 |
| react-fretboard (devboell) | 多年未維護 |

## 架構

```
src/
  App.tsx                 — 組合畫面、state（selectedKey, selectedChordType）
  components/
    KeySelector.tsx       — 12 調按鈕列
    ChordTypeSelector.tsx — 和弦類型按鈕列
    ChordNotesDisplay.tsx — 組成音列表
    Fretboard.tsx         — SVG 指板（純顯示元件，吃 props）
  lib/
    chords.ts             — 包 tonal：getChordNotes(key, type) → { notes, root }
    fretboard.ts          — 指板資料：每弦每格音名（Note.transpose 計算）
    audio.ts              — Web Audio 播音（音名+八度 → 頻率 → oscillator）
```

## 資料流

1. 使用者選調（預設 C）+ 選和弦類型（預設 major）。
2. `chords.ts` 以 tonal 算出組成音集合與根音。
3. `Fretboard` 將 6 弦 × 13 格（含空弦）每格音名與組成音集合比對——以 **chroma**（半音類別 0–11）比對，等音（C# = Db）視為同音。
4. 命中的格子亮起；根音橘色、其他藍色，標示音名（顯示以和弦拼法為準，例如 Cm 顯示 Eb 而非 D#）。
5. 點擊亮起的音 → `audio.ts` 依該弦該格實際音高（含八度）播放。

## 錯誤處理

- 12 調 × 9 類型均為 tonal 已知和弦，不存在無效組合；`Chord.get()` 回空時（防禦性）指板不亮任何點、組成音列表顯示空。
- Web Audio 需使用者手勢才能啟動：`AudioContext` 於首次點擊時建立/resume。

## 測試

- Vitest 單元測試，範圍為樂理邏輯：
  - `chords.ts`：C major → C, E, G；C minor → C, Eb, G；A7 → A, C#, E, G 等
  - `fretboard.ts`：第 2 弦（B 弦）第 1 格 = C、第 6 弦第 0 格 = E 等
- UI 與聲音以手動驗證為主。

## 不做（YAGNI）

- 特定按法（voicing）顯示
- 深色模式
- 進階和弦（9th/11th/13th…）
- 左撇子模式、變調夾、自訂調音
