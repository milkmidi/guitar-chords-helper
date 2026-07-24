# Floating Metronome — Design

Date: 2026-07-24

## Goal

Add a metronome to the guitar-chords-helper page, opened from a floating icon
button (FAB) and shown as a **floating, draggable panel** the user can move
anywhere on screen. The metronome logic is ported from an existing Figma-export
prototype (`practice-for-better-understanding/04-ai-projects/Metronome-Application--figma/src`),
but reskinned to this project's design system and stripped of the prototype's
dependencies (gsap, lucide-react, shadcn).

## Non-goals

- No new runtime dependencies.
- No persistence of BPM / time signature across reloads.
- No sync between the metronome and the existing audio playback / track sequencer.
- Not full-screen; the source's `min-h-screen` layout is dropped.

## Architecture

Follows the project's strict layering: pure logic in `src/lib/` (unit-tested),
stateless views in `src/components/`, state/effects in `src/hooks/`.

```
src/lib/metronome.ts              pure math: getDegree, bpmFromAngle, bpmFromTaps, clampBpm, BPM_MIN/MAX
src/lib/metronome.test.ts         vitest coverage for the above
src/hooks/useMetronome.ts         precise requestAnimationFrame scheduler (ported), calls audio.playClick
src/hooks/useDraggable.ts         pointer-based drag with viewport clamping (reusable)
src/components/Pie.tsx            dial arc SVG (accent-token colored)
src/components/Metronome.tsx      metronome UI: dial, BPM readout, TAP, time-sig, +/-, mute, play/pause
src/components/MetronomeLauncher.tsx  owns open state; renders FAB + floating draggable panel
src/lib/audio.ts                  add playClick(isAccent) using the shared AudioContext
src/index.css                     metronome styles using existing design tokens
src/App.tsx                       render <MetronomeLauncher /> (one line)
```

## Key decisions

### No new dependencies

- **gsap**: the prototype only uses `gsap.utils.{pipe,clamp,normalize,mapRange,snap}`
  to map a dial angle to BPM. This collapses to plain math in `bpmFromAngle`:
  clamp angle to `[45, 315]`, normalize to `0..1`, map to `[30, 300]`, round.
- **lucide-react**: icons (play, pause, volume, music, drag handle, close) are
  inlined as small SVGs, matching the project convention (`Fretboard`, `ChordDiagram`
  already inline SVG). No icon library.
- **shadcn `Button`**: replaced by native `<button>` with project CSS classes.
- **`Pie`**: ported nearly verbatim (self-contained SVG). Colors changed from
  hardcoded `#f97316` / `#e5e7eb` to the project's `--accent` and a muted token.

### Reuse the shared AudioContext

The prototype creates its own `new AudioContext()`. Instead, add
`playClick(isAccent: boolean)` to `src/lib/audio.ts`, built on the existing
`ensureContext()`. This gives the metronome the project's iOS/WebKit playback-session
mute handling for free and keeps a single module-level context.

- Click sound: square-wave oscillator, 800 Hz for the accented downbeat,
  400 Hz otherwise; short exponential gain decay (~0.1 s), peak gain ~0.3.
- `useMetronome` respects a `muted` flag by simply not calling `playClick`.

### Pointer events

Both the dial (BPM set/drag) and the panel drag use Pointer Events (with
`setPointerCapture`) rather than the prototype's mouse-only handlers, so touch
works on mobile.

### State ownership

`MetronomeLauncher` owns `open` (boolean) and the panel position. The metronome's
own state (bpm, isPlaying, currentBeat, timeSignature, muted) lives in
`Metronome.tsx`. `App.tsx` only renders `<MetronomeLauncher />`, mirroring the
existing "each section owns its instrument-local state" pattern.

## Floating panel & drag behavior

- Panel is `position: fixed`, rendered as a `--surface` card with the project's
  border/shadow tokens.
- Panel has a **header bar** containing a drag-handle glyph + title (節拍器) and a
  close (✕) button. Dragging grabs the **header only**, so the dial and buttons
  stay interactive.
- `useDraggable` tracks `{x, y}`, updates on pointer move, and **clamps** so the
  panel stays fully within the viewport (accounting for panel width/height).
- **FAB**: fixed at bottom-right, accent-filled circular button with a `♪` icon,
  `aria-label` toggling open/close. Panel starts **closed**; opens at a default
  position near the FAB (e.g. bottom-right inset). Reopening keeps the last position.
- Escape key or the ✕ button closes the panel.

## Metronome features

All four requested feature groups:

1. **BPM dial (drag)** — circular `Pie` arc; drag anywhere on the dial sets BPM
   30–300 via `bpmFromAngle`.
2. **Tap tempo** — center TAP button; `bpmFromTaps` averages the last up-to-4 tap
   intervals, applies result only if within 30–300.
3. **Time signature 3/4/5** — buttons selecting beat count; beat dots render with
   an accented downbeat; changing resets the current beat.
4. **+/- and mute** — step buttons (±1 BPM, clamped) and a mute toggle.

Plus **play/pause** (large circular button) driving the scheduler.

Beat dots and dial use `--accent`; the downbeat is visually distinguished from
other beats and from the active-beat highlight.

## Precise scheduler (ported)

`useMetronome({ isPlaying, bpm, beats, muted, onBeat })`:

- Uses `requestAnimationFrame` and the AudioContext clock (`getAudioTime` /
  context `currentTime`) to avoid `setInterval` drift.
- Maintains `nextNoteTime` and advances by `60 / bpm`; on each due beat it calls
  `playClick(beat === 0)` (unless muted) and reports the beat via `onBeat`.
- Restarts cleanly when `isPlaying`, `bpm`, or `beats` change; cancels the RAF and
  resets the beat to 0 on stop.

## Testing

Per project policy, pure logic in `src/lib/` is unit-tested; audio, SVG rendering,
the RAF scheduler, and drag are verified manually in the browser.

`metronome.test.ts` covers:

- `bpmFromAngle`: boundary angles (45→30, 315→300, mid→~165), clamping below 45
  and above 315.
- `getDegree`: known quadrant results.
- `bpmFromTaps`: correct averaging, the 30–300 guard (rejects out-of-range),
  behavior with fewer than 2 taps.
- `clampBpm`: 30 / 300 bounds.

Manual verification checklist:

- FAB opens/closes panel; panel drags by header and stays within viewport.
- Dial drag and TAP both change BPM; +/- step; mute silences clicks.
- Play produces on-time clicks with accented downbeat; beat dots track the beat;
  time-signature change resets and re-accents correctly.
- Works on a touch device (pointer events).
