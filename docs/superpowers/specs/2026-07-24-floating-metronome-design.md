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
src/components/Metronome.tsx      metronome UI: full controls or compact beat-dot view
src/components/MetronomeLauncher.tsx  owns display mode and position; renders FAB + floating draggable panel
src/lib/audio.ts                  add playClick(isAccent) using the shared AudioContext
src/index.css                     metronome styles using existing design tokens
src/App.tsx                       render <MetronomeLauncher /> (one line)
```

## Key decisions

### No new dependencies

- **gsap**: the prototype only uses `gsap.utils.{pipe,clamp,normalize,mapRange,snap}`
  to map a dial angle to BPM. This collapses to plain math in `bpmFromAngle`:
  clamp angle to `[45, 315]`, normalize to `0..1`, map to `[60, 300]`, round.
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

`MetronomeLauncher` owns the panel display mode (`closed`, `expanded`, or
`compact`) and panel position. The metronome's own state (bpm, isPlaying,
currentBeat, timeSignature, muted) lives in `Metronome.tsx`. The component stays
mounted when switching between expanded and compact modes, so playback and all
metronome state continue uninterrupted. Closing unmounts it and restores the
existing defaults the next time it opens: 120 BPM, 4/4, unmuted, and paused.

`App.tsx` only renders `<MetronomeLauncher />`, mirroring the existing "each
section owns its instrument-local state" pattern.

## Floating panel & drag behavior

- Panel is `position: fixed`, rendered as a `--surface` card with the project's
  border/shadow tokens.
- In expanded mode, the panel has a **header bar** containing a drag-handle
  glyph, title (節拍器), compact-mode button, and close (✕) button. Dragging grabs
  the **header only**, so the dial and buttons stay interactive.
- Header actions use Lucide's `GripVertical`, `PanelTopClose`, and `X` icons with
  a consistent 1.8 stroke weight.
- The compact-mode button uses Lucide's `PanelTopClose`, which communicates
  collapsing the panel content without suggesting an operating-system minimize
  action. Its tooltip reads `只顯示節拍點`.
- `useDraggable` tracks `{x, y}`, updates on pointer move, and **clamps** so the
  panel stays fully within the viewport (accounting for panel width/height).
- **FAB**: fixed at bottom-right, accent-filled circular button with a `♪` icon,
  `aria-label` toggling open/close. Panel starts **closed**; opens at a default
  position near the FAB (e.g. bottom-right inset). Reopening keeps the last position.
- Escape key or the ✕ button closes the panel.

## Compact mode

- Compact mode is entered only when the user presses the compact-mode button in the
  expanded panel header. Playback, BPM, time signature, mute state, and current
  beat are preserved. Scrolling, viewport changes, playback changes, and focus
  changes never enter compact mode automatically.
- The compact panel is a fixed-size pill of approximately **104 × 44 px**. Its
  only visible content is the centered beat-dot row; it contains no title, drag
  glyph, icon, BPM value, or playback control.
- While playing, the active dot advances with the beat. While paused, the dots
  remain still and the first dot retains the downbeat distinction. Muting audio
  does not stop the visual beat animation and adds no mute icon.
- A short click or tap anywhere on the compact panel restores expanded mode.
  Dragging anywhere on it moves the panel. A movement threshold distinguishes a
  drag from a click so releasing a drag does not expand the panel.
- The FAB is hidden in compact mode, leaving the beat-dot pill as the only
  metronome element on screen. Closing requires expanding the panel and using
  the existing close control; keyboard Escape continues to close an open panel.
- Entering compact mode and expanding retain the panel's current top-left position. The
  position is re-clamped after either size change and after viewport resize or
  orientation change so the whole panel remains visible.
- The beat-dot row supports 3, 4, or 5 dots without changing the pill width.
- The compact surface is an accessible button named `展開節拍器`; Enter and
  Space restore expanded mode. The decorative dots are hidden from the
  accessibility tree.

## Metronome features

All four requested feature groups:

1. **BPM dial (drag)** — circular `Pie` arc; drag anywhere on the dial sets BPM
   60–300 via `bpmFromAngle`.
2. **Tap tempo** — center TAP button; `bpmFromTaps` averages the last up-to-4 tap
   intervals, applies result only if within 60–300.
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
- Restarts cleanly when `isPlaying` or `beats` change; a time-signature change
  starts again from the downbeat. BPM changes are read through a ref and apply
  to the next calculated interval without resetting the beat sequence.

## Testing

Per project policy, pure logic in `src/lib/` is unit-tested; audio, SVG rendering,
the RAF scheduler, and drag are verified manually in the browser.

`metronome.test.ts` covers:

- `bpmFromAngle`: boundary angles (45→60, 315→300, mid→180), clamping below 45
  and above 315.
- `getDegree`: known quadrant results.
- `bpmFromTaps`: correct averaging, the 60–300 guard (rejects out-of-range),
  behavior with fewer than 2 taps.
- `clampBpm`: 30 / 300 bounds.

Manual verification checklist:

- FAB opens/closes panel; panel drags by header and stays within viewport.
- Dial drag and TAP both change BPM; +/- step; mute silences clicks.
- Play produces on-time clicks with accented downbeat; beat dots track the beat;
  time-signature change resets and re-accents correctly.
- Entering compact mode keeps playback and settings intact; compact mode shows only the
  fixed-size beat-dot pill and hides the FAB.
- Compact beat dots animate while playing, remain static while paused, and
  continue animating while muted.
- Compact panel distinguishes click-to-expand from drag, retains its position
  through both mode changes, and re-clamps after resize or orientation change.
- Compact panel supports pointer, Enter, and Space expansion; Escape closes it.
- Closing and reopening resets the metronome to 120 BPM, 4/4, unmuted, and paused.
- Works on a touch device (pointer events).
