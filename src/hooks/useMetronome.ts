import { useEffect, useRef } from "react";
import { getAudioTime, playClick } from "../lib/audio";

interface UseMetronomeOptions {
  isPlaying: boolean;
  bpm: number;
  beats: number;
  muted: boolean;
  onBeat: (beat: number) => void;
}

export function useMetronome({ isPlaying, bpm, beats, muted, onBeat }: UseMetronomeOptions): void {
  // bpm / muted / onBeat 用 ref 讀取，變動時不重啟排程迴圈；拍號改變則刻意重啟並回到重拍。
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const onBeatRef = useRef(onBeat);
  onBeatRef.current = onBeat;

  useEffect(() => {
    if (!isPlaying) {
      onBeatRef.current(0);
      return;
    }
    let rafId: number | null = null;
    let nextNoteTime = getAudioTime();
    let beat = 0;

    const scheduler = (): void => {
      const now = getAudioTime();
      const interval = 60 / bpmRef.current;
      // 分頁切到背景時 rAF 會暫停；回到前景避免一次補發上百拍的爆音，落後太多就直接跳到現在。
      if (now - nextNoteTime > interval * 2) {
        nextNoteTime = now;
      }
      while (now >= nextNoteTime) {
        if (!mutedRef.current) playClick(beat === 0);
        onBeatRef.current(beat);
        beat = (beat + 1) % beats;
        nextNoteTime += interval;
      }
      rafId = requestAnimationFrame(scheduler);
    };
    rafId = requestAnimationFrame(scheduler);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [beats, isPlaying]);
}
