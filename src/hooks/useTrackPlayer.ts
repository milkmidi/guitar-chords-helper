import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioTime, playStrum } from "../lib/audio";
import { measureDuration, nextMeasureIndex, type Track } from "../lib/player";

// setTimeout 鏈 + AudioContext 時鐘校正：
// 每小節的開始時間為絕對 audio 時間，delay = 目標時間 - 當前 audio 時間，
// 所以誤差不會逐小節累積。track / bpm 走 ref，播放中變更下一小節生效。
export function useTrackPlayer(track: Track, bpm: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMeasure, setCurrentMeasure] = useState<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const trackRef = useRef(track);
  const bpmRef = useRef(bpm);
  trackRef.current = track;
  bpmRef.current = bpm;

  const stop = useCallback(() => {
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setIsPlaying(false);
    setCurrentMeasure(null);
  }, []);

  const play = useCallback(() => {
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    setIsPlaying(true);

    const playMeasure = (index: number, startAt: number) => {
      setCurrentMeasure(index);
      const cell = trackRef.current[index];
      if (cell) playStrum(cell.voicing.midi);
      const nextAt = startAt + measureDuration(bpmRef.current);
      const delayMs = Math.max(0, (nextAt - getAudioTime()) * 1000);
      timeoutRef.current = window.setTimeout(() => {
        playMeasure(nextMeasureIndex(index, trackRef.current.length), nextAt);
      }, delayMs);
    };

    playMeasure(0, getAudioTime());
  }, []);

  // 卸載時清掉排程
  useEffect(() => stop, [stop]);

  return { isPlaying, currentMeasure, play, stop };
}
