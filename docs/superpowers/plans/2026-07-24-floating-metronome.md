# Floating Metronome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a draggable, floating metronome panel opened from a bottom-right FAB, ported from an existing prototype but reskinned to this project's design system with no new dependencies.

**Architecture:** Pure math lives in `src/lib/metronome.ts` (unit-tested); the precise scheduler and drag behavior are hooks (`src/hooks/`); the dial arc, metronome UI, and floating launcher are stateless-ish components (`src/components/`). Click audio reuses the shared `AudioContext` in `src/lib/audio.ts`. `App.tsx` mounts one `<MetronomeLauncher />`.

**Tech Stack:** Vite + React 19 + TypeScript (strict) + Tailwind v4 (but project uses semantic CSS classes with design tokens in `src/index.css`) + Web Audio. Tests: Vitest. Lint: oxlint.

## Global Constraints

- No new runtime dependencies (no gsap, no lucide-react, no shadcn). Icons are inline SVG.
- Pure logic goes in `src/lib/` with colocated `*.test.ts`; audio, SVG, RAF scheduler, and drag are verified manually in the browser (project testing policy).
- Use existing design tokens, never hardcoded colors: `--surface`, `--ink`, `--chip`, `--line`, `--muted`, `--accent`, `--on-accent`, `--r-card`, `--spring`, `--display`, `--mono`.
- Follow the existing component convention: semantic `className`s, `is-*` state modifiers, `aria-pressed` on toggles.
- BPM range is 30–300. Dial sweep is 45°–315°. Click = square wave, 800 Hz accented downbeat / 400 Hz otherwise.
- `npm run build` (tsc) and `npm run lint` (oxlint) must pass before the final commit.

---

### Task 1: Pure metronome math + tests

**Files:**
- Create: `src/lib/metronome.ts`
- Test: `src/lib/metronome.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `BPM_MIN = 30`, `BPM_MAX = 300` (numbers)
  - `clampBpm(bpm: number): number`
  - `getDegree(clientX: number, clientY: number, centerX: number, centerY: number): number`
  - `bpmFromAngle(angle: number): number`
  - `bpmFromTaps(taps: number[]): number | null`

- [ ] **Step 1: Write the failing test**

Create `src/lib/metronome.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BPM_MAX, BPM_MIN, bpmFromAngle, bpmFromTaps, clampBpm, getDegree } from "./metronome";

describe("clampBpm", () => {
  it("clamps below the minimum", () => expect(clampBpm(10)).toBe(BPM_MIN));
  it("clamps above the maximum", () => expect(clampBpm(500)).toBe(BPM_MAX));
  it("passes through an in-range value", () => expect(clampBpm(120)).toBe(120));
});

describe("bpmFromAngle", () => {
  it("maps the start angle (45) to BPM_MIN", () => expect(bpmFromAngle(45)).toBe(30));
  it("maps the end angle (315) to BPM_MAX", () => expect(bpmFromAngle(315)).toBe(300));
  it("maps the mid angle (180) to the midpoint BPM", () => expect(bpmFromAngle(180)).toBe(165));
  it("clamps angles below the start", () => expect(bpmFromAngle(0)).toBe(30));
  it("clamps angles above the end", () => expect(bpmFromAngle(400)).toBe(300));
});

describe("getDegree", () => {
  // center at (100, 100)
  it("returns 270 for a point directly to the right", () =>
    expect(getDegree(200, 100, 100, 100)).toBe(270));
  it("returns 90 for a point directly to the left", () =>
    expect(getDegree(0, 100, 100, 100)).toBe(90));
});

