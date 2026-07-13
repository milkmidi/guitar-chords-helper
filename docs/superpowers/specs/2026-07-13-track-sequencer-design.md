# Track Sequencer Design（音軌功能）

日期：2026-07-13
狀態：已與使用者確認

## 目標

在現有頁面新增一組「音軌」：預設 4 個小節，可把「常用按法」的卡片拖進小節，
並提供 control panel（BPM 拉桿 50–150、Play / Stop），按 Play 依 BPM 循環播放音軌內容。

本次範圍刻意縮小（YAGNI）：

- 只有 **1 組音軌**、固定 **4 個小節**、固定 **4/4 拍**
- 每小節**刷弦一次**（小節開頭 `playStrum`，不做刷法 pattern）
- 只支援 HTML5 拖放（桌機），不處理手機觸控
- 不做小節間拖動排序、不做 localStorage 持久化

## 已確認的決策

| 決策 | 結果 |
| --- | --- |
| 小節發聲 | 每小節開頭刷一次弦，聲音自然延續 |
| 放入方式 | HTML5 drag & drop（拖卡片到目標小節） |
| 小節編輯 | 可空（播放時休止）、拖入即覆蓋、× 按鈕清除 |
| 播放行為 | 循環播放直到 Stop；播放中高亮當前小節 |
| 內容快照 | 小節存 voicing 快照（含和弦名），換 key/和弦類型不影響音軌 |
| BPM 變更 | 播放中調整 BPM，從下一小節生效 |
| BPM 預設 | 90（範圍 50–150） |

## 資料模型

```ts
// 空小節以 null 表示，播放時休止
interface TrackCell {
  chordName: string; // 顯示用，例如 "C Major"
  voicing: Voicing;  // 快照，midi[] 供 playStrum
}
type Track = (TrackCell | null)[]; // 長度固定 4
```

`App.tsx` 新增 state：

- `track: Track`，初始 `[null, null, null, null]`
- `bpm: number`，初始 90

播放狀態（`isPlaying`、`currentMeasure`）由 `useTrackPlayer` hook 內部管理並回傳。

## 架構（沿用現有分層）

### `src/lib/player.ts` — 純邏輯（Vitest 覆蓋）

- `measureDuration(bpm: number): number` — 4/4 拍一小節秒數 = `(60 / bpm) * 4`
- `nextMeasureIndex(current: number, length: number): number` — 循環推進

### `src/hooks/useTrackPlayer.ts` — 播放排程（新目錄 `src/hooks/`）

方案 A：`setTimeout` 鏈 + AudioContext 時鐘校正。

- 以 `AudioContext.currentTime` 為基準計算每個小節的絕對開始時間，
  `setTimeout` 延遲 = 目標時間 − 當前 audio 時間，避免 `Date.now()` 累積漂移
- 每小節開頭：非空格子呼叫 `playStrum(voicing.midi)`，空格跳過；更新 `currentMeasure`
- 循環：最後一小節播完回到第 0 小節
- BPM 用 ref 讀最新值，下一小節套用新速度
- `stop()`：清除 timeout、`isPlaying = false`、`currentMeasure` 重置
- track 內容用 ref 讀取，播放中拖入/清除即時反映在下一次小節觸發
- 介面：`useTrackPlayer(track, bpm) => { isPlaying, currentMeasure, play, stop }`

不採用 Web Audio lookahead scheduler：每小節僅一個事件，精度需求低，
lookahead 複雜度不划算。

### 元件（純顯示、props 驅動）

- **`TrackPanel.tsx`**（新增）— 一列 4 個小節格子：
  - 空格：虛線框 drop zone，提示「拖曳按法到這裡」
  - 有內容：縮小版 `ChordDiagram`（不含播放行為）+ 和弦名 + 右上角 × 清除鈕
  - drop target：`onDragOver` preventDefault、`onDrop` 解析 payload 呼叫 `onDropCell(index, cell)`
  - 播放中 `currentMeasure` 對應格子高亮
  - props：`track, currentMeasure, onDropCell, onClearCell`
- **`TrackControls.tsx`**（新增）— BPM `input[type=range]`（min 50、max 150、步進 1、旁顯數值）
  \+ Play / Stop 按鈕（播放中 Play 停用或轉為 Stop 高亮）
  - props：`bpm, isPlaying, onBpmChange, onPlay, onStop`
- **`ChordDiagram.tsx`**（修改）— 新增可選 `dragPayload?: string` prop；
  有值時 `draggable`，`onDragStart` 把 payload 放進 `dataTransfer`（`application/json`）
- **`VoicingsPanel.tsx`**（修改）— 為每張卡片組出 payload：
  `JSON.stringify({ chordName, voicing })`

拖放 payload 走 `dataTransfer` JSON 序列化，`Voicing` 為純資料物件可安全序列化。

### `App.tsx`（唯一有狀態的模組）

- 新增 `track`、`bpm` state 與 `useTrackPlayer`
- 版面：`VoicingsPanel` 下方新增音軌 section（`TrackControls` + `TrackPanel`）
- handlers：`handleDropCell(index, cell)`、`handleClearCell(index)`

## 錯誤處理

- `onDrop` 的 JSON 解析包 try/catch，解析失敗（外部拖入的東西）靜默忽略
- 整條音軌皆空時按 Play：照常運行（全休止），高亮照走 — 不特別擋，行為單純

## 測試

- `src/lib/player.test.ts`：`measureDuration`（50/90/150 邊界）、`nextMeasureIndex` 循環
- 拖放、覆蓋、清除、播放高亮、BPM 即時調整、Stop：瀏覽器手動驗證
  （依既有 policy，audio 與 DOM 互動不進 Vitest）
