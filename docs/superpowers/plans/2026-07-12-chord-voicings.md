# Chord Voicings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 指板下方顯示所選和弦的全部吉他按法圖（直式 SVG，v1–vN），點擊播放掃弦聲。

**Architecture:** chords-db 只當 devDependency，用抽取腳本把 12 調 × 9 類型的 voicing 子集產成 `src/data/voicings.json`（commit 進 repo）。`lib/voicings.ts` 提供查詢（含升記號 → chords-db 鍵名 mapping），`ChordDiagram` 純顯示 SVG、`VoicingsPanel` 橫排容器，掃弦重用現有 `audio.ts` 的 AudioContext。

**Tech Stack:** 既有 stack（Vite + React 19 + TS + Tailwind v4 + tonal + Vitest）＋ `@tombatossals/chords-db@0.5.1`（devDependency）

**Spec:** `docs/superpowers/specs/2026-07-12-chord-voicings-design.md`

## Global Constraints

- 唯一新增套件：`@tombatossals/chords-db`，且必須是 **devDependency**（runtime bundle 只吃生成的 JSON）
- 調性對應：`C#→Csharp, D#→Eb, F#→Fsharp, G#→Ab, A#→Bb`，其餘同名；suffix 與 ChordTypeId 同名直用
- Voicing 形狀：`{ frets[6], fingers[6], baseFret, barres[], capo?, midi[] }`；frets -1=悶音、0=空弦、其餘相對 baseFret
- 按法圖：直式、低音 E 在最左、5 格窗口、底部弦名 `E2 A2 D3 G3 B3 E4`、baseFret=1 畫粗 nut／>1 顯示「Nfr」、手指圓點 slate-800 + 白色編號、barres 畫圓角封閉條
- 掃弦：midi 由低到高、每音間隔 0.06s，重用現有 AudioContext（首次手勢建立）
- 查無 voicing → panel 不渲染
- 測試範圍：`src/lib/voicings.ts` 用 Vitest；SVG 與掃弦聲手動驗證
- 既有 16 個測試必須保持綠燈

---

### Task 1: 抽取腳本 + voicings 資料 + `lib/voicings.ts`（TDD）

**Files:**
- Create: `scripts/extract-voicings.mjs`
- Create: `src/data/voicings.json`（腳本生成後 commit）
- Create: `src/lib/voicings.ts`
- Test: `src/lib/voicings.test.ts`
- Modify: `package.json`（devDependency + `extract-voicings` script）
- Modify: `tsconfig.app.json`（`resolveJsonModule`）

**Interfaces:**
- Consumes: `src/lib/chords.ts` 的 `KEYS`, `CHORD_TYPES`, `Key`, `ChordTypeId`（既有，勿改）
- Produces:
  - `interface Voicing { frets: number[]; fingers: number[]; baseFret: number; barres: number[]; capo?: boolean; midi: number[] }`
  - `getVoicings(key: Key, typeId: ChordTypeId): Voicing[]`（查無回傳 `[]`）

- [ ] **Step 1: 安裝 devDependency 並加 npm script**

```bash
npm install -D @tombatossals/chords-db
```

在 `package.json` 的 `scripts` 加入：

```json
"extract-voicings": "node scripts/extract-voicings.mjs"
```

- [ ] **Step 2: 建立 `scripts/extract-voicings.mjs`**

```js
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const guitar = require("@tombatossals/chords-db/lib/guitar.json");

const KEY_MAP = {
  C: "C",
  "C#": "Csharp",
  D: "D",
  "D#": "Eb",
  E: "E",
  F: "F",
  "F#": "Fsharp",
  G: "G",
  "G#": "Ab",
  A: "A",
  "A#": "Bb",
  B: "B",
};
const CHORD_TYPES = ["major", "minor", "7", "maj7", "m7", "sus2", "sus4", "dim", "aug"];

const out = {};
const problems = [];
for (const [ourKey, dbKey] of Object.entries(KEY_MAP)) {
  const entries = new Map(guitar.chords[dbKey].map((c) => [c.suffix, c]));
  out[ourKey] = {};
  for (const type of CHORD_TYPES) {
    const positions = entries.get(type)?.positions ?? [];
    if (positions.length === 0) {
      problems.push(`${ourKey} ${type}: no positions`);
      continue;
    }
    out[ourKey][type] = positions.map((p) => ({
      frets: p.frets,
      fingers: p.fingers,
      baseFret: p.baseFret,
      barres: p.barres,
      ...(p.capo ? { capo: true } : {}),
      midi: p.midi,
    }));
  }
}

if (problems.length > 0) {
  console.error(`integrity check failed:\n${problems.join("\n")}`);
  process.exit(1);
}

mkdirSync(new URL("../src/data/", import.meta.url), { recursive: true });
writeFileSync(new URL("../src/data/voicings.json", import.meta.url), JSON.stringify(out));
console.log("wrote src/data/voicings.json");
```

