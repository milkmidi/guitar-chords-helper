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
writeFileSync(new URL("../src/data/voicings.json", import.meta.url), `${JSON.stringify(out)}\n`);
console.log("wrote src/data/voicings.json");
