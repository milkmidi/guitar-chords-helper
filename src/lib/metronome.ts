export const BPM_MIN = 30;
export const BPM_MAX = 300;

const RADIANS_TO_DEGREES = 180 / Math.PI;

// 儀表掃描角度：45° = 最慢，315° = 最快
const DIAL_START_ANGLE = 45;
const DIAL_END_ANGLE = 315;

export function clampBpm(bpm: number): number {
  return Math.max(BPM_MIN, Math.min(BPM_MAX, bpm));
}

/** 指標相對於儀表中心的角度（度）。正右方為 270°、正下方為 0/360°、正左方為 90°、正上方為 180°。 */
export function getDegree(clientX: number, clientY: number, centerX: number, centerY: number): number {
  const x = clientX - centerX;
  const y = clientY - centerY;
  if (x === 0 && y === 0) return 0;
  let degree = Math.atan(y / x) * RADIANS_TO_DEGREES;
  if (x < 0) {
    degree += 90;
  } else {
    degree += 270;
  }
  return degree;
}

/** 將儀表角度（度）對應成 30–300 BPM。 */
export function bpmFromAngle(angle: number): number {
  const clamped = Math.max(DIAL_START_ANGLE, Math.min(DIAL_END_ANGLE, angle));
  const t = (clamped - DIAL_START_ANGLE) / (DIAL_END_ANGLE - DIAL_START_ANGLE);
  return Math.round(BPM_MIN + t * (BPM_MAX - BPM_MIN));
}

/**
 * 由點擊時間戳（毫秒）平均出 BPM；不足 2 下或結果超出 30–300 時回傳 null。
 */
export function bpmFromTaps(taps: number[]): number | null {
  if (taps.length < 2) return null;
  const intervals: number[] = [];
  for (let i = 1; i < taps.length; i++) {
    intervals.push(taps[i] - taps[i - 1]);
  }
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = Math.round(60000 / avg);
  if (bpm < BPM_MIN || bpm > BPM_MAX) return null;
  return bpm;
}