- [ ] **Step 3: 執行腳本產生資料**

```bash
npm run extract-voicings
```

Expected: 印出 `wrote src/data/voicings.json`，exit code 0。檢查檔案存在且大小約 55–60KB：`ls -la src/data/voicings.json`

- [ ] **Step 4: 寫失敗測試 `src/lib/voicings.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { CHORD_TYPES, KEYS } from "./chords";
import { getVoicings } from "./voicings";

describe("getVoicings", () => {
  it("C major first voicing is the open-position shape", () => {
    const voicings = getVoicings("C", "major");
    expect(voicings.length).toBeGreaterThanOrEqual(1);
    expect(voicings[0].frets).toEqual([-1, 3, 2, 0, 1, 0]);
    expect(voicings[0].baseFret).toBe(1);
  });

  it("every voicing has 6 frets, 6 fingers, and non-empty midi", () => {
    for (const key of KEYS) {
      for (const type of CHORD_TYPES) {
        for (const v of getVoicings(key, type.id)) {
          expect(v.frets).toHaveLength(6);
          expect(v.fingers).toHaveLength(6);
          expect(v.midi.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("sharp keys map to flat data (D#, G#, A#)", () => {
    for (const key of ["D#", "G#", "A#"] as const) {
      expect(getVoicings(key, "major").length).toBeGreaterThanOrEqual(1);
    }
  });

  it("all 12 keys x 9 types have at least one voicing", () => {
    for (const key of KEYS) {
      for (const type of CHORD_TYPES) {
        expect(getVoicings(key, type.id).length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
```

- [ ] **Step 5: 跑測試確認失敗**

Run: `npx vitest run src/lib/voicings.test.ts`
Expected: FAIL — `voicings` 模組不存在

- [ ] **Step 6: 實作 `src/lib/voicings.ts`（並開啟 resolveJsonModule）**

在 `tsconfig.app.json` 的 `compilerOptions` 加入（若尚未存在）：

```json
"resolveJsonModule": true
```

建立 `src/lib/voicings.ts`：

```ts
import voicingsData from "../data/voicings.json";
import type { ChordTypeId, Key } from "./chords";

export interface Voicing {
  frets: number[]; // 6 元素，低音 E → 高音 E；-1 悶音、0 空弦、其餘相對 baseFret
  fingers: number[]; // 6 元素，0 = 不標編號
  baseFret: number; // 1 = 開放把位
  barres: number[]; // 封閉的（相對）格數
  capo?: boolean;
  midi: number[]; // 發聲弦 MIDI 音高，由低到高
}

const data = voicingsData as Record<string, Record<string, Voicing[]>>;

export function getVoicings(key: Key, typeId: ChordTypeId): Voicing[] {
  return data[key]?.[typeId] ?? [];
}
```

- [ ] **Step 7: 跑測試確認全部通過**

Run: `npx vitest run`
Expected: PASS — 既有 16 + 新增 4 = 20 個測試全綠

- [ ] **Step 8: Commit**

```bash
git add scripts/extract-voicings.mjs src/data/voicings.json src/lib/voicings.ts src/lib/voicings.test.ts package.json package-lock.json tsconfig.app.json
git commit -m "feat: chord voicings data extracted from chords-db"
```

---

### Task 2: `ChordDiagram` + `VoicingsPanel`（顯示）

**Files:**
- Create: `src/components/ChordDiagram.tsx`
- Create: `src/components/VoicingsPanel.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Task 1 的 `Voicing`, `getVoicings`；App 既有 `selectedKey`, `chordType`, `typeLabel`
- Produces:
  - `ChordDiagram({ voicing: Voicing; label: string; onPlay?: () => void })`
  - `VoicingsPanel({ chordName: string; voicings: Voicing[]; onPlay?: (voicing: Voicing) => void })` — `onPlay` 本 task 不傳，Task 3 接上

- [ ] **Step 1: 建立 `src/components/ChordDiagram.tsx`**

```tsx
import type { Voicing } from "../lib/voicings";

const STRING_GAP = 20;
const FRET_GAP = 26;
const LEFT = 30;
const GRID_TOP = 40;
const STRING_COUNT = 6;
const FRET_WINDOW = 5;
const GRID_W = STRING_GAP * (STRING_COUNT - 1);
const GRID_H = FRET_GAP * FRET_WINDOW;
const WIDTH = LEFT + GRID_W + 14;
const HEIGHT = GRID_TOP + GRID_H + 24;
const STRING_LABELS = ["E2", "A2", "D3", "G3", "B3", "E4"];

const stringX = (i: number) => LEFT + i * STRING_GAP;
const fretY = (f: number) => GRID_TOP + (f - 0.5) * FRET_GAP;

