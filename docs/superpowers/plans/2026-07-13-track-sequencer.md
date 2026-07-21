# Track Sequencer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增一組 4 小節音軌：可拖入常用按法卡片、BPM 拉桿（50–150）與 Play/Stop，循環播放並高亮當前小節。

**Architecture:** 純邏輯（小節時長、循環推進、型別）放 `src/lib/player.ts`（Vitest 覆蓋）；播放排程用 `src/hooks/useTrackPlayer.ts` 的 setTimeout 鏈 + `AudioContext.currentTime` 校正；`TrackPanel` / `TrackControls` 為純顯示元件；`App.tsx` 持有 `track` / `bpm` state。拖放走 HTML5 drag & drop，payload 為 `dataTransfer` JSON。

**Tech Stack:** Vite + React 19 + TypeScript + Tailwind CSS v4（實際樣式在 `src/index.css` 手寫 class）+ Web Audio（既有 `src/lib/audio.ts`）+ Vitest。

**Spec:** `docs/superpowers/specs/2026-07-13-track-sequencer-design.md`

## Global Constraints

- 1 組音軌、固定 4 小節、4/4 拍；每小節開頭 `playStrum` 一次
- BPM 範圍 50–150、預設 90、step 1；播放中改 BPM 下一小節生效
- 循環播放直到 Stop；空小節休止；拖入覆蓋；× 清除
- 小節存 voicing 快照，換 key/和弦類型不影響音軌
- 只支援桌機 HTML5 拖放；不做排序、不做持久化
- audio 與 DOM 互動不進 Vitest（既有 policy）；`npm run build`（含 tsc）與 `npm test` 必須通過
- UI 文案用繁體中文；CSS 沿用 `src/index.css` 的設計 token（`--chip`、`--edge`、`--accent`、pill 按鈕、`--r-card`/`--r-block`）

---

### Task 1: `src/lib/player.ts` 純邏輯 + 測試

**Files:**
- Create: `src/lib/player.ts`
- Test: `src/lib/player.test.ts`

**Interfaces:**
- Consumes: `Voicing`（`src/lib/voicings.ts`，已存在）
- Produces:
  - `interface TrackCell { chordName: string; voicing: Voicing }`
  - `type Track = (TrackCell | null)[]`
  - `const MEASURE_COUNT = 4`
  - `measureDuration(bpm: number): number` — 4/4 拍一小節秒數
  - `nextMeasureIndex(current: number, length: number): number` — 循環推進

- [ ] **Step 1: 寫失敗的測試**

建立 `src/lib/player.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { MEASURE_COUNT, measureDuration, nextMeasureIndex } from "./player";

describe("measureDuration", () => {
  it("BPM 60 時一小節（4 拍）為 4 秒", () => {
    expect(measureDuration(60)).toBe(4);
  });

  it("BPM 120 時為 2 秒", () => {
    expect(measureDuration(120)).toBe(2);
  });

  it("涵蓋拉桿邊界 50 與 150", () => {
    expect(measureDuration(50)).toBeCloseTo(4.8);
    expect(measureDuration(150)).toBeCloseTo(1.6);
  });
});

describe("nextMeasureIndex", () => {
  it("依序推進", () => {
    expect(nextMeasureIndex(0, MEASURE_COUNT)).toBe(1);
    expect(nextMeasureIndex(2, MEASURE_COUNT)).toBe(3);
  });

  it("最後一小節回到 0（循環）", () => {
    expect(nextMeasureIndex(3, MEASURE_COUNT)).toBe(0);
  });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/lib/player.test.ts`
Expected: FAIL（`Cannot find module './player'` 或同義錯誤）

- [ ] **Step 3: 最小實作**

建立 `src/lib/player.ts`：

