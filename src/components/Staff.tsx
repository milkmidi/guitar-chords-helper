import { useEffect, useRef } from "react";
import {
  Accidental,
  Formatter,
  Renderer,
  Stave,
  StaveConnector,
  StaveNote,
  Voice,
} from "vexflow";
import { isTrebleClef, parseSpelledNote } from "../lib/staff";

export interface StaffNote {
  midi: number;
  name: string; // 帶拼音的音名，例如 "E♭4"
}

interface Props {
  notes: StaffNote[];
}

const WIDTH = 360;
const HEIGHT = 250;

export default function Staff({ notes }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = ""; // 每次重畫前清掉上次的 SVG

    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(WIDTH, HEIGHT);
    const ctx = renderer.getContext();

    const staveX = 16;
    const staveW = WIDTH - staveX - 16;
    const treble = new Stave(staveX, 16, staveW).addClef("treble");
    const bass = new Stave(staveX, 122, staveW).addClef("bass");
    treble.setContext(ctx).draw();
    bass.setContext(ctx).draw();

    // 大譜表：左側花括號 + 左右直線把兩譜連起來
    new StaveConnector(treble, bass).setType("brace").setContext(ctx).draw();
    new StaveConnector(treble, bass).setType("singleLeft").setContext(ctx).draw();
    new StaveConnector(treble, bass).setType("singleRight").setContext(ctx).draw();

    const buildVoice = (clef: "treble" | "bass") => {
      const staffNotes = notes
        .filter((n) => (clef === "treble" ? isTrebleClef(n.midi) : !isTrebleClef(n.midi)))
        .sort((a, b) => a.midi - b.midi);

      let note: StaveNote;
      if (staffNotes.length === 0) {
        // 空譜畫全休止符（放在譜中間）
        note = new StaveNote({ keys: [clef === "treble" ? "b/4" : "d/3"], duration: "wr", clef });
      } else {
        const parsed = staffNotes.map((n) => parseSpelledNote(n.name));
        note = new StaveNote({ keys: parsed.map((p) => p.key), duration: "w", clef });
        parsed.forEach((p, i) => {
          if (p.accidental) note.addModifier(new Accidental(p.accidental), i);
        });
      }

      const voice = new Voice({ numBeats: 4, beatValue: 4 });
      voice.addTickable(note);
      return voice;
    };

    const trebleVoice = buildVoice("treble");
    const bassVoice = buildVoice("bass");
    new Formatter()
      .joinVoices([trebleVoice])
      .joinVoices([bassVoice])
      .format([trebleVoice, bassVoice], staveW - 48);
    trebleVoice.draw(ctx, treble);
    bassVoice.draw(ctx, bass);
  }, [notes]);

  return (
    <div className="staff-wrap">
      <div className="staff" ref={ref} aria-hidden="true" />
    </div>
  );
}
