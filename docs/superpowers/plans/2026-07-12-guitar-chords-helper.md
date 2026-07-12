# Guitar Chords Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 吉他學習 Web App — 選調性 + 和弦類型後，橫式 SVG 指板亮起該和弦所有組成音位置，點擊可播音。

**Architecture:** 單頁 React app。樂理計算集中在 `src/lib/`（tonal 包裝，純函式、可單元測試），UI 元件吃 props 純顯示，state 只在 `App.tsx`（selectedKey + chordType）。指板自繪 SVG，聲音用 Web Audio API 合成。

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4 (@tailwindcss/vite), tonal v6, Vitest

**Spec:** `docs/superpowers/specs/2026-07-12-guitar-chords-helper-design.md`

## Global Constraints

- 12 調：`C, C#, D, D#, E, F, F#, G, G#, A, A#, B`（用升記號拼法）
- 9 種和弦類型：`major, minor, 7, maj7, m7, sus2, sus4, dim, aug`
- 標準調音，畫面上第 1 弦（高音 E4）在最上、第 6 弦（低音 E2）在最下
- 琴格 0（空弦）～ 12，位置記號點在 3/5/7/9（單點）、12（雙點）
- 音的比對用 chroma（半音類別 0–11），顯示音名用和弦拼法（Cm 顯示 Eb 不是 D#）
- 根音橘色（orange-500）、其他組成音藍色（blue-500）
- 不做：voicing 按法、深色模式、進階和弦、左撇子/自訂調音
- 測試範圍：`src/lib/chords.ts`、`src/lib/fretboard.ts` 用 Vitest；UI 與聲音手動驗證
- Node 套件只新增：`tonal`、`tailwindcss`、`@tailwindcss/vite`、`vitest`（其餘由 Vite template 提供）

---

### Task 1: 專案 Scaffold（Vite + React + TS + Tailwind v4 + Vitest + tonal）

**Files:**
- Create: 整個 Vite react-ts template（`package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css` 等）
- Delete: `src/App.css`, `src/assets/react.svg`（template 附帶的 demo 檔）

**Interfaces:**
- Consumes: 無
- Produces: 可運行的空專案；`npm run dev` 啟動、`npm test` 可執行、Tailwind class 生效

- [ ] **Step 1: 用 create-vite scaffold 到暫存目錄再搬進專案根目錄**

專案根目錄非空（.git/docs/README.md），直接在 `.` scaffold 會觸發互動提示，所以先到暫存目錄：

```bash
cd /Users/milkmidi/Documents/milkmidi-workspace/_side-projects_/guitar-chords-helper
npm create vite@latest scaffold-tmp -- --template react-ts
rsync -a scaffold-tmp/ .
rm -rf scaffold-tmp
```

若 create-vite 出現額外互動提示（如 rolldown-vite 實驗選項），一律選預設／No。
注意：template 的 README.md 會覆蓋原本的空 README.md，這是預期行為。

- [ ] **Step 2: 安裝依賴**

```bash
npm install
npm install tonal tailwindcss @tailwindcss/vite
npm install -D vitest
```

- [ ] **Step 3: 設定 Tailwind v4 + Vitest**

覆寫 `vite.config.ts`：

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

覆寫 `src/index.css`（整個檔案只留這行）：

```css
@import "tailwindcss";
```

在 `package.json` 的 `scripts` 加入：

```json
"test": "vitest run"
```

- [ ] **Step 4: 清掉 template demo，換成最小 App**

刪除 `src/App.css` 與 `src/assets/react.svg`。覆寫 `src/App.tsx`：

```tsx
export default function App() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold text-slate-800">Guitar Chords Helper</h1>
    </div>
  );
}
```

確認 `src/main.tsx` 只 import `./index.css`（若 template 有 import `./App.css` 之類，移除）。

- [ ] **Step 5: 驗證 build、test、dev**

```bash
npm run build
```
Expected: build 成功，無 TypeScript 錯誤。

```bash
npx vitest run --passWithNoTests
```
Expected: 顯示 "No test files found" 並以 exit code 0 結束。

