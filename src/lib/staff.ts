// 五線譜純邏輯：把帶拼音的音名（如 "E♭4"、"F♯4"、"B♭♭4"）轉成 VexFlow 的 key
// 與臨時記號，並依中央 C 決定高音／低音譜。SVG 由 VexFlow 畫，不在此測試。

export interface ParsedNote {
  key: string; // VexFlow 音高鍵，例如 "eb/4"、"f#/4"、"bbb/4"、"c/4"
  accidental: string | null; // 臨時記號代碼："#"、"##"、"b"、"bb"，自然音為 null
}

// 解析音名為 VexFlow key 與臨時記號。名稱格式：字母 + 任意個 ♯/♭ + 八度數字。
export function parseSpelledNote(name: string): ParsedNote {
  const letter = name[0].toLowerCase();
  let i = 1;
  let sharps = 0;
  let flats = 0;
  while (i < name.length && (name[i] === "♯" || name[i] === "♭")) {
    if (name[i] === "♯") sharps++;
    else flats++;
    i++;
  }
  const octave = name.slice(i);
  const accidental = sharps > 0 ? "#".repeat(sharps) : flats > 0 ? "b".repeat(flats) : null;
  return { key: letter + (accidental ?? "") + "/" + octave, accidental };
}

// 中央 C（MIDI 60）以上放高音譜，以下放低音譜。
export function isTrebleClef(midi: number): boolean {
  return midi >= 60;
}
