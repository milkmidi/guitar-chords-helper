// 和弦偵測純邏輯：輸入一組 MIDI 音高，辨識和弦名稱、組成音拼寫與等音別名。
// 由 midi-chord-detector 原型移植，維持其升降記法與延伸和弦模板。

// ---------- 字母與拼寫 ----------
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
// 各 pitch-class 的根音拼寫
const ROOT_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const ROOT_LETTER_IDX = ROOT_NAMES.map((n) => (LETTERS as readonly string[]).indexOf(n[0]));
// 未知和弦 / 單音的簡易拼寫
const DISP = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

function accStr(d: number): string {
  if (d === 0) return "";
  if (d === 1) return "♯";
  if (d === -1) return "♭";
  if (d === 2) return "♯♯";
  if (d === -2) return "♭♭";
  return d > 0 ? "♯".repeat(d) : "♭".repeat(-d);
}

function octaveOf(m: number): number {
  return Math.floor(m / 12) - 1;
}

function pcName(pc: number): string {
  return DISP[(((pc % 12) + 12) % 12)];
}

interface SpelledTone {
  letter: string;
  name: string;
  pc: number;
}

// 依 根音pc / 根音字母索引 / 相對半音 / 字母級數位移 拼出一個和弦音
function spellTone(rootPc: number, rootLi: number, semi: number, degOff: number): SpelledTone {
  const li = (rootLi + degOff) % 7;
  const naturalPc = LETTER_PC[li];
  const actualPc = (rootPc + semi) % 12;
  const d = (((actualPc - naturalPc + 6) % 12) - 6); // -6..5，真實和弦落在 -2..2
  return { letter: LETTERS[li], name: LETTERS[li] + accStr(d), pc: actualPc };
}

// ---------- 和弦模板：[半音, 字母級數位移] ----------
interface Template {
  sym: string;
  full: string;
  t: [number, number][];
  set: number[]; // 正規化 pitch-class 集合，供比對
}

const RAW_TEMPLATES: Omit<Template, "set">[] = [
  { sym: "", full: "major", t: [[0, 0], [4, 2], [7, 4]] },
  { sym: "m", full: "minor", t: [[0, 0], [3, 2], [7, 4]] },
  { sym: "°", full: "diminished", t: [[0, 0], [3, 2], [6, 4]] },
  { sym: "+", full: "augmented", t: [[0, 0], [4, 2], [8, 4]] },
  { sym: "sus2", full: "suspended 2nd", t: [[0, 0], [2, 1], [7, 4]] },
  { sym: "sus4", full: "suspended 4th", t: [[0, 0], [5, 3], [7, 4]] },
  { sym: "maj7", full: "major 7th", t: [[0, 0], [4, 2], [7, 4], [11, 6]] },
  { sym: "7", full: "dominant 7th", t: [[0, 0], [4, 2], [7, 4], [10, 6]] },
  { sym: "m7", full: "minor 7th", t: [[0, 0], [3, 2], [7, 4], [10, 6]] },
  { sym: "°7", full: "diminished 7th", t: [[0, 0], [3, 2], [6, 4], [9, 6]] },
  { sym: "ø7", full: "half-diminished (m7♭5)", t: [[0, 0], [3, 2], [6, 4], [10, 6]] },
  { sym: "mMaj7", full: "minor–major 7th", t: [[0, 0], [3, 2], [7, 4], [11, 6]] },
  { sym: "+7", full: "augmented 7th", t: [[0, 0], [4, 2], [8, 4], [10, 6]] },
  { sym: "6", full: "major 6th", t: [[0, 0], [4, 2], [7, 4], [9, 5]] },
  { sym: "m6", full: "minor 6th", t: [[0, 0], [3, 2], [7, 4], [9, 5]] },
  { sym: "add9", full: "add 9", t: [[0, 0], [4, 2], [7, 4], [2, 1]] },
  { sym: "madd9", full: "minor add 9", t: [[0, 0], [3, 2], [7, 4], [2, 1]] },
  { sym: "5", full: "power chord", t: [[0, 0], [7, 4]] },

  // ---- 延伸：9th ----
  { sym: "9", full: "dominant 9th", t: [[0, 0], [4, 2], [7, 4], [10, 6], [2, 1]] },
  { sym: "9", full: "dominant 9th · omit 5", t: [[0, 0], [4, 2], [10, 6], [2, 1]] },
  { sym: "maj9", full: "major 9th", t: [[0, 0], [4, 2], [7, 4], [11, 6], [2, 1]] },
  { sym: "maj9", full: "major 9th · omit 5", t: [[0, 0], [4, 2], [11, 6], [2, 1]] },
  { sym: "m9", full: "minor 9th", t: [[0, 0], [3, 2], [7, 4], [10, 6], [2, 1]] },
  { sym: "m9", full: "minor 9th · omit 5", t: [[0, 0], [3, 2], [10, 6], [2, 1]] },
  { sym: "6/9", full: "six-nine", t: [[0, 0], [4, 2], [7, 4], [9, 5], [2, 1]] },
  { sym: "m6/9", full: "minor six-nine", t: [[0, 0], [3, 2], [7, 4], [9, 5], [2, 1]] },

  // ---- 延伸：11th ----
  { sym: "11", full: "dominant 11th", t: [[0, 0], [4, 2], [7, 4], [10, 6], [2, 1], [5, 3]] },
  { sym: "11", full: "dominant 11th · omit 3", t: [[0, 0], [7, 4], [10, 6], [2, 1], [5, 3]] },
  { sym: "maj11", full: "major 11th", t: [[0, 0], [4, 2], [7, 4], [11, 6], [2, 1], [5, 3]] },
  { sym: "m11", full: "minor 11th", t: [[0, 0], [3, 2], [7, 4], [10, 6], [2, 1], [5, 3]] },

  // ---- 延伸：13th（省略 11 的常見握法）----
  { sym: "13", full: "dominant 13th · omit 11", t: [[0, 0], [4, 2], [7, 4], [10, 6], [2, 1], [9, 5]] },
  { sym: "13", full: "dominant 13th · omit 5,11", t: [[0, 0], [4, 2], [10, 6], [2, 1], [9, 5]] },
  { sym: "maj13", full: "major 13th · omit 11", t: [[0, 0], [4, 2], [7, 4], [11, 6], [2, 1], [9, 5]] },
  { sym: "m13", full: "minor 13th · omit 11", t: [[0, 0], [3, 2], [7, 4], [10, 6], [2, 1], [9, 5]] },
];

