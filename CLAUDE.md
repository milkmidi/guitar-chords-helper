# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev               # Vite dev server at http://localhost:5173
npm test                  # vitest run (all tests)
npx vitest run src/lib/chords.test.ts   # single test file
npm run build             # tsc -b && vite build (type-checks; must pass before commit)
npm run lint              # oxlint
npm run extract-voicings  # regenerate src/data/voicings.json from chords-db (see Data pipeline)
```

## What this is

A guitar-learning SPA (Vite + React 19 + TypeScript + Tailwind CSS v4 + tonal): pick a key (C…B) and chord type (major/minor/7/maj7/m7/sus2/sus4/dim/aug), and the app shows all chord-tone positions on a horizontal SVG fretboard, a chord-notes line, and vertical voicing diagrams (v1–vN) below. Clicking a fretboard note plays that pitch; clicking a voicing diagram strums the chord — both via Web Audio synthesis, no audio files.

Design specs and implementation plans live in `docs/superpowers/specs/` and `docs/superpowers/plans/` — read the spec before extending a feature.

## Architecture

Strict layering, enforced by convention:

- **`src/lib/`** — pure logic, unit-tested with Vitest. `chords.ts` wraps tonal's `Chord.getChord` (KEYS, CHORD_TYPES, `getChordInfo`); `fretboard.ts` precomputes all 78 string/fret positions (`FRETBOARD`); `voicings.ts` looks up chord voicings from generated JSON; `audio.ts` is the one untested lib module (Web Audio can't run under Vitest/node — the plan explicitly exempts it; verify audio manually in the browser).
- **`src/components/`** — pure, stateless, props-driven display components (SVG rendering lives here). No business logic, no state.
- **`src/App.tsx`** — the only stateful module: `selectedKey` + `chordType`, everything else derived via `useMemo`.

### Enharmonic policy (the core design decision)

Note **matching** uses chroma (pitch class 0–11) so C# ≡ Db; note **display** uses the chord's own spelling from tonal (C minor shows Eb, never D#). `App.tsx` builds a `noteLabels: Map<chroma, spelledName>` from `ChordInfo`'s parallel `chromas`/`notes` arrays and passes it to `Fretboard`. Never display fretboard-derived note names directly — they are sharp-spelled and only used for audio pitch.

### Two opposite string orderings — easy to get wrong

- `fretboard.ts` `TUNING = ["E4","B3","G3","D3","A2","E2"]`: index 0 = **string 1 = high E** (drawn at top of the horizontal fretboard).
- Voicing data (`Voicing.frets`/`fingers`, from chords-db): index 0 = **low E** (drawn leftmost in the vertical chord diagrams). `frets`: -1 = muted, 0 = open, else relative to `baseFret`.

### Data pipeline for voicings

`@tombatossals/chords-db` is a **devDependency only** — the runtime bundle imports the committed, generated `src/data/voicings.json` (12 keys × 9 types subset). `scripts/extract-voicings.mjs` regenerates it and exits non-zero if any key×type combo has no positions. Sharp-key mapping to chords-db names (`C#→Csharp, D#→Eb, F#→Fsharp, G#→Ab, A#→Bb`) lives in both the script and implicitly in the JSON keys; the script duplicates the chord-type list from `chords.ts` (it can't import the .ts module) — the suite-wide tests in `voicings.test.ts` fail loudly if the two drift. If you add a key or chord type, update the script and re-run `npm run extract-voicings`.

### Audio

Single module-level `AudioContext`, lazily created/resumed on first user gesture (browser autoplay policy). `playNote(note)` takes octave-bearing names ("C4"); `playStrum(midi[])` schedules oscillators low→high at 60ms intervals with reduced per-note gain (0.15 vs 0.25) to avoid clipping. Both share `ensureContext()`/`playFreq()` — extend those rather than duplicating oscillator wiring.

## Testing policy

Music-theory logic in `src/lib/` gets Vitest coverage (colocated `*.test.ts`); SVG rendering and audio are verified manually in the browser. Keep exhaustive matrix tests (all 12 keys × 9 types) — they are the guard against tonal upgrades and data drift.
