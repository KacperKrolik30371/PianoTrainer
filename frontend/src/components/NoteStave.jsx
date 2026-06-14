import { useEffect, useRef } from "react";
import { Formatter, Renderer, Stave, StaveNote } from "vexflow";

function NoteStave({ note }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !note) {
      return;
    }

    container.innerHTML = "";

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(650, 220);

    const context = renderer.getContext();
    context.setFillStyle("black");
    context.setStrokeStyle("black");

    const stave = new Stave(40, 50, 550);
    stave.addClef(note.clef);
    stave.setContext(context).draw();

    const notes = [
      new StaveNote({
        clef: note.clef,
        keys: [note.key],
        duration: "w",
      }),
    ];

    Formatter.FormatAndDraw(context, stave, notes);
  }, [note]);

  return <div ref={containerRef} className="note-stage" />;
}

export default NoteStave;
