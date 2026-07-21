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
// 我們的 catalog symbol → chords-db 吉他 suffix。只列有吉他指法的（guitar-supported）。
// 等音對應：7#5/9#5 與 aug7/aug9 同音，共用其指法。catalog 的 m13、13#11 無 chords-db
// 資料，不列於此（getVoicings 會回傳 []，VoicingsPanel 自動隱藏）。
// 若新增 key 或和弦，更新此表並重跑 npm run extract-voicings；voicings.test.ts 會抓漂移。
const SYMBOL_TO_SUFFIX = {
  major: "major",
  "6": "6",
  "6/9": "69",
  maj7: "maj7",
  maj9: "maj9",
  maj13: "maj13",
  add9: "add9",
  sus2: "sus2",
  sus4: "sus4",
  minor: "minor",
  m6: "m6",
  m7: "m7",
  m9: "m9",
  m11: "m11",
  mMaj7: "mmaj7",
  madd9: "madd9",
  m69: "m69",
  "7": "7",
  "9": "9",
  "11": "11",
  "13": "13",
  "7sus4": "7sus4",
  dim: "dim",
  dim7: "dim7",
  m7b5: "m7b5",
  aug: "aug",
  aug7: "aug7",
  "maj7#5": "maj7#5",
  "7b5": "7b5",
  "7#5": "aug7",
  "7b9": "7b9",
  "7#9": "7#9",
  "9#5": "aug9",
  alt7: "alt",
};

const out = {};
const problems = [];
for (const [ourKey, dbKey] of Object.entries(KEY_MAP)) {
  const entries = new Map(guitar.chords[dbKey].map((c) => [c.suffix, c]));
  out[ourKey] = {};
  for (const [symbol, suffix] of Object.entries(SYMBOL_TO_SUFFIX)) {
    const positions = entries.get(suffix)?.positions ?? [];
    if (positions.length === 0) {
      problems.push(`${ourKey} ${symbol} (db:${suffix}): no positions`);
      continue;
    }
    out[ourKey][symbol] = positions.map((p) => ({
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