```bash
npm run dev
```
Expected: dev server 啟動。開瀏覽器看 http://localhost:5173 ，標題「Guitar Chords Helper」以粗體、深灰色呈現（證明 Tailwind 生效）。驗完 Ctrl+C 關掉。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite + react + ts + tailwind v4 + vitest + tonal"
```

---

### Task 2: `src/lib/chords.ts` — 和弦組成音計算（TDD）

**Files:**
- Create: `src/lib/chords.ts`
- Test: `src/lib/chords.test.ts`

**Interfaces:**
- Consumes: `tonal` 的 `Chord.getChord(type, tonic)`、`Note.chroma(name)`
- Produces:
  - `KEYS: readonly ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]`，`type Key = typeof KEYS[number]`
  - `CHORD_TYPES: readonly { id: ChordTypeId; label: string }[]`，`type ChordTypeId = "major"|"minor"|"7"|"maj7"|"m7"|"sus2"|"sus4"|"dim"|"aug"`
  - `interface ChordInfo { root: string; rootChroma: number; notes: string[]; chromas: number[] }`
  - `getChordInfo(key: Key, typeId: ChordTypeId): ChordInfo`

- [ ] **Step 1: 寫失敗測試**

建立 `src/lib/chords.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { CHORD_TYPES, getChordInfo, KEYS } from "./chords";

describe("KEYS / CHORD_TYPES", () => {
  it("has 12 keys from C to B", () => {
    expect(KEYS).toEqual(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]);
  });

  it("has the 9 chord types", () => {
    expect(CHORD_TYPES.map((t) => t.id)).toEqual([
      "major", "minor", "7", "maj7", "m7", "sus2", "sus4", "dim", "aug",
    ]);
  });
});

