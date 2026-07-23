import { useCallback, useRef, useState } from "react";

// Web MIDI 有副作用、無法在 Vitest/node 下執行（同 audio.ts），僅在瀏覽器手動驗證。
// Web MIDI 型別未包含在標準 DOM lib 中，這裡宣告最小介面。
interface MidiMessage {
  data: Uint8Array;
}
interface MidiInput {
  name: string | null;
  onmidimessage: ((e: MidiMessage) => void) | null;
}
interface MidiAccess {
  inputs: { forEach: (cb: (input: MidiInput) => void) => void };
  onstatechange: (() => void) | null;
}
interface MidiNavigator {
  requestMIDIAccess?: (options?: { sysex?: boolean }) => Promise<MidiAccess>;
}

export type LampState = "off" | "on" | "err";

export interface MidiInputState {
  supported: boolean; // 瀏覽器有沒有 Web MIDI；沒有的話 UI 整組不顯示
  litMidis: number[]; // 目前被按住的 MIDI 音高，已排序
  lampState: LampState;
  statusText: string;
  deviceName: string;
  started: boolean;
  start: () => Promise<void>;
}

// iOS 上所有瀏覽器都是 WebKit，一律沒有 Web MIDI；桌機也只有 Chrome / Edge 有。
const SUPPORTED = typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;

export function useMidiInput(): MidiInputState {
  const [litMidis, setLitMidis] = useState<number[]>([]);
  const [lampState, setLampState] = useState<LampState>("off");
  const [statusText, setStatusText] = useState("尚未連線");
  const [deviceName, setDeviceName] = useState("—");
  const [started, setStarted] = useState(false);
  const pressedRef = useRef<Set<number>>(new Set());

  const syncPressed = useCallback(() => {
    setLitMidis([...pressedRef.current].sort((a, b) => a - b));
  }, []);

  const onMIDIMessage = useCallback(
    (e: MidiMessage) => {
      const [status, data1, data2] = e.data;
      const cmd = status & 0xf0;
      if (cmd === 0x90 && data2 > 0) pressedRef.current.add(data1);
      else if (cmd === 0x80 || (cmd === 0x90 && data2 === 0)) pressedRef.current.delete(data1);
      else return;
      syncPressed();
    },
    [syncPressed],
  );

  const start = useCallback(async () => {
    const nav = navigator as MidiNavigator;
    if (!nav.requestMIDIAccess) {
      setLampState("err");
      setStatusText("此瀏覽器不支援 Web MIDI");
      return;
    }
    try {
      const access = await nav.requestMIDIAccess({ sysex: false });
      setLampState("on");
      setStatusText("已連線");
      setStarted(true);
      const attach = () => {
        const names: string[] = [];
        access.inputs.forEach((inp) => {
          inp.onmidimessage = onMIDIMessage;
          if (inp.name) names.push(inp.name);
        });
        setDeviceName(names.length ? names.join(", ") : "（未偵測到輸入裝置）");
        if (!names.length) setStatusText("已授權，等待裝置");
      };
      attach();
      access.onstatechange = attach;
    } catch (err) {
      setLampState("err");
      setStatusText("權限被拒 / 無法存取");
      console.error(err);
    }
  }, [onMIDIMessage]);

  return { supported: SUPPORTED, litMidis, lampState, statusText, deviceName, started, start };
}
