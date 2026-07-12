import { Note } from "tonal";

let ctx: AudioContext | null = null;

export function playNote(note: string, duration = 0.8): void {
  const freq = Note.freq(note);
  if (freq == null) return;

  // AudioContext 需要使用者手勢才能啟動，所以在第一次點擊時才建立
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}
