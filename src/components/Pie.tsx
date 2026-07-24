/**
 * BPM 儀表弧線。value 0~1 對應 45°~315° 的掃描範圍。
 */
export function Pie({ value = 0 }: { value: number }) {
  const v = Math.max(0, Math.min(1, value));
  const size = 100;
  const stroke = 8;
  const r = size / 2 - stroke / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 45 + 180;
  const endAngle = startAngle + 270;
  const angle = startAngle + (endAngle - startAngle) * v;
  const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startAngle));
  const y1 = cy + r * Math.sin(rad(startAngle));
  const x2 = cx + r * Math.cos(rad(angle));
  const y2 = cy + r * Math.sin(rad(angle));
  const bgX2 = cx + r * Math.cos(rad(endAngle));
  const bgY2 = cy + r * Math.sin(rad(endAngle));
  const largeArcFlag = angle - startAngle > 180 ? 1 : 0;
  const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${bgX2} ${bgY2}`}
        fill="none"
        stroke="var(--line)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {v > 0 && (
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth={stroke} strokeLinecap="round" />
      )}
    </svg>
  );
}
