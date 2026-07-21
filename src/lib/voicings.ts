import voicingsData from "../data/voicings.json";
import type { Key } from "./chords";

export interface Voicing {
  frets: number[]; // 6 元素，低音 E → 高音 E；-1 悶音、0 空弦、其餘相對 baseFret
  fingers: number[]; // 6 元素，0 = 不標編號
  baseFret: number; // 1 = 開放把位
  barres: number[]; // 封閉的（相對）格數
  capo?: boolean;
  midi: number[]; // 發聲弦 MIDI 音高，由低到高
}

const data = voicingsData as Record<string, Record<string, Voicing[]>>;

// symbol 為 catalog 的和弦符號（例如 "6/9"、"m7"）。無吉他指法的和弦（m13、13#11）回傳 []。
export function getVoicings(key: Key, symbol: string): Voicing[] {
  return data[key]?.[symbol] ?? [];
}