interface Props {
  voicing: Voicing;
  label: string; // 例如 "v1"
  onPlay?: () => void;
}

export default function ChordDiagram({ voicing, label, onPlay }: Props) {
  const { frets, fingers, baseFret, barres } = voicing;
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`播放按法 ${label}`}
      className={`shrink-0 rounded-lg bg-white p-2 shadow ${
        onPlay ? "cursor-pointer transition-shadow hover:shadow-md" : ""
      }`}
    >
      <p className="mb-1 text-center text-sm font-semibold text-slate-600">{label}</p>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH * 1.2} height={HEIGHT * 1.2}>
        {Array.from({ length: FRET_WINDOW + 1 }, (_, f) => (
          <line
            key={f}
            x1={LEFT}
            y1={GRID_TOP + f * FRET_GAP}
            x2={LEFT + GRID_W}
            y2={GRID_TOP + f * FRET_GAP}
            strokeWidth={1}
            className="stroke-slate-400"
          />
        ))}
        {Array.from({ length: STRING_COUNT }, (_, i) => (
          <line
            key={i}
            x1={stringX(i)}
            y1={GRID_TOP}
            x2={stringX(i)}
            y2={GRID_TOP + GRID_H}
            strokeWidth={1}
            className="stroke-slate-500"
          />
        ))}
        {baseFret === 1 ? (
          <rect x={LEFT - 1} y={GRID_TOP - 4} width={GRID_W + 2} height={4} className="fill-slate-800" />
        ) : (
          <text x={LEFT - 6} y={fretY(1) + 4} textAnchor="end" className="fill-slate-500 text-[11px]">
            {baseFret}fr
          </text>
        )}
        {frets.map((f, i) =>
          f === -1 ? (
            <text
              key={i}
              x={stringX(i)}
              y={GRID_TOP - 10}
              textAnchor="middle"
              className="fill-slate-600 text-[12px] font-bold"
            >
              ✕
            </text>
          ) : f === 0 ? (
            <circle
              key={i}
              cx={stringX(i)}
              cy={GRID_TOP - 14}
              r={4.5}
              strokeWidth={1.5}
              className="fill-none stroke-slate-600"
            />
          ) : null
        )}
        {barres.map((b) => {
          const covered = frets.map((f, i) => (f === b ? i : -1)).filter((i) => i >= 0);
          if (covered.length < 2) return null;
          const from = covered[0];
          const to = covered[covered.length - 1];
          return (
            <rect
              key={b}
              x={stringX(from) - 8}
              y={fretY(b) - 8}
              width={stringX(to) - stringX(from) + 16}
              height={16}
              rx={8}
              className="fill-slate-800"
            />
          );
        })}
        {frets.map((f, i) =>
          f > 0 ? (
            <g key={i}>
              <circle cx={stringX(i)} cy={fretY(f)} r={8} className="fill-slate-800" />
              {fingers[i] > 0 && (
                <text
                  x={stringX(i)}
                  y={fretY(f) + 3.5}
                  textAnchor="middle"
                  className="fill-white text-[10px] font-semibold"
                >
                  {fingers[i]}
                </text>
              )}
            </g>
          ) : null
        )}
        {STRING_LABELS.map((s, i) => (
          <text key={s} x={stringX(i)} y={HEIGHT - 6} textAnchor="middle" className="fill-slate-500 text-[9px]">
            {s}
          </text>
        ))}
      </svg>
    </button>
  );
}
```

- [ ] **Step 2: 建立 `src/components/VoicingsPanel.tsx`**

```tsx
import type { Voicing } from "../lib/voicings";
import ChordDiagram from "./ChordDiagram";

interface Props {
  chordName: string; // 例如 "C Major"
  voicings: Voicing[];
  onPlay?: (voicing: Voicing) => void;
}

