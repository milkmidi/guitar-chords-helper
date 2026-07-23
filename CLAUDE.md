# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev               # Vite dev server at http://localhost:3000 (port set in vite.config.ts)
npm test                  # vitest run (all tests)
npx vitest run src/lib/chords.test.ts   # single test file
npm run build             # tsc -b && vite build (type-checks; must pass before commit)
npm run lint              # oxlint
npm run extract-voicings  # regenerate src/data/voicings.json from chords-db (see Data pipeline)
```

## What this is

A guitar-learning SPA (Vite + React 19 + TypeScript + Tailwind CSS v4 + tonal) — one page showing a chord on both a guitar and a piano at once. Pick a key (C…B) and a chord from a category-filtered catalog (~36 types across Major/Minor/Dominant/Diminished/Augmented/Altered) via one shared control set; the choice drives both a **guitar column** (`GuitarSection`: horizontal SVG fretboard, a chord-notes hero line, voicing diagrams v1–vN, and a track sequencer currently gated off behind `SHOW_TRACK = false` in `GuitarSection.tsx`) and a **piano column** (`PianoSection`: VexFlow grand staff + keyboard). Live Web MIDI input is analyzed back into chord names and drives only the piano column. The two columns stack vertically within the 1100px page width (`.instrument-grid` is a single column). Shared: KeySelector, ChordCatalogSelector (via `useChordCatalog`), keyboard shortcuts (1–7 roots, ←/→ chord, ↑/↓ category). Clicking a fretboard note / keyboard key plays that pitch; clicking a voicing diagram / the staff strums the chord — all via Web Audio synthesis, no audio files.

Design specs and implementation plans live in `docs/superpowers/specs/` and `docs/superpowers/plans/` — read the spec before extending a feature.

## Architecture

Strict layering, enforced by convention:

- **`src/lib/`** — pure logic, unit-tested with Vitest. `chords.ts` wraps tonal (`KEYS`, `getChordBySymbol`); `chordCatalog.ts` is the shared ~36-chord catalog (`{symbol, label, category}`, `toGlyph`); `chordDetect.ts` reverse-analyzes MIDI notes into chord names; `fretboard.ts` precomputes all 78 string/fret positions (`FRETBOARD`); `voicings.ts` looks up guitar voicings (`getVoicings(key, symbol)`) from generated JSON, keyed by catalog symbol; `staff.ts`/`player.ts` are pure helpers. `audio.ts` and the Web MIDI hook can't run under Vitest/node — verify those manually in the browser.
- **`src/components/`** — pure, stateless, props-driven display components (SVG rendering lives here). No business logic, no state.
- **`src/App.tsx`** — the single page. Owns the shared selection (`selectedKey` + `useChordCatalog`) and the keyboard shortcuts, renders the controls + chord hero once, then `GuitarSection` | `PianoSection` in a responsive grid. Each section owns its instrument-local state (`useTrackPlayer` / `useMidiInput`). VexFlow is heavy, so `Staff` stays behind `lazy()` + `Suspense` inside `PianoSection`.

### Enharmonic policy (the core design decision)

Note **matching** uses chroma (pitch class 0–11) so C# ≡ Db; note **display** uses the chord's own spelling from tonal (C minor shows Eb, never D#). `ChordFinderView` builds a `noteLabels: Map<chroma, spelledName>` from the chord's parallel `chromas`/`notes` arrays and passes it to `Fretboard`. Never display fretboard-derived note names directly — they are sharp-spelled and only used for audio pitch.

### Two opposite string orderings — easy to get wrong

- `fretboard.ts` `TUNING = ["E4","B3","G3","D3","A2","E2"]`: index 0 = **string 1 = high E** (drawn at top of the horizontal fretboard).
- Voicing data (`Voicing.frets`/`fingers`, from chords-db): index 0 = **low E** (drawn leftmost in the vertical chord diagrams). `frets`: -1 = muted, 0 = open, else relative to `baseFret`.

### Data pipeline for voicings

`@tombatossals/chords-db` is a **devDependency only** — the runtime bundle imports the committed, generated `src/data/voicings.json` (12 keys × 34 guitar chords). `scripts/extract-voicings.mjs` regenerates it and exits non-zero if any mapped key×chord has no positions. Two maps live in the script (it can't import the .ts modules): `KEY_MAP` for sharp-key → chords-db names (`C#→Csharp, D#→Eb, F#→Fsharp, G#→Ab, A#→Bb`), and `SYMBOL_TO_SUFFIX` for our catalog symbol → chords-db suffix (e.g. `6/9→69, mMaj7→mmaj7, alt7→alt`, plus enharmonic `7#5→aug7, 9#5→aug9`). The JSON is keyed by our catalog symbols. Catalog chords with no chords-db data (`m13`, `13#11`) are omitted — `getVoicings` returns `[]` and `VoicingsPanel` renders nothing. `voicings.test.ts` guards drift (every guitar-supported catalog symbol must have ≥1 voicing across all 12 keys). If you add a key or chord, update `chordCatalog.ts` + `SYMBOL_TO_SUFFIX` and re-run `npm run extract-voicings`.

### Audio

Single module-level `AudioContext`, lazily created/resumed on first user gesture (browser autoplay policy). `playNote(note)` takes octave-bearing names ("C4"); `playStrum(midi[])` schedules oscillators low→high at 60ms intervals with reduced per-note gain (0.15 vs 0.25) to avoid clipping. Both share `ensureContext()`/`playFreq()` — extend those rather than duplicating oscillator wiring.

## Testing policy

Music-theory logic in `src/lib/` gets Vitest coverage (colocated `*.test.ts`); SVG rendering, audio, and Web MIDI are verified manually in the browser. Keep exhaustive matrix tests (all 12 keys × the catalog / guitar-supported chords) — they are the guard against tonal upgrades and data drift.