```ts
import type { Voicing } from "./voicings";

// 音軌小節：null = 空小節，播放時休止
export interface TrackCell {
  chordName: string; // 顯示用，例如 "C Major"
  voicing: Voicing; // 快照，midi[] 供 playStrum
}

export type Track = (TrackCell | null)[];

export const MEASURE_COUNT = 4;

// 4/4 拍：一小節 = 4 拍，每拍 60/bpm 秒
export function measureDuration(bpm: number): number {
  return (60 / bpm) * 4;
}

export function nextMeasureIndex(current: number, length: number): number {
  return (current + 1) % length;
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/lib/player.test.ts`
Expected: PASS（5 tests）

- [ ] **Step 5: Commit**

```bash
git add src/lib/player.ts src/lib/player.test.ts
git commit -m "feat: add track player pure logic (measure duration, loop index)"
```

---

### Task 2: `getAudioTime` + `useTrackPlayer` hook

**Files:**
- Modify: `src/lib/audio.ts`（新增一個 export，檔尾即可）
- Create: `src/hooks/useTrackPlayer.ts`（新目錄 `src/hooks/`）

**Interfaces:**
- Consumes: `playStrum(midi: number[])`（`src/lib/audio.ts`）、`measureDuration` / `nextMeasureIndex` / `Track`（Task 1）
- Produces:
  - `getAudioTime(): number`（`src/lib/audio.ts`）— AudioContext 當前時間（秒）
  - `useTrackPlayer(track: Track, bpm: number): { isPlaying: boolean; currentMeasure: number | null; play: () => void; stop: () => void }`

audio 與 hook 依既有 policy 不寫單元測試，於 Task 5 瀏覽器手動驗證。

- [ ] **Step 1: 在 `src/lib/audio.ts` 檔尾新增**

```ts
// 音軌排程以 audio 時鐘為基準，避免 setTimeout 累積漂移
export function getAudioTime(): number {
  return ensureContext().currentTime;
}
```

- [ ] **Step 2: 建立 `src/hooks/useTrackPlayer.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioTime, playStrum } from "../lib/audio";
import { measureDuration, nextMeasureIndex, type Track } from "../lib/player";

// setTimeout 鏈 + AudioContext 時鐘校正：
// 每小節的開始時間為絕對 audio 時間，delay = 目標時間 - 當前 audio 時間，
// 所以誤差不會逐小節累積。track / bpm 走 ref，播放中變更下一小節生效。
export function useTrackPlayer(track: Track, bpm: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMeasure, setCurrentMeasure] = useState<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const trackRef = useRef(track);
  const bpmRef = useRef(bpm);
  trackRef.current = track;
  bpmRef.current = bpm;

  const stop = useCallback(() => {
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setIsPlaying(false);
    setCurrentMeasure(null);
  }, []);

  const play = useCallback(() => {
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    setIsPlaying(true);

    const playMeasure = (index: number, startAt: number) => {
      setCurrentMeasure(index);
      const cell = trackRef.current[index];
      if (cell) playStrum(cell.voicing.midi);
      const nextAt = startAt + measureDuration(bpmRef.current);
      const delayMs = Math.max(0, (nextAt - getAudioTime()) * 1000);
      timeoutRef.current = window.setTimeout(() => {
        playMeasure(nextMeasureIndex(index, trackRef.current.length), nextAt);
      }, delayMs);
    };

    playMeasure(0, getAudioTime());
  }, []);

  // 卸載時清掉排程
  useEffect(() => stop, [stop]);

  return { isPlaying, currentMeasure, play, stop };
}
```

- [ ] **Step 3: 型別檢查**

Run: `npm run build`
Expected: 成功（tsc 無錯誤；hook 尚未被引用，`noUnusedLocals` 不會對未引用的 export 檔案報錯）

- [ ] **Step 4: Commit**

```bash
git add src/lib/audio.ts src/hooks/useTrackPlayer.ts
git commit -m "feat: add useTrackPlayer hook with audio-clock-corrected scheduling"
```

---

### Task 3: `ChordDiagram` 可拖曳 + `VoicingsPanel` 帶 payload

**Files:**
- Modify: `src/components/ChordDiagram.tsx`
- Modify: `src/components/VoicingsPanel.tsx`

