import type { DetectionResult } from "../lib/chordDetect";

// 和弦讀出面板：顯示和弦名稱、全名、組成音，以及等音別名（同音不同根音的命名）。
// 純渲染，由 analyze() 的結果驅動。當 result 為 null 時顯示提示訊息。

interface Props {
  result: DetectionResult | null;
  placeholder: string; // 尚未偵測到和弦時的副標提示
}

export default function ChordReadout({ result, placeholder }: Props) {
  if (!result) {
    return (
      <section className="readout" aria-label="和弦讀出">
        <div className="chord-name is-dim">—</div>
        <div className="chord-full">{placeholder}</div>
      </section>
    );
  }

  const showAlts = result.matches.length > 1;

  return (
    <section className="readout" aria-label="和弦讀出">
      <div className="chord-name">{result.name + (result.slash ? "/" + result.slash : "")}</div>
      <div className="chord-full">
        {result.full + (result.slash ? "  ·  bass " + result.slash : "")}
      </div>
      <div className="notes-row">
        {result.chips.map((n, i) => (
          <span key={`${n}-${i}`} className="note-chip">
            {n}
          </span>
        ))}
      </div>
      {showAlts && (
        <div className="alts show">
          <span className="alts-caption">等音和弦 · SAME NOTES, OTHER ROOTS</span>
          <div className="alt-chips">
            {result.matches.map((a, i) => (
              <span key={`${a.label}-${i}`} className={`alt-chip${a.primary ? " primary" : ""}`}>
                {a.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