export const TEMPLATES: Template[] = RAW_TEMPLATES.map((tp) => ({
  ...tp,
  set: [...new Set(tp.t.map(([s]) => (((s % 12) + 12) % 12)))].sort((a, b) => a - b),
}));

const keyOf = (arr: number[]) => arr.join(",");
const TEMPLATE_MAP = new Map(TEMPLATES.map((tp) => [keyOf(tp.set), tp]));

// ---------- 分析結果 ----------
export interface AltName {
  label: string;
  primary: boolean;
}

export interface DetectionResult {
  name: string;
  full: string;
  chips: string[];
  slash: string | null;
  matches: AltName[];
  single?: boolean;
  unknown?: boolean;
}

export function analyze(midiNotes: number[]): DetectionResult | null {
  if (midiNotes.length === 0) return null;
  const sorted = [...midiNotes].sort((a, b) => a - b);
  const bassPc = sorted[0] % 12;
  const pcs = [...new Set(sorted.map((n) => n % 12))].sort((a, b) => a - b);

  if (pcs.length === 1) {
    return {
      single: true,
      name: pcName(pcs[0]),
      full: "single note",
      chips: sorted.map((m) => pcName(m % 12) + octaveOf(m)),
      slash: null,
      matches: [],
    };
  }

  // 收集所有能構成已知和弦的根音
  const matches: { root: number; tp: Template; isBass: boolean }[] = [];
  for (const root of pcs) {
    const rel = pcs.map((pc) => (pc - root + 12) % 12).sort((a, b) => a - b);
    const tp = TEMPLATE_MAP.get(keyOf(rel));
    if (tp) matches.push({ root, tp, isBass: root === bassPc });
  }

  if (matches.length === 0) {
    return {
      unknown: true,
      name: "?",
      full: pcs.length + " notes",
      chips: sorted.map((m) => pcName(m % 12) + octaveOf(m)),
      slash: null,
      matches: [],
    };
  }

  // 主要判讀：優先以低音為根音，其次挑組成音較豐富的和弦
  let primary = matches[0];
  for (const c of matches) {
    if (c.isBass && !primary.isBass) primary = c;
    else if (c.isBass === primary.isBass && c.tp.set.length > primary.tp.set.length) primary = c;
  }

  // 依主要和弦拼寫各音名
  const rootLi = ROOT_LETTER_IDX[primary.root];
  const pcToName: Record<number, string> = {};
  primary.tp.t.forEach(([semi, deg]) => {
    const s = spellTone(primary.root, rootLi, semi, deg);
    pcToName[s.pc] = s.name;
  });
  const chips = sorted.map((m) => {
    const pc = m % 12;
    return (pcToName[pc] || pcName(pc)) + octaveOf(m);
  });

  const primaryName = ROOT_NAMES[primary.root] + primary.tp.sym;
  const slash = primary.root !== bassPc ? ROOT_NAMES[bassPc] : null;

  const altNames: AltName[] = matches.map((c) => ({
    label: ROOT_NAMES[c.root] + c.tp.sym,
    primary: c === primary,
  }));

  return {
    name: primaryName,
    full: ROOT_NAMES[primary.root] + " " + primary.tp.full,
    chips,
    slash,
    matches: altNames,
  };
}