describe("getChordInfo", () => {
  it("C major = C E G", () => {
    const info = getChordInfo("C", "major");
    expect(info.notes).toEqual(["C", "E", "G"]);
    expect(info.chromas).toEqual([0, 4, 7]);
    expect(info.root).toBe("C");
    expect(info.rootChroma).toBe(0);
  });

  it("C minor spells Eb (not D#)", () => {
    expect(getChordInfo("C", "minor").notes).toEqual(["C", "Eb", "G"]);
  });

  it("A 7 = A C# E G", () => {
    expect(getChordInfo("A", "7").notes).toEqual(["A", "C#", "E", "G"]);
  });

  it("C maj7 = C E G B", () => {
    expect(getChordInfo("C", "maj7").notes).toEqual(["C", "E", "G", "B"]);
  });

  it("C sus4 = C F G", () => {
    expect(getChordInfo("C", "sus4").notes).toEqual(["C", "F", "G"]);
  });

  it("C dim = C Eb Gb", () => {
    expect(getChordInfo("C", "dim").notes).toEqual(["C", "Eb", "Gb"]);
  });

  it("C aug = C E G#", () => {
    expect(getChordInfo("C", "aug").notes).toEqual(["C", "E", "G#"]);
  });

  it("every key × type produces at least 3 notes with valid chromas", () => {
    for (const key of KEYS) {
      for (const type of CHORD_TYPES) {
        const info = getChordInfo(key, type.id);
        expect(info.notes.length).toBeGreaterThanOrEqual(3);
        for (const c of info.chromas) {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(11);
        }
      }
    }
  });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/lib/chords.test.ts`
Expected: FAIL — "Failed to load ... chords"（模組不存在）

- [ ] **Step 3: 實作 `src/lib/chords.ts`**

```ts
import { Chord, Note } from "tonal";

export const KEYS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;
export type Key = (typeof KEYS)[number];

export const CHORD_TYPES = [
  { id: "major", label: "Major" },
  { id: "minor", label: "Minor" },
  { id: "7", label: "7" },
  { id: "maj7", label: "Maj7" },
  { id: "m7", label: "m7" },
  { id: "sus2", label: "Sus2" },
  { id: "sus4", label: "Sus4" },
  { id: "dim", label: "Dim" },
  { id: "aug", label: "Aug" },
] as const;
export type ChordTypeId = (typeof CHORD_TYPES)[number]["id"];

export interface ChordInfo {
  root: string;
  rootChroma: number;
  notes: string[];
  chromas: number[];
}

export function getChordInfo(key: Key, typeId: ChordTypeId): ChordInfo {
  const chord = Chord.getChord(typeId, key);
  const notes = chord.notes;
  return {
    root: key,
    rootChroma: Note.chroma(key) ?? 0,
    notes,
    chromas: notes.map((n) => Note.chroma(n) ?? 0),
  };
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run src/lib/chords.test.ts`
Expected: PASS，全部測試綠燈。若 spelling 測試（如 `C dim = C Eb Gb`）失敗，印出 `Chord.getChord("dim", "C")` 的實際回傳值修正期望值前，先確認是不是 tonal 版本差異 — chroma 測試必須維持不變。

- [ ] **Step 5: Commit**

```bash
git add src/lib/chords.ts src/lib/chords.test.ts
git commit -m "feat: chord note computation with tonal"
```

---

### Task 3: `src/lib/fretboard.ts` — 指板音名資料（TDD）

**Files:**
- Create: `src/lib/fretboard.ts`
- Test: `src/lib/fretboard.test.ts`

**Interfaces:**
- Consumes: `tonal` 的 `Note.transpose`、`Interval.fromSemitones`、`Note.chroma`
- Produces:
  - `TUNING: readonly ["E4","B3","G3","D3","A2","E2"]`（index 0 = 第 1 弦）
  - `FRET_COUNT = 12`
  - `interface FretPosition { string: number; fret: number; note: string; chroma: number }`（string 1–6、fret 0–12、note 含八度如 "C4"）
  - `buildFretboard(): FretPosition[]`
  - `FRETBOARD: FretPosition[]`（module-level 預算好的結果，UI 直接用）

- [ ] **Step 1: 寫失敗測試**

建立 `src/lib/fretboard.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { FRET_COUNT, FRETBOARD, TUNING } from "./fretboard";

const at = (string: number, fret: number) => {
  const pos = FRETBOARD.find((p) => p.string === string && p.fret === fret);
  if (!pos) throw new Error(`no position at string ${string} fret ${fret}`);
  return pos;
};

describe("FRETBOARD", () => {
  it("has 6 strings x 13 frets (0-12) = 78 positions", () => {
    expect(FRETBOARD).toHaveLength(78);
  });

  it("open strings match standard tuning", () => {
    expect(TUNING).toEqual(["E4", "B3", "G3", "D3", "A2", "E2"]);
    expect(at(1, 0).note).toBe("E4");
    expect(at(6, 0).note).toBe("E2");
  });

  it("string 2 fret 1 is C4 (chroma 0)", () => {
    expect(at(2, 1).note).toBe("C4");
    expect(at(2, 1).chroma).toBe(0);
  });

  it("fret 12 is the octave of the open string", () => {
    expect(at(1, FRET_COUNT).note).toBe("E5");
    expect(at(6, FRET_COUNT).note).toBe("E3");
  });

  it("string 3 fret 2 is A3", () => {
    expect(at(3, 2).chroma).toBe(9);
  });

  it("all chromas are 0-11", () => {
    for (const p of FRETBOARD) {
      expect(p.chroma).toBeGreaterThanOrEqual(0);
      expect(p.chroma).toBeLessThanOrEqual(11);
    }
  });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run src/lib/fretboard.test.ts`
Expected: FAIL — 模組不存在

- [ ] **Step 3: 實作 `src/lib/fretboard.ts`**

```ts
import { Interval, Note } from "tonal";

export const TUNING = ["E4", "B3", "G3", "D3", "A2", "E2"] as const;
export const FRET_COUNT = 12;

export interface FretPosition {
  string: number; // 1（最高音，畫面最上）～ 6（最低音，畫面最下）
  fret: number; // 0 = 空弦 ～ 12
  note: string; // 含八度的音高，如 "C4"，播音用
  chroma: number; // 半音類別 0-11，比對用
}

export function buildFretboard(): FretPosition[] {
  const positions: FretPosition[] = [];
  TUNING.forEach((open, i) => {
    for (let fret = 0; fret <= FRET_COUNT; fret++) {
      const note = Note.transpose(open, Interval.fromSemitones(fret));
      positions.push({
        string: i + 1,
        fret,
        note,
        chroma: Note.chroma(note) ?? 0,
      });
    }
  });
  return positions;
}

export const FRETBOARD = buildFretboard();
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run`
Expected: PASS — chords + fretboard 兩個測試檔全綠。

- [ ] **Step 5: Commit**

```bash
git add src/lib/fretboard.ts src/lib/fretboard.test.ts
git commit -m "feat: fretboard note map for standard tuning"
```

---

### Task 4: 選擇器 UI + 組成音列表 + App 串接

**Files:**
- Create: `src/components/KeySelector.tsx`
- Create: `src/components/ChordTypeSelector.tsx`
- Create: `src/components/ChordNotesDisplay.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Task 2 的 `KEYS`, `CHORD_TYPES`, `getChordInfo`, `Key`, `ChordTypeId`, `ChordInfo`
- Produces:
  - `KeySelector({ selected: Key; onSelect: (key: Key) => void })`
  - `ChordTypeSelector({ selected: ChordTypeId; onSelect: (id: ChordTypeId) => void })`
  - `ChordNotesDisplay({ chordName: string; notes: string[]; root: string })`
  - `App.tsx` 持有 state：`selectedKey`（預設 `"C"`）、`chordType`（預設 `"major"`），並以 `useMemo` 算 `chord: ChordInfo`

- [ ] **Step 1: 建立 `src/components/KeySelector.tsx`**

```tsx
import { KEYS, type Key } from "../lib/chords";

interface Props {
  selected: Key;
  onSelect: (key: Key) => void;
}

export default function KeySelector({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className={`w-12 rounded-lg py-2 text-sm font-semibold transition-colors ${
            key === selected
              ? "bg-orange-500 text-white"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          {key}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 建立 `src/components/ChordTypeSelector.tsx`**

```tsx
import { CHORD_TYPES, type ChordTypeId } from "../lib/chords";

interface Props {
  selected: ChordTypeId;
  onSelect: (id: ChordTypeId) => void;
}

export default function ChordTypeSelector({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHORD_TYPES.map((type) => (
        <button
          key={type.id}
          type="button"
          onClick={() => onSelect(type.id)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            type.id === selected
              ? "bg-blue-500 text-white"
              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 建立 `src/components/ChordNotesDisplay.tsx`**

```tsx
interface Props {
  chordName: string; // 例如 "C Major"
  notes: string[]; // 例如 ["C", "E", "G"]
  root: string; // 例如 "C"
}

export default function ChordNotesDisplay({ chordName, notes, root }: Props) {
  return (
    <p className="text-lg text-slate-700">
      <span className="font-bold">{chordName}</span>
      {" = "}
      {notes.map((note, i) => (
        <span key={note}>
          {i > 0 && <span className="text-slate-400"> - </span>}
          <span className={note === root ? "font-bold text-orange-500" : "font-semibold text-blue-600"}>
            {note}
          </span>
        </span>
      ))}
    </p>
  );
}
```

- [ ] **Step 4: 覆寫 `src/App.tsx` 串接**

```tsx
import { useMemo, useState } from "react";
import ChordNotesDisplay from "./components/ChordNotesDisplay";
import ChordTypeSelector from "./components/ChordTypeSelector";
import KeySelector from "./components/KeySelector";
import { CHORD_TYPES, getChordInfo, type ChordTypeId, type Key } from "./lib/chords";

export default function App() {
  const [selectedKey, setSelectedKey] = useState<Key>("C");
  const [chordType, setChordType] = useState<ChordTypeId>("major");

  const chord = useMemo(() => getChordInfo(selectedKey, chordType), [selectedKey, chordType]);
  const typeLabel = CHORD_TYPES.find((t) => t.id === chordType)?.label ?? chordType;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-slate-800">Guitar Chords Helper</h1>
      <KeySelector selected={selectedKey} onSelect={setSelectedKey} />
      <ChordTypeSelector selected={chordType} onSelect={setChordType} />
      <ChordNotesDisplay chordName={`${selectedKey} ${typeLabel}`} notes={chord.notes} root={chord.root} />
    </div>
  );
}
```

- [ ] **Step 5: 手動驗證**

```bash
npm run dev
```

開 http://localhost:5173 檢查：
1. 預設顯示「**C Major** = C - E - G」，C 橘色、E/G 藍色
2. 點「A」再點「7」→ 顯示「**A 7** = A - C# - E - G」
3. 點「C」再點「Minor」→ 顯示「C - Eb - G」（Eb 不是 D#）
4. 選中的調性按鈕橘色、選中的類型按鈕藍色

驗完關掉 dev server。

- [ ] **Step 6: Build 檢查 + Commit**

```bash
npm run build
git add src/App.tsx src/components/
git commit -m "feat: key/chord-type selectors and chord notes display"
```

---

### Task 5: Fretboard SVG 元件（顯示組成音）

**Files:**
- Create: `src/components/Fretboard.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Task 3 的 `FRETBOARD`, `FRET_COUNT`, `FretPosition`；Task 4 的 `App.tsx` state 與 `chord: ChordInfo`
- Produces:
  - `Fretboard({ chordChromas: number[]; rootChroma: number; noteLabels: ReadonlyMap<number, string>; onNotePlay?: (position: FretPosition) => void })` — `onNotePlay` 本 task 先不傳，Task 6 接上

- [ ] **Step 1: 建立 `src/components/Fretboard.tsx`**

```tsx
import { FRET_COUNT, FRETBOARD, type FretPosition } from "../lib/fretboard";

const NUT_X = 70;
const FRET_W = 76;
const TOP = 28;
const STRING_GAP = 36;
const BOARD_W = NUT_X + FRET_W * FRET_COUNT;
const WIDTH = BOARD_W + 24;
const HEIGHT = TOP + STRING_GAP * 5 + 44;
const SINGLE_MARKER_FRETS = [3, 5, 7, 9];

const stringY = (s: number) => TOP + (s - 1) * STRING_GAP;
const fretCenterX = (f: number) => (f === 0 ? 36 : NUT_X + (f - 0.5) * FRET_W);

interface Props {
  chordChromas: number[];
  rootChroma: number;
  noteLabels: ReadonlyMap<number, string>;
  onNotePlay?: (position: FretPosition) => void;
}

export default function Fretboard({ chordChromas, rootChroma, noteLabels, onNotePlay }: Props) {
  const activePositions = FRETBOARD.filter((p) => chordChromas.includes(p.chroma));

  return (
    <div className="overflow-x-auto rounded-xl bg-white p-2 shadow">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full min-w-[900px]">
        <rect
          x={NUT_X}
          y={TOP - 14}
          width={FRET_W * FRET_COUNT}
          height={STRING_GAP * 5 + 28}
          rx={4}
          className="fill-amber-100"
        />
        <rect
          x={NUT_X - 6}
          y={TOP - 14}
          width={6}
          height={STRING_GAP * 5 + 28}
          className="fill-slate-700"
        />
        {Array.from({ length: FRET_COUNT }, (_, i) => i + 1).map((f) => (
          <line
            key={f}
            x1={NUT_X + f * FRET_W}
            y1={TOP - 14}
            x2={NUT_X + f * FRET_W}
            y2={TOP + STRING_GAP * 5 + 14}
            strokeWidth={2}
            className="stroke-slate-400"
          />
        ))}
        {SINGLE_MARKER_FRETS.map((f) => (
          <circle key={f} cx={fretCenterX(f)} cy={TOP + 2.5 * STRING_GAP} r={7} className="fill-slate-300" />
        ))}
        <circle cx={fretCenterX(12)} cy={TOP + 1.5 * STRING_GAP} r={7} className="fill-slate-300" />
        <circle cx={fretCenterX(12)} cy={TOP + 3.5 * STRING_GAP} r={7} className="fill-slate-300" />
        {Array.from({ length: 6 }, (_, i) => i + 1).map((s) => (
          <line
            key={s}
            x1={NUT_X - 6}
            y1={stringY(s)}
            x2={BOARD_W}
            y2={stringY(s)}
            strokeWidth={0.8 + s * 0.35}
            className="stroke-slate-600"
          />
        ))}
        {Array.from({ length: FRET_COUNT }, (_, i) => i + 1).map((f) => (
          <text
            key={f}
            x={fretCenterX(f)}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-slate-500 text-[12px]"
          >
            {f}
          </text>
        ))}
        {activePositions.map((p) => {
          const isRoot = p.chroma === rootChroma;
          return (
            <g
              key={`${p.string}-${p.fret}`}
              onClick={onNotePlay ? () => onNotePlay(p) : undefined}
              className={onNotePlay ? "cursor-pointer" : undefined}
            >
              <circle
                cx={fretCenterX(p.fret)}
                cy={stringY(p.string)}
                r={13}
                className={isRoot ? "fill-orange-500" : "fill-blue-500"}
              />
              <text
                x={fretCenterX(p.fret)}
                y={stringY(p.string) + 4}
                textAnchor="middle"
                className="pointer-events-none fill-white text-[11px] font-semibold"
              >
                {noteLabels.get(p.chroma) ?? ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: 在 `src/App.tsx` 加入 Fretboard**

在 imports 加入：

```tsx
import Fretboard from "./components/Fretboard";
```

在 `typeLabel` 宣告之後加入 `noteLabels`（chroma → 和弦拼法音名，指板顯示用）：

```tsx
const noteLabels = useMemo(() => {
  const labels = new Map<number, string>();
  chord.chromas.forEach((chroma, i) => labels.set(chroma, chord.notes[i]));
  return labels;
}, [chord]);
```

在 `<ChordNotesDisplay ... />` 下一行加入：

```tsx
<Fretboard chordChromas={chord.chromas} rootChroma={chord.rootChroma} noteLabels={noteLabels} />
```

- [ ] **Step 3: 手動驗證**

```bash
npm run dev
```

開 http://localhost:5173 檢查：
1. 橫式指板：6 條弦（上細下粗）、琴衍 12 格、左側粗黑 nut、nut 左邊是空弦音區
2. 3/5/7/9 格有單記號點、12 格雙記號點、格子下方有 1–12 數字
3. C Major：所有 C 橘色、E/G 藍色，圓內有音名。抽查位置：第 2 弦第 1 格 = C（橘）、第 1 弦空弦 = E（藍）、第 3 弦空弦 = G（藍）、第 6 弦第 8 格 = C（橘）
4. 切 A 7 → 亮點變成 A/C#/E/G；切 C Minor → 第 2 弦第 4 格顯示「Eb」
5. 縮小視窗，指板容器可橫向捲動、頁面本身不出現橫向捲軸

驗完關掉 dev server。

- [ ] **Step 4: Build 檢查 + Commit**

```bash
npm run build
git add src/components/Fretboard.tsx src/App.tsx
git commit -m "feat: SVG fretboard showing chord tones"
```

---

### Task 6: 點擊播音（Web Audio）

**Files:**
- Create: `src/lib/audio.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `tonal` 的 `Note.freq`；Task 5 的 `Fretboard` 之 `onNotePlay` prop 與 `FretPosition`
- Produces: `playNote(note: string, duration?: number): void` — note 含八度（如 "C4"）

- [ ] **Step 1: 建立 `src/lib/audio.ts`**

Web Audio 無法在 Vitest（node 環境）測試，本 task 以手動驗證為準。

```ts
import { Note } from "tonal";

let ctx: AudioContext | null = null;

export function playNote(note: string, duration = 0.8): void {
  const freq = Note.freq(note);
  if (freq == null) return;

  // AudioContext 需要使用者手勢才能啟動，所以在第一次點擊時才建立
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}
```

- [ ] **Step 2: 在 `src/App.tsx` 接上點擊播音**

imports 加入：

```tsx
import { playNote } from "./lib/audio";
```

`<Fretboard ... />` 加上 `onNotePlay`：

```tsx
<Fretboard
  chordChromas={chord.chromas}
  rootChroma={chord.rootChroma}
  noteLabels={noteLabels}
  onNotePlay={(position) => playNote(position.note)}
/>
```

- [ ] **Step 3: 手動驗證**

```bash
npm run dev
```

開 http://localhost:5173 檢查：
1. 滑鼠移到亮點上出現 pointer 游標
2. 點第 2 弦第 1 格的 C 有聲音；點第 6 弦第 8 格的 C 音高低一個八度
3. 點第 1 弦第 12 格（E5）明顯比第 6 弦空弦（E2）高
4. 連點多下不會爆音或報錯（看 console 無錯誤）

驗完關掉 dev server。

- [ ] **Step 4: 全部測試 + Build + Commit**

```bash
npm test
npm run build
git add src/lib/audio.ts src/App.tsx
git commit -m "feat: click fretboard notes to play synthesized audio"
```

Expected: `npm test` 全綠、build 成功。

---

## Self-Review 紀錄

- Spec coverage：12 調（Task 2 KEYS）、9 類型（Task 2 CHORD_TYPES）、橫式 6×12+空弦指板（Task 3/5）、所有組成音亮起＋根音橘/其他藍＋音名（Task 5）、組成音列表（Task 4）、點擊播音＋手勢啟動 AudioContext（Task 6）、記號點 3/5/7/9/12（Task 5）、chroma 等音比對＋和弦拼法顯示（Task 2/5 noteLabels）、防禦性空和弦（chromas 為空 → 指板無亮點，自然成立）、Vitest 樂理測試（Task 2/3）— 全數對應。
- Placeholder scan：無 TBD/TODO，每個程式碼步驟均含完整程式碼。
- Type consistency：`ChordInfo`/`FretPosition`/`Key`/`ChordTypeId` 於 Task 2/3 定義，Task 4–6 使用處簽名一致；`onNotePlay?: (position: FretPosition) => void` 在 Task 5 宣告為 optional、Task 6 接上，一致。