export default function VoicingsPanel({ chordName, voicings, onPlay }: Props) {
  if (voicings.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-slate-700">{chordName} 按法</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {voicings.map((voicing, i) => (
          <ChordDiagram
            key={i}
            voicing={voicing}
            label={`v${i + 1}`}
            onPlay={onPlay ? () => onPlay(voicing) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: 在 `src/App.tsx` 加入 VoicingsPanel**

imports 加入：

```tsx
import VoicingsPanel from "./components/VoicingsPanel";
import { getVoicings } from "./lib/voicings";
```

在 `noteLabels` 宣告之後加入：

```tsx
const voicings = useMemo(() => getVoicings(selectedKey, chordType), [selectedKey, chordType]);
```

在 `<Fretboard ... />` 的下一行加入：

```tsx
<VoicingsPanel chordName={`${selectedKey} ${typeLabel}`} voicings={voicings} />
```

- [ ] **Step 4: 驗證 build 與測試**

```bash
npm run build
npx vitest run
```

Expected: build 無 TS 錯誤；20 個測試全綠。

- [ ] **Step 5: 手動驗證（瀏覽器）**

```bash
npm run dev
```

開 http://localhost:5173 檢查：
1. 指板下方出現「C Major 按法」區，橫排 4 張直式按法圖 v1–v4
2. v1（C major 開放把位）：低音 E 弦上方是 ✕、A 弦第 3 格「3」、D 弦第 2 格「2」、G 弦上方 ○、B 弦第 1 格「1」、高音 E 弦上方 ○；頂部有粗 nut
3. 切到某個高把位 voicing（如 C major v2）：左側顯示「3fr」、有橫跨封閉條
4. 底部弦名 E2 A2 D3 G3 B3 E4
5. 縮小視窗：按法圖區橫向捲動，頁面本身無橫向捲軸

驗完關掉 dev server。

- [ ] **Step 6: Commit**

```bash
git add src/components/ChordDiagram.tsx src/components/VoicingsPanel.tsx src/App.tsx
git commit -m "feat: chord voicing diagrams below fretboard"
```

---

### Task 3: 掃弦播音（playStrum + 點擊接線）

**Files:**
- Modify: `src/lib/audio.ts`（重構共用 + 新增 playStrum）
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Task 2 的 `VoicingsPanel` `onPlay` prop；Task 1 的 `Voicing.midi`
- Produces: `playStrum(midi: number[], duration?: number): void`

- [ ] **Step 1: 重構 `src/lib/audio.ts` 並新增 playStrum**

整檔改為：

```ts
import { Note } from "tonal";

let ctx: AudioContext | null = null;

// AudioContext 需要使用者手勢才能啟動，所以在第一次點擊時才建立
function ensureContext(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

function playFreq(
  audio: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  peak: number,
): void {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(peak, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(startAt);
  osc.stop(startAt + duration);
}

export function playNote(note: string, duration = 0.8): void {
  const freq = Note.freq(note);
  if (freq == null) return;
  const audio = ensureContext();
  playFreq(audio, freq, audio.currentTime, duration, 0.25);
}

const STRUM_DELAY = 0.06;

export function playStrum(midi: number[], duration = 1.2): void {
  const audio = ensureContext();
  const start = audio.currentTime;
  midi.forEach((m, i) => {
    const freq = Note.freq(Note.fromMidi(m));
    if (freq == null) return;
    // 同時發聲的弦多，單音音量調低避免削波
    playFreq(audio, freq, start + i * STRUM_DELAY, duration, 0.15);
  });
}
```

- [ ] **Step 2: 在 `src/App.tsx` 接上掃弦**

把 import 改為：

```tsx
import { playNote, playStrum } from "./lib/audio";
```

`<VoicingsPanel ... />` 加上 `onPlay`：

```tsx
<VoicingsPanel
  chordName={`${selectedKey} ${typeLabel}`}
  voicings={voicings}
  onPlay={(voicing) => playStrum(voicing.midi)}
/>
```

- [ ] **Step 3: 驗證 build 與測試**

```bash
npm test
npm run build
```

Expected: 20 個測試全綠；build 無 TS 錯誤。

- [ ] **Step 4: 手動驗證（瀏覽器）**

```bash
npm run dev
```

開 http://localhost:5173 檢查：
1. hover 按法圖出現 pointer + shadow 變化
2. 點 C major v1 → 由低到高依序撥出 5 個音（掃弦感）
3. 點高把位 voicing 音高不同；點指板單音仍正常（playNote 未壞）
4. 連點多下無爆音、console 無錯誤

驗完關掉 dev server。

- [ ] **Step 5: Commit**

```bash
git add src/lib/audio.ts src/App.tsx
git commit -m "feat: strum playback on voicing diagram click"
```

---

## Self-Review 紀錄

- Spec coverage：抽取腳本＋完整性檢查＋devDep（Task 1）、voicings.json 子集＋key mapping＋Voicing 形狀（Task 1）、直式 SVG 全部視覺需求——X/O、nut/把位標示、手指編號、封閉條、弦名、v1–vN 標題（Task 2）、橫排＋overflow-x-auto＋查無不渲染（Task 2 VoicingsPanel）、掃弦 60ms＋重用 AudioContext＋整圖可點＋aria-label（Task 2 button + Task 3）、Vitest 四項測試（Task 1）— 全數對應。
- Placeholder scan：無 TBD/TODO，所有程式碼步驟含完整程式碼。
- Type consistency：`Voicing` 於 Task 1 定義，Task 2/3 的 props 與 `playStrum(midi: number[])` 簽名一致；`getVoicings(key, typeId)` 與 App 呼叫一致；`onPlay` optional 鏈（ChordDiagram ← VoicingsPanel ← App）一致。
