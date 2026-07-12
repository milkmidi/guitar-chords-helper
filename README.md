# Guitar Chords Helper

**Live demo: https://milkmidi.github.io/guitar-chords-helper/**

A web app for learning guitar chords: pick a key (C–B) and a chord type (major, minor, 7, maj7, m7, sus2, sus4, dim, aug) to see —

- **A horizontal fretboard** (6 strings × 12 frets + open strings) highlighting **every position of the chord tones**: root in orange, other chord tones in blue, with note names inside the dots (enharmonics follow the chord's spelling — Cm shows Eb, not D#)
- **The chord-tone list**, e.g. `C Major = C - E - G`
- **Voicing diagrams**: the chord's common fingerings (v1–vN) as vertical chord charts, with position labels (3fr, 5fr…), barres, finger numbers, and muted/open string markers

All sound is synthesized with the Web Audio API — no audio files:

- Click a note on the fretboard → plays the actual pitch of that string/fret
- Click a voicing diagram → strums the whole chord from low to high

## Development

```bash
npm install
npm run dev        # http://localhost:5173/guitar-chords-helper/
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
- **[@tombatossals/chords-db](https://github.com/tombatossals/chords-db)** — voicing data source (devDependency only: `scripts/extract-voicings.mjs` extracts the 12-key × 9-type subset into `src/data/voicings.json`; the runtime bundle only consumes this generated JSON)
- Fretboard and chord diagrams are hand-rolled SVG; strumming is synthesized with Web Audio `OscillatorNode`

## Structure

```
src/
  lib/         Pure logic (unit-tested): chords / fretboard / voicings / audio
  components/  Pure display components: Fretboard, ChordDiagram, VoicingsPanel, selectors
  data/        Generated voicing data (produced by extract-voicings)
  App.tsx      The only state (selectedKey + chordType)
docs/superpowers/  Design specs and implementation plans
```

Deployed to GitHub Pages automatically on every push to `main` (`.github/workflows/deploy.yml`).