describe("bpmFromTaps", () => {
  it("returns null with fewer than 2 taps", () => expect(bpmFromTaps([1000])).toBeNull());
  it("averages even intervals to a BPM", () =>
    expect(bpmFromTaps([0, 500, 1000, 1500])).toBe(120));
  it("rejects a result above the range", () => expect(bpmFromTaps([0, 100])).toBeNull());
  it("rejects a result below the range", () => expect(bpmFromTaps([0, 3000])).toBeNull());
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/metronome.test.ts`
Expected: FAIL — cannot find module `./metronome` / exports undefined.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/metronome.ts`:

```ts
export const BPM_MIN = 30;
export const BPM_MAX = 300;

const RADIANS_TO_DEGREES = 180 / Math.PI;

// 儀表掃描角度：45° = 最慢，315° = 最快
const DIAL_START_ANGLE = 45;
const DIAL_END_ANGLE = 315;

export function clampBpm(bpm: number): number {
  return Math.max(BPM_MIN, Math.min(BPM_MAX, bpm));
}

/** 指標相對於儀表中心的角度（度）；正上方為 0，順時針增加。 */
export function getDegree(clientX: number, clientY: number, centerX: number, centerY: number): number {
  const x = clientX - centerX;
  const y = clientY - centerY;
  let degree = Math.atan(y / x) * RADIANS_TO_DEGREES;
  if (x < 0) {
    degree += 90;
  } else {
    degree += 270;
  }
  return degree;
}

/** 將儀表角度（度）對應成 30–300 BPM。 */
export function bpmFromAngle(angle: number): number {
  const clamped = Math.max(DIAL_START_ANGLE, Math.min(DIAL_END_ANGLE, angle));
  const t = (clamped - DIAL_START_ANGLE) / (DIAL_END_ANGLE - DIAL_START_ANGLE);
  return Math.round(BPM_MIN + t * (BPM_MAX - BPM_MIN));
}

/**
 * 由點擊時間戳（毫秒）平均出 BPM；不足 2 下或結果超出 30–300 時回傳 null。
 */
export function bpmFromTaps(taps: number[]): number | null {
  if (taps.length < 2) return null;
  const intervals: number[] = [];
  for (let i = 1; i < taps.length; i++) {
    intervals.push(taps[i] - taps[i - 1]);
  }
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = Math.round(60000 / avg);
  if (bpm < BPM_MIN || bpm > BPM_MAX) return null;
  return bpm;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/metronome.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/metronome.ts src/lib/metronome.test.ts
git commit -m "feat: add pure metronome math (bpmFromAngle, bpmFromTaps, getDegree)"
```

---

### Task 2: Metronome click sound in audio.ts

**Files:**
- Modify: `src/lib/audio.ts` (append a new export)

**Interfaces:**
- Consumes: existing module-internal `ensureContext(): AudioContext`.
- Produces: `playClick(isAccent: boolean): void`.

No unit test (audio can't run under Vitest/node — project policy). Verify by type-check + browser.

- [ ] **Step 1: Add `playClick` to `src/lib/audio.ts`**

Append at the end of the file (after `playStrum`):

```ts
// 節拍器 click：方波，重拍 800Hz、弱拍 400Hz，短促衰減。
// 走共用的 ensureContext，繼承 iOS playback session 靜音處理。
export function playClick(isAccent: boolean): void {
  const audio = ensureContext();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "square";
  osc.frequency.value = isAccent ? 800 : 400;
  const start = audio.currentTime;
  gain.gain.setValueAtTime(0.3, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + 0.1);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/audio.ts
git commit -m "feat: add playClick metronome sound to shared audio context"
```

---

### Task 3: useMetronome scheduler hook

**Files:**
- Create: `src/hooks/useMetronome.ts`

**Interfaces:**
- Consumes: `getAudioTime()` and `playClick(isAccent)` from `src/lib/audio.ts`.
- Produces: `useMetronome(options: UseMetronomeOptions): void` where
  `UseMetronomeOptions = { isPlaying: boolean; bpm: number; beats: number; muted: boolean; onBeat: (beat: number) => void }`.

No unit test (RAF + audio — manual verification). Verify by type-check now, behavior in Task 7.

- [ ] **Step 1: Create `src/hooks/useMetronome.ts`**

```ts
import { useEffect, useRef } from "react";
import { getAudioTime, playClick } from "../lib/audio";

interface UseMetronomeOptions {
  isPlaying: boolean;
  bpm: number;
  beats: number;
  muted: boolean;
  onBeat: (beat: number) => void;
}

// 精準節拍器：用 requestAnimationFrame + AudioContext 時鐘排程，避免 setInterval 漂移。
export function useMetronome({ isPlaying, bpm, beats, muted, onBeat }: UseMetronomeOptions): void {
  // muted / onBeat 用 ref 讀取，避免它們變動時重啟排程迴圈。
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const onBeatRef = useRef(onBeat);
  onBeatRef.current = onBeat;

  useEffect(() => {
    if (!isPlaying) {
      onBeatRef.current(0);
      return;
    }
    let rafId: number | null = null;
    let nextNoteTime = getAudioTime();
    let beat = 0;
    const interval = 60 / bpm;

    const scheduler = (): void => {
      const now = getAudioTime();
      while (now >= nextNoteTime) {
        if (!mutedRef.current) playClick(beat === 0);
        onBeatRef.current(beat);
        beat = (beat + 1) % beats;
        nextNoteTime += interval;
      }
      rafId = requestAnimationFrame(scheduler);
    };
    rafId = requestAnimationFrame(scheduler);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isPlaying, bpm, beats]);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useMetronome.ts
git commit -m "feat: add useMetronome precise scheduler hook"
```

---

### Task 4: Pie dial-arc component

**Files:**
- Create: `src/components/Pie.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `export function Pie({ value }: { value: number }): JSX.Element` — `value` is 0–1 across the 45°–315° sweep; renders a track arc (`--line`) plus a progress arc (`--accent`).

No unit test (SVG — manual verification).

- [ ] **Step 1: Create `src/components/Pie.tsx`**

```tsx
/**
 * BPM 儀表弧線。value 0~1 對應 45°~315° 的掃描範圍。
 */
export function Pie({ value = 0 }: { value: number }) {
  const v = Math.max(0, Math.min(1, value));
  const size = 100;
  const stroke = 8;
  const r = size / 2 - stroke / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 45 + 180;
  const endAngle = startAngle + 270;
  const angle = startAngle + (endAngle - startAngle) * v;
  const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startAngle));
  const y1 = cy + r * Math.sin(rad(startAngle));
  const x2 = cx + r * Math.cos(rad(angle));
  const y2 = cy + r * Math.sin(rad(angle));
  const bgX2 = cx + r * Math.cos(rad(endAngle));
  const bgY2 = cy + r * Math.sin(rad(endAngle));
  const largeArcFlag = angle - startAngle > 180 ? 1 : 0;
  const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${bgX2} ${bgY2}`}
        fill="none"
        stroke="var(--line)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {v > 0 && (
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth={stroke} strokeLinecap="round" />
      )}
    </svg>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Pie.tsx
git commit -m "feat: add Pie dial-arc component for metronome"
```

---

### Task 5: useDraggable hook

**Files:**
- Create: `src/hooks/useDraggable.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface Position { x: number; y: number }`
  - `useDraggable<T extends HTMLElement>(initial: Position, panelRef: RefObject<T | null>): { position: Position; setPosition: (p: Position) => void; dragHandleProps: { onPointerDown: (e: ReactPointerEvent) => void } }`
  - Drag updates `position` on pointer move and clamps so the element stays fully within the viewport.

No unit test (DOM pointer events — manual verification).

- [ ] **Step 1: Create `src/hooks/useDraggable.ts`**

```ts
import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

export interface Position {
  x: number;
  y: number;
}

interface DragOrigin {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

// 以 header 為把手拖曳浮動面板；限制在視窗範圍內。
export function useDraggable<T extends HTMLElement>(initial: Position, panelRef: RefObject<T | null>) {
  const [position, setPosition] = useState<Position>(initial);
  const origin = useRef<DragOrigin | null>(null);
  const moveRef = useRef<(e: PointerEvent) => void>(() => {});
  const upRef = useRef<() => void>(() => {});

  const clamp = useCallback(
    (x: number, y: number): Position => {
      const el = panelRef.current;
      const w = el?.offsetWidth ?? 0;
      const h = el?.offsetHeight ?? 0;
      const maxX = Math.max(0, window.innerWidth - w);
      const maxY = Math.max(0, window.innerHeight - h);
      return { x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) };
    },
    [panelRef],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault();
      origin.current = { startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y };

      const onMove = (ev: PointerEvent) => {
        const o = origin.current;
        if (!o) return;
        setPosition(clamp(o.originX + (ev.clientX - o.startX), o.originY + (ev.clientY - o.startY)));
      };
      const onUp = () => {
        origin.current = null;
        document.removeEventListener("pointermove", moveRef.current);
        document.removeEventListener("pointerup", upRef.current);
      };
      moveRef.current = onMove;
      upRef.current = onUp;
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [position.x, position.y, clamp],
  );

  return { position, setPosition, dragHandleProps: { onPointerDown } };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDraggable.ts
git commit -m "feat: add useDraggable hook for the floating panel"
```

---

### Task 6: Metronome UI component + styles

**Files:**
- Create: `src/components/Metronome.tsx`
- Modify: `src/index.css` (append metronome-body styles)

**Interfaces:**
- Consumes: `useMetronome` (Task 3); `bpmFromAngle`, `bpmFromTaps`, `clampBpm`, `getDegree`, `BPM_MIN`, `BPM_MAX` (Task 1); `Pie` (Task 4).
- Produces: `export default function Metronome(): JSX.Element` — self-contained metronome with its own state (bpm, isPlaying, currentBeat, beats, muted).

No unit test (UI/audio — manual verification in Task 7).

- [ ] **Step 1: Create `src/components/Metronome.tsx`**

```tsx
import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useMetronome } from "../hooks/useMetronome";
import { BPM_MAX, BPM_MIN, bpmFromAngle, bpmFromTaps, clampBpm, getDegree } from "../lib/metronome";
import { Pie } from "./Pie";

const BEAT_OPTIONS = [3, 4, 5];

const PlayIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
  </svg>
);
const VolumeIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M3 9v6h4l5 5V4L7 9H3z" />
  </svg>
);
const MutedIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor" />
    <path d="M16 8l5 8M21 8l-5 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

export default function Metronome() {
  const [bpm, setBpm] = useState(75);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beats, setBeats] = useState(4);
  const [muted, setMuted] = useState(false);

  const dialRef = useRef<HTMLDivElement>(null);
  const tapsRef = useRef<number[]>([]);
  const draggingDial = useRef(false);

  useMetronome({ isPlaying, bpm, beats, muted, onBeat: setCurrentBeat });

  const setBpmFromPointer = useCallback((clientX: number, clientY: number) => {
    const el = dialRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setBpm(bpmFromAngle(getDegree(clientX, clientY, cx, cy)));
  }, []);

  const onDialPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      draggingDial.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setBpmFromPointer(e.clientX, e.clientY);
    },
    [setBpmFromPointer],
  );

  const onDialPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingDial.current) return;
      setBpmFromPointer(e.clientX, e.clientY);
    },
    [setBpmFromPointer],
  );

  const onDialPointerUp = useCallback(() => {
    draggingDial.current = false;
  }, []);

  const handleTap = useCallback(() => {
    tapsRef.current = [...tapsRef.current, Date.now()].slice(-4);
    const next = bpmFromTaps(tapsRef.current);
    if (next !== null) setBpm(next);
  }, []);

  const changeBeats = (n: number) => {
    setBeats(n);
    setCurrentBeat(0);
  };

  const progress = (bpm - BPM_MIN) / (BPM_MAX - BPM_MIN);

  return (
    <div className="metronome">
      <div className="metronome-timesig">{beats}/4</div>

      <div className="metronome-dots">
        {Array.from({ length: beats }, (_, i) => (
          <span
            key={i}
            className={`metronome-dot${i === 0 ? " is-downbeat" : ""}${
              i === currentBeat && isPlaying ? " is-active" : ""
            }`}
          />
        ))}
      </div>

      <div className="metronome-meters" role="group" aria-label="拍號">
        {BEAT_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            className={`metronome-meter${beats === n ? " is-selected" : ""}`}
            aria-pressed={beats === n}
            onClick={() => changeBeats(n)}
          >
            {n}/4
          </button>
        ))}
      </div>

      <div className="metronome-bpm">
        <button
          type="button"
          className="metronome-step"
          onClick={() => setBpm((b) => clampBpm(b - 1))}
          aria-label="降低 BPM"
        >
          −
        </button>
        <div className="metronome-bpm-value">
          {bpm}
          <span className="metronome-bpm-unit">BPM</span>
        </div>
        <button
          type="button"
          className="metronome-step"
          onClick={() => setBpm((b) => clampBpm(b + 1))}
          aria-label="提高 BPM"
        >
          +
        </button>
      </div>

      <div
        ref={dialRef}
        className="metronome-dial"
        onPointerDown={onDialPointerDown}
        onPointerMove={onDialPointerMove}
        onPointerUp={onDialPointerUp}
      >
        <Pie value={progress} />
        <button
          type="button"
          className="metronome-tap"
          onClick={handleTap}
          onPointerDown={(e) => e.stopPropagation()}
        >
          TAP
        </button>
      </div>

      <div className="metronome-controls">
        <button
          type="button"
          className={`metronome-mute${muted ? " is-muted" : ""}`}
          onClick={() => setMuted((m) => !m)}
          aria-pressed={muted}
          aria-label={muted ? "取消靜音" : "靜音"}
        >
          {muted ? MutedIcon : VolumeIcon}
        </button>
        <button
          type="button"
          className="metronome-play"
          onClick={() => setIsPlaying((p) => !p)}
          aria-label={isPlaying ? "暫停" : "播放"}
        >
          {isPlaying ? PauseIcon : PlayIcon}
        </button>
        <span className="metronome-controls-spacer" aria-hidden="true" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Append metronome-body styles to `src/index.css`**

Add at the end of the file:

```css
/* ---------- Metronome ---------- */
.metronome {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 18px 18px 20px;
  color: var(--ink);
}
.metronome-timesig {
  font-family: var(--display);
  font-size: 28px;
  line-height: 1;
}
.metronome-dots {
  display: flex;
  gap: 8px;
}
.metronome-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--line);
  transition:
    background 0.12s ease,
    transform 0.12s ease;
}
.metronome-dot.is-downbeat {
  background: var(--muted);
}
.metronome-dot.is-active {
  background: var(--accent);
  transform: scale(1.3);
}
.metronome-meters {
  display: flex;
  gap: 8px;
}
.metronome-meter {
  min-width: 44px;
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  color: var(--ink);
  font-family: var(--mono);
  font-size: 13px;
  cursor: pointer;
}
.metronome-meter.is-selected {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}
.metronome-bpm {
  display: flex;
  align-items: center;
  gap: 16px;
}
.metronome-step {
  width: 36px;
  height: 36px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.metronome-step:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.metronome-bpm-value {
  min-width: 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--display);
  font-size: 40px;
  line-height: 1;
}
.metronome-bpm-unit {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 3px;
  color: var(--muted);
}
.metronome-dial {
  position: relative;
  width: 180px;
  height: 180px;
  touch-action: none;
  cursor: pointer;
  user-select: none;
}
.metronome-tap {
  position: absolute;
  inset: 34px;
  border: none;
  border-radius: 999px;
  background: var(--chip);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 14px;
  letter-spacing: 2px;
  cursor: pointer;
}
.metronome-tap:hover {
  color: var(--ink);
}
.metronome-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.metronome-controls-spacer {
  width: 40px;
}
.metronome-mute {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
.metronome-mute:hover {
  color: var(--accent);
}
.metronome-mute.is-muted {
  color: var(--line);
}
.metronome-play {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 999px;
  background: var(--accent);
  color: var(--on-accent);
  cursor: pointer;
  transition: transform 0.12s var(--spring);
}
.metronome-play:active {
  transform: scale(0.94);
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc -b && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Metronome.tsx src/index.css
git commit -m "feat: add Metronome UI component and styles"
```

---

### Task 7: MetronomeLauncher (FAB + floating panel) + App wiring

**Files:**
- Create: `src/components/MetronomeLauncher.tsx`
- Modify: `src/App.tsx` (import + render `<MetronomeLauncher />`)
- Modify: `src/index.css` (append FAB + panel styles)

**Interfaces:**
- Consumes: `useDraggable`, `Position` (Task 5); `Metronome` (Task 6).
- Produces: `export default function MetronomeLauncher(): JSX.Element` — owns `open` state and panel position; renders the FAB always, the panel when open.

- [ ] **Step 1: Create `src/components/MetronomeLauncher.tsx`**

```tsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDraggable } from "../hooks/useDraggable";
import Metronome from "./Metronome";

const MusicIcon = (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
    <path
      d="M9 18V5l10-2v13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6" cy="18" r="3" fill="currentColor" />
    <circle cx="16" cy="16" r="3" fill="currentColor" />
  </svg>
);
const CloseIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export default function MetronomeLauncher() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const placed = useRef(false);
  const { position, setPosition, dragHandleProps } = useDraggable({ x: 24, y: 24 }, panelRef);

  // 第一次開啟時，量測面板尺寸並放到右下角（FAB 附近）。
  useLayoutEffect(() => {
    if (open && !placed.current && panelRef.current) {
      const w = panelRef.current.offsetWidth;
      const h = panelRef.current.offsetHeight;
      setPosition({
        x: Math.max(16, window.innerWidth - w - 24),
        y: Math.max(16, window.innerHeight - h - 96),
      });
      placed.current = true;
    }
  }, [open, setPosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          className="metronome-panel"
          style={{ left: position.x, top: position.y }}
          role="dialog"
          aria-label="節拍器"
        >
          <div className="metronome-panel-header" {...dragHandleProps}>
            <span className="metronome-panel-grip" aria-hidden="true">
              ⠿
            </span>
            <span className="metronome-panel-title">節拍器</span>
            <button
              type="button"
              className="metronome-panel-close"
              onClick={() => setOpen(false)}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="關閉節拍器"
            >
              {CloseIcon}
            </button>
          </div>
          <Metronome />
        </div>
      )}
      <button
        type="button"
        className="metronome-fab"
        onClick={() => setOpen((o) => !o)}
        aria-pressed={open}
        aria-label={open ? "關閉節拍器" : "開啟節拍器"}
      >
        {MusicIcon}
      </button>
    </>
  );
}
```

- [ ] **Step 2: Append FAB + panel styles to `src/index.css`**

Add at the end of the file:

```css
.metronome-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 50;
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 999px;
  background: var(--accent);
  color: var(--on-accent);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  transition: transform 0.15s var(--spring);
}
.metronome-fab:hover {
  transform: scale(1.06);
}
.metronome-fab:active {
  transform: scale(0.96);
}
.metronome-panel {
  position: fixed;
  z-index: 60;
  width: 300px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}
