import type { Voicing } from "./voicings";

// 音軌小節：null = 空小節，播放時休止
export interface TrackCell {
  chordName: string; // 顯示用，例如 "C Major"
  voicing: Voicing; // 快照，midi[] 供 playStrum
}

export type Track = (TrackCell | null)[];

export const MEASURE_COUNT = 4;

// 4/4 拍：一小節 = 4 拍，每拍 60/bpm 秒
export function measureDuration(bpm: number): number {
  return (60 / bpm) * 4;
}

export function nextMeasureIndex(current: number, length: number): number {
  return (current + 1) % length;
}