**Interfaces:**
- Consumes: `TrackCell`（Task 1）— payload 的形狀就是 `TrackCell`
- Produces:
  - `ChordDiagram` 新增可選 prop `dragPayload?: string`；有值時卡片 `draggable`，`onDragStart` 以 MIME `application/json` 放入 `dataTransfer`
  - `VoicingsPanel` 每張卡片 payload = `JSON.stringify({ chordName, voicing })`（`TrackCell` 形狀）

- [ ] **Step 1: 修改 `ChordDiagram.tsx`**

Props 介面與 button 開頭改為（其餘 SVG 內容不動）：

```tsx
interface Props {
  voicing: Voicing;
  label: string; // 例如 "v1"
  onPlay?: () => void;
  dragPayload?: string; // 有值時可拖曳（JSON 字串，直接放進 dataTransfer）
}

export default function ChordDiagram({ voicing, label, onPlay, dragPayload }: Props) {
  const { frets, fingers, baseFret, barres } = voicing;
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={onPlay ? `播放按法 ${label}` : label}
      className={`chord-diagram ${onPlay ? "is-playable" : ""}`}
      draggable={dragPayload != null}
      onDragStart={
        dragPayload != null
          ? (e) => e.dataTransfer.setData("application/json", dragPayload)
          : undefined
      }
    >
```

（`aria-label` 一併修正：沒有 `onPlay` 時不再宣稱「播放」。）

- [ ] **Step 2: 修改 `VoicingsPanel.tsx` 的 map**

```tsx
{voicings.map((voicing, i) => (
  <ChordDiagram
    key={i}
    voicing={voicing}
    label={`v${i + 1}`}
    onPlay={onPlay ? () => onPlay(voicing) : undefined}
    dragPayload={JSON.stringify({ chordName: `${chordName} v${i + 1}`, voicing })}
  />
))}
```

並把 section-note 文案改為「點擊卡片播放刷弦，或拖曳到下方音軌」。

- [ ] **Step 3: 驗證**

Run: `npm run build && npm test`
Expected: build 成功、既有測試全 PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ChordDiagram.tsx src/components/VoicingsPanel.tsx
git commit -m "feat: make voicing cards draggable with TrackCell payload"
```

---

### Task 4: `TrackPanel` + `TrackControls` 元件 + CSS

**Files:**
- Create: `src/components/TrackPanel.tsx`
- Create: `src/components/TrackControls.tsx`
- Modify: `src/index.css`（在 `/* ---------- Footer ---------- */` 前插入音軌區塊樣式）

**Interfaces:**
- Consumes: `Track` / `TrackCell`（Task 1）、`ChordDiagram`（Task 3，不傳 `onPlay` / `dragPayload`）
- Produces:
  - `TrackPanel({ track, currentMeasure, onDropCell, onClearCell })`
    — `onDropCell: (index: number, cell: TrackCell) => void`、`onClearCell: (index: number) => void`、`currentMeasure: number | null`
  - `TrackControls({ bpm, isPlaying, onBpmChange, onPlay, onStop })`
    — `onBpmChange: (bpm: number) => void`

- [ ] **Step 1: 建立 `src/components/TrackControls.tsx`**

```tsx
interface Props {
  bpm: number;
  isPlaying: boolean;
  onBpmChange: (bpm: number) => void;
  onPlay: () => void;
  onStop: () => void;
}

