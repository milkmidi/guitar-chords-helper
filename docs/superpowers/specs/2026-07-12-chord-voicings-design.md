# Chord Voicings（和弦按法圖）— Design Spec

Date: 2026-07-12
Status: Approved
Extends: 2026-07-12-guitar-chords-helper-design.md

## 目的

在現有 Guitar Chords Helper 加入所選和弦的吉他按法圖（voicing diagrams）：橫排顯示該和弦的所有常見按法（v1–vN，每個和弦 4–5 個），並可點擊播放掃弦聲。視覺慣例參照 tombatossals/react-chords demo。

## 需求

1. 指板下方新增按法圖區：所選和弦的**全部** voicing 橫排顯示，窄螢幕時該區橫向捲動（頁面不出現橫向捲軸）。
2. 每張按法圖為**直式**和弦圖 SVG：
   - 6 弦直線（低音 E 在最左）× 5 格窗口；底部標弦名 `E2 A2 D3 G3 B3 E4`
   - 圖上方標記：X（悶音，frets = -1）、O（空弦，frets = 0）
   - `baseFret === 1` → 頂部畫粗 nut 線；`baseFret > 1` → 左側顯示把位文字（如「3fr」），不畫粗 nut
   - 手指位置：深色實心圓 + 白色手指編號（fingers 1–4；finger 0 不顯示編號）
   - `barres`：在該琴格畫橫跨封閉條（圓角矩形），從該格最低弦到最高弦（以 frets 中等於 barre 值的弦為範圍）
   - 每張圖標題「v1」「v2」…
3. 點按法圖播放掃弦：依 voicing 的 `midi` 陣列由低到高依序播音，每弦間隔 60ms，重用現有 Web Audio 機制。整張 SVG 是可點擊區域（cursor-pointer + aria-label）。
4. 查無 voicing 資料（防禦性）→ 按法圖區整個不顯示。

## 資料來源

- `@tombatossals/chords-db@0.5.1` 安裝為 **devDependency**（純資料，2019 後未更新但按法不會過時；不進 runtime bundle）。
- 一次性腳本 `scripts/extract-voicings.mjs`（node 執行，可重跑）從 `@tombatossals/chords-db/lib/guitar.json` 抽出 12 調 × 9 類型子集，寫入 `src/data/voicings.json`（約 56KB，commit 進 repo）。
- 腳本內建完整性檢查：12×9 每個組合必須有 ≥1 個 position，否則以非零 exit code 失敗。
- 已驗證（2026-07-12，chords-db 0.5.1）：12×9 全部有資料，共 433 個 positions，每和弦 4–5 個。

### 調性對應（我們的升記號 → chords-db chords dict 鍵名）

| 我們 | chords-db |
|---|---|
| C# | Csharp |
| D# | Eb |
| F# | Fsharp |
| G# | Ab |
| A# | Bb |
| 其餘 | 同名 |

Suffix 對應：我們的 9 個 ChordTypeId（major, minor, 7, maj7, m7, sus2, sus4, dim, aug）與 chords-db suffix 同名，直接使用。

### Voicing 資料形狀（沿用 chords-db position 格式）

```ts
interface Voicing {
  frets: number[];    // 6 元素，低音 E 到高音 E；-1 悶音、0 空弦、其餘為相對 baseFret 的格數
  fingers: number[];  // 6 元素，0 = 不標
  baseFret: number;   // 1 = 開放把位
  barres: number[];   // 封閉的（相對）格數
  capo?: boolean;
  midi: number[];     // 發聲弦的 MIDI 音高，由低到高
}
```

## 架構（新增/修改）

```
scripts/extract-voicings.mjs      — 產生 src/data/voicings.json + 完整性檢查
src/data/voicings.json            — 12×9 voicing 子集（generated，commit）
src/lib/voicings.ts               — getVoicings(key: Key, typeId: ChordTypeId): Voicing[]
                                    內含 key mapping；查無回傳 []
src/lib/audio.ts                  — 新增 playStrum(midi: number[])：
                                    Note.fromMidi → Note.freq，每音間隔 60ms 排程，
                                    重用現有 AudioContext/envelope（抽出共用 ensure/play 內部函式）
src/components/ChordDiagram.tsx   — 單一 voicing 直式 SVG（純顯示 + onClick）
src/components/VoicingsPanel.tsx  — 標題列 + 橫排 ChordDiagram（overflow-x-auto）
src/App.tsx                       — 以 selectedKey/chordType 取 voicings，渲染 VoicingsPanel
```

## 資料流

selectedKey + chordType（現有 state，不新增）→ `getVoicings()`（useMemo）→ `VoicingsPanel` 依序渲染 `ChordDiagram(voicing, index)` → 點擊 → `playStrum(voicing.midi)`。

## 測試

- Vitest 測 `src/lib/voicings.ts`：
  - C major 回傳 ≥1 個 voicing，且第一個是標準開放把位（frets `[-1,3,2,0,1,0]`）
  - 每個 voicing 的 frets/fingers 長度為 6、midi 非空
  - Flat mapping：D#、G#、A# 各類型查得到資料
  - 12 調 × 9 類型全部回傳 ≥1 個 voicing
- `playStrum` 與 SVG 外觀：手動驗證（同既有慣例）。

## 不做（YAGNI）

- Voicing 的左撇子鏡像、移調夾標示 UI（capo 資料保留但不特別視覺化，封閉條照畫）
- 按法圖下載 SVG/PNG（demo 網站有，我們不做）
- 指板與按法圖的連動 highlight
