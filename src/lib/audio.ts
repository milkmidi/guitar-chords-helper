import { Note } from "tonal";

let ctx: AudioContext | null = null;

// AudioContext 需要使用者手勢才能啟動，所以在第一次點擊時才建立
function ensureContext(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

function playFreq(
  audio: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  peak: number,
): void {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(peak, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(startAt);
  osc.stop(startAt + duration);
}

export function playNote(note: string, duration = 0.8): void {
  const freq = Note.freq(note);
  if (freq == null) return;
  const audio = ensureContext();
  playFreq(audio, freq, audio.currentTime, duration, 0.25);
}

// 音軌排程以 audio 時鐘為基準，避免 setTimeout 累積漂移
export function getAudioTime(): number {
  return ensureContext().currentTime;
}

const STRUM_DELAY = 0.06;

export function playStrum(midi: number[], duration = 1.2): void {
  const audio = ensureContext();
  const start = audio.currentTime;
  midi.forEach((m, i) => {
    const freq = Note.freq(Note.fromMidi(m));
    if (freq == null) return;
    // 同時發聲的弦多，單音音量調低避免削波
    playFreq(audio, freq, start + i * STRUM_DELAY, duration, 0.15);
  });
}