export default function TrackControls({ bpm, isPlaying, onBpmChange, onPlay, onStop }: Props) {
  return (
    <div className="track-controls">
      <label className="bpm-control">
        <span className="bpm-label">BPM</span>
        <input
          type="range"
          min={50}
          max={150}
          step={1}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="bpm-slider"
        />
        <span className="bpm-value">{bpm}</span>
      </label>
      <div className="transport-buttons">
        <button type="button" className="transport-button is-play" onClick={onPlay} disabled={isPlaying}>
          ▶ Play
        </button>
        <button type="button" className="transport-button" onClick={onStop} disabled={!isPlaying}>
          ■ Stop
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 建立 `src/components/TrackPanel.tsx`**

```tsx
import { useState } from "react";
import type { Track, TrackCell } from "../lib/player";
import ChordDiagram from "./ChordDiagram";

interface Props {
  track: Track;
  currentMeasure: number | null; // null = 未播放，不高亮
  onDropCell: (index: number, cell: TrackCell) => void;
  onClearCell: (index: number) => void;
}

// 解析 dataTransfer 的 JSON payload；外部拖入的東西一律忽略
function parseCell(data: string): TrackCell | null {
  try {
    const parsed: unknown = JSON.parse(data);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as TrackCell).chordName === "string" &&
      Array.isArray((parsed as TrackCell).voicing?.midi)
    ) {
      return parsed as TrackCell;
    }
  } catch {
    // 非 JSON，忽略
  }
  return null;
}

export default function TrackPanel({ track, currentMeasure, onDropCell, onClearCell }: Props) {
  const [dragOver, setDragOver] = useState<number | null>(null);

  return (
    <div className="track-grid">
      {track.map((cell, i) => (
        <div
          key={i}
          className={[
            "track-cell",
            cell == null ? "is-empty" : "",
            currentMeasure === i ? "is-current" : "",
            dragOver === i ? "is-drag-over" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragEnter={() => setDragOver(i)}
          onDragLeave={(e) => {
            // 進入子元素也會觸發 dragleave，只在真正離開格子時清除
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(null);
            const dropped = parseCell(e.dataTransfer.getData("application/json"));
            if (dropped) onDropCell(i, dropped);
          }}
        >
          <p className="track-cell-number">{i + 1}</p>
          {cell == null ? (
            <p className="track-cell-hint">拖曳按法到這裡</p>
          ) : (
            <>
              <ChordDiagram voicing={cell.voicing} label={cell.chordName} />
              <button
                type="button"
                className="track-cell-clear"
                aria-label={`清除第 ${i + 1} 小節`}
                onClick={() => onClearCell(i)}
              >
                ✕
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 在 `src/index.css` 的 `/* ---------- Footer ---------- */` 之前插入**

```css
/* ---------- Track sequencer ---------- */

.track-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 28px;
  margin-bottom: 20px;
  padding: 16px 20px;
  border: 2px solid var(--edge);
  border-radius: var(--r-card);
  background: var(--surface);
  box-shadow: 4px 4px 0 var(--edge);
}

.bpm-control { display: flex; flex: 1 1 260px; align-items: center; gap: 12px; }
.bpm-label { font-family: var(--mono); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; }
.bpm-slider { flex: 1; accent-color: var(--accent); }
.bpm-value {
  min-width: 3ch;
  font-family: var(--display);
  font-size: 20px;
  font-weight: 800;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.transport-buttons { display: flex; gap: 10px; }

.transport-button {
  min-height: 44px;
  padding: 0 24px;
  border: 2px solid var(--edge);
  border-radius: 999px;
  background: var(--chip);
  color: var(--ink);
  cursor: pointer;
  font-family: var(--display);
  font-size: 15px;
  font-weight: 700;
  transition: background 0.15s ease, transform 0.2s var(--spring), box-shadow 0.2s ease;
}

.transport-button.is-play:not(:disabled) {
  background: var(--accent);
  color: var(--on-accent);
  box-shadow: 3px 3px 0 var(--edge);
}

.transport-button:not(:disabled):hover { transform: translateY(-2px); }
.transport-button:not(:disabled):active { transform: scale(0.93); }
.transport-button:disabled { cursor: default; opacity: 0.4; box-shadow: none; }

.track-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 14px;
  overflow-x: auto;
  padding: 6px;
}

.track-cell {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 220px;
  padding: 12px;
  border: 2px solid var(--edge);
  border-radius: var(--r-card);
  background: var(--surface);
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.track-cell.is-empty { border-style: dashed; border-color: var(--line); background: transparent; }
.track-cell.is-drag-over { border-color: var(--accent); border-style: solid; background: var(--chip); }
.track-cell.is-current { border-color: var(--accent); box-shadow: 4px 4px 0 var(--accent); }

.track-cell-number {
  position: absolute;
  top: 8px;
  left: 12px;
  margin: 0;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 700;
}

.track-cell-hint { margin: 0; color: var(--muted); font-size: 13px; text-align: center; }

/* 音軌內的縮圖卡片不需要陰影與入場動畫 */
.track-cell .chord-diagram { box-shadow: none; border: none; padding: 4px; animation: none; }

.track-cell-clear {
  position: absolute;
  top: 6px;
  right: 6px;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 2px solid var(--edge);
  border-radius: 50%;
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}

.track-cell-clear:hover { background: var(--accent); color: var(--on-accent); }
```

- [ ] **Step 4: 驗證**

Run: `npm run build && npm test`
Expected: build 成功（元件尚未被 App 引用也需通過 tsc）、既有測試全 PASS
（注意：若 tsc 因 `noUnusedLocals` 類規則對「已建立未引用」的元件報錯，屬設定外情況——本專案 tsconfig 不會；如遇到請如實回報，不要為過關而亂改設定。）

- [ ] **Step 5: Commit**

```bash
git add src/components/TrackPanel.tsx src/components/TrackControls.tsx src/index.css
git commit -m "feat: add TrackPanel and TrackControls components with styles"
```

---

### Task 5: `App.tsx` 接線 + 手動驗證

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Task 1–4 的全部 export
- Produces: 完整可用的音軌功能

- [ ] **Step 1: 修改 `src/App.tsx`**

新增 import：

```tsx
import { useCallback, useMemo, useState } from "react";
import TrackControls from "./components/TrackControls";
import TrackPanel from "./components/TrackPanel";
import { useTrackPlayer } from "./hooks/useTrackPlayer";
import { MEASURE_COUNT, type Track, type TrackCell } from "./lib/player";
```

（原本的 `useMemo, useState` import 行由上面第一行取代。）

在 `App` 內、`const chordId = ...` 之後新增：

```tsx
const [track, setTrack] = useState<Track>(() => Array(MEASURE_COUNT).fill(null));
const [bpm, setBpm] = useState(90);
const { isPlaying, currentMeasure, play, stop } = useTrackPlayer(track, bpm);

const handleDropCell = useCallback((index: number, cell: TrackCell) => {
  setTrack((prev) => prev.map((c, i) => (i === index ? cell : c)));
}, []);

const handleClearCell = useCallback((index: number) => {
  setTrack((prev) => prev.map((c, i) => (i === index ? null : c)));
}, []);
```

在 `<VoicingsPanel ... />` 與 `<footer>` 之間新增：

```tsx
<section className="content-section" aria-labelledby="track-title">
  <div className="section-heading">
    <h2 id="track-title">音軌</h2>
    <p className="section-note">把上方按法卡片拖進小節，按 Play 循環播放</p>
  </div>
  <TrackControls bpm={bpm} isPlaying={isPlaying} onBpmChange={setBpm} onPlay={play} onStop={stop} />
  <TrackPanel
    track={track}
    currentMeasure={currentMeasure}
    onDropCell={handleDropCell}
    onClearCell={handleClearCell}
  />
</section>
```

- [ ] **Step 2: 驗證**

Run: `npm run build && npm test`
Expected: build 成功、全部測試 PASS

- [ ] **Step 3: 瀏覽器手動驗證（`npm run dev`）**

逐項確認：

1. 拖 v1 卡片到第 1 小節 → 顯示縮圖 + 和弦名 + ✕ 鈕
2. 拖另一張卡到同一小節 → 覆蓋
3. ✕ → 清除回到虛線空格
4. 留第 3 小節空白按 Play → 循環播放、空小節休止、當前小節高亮框
5. 播放中把 BPM 從 90 拉到 150 → 下一小節明顯變快
6. Stop → 聲音停、 高亮消失；再按 Play 從第 1 小節開始
7. 播放中切換 key / 和弦類型 → 音軌內容與播放不受影響
8. 拖曳過程中目標格有 drag-over 反饋

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire track sequencer into App"
```