.metronome-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--chip);
  border-bottom: 1px solid var(--line);
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.metronome-panel-header:active {
  cursor: grabbing;
}
.metronome-panel-grip {
  color: var(--muted);
  font-size: 14px;
  letter-spacing: 2px;
}
.metronome-panel-title {
  flex: 1;
  font-family: var(--display);
  font-size: 14px;
  color: var(--ink);
}
.metronome-panel-close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
.metronome-panel-close:hover {
  background: var(--surface);
  color: var(--ink);
}
```

- [ ] **Step 3: Wire into `src/App.tsx`**

Add the import near the other component imports:

```tsx
import MetronomeLauncher from "./components/MetronomeLauncher";
```

Then render it as the last child inside the `<main className="page">` element, immediately before `</main>`:

```tsx
      <MetronomeLauncher />
    </main>
```

- [ ] **Step 4: Full build, lint, tests**

Run: `npm run build && npm run lint && npm test`
Expected: type-check passes, lint clean, all tests (including `metronome.test.ts`) pass.

- [ ] **Step 5: Manual browser verification**

Run: `npm run dev`, open http://localhost:3000, and confirm:
- FAB shows at bottom-right; clicking it opens the panel near the FAB, clicking again (or ✕, or Escape) closes it.
- Dragging the panel header moves it; it stays within the viewport; dial/buttons remain clickable.
- Dragging the dial changes BPM (30–300); TAP infers BPM; +/- step by 1 and clamp.
- Play produces on-time clicks with an accented (higher-pitch) downbeat; beat dots track the current beat; the downbeat dot is distinguished.
- Switching 3/4/5 resets the beat and re-renders the right number of dots.
- Mute silences clicks and shows the muted icon; unmute restores sound.

- [ ] **Step 6: Commit**

```bash
git add src/components/MetronomeLauncher.tsx src/App.tsx src/index.css
git commit -m "feat: add floating metronome launcher (FAB + draggable panel)"
```

---

## Self-Review Notes

- **Spec coverage:** no-new-deps (Global Constraints + inline SVG/plain math in Tasks 1,4,6,7); shared AudioContext click (Task 2); pointer events (Tasks 5,6); state ownership in Launcher (Task 7); header-only drag + viewport clamp + FAB + Escape (Tasks 5,7); all four feature groups (Task 6); precise scheduler (Task 3); pure-logic tests (Task 1); manual verification checklist (Task 7 Step 5). All spec sections map to a task.
- **Type consistency:** `useMetronome({ isPlaying, bpm, beats, muted, onBeat })` defined in Task 3 and consumed identically in Task 6. `useDraggable(initial, panelRef) → { position, setPosition, dragHandleProps }` defined in Task 5, consumed identically in Task 7. `Pie({ value })` defined in Task 4, consumed in Task 6. `playClick(isAccent)` / `getAudioTime()` from Tasks 2 and existing audio.ts, consumed in Task 3. `bpmFromAngle`/`bpmFromTaps`/`clampBpm`/`getDegree`/`BPM_MIN`/`BPM_MAX` defined in Task 1, consumed in Task 6.
- **Placeholders:** none — every code step contains complete code.
