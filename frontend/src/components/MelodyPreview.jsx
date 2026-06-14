import { useEffect, useRef } from "react";
import { Formatter, Renderer, Stave, StaveNote } from "vexflow";

function MelodyPreview({ notes }) {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;

    if (!container) {
      return;
    }

    container.innerHTML = "";

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(360, 120);

    const context = renderer.getContext();
    const stave = new Stave(10, 20, 330);
    const staveNotes = notes.map(
      (note) =>
        new StaveNote({
          clef: "treble",
          keys: [note.key],
          duration: "q",
        }),
    );

    stave.addClef("treble").setContext(context).draw();
    Formatter.FormatAndDraw(context, stave, staveNotes);
  }, [notes]);

  return <div className="melody-preview" ref={ref} />;
}

export default MelodyPreview;
