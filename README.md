# Guitar Chords Helper

**Live demo: https://milkmidi.github.io/guitar-chords-helper/**

A web app for learning chords on **two instruments at once**. Pick a key (C–B) and a chord type
from a catalog of 36 (Major / Minor / Dominant / Diminished / Augmented / Altered), and one shared
control set drives both a guitar view and a piano view of the same chord.

### Guitar

- **A horizontal fretboard** (6 strings × 12 frets + open strings) highlighting **every position of
  the chord tones**: root in orange, other chord tones in near-black, with note names inside the dots
- **The chord-tone list**, e.g. `C Major = C - E - G`
- **Voicing diagrams**: common fingerings (v1–vN) as vertical chord charts, with position labels
  (3fr, 5fr…), barres, finger numbers, and muted/open string markers

### Piano

- **A grand staff** rendered with VexFlow, with correct accidentals for the chord
- **A keyboard** with the chord tones lit up

### Enharmonics are spelled correctly

Note *matching* uses pitch class, but note *display* uses the chord's own spelling — so Cm shows
**Eb, never D#**. Most tools hand you sharps for everything, which makes the result hard to read
against sheet music.

### Sound

All audio is synthesized with the Web Audio API — no audio files:

- Click a note on the fretboard, or a key on the piano → plays that pitch
- Click a voicing diagram, or the staff → strums the whole chord from low to high

### MIDI input

Connect a MIDI keyboard (Web MIDI, Chrome/Edge) and it works in reverse: play anything and the notes
are analyzed back into a chord name and lit on the piano keyboard.

### Keyboard shortcuts

| Keys | Action |
|---|---|
| `1`–`7` | Root note C D E F G A B (sharps by click) |
| `←` / `→` | Previous / next chord type |
| `↑` / `↓` | Previous / next category |

## Development

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command | Description |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Run Vitest tests (music-theory logic) |
| `npm run build` | Type-check + production build |
| `npm run lint` | oxlint |
| `npm run extract-voicings` | Regenerate voicing data from chords-db (see below) |

## Tech

- **Vite + React 19 + TypeScript + Tailwind CSS v4**
- **[tonal](https://github.com/tonaljs/tonal)** — chord-tone and pitch computation
- **[VexFlow](https://github.com/0xfe/vexflow)** — grand staff notation (lazy-loaded)
- **[@tombatossals/chords-db](https://github.com/tombatossals/chords-db)** — voicing data source
  (devDependency only: `scripts/extract-voicings.mjs` extracts a 12-key × 34-chord subset into
  `src/data/voicings.json`; the runtime bundle only consumes this generated JSON. Two catalog chords,
  `m13` and `13♯11`, have no chords-db data and simply render no diagrams.)
- Fretboard, chord diagrams and piano keyboard are hand-rolled SVG; notes and strums are synthesized
  with Web Audio `OscillatorNode`

## Structure

```
src/
  lib/         Pure logic (unit-tested): chords / chordCatalog / chordDetect /
               fretboard / voicings / staff / player / audio
  hooks/       useChordCatalog, useArrowCycle, useRootShortcut, useMidiInput
  components/  Pure display components: GuitarSection, PianoSection, Fretboard,
               ChordDiagram, VoicingsPanel, Staff, MidiKeyboard, selectors
  data/        Generated voicing data (produced by extract-voicings)
  App.tsx      The single page: shared selection (key + chord) and keyboard shortcuts
docs/superpowers/  Design specs and implementation plans
```

Music-theory logic in `src/lib/` is covered by Vitest, including exhaustive matrix tests across all
12 keys. SVG rendering, audio and Web MIDI are verified manually in the browser.

Deployed to GitHub Pages automatically on every push to `main` (`.github/workflows/deploy.yml`).
