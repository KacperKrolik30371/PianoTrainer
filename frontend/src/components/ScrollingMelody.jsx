import { useCallback, useEffect, useRef } from "react";
import { Formatter, Renderer, Stave, StaveNote } from "vexflow";

const SCORE_WIDTH = 1100;
const FALLBACK_SPEED = 150;
const NOTE_SCALE = 1.18;

function ScrollingMelody({ song, time }) {
  const ref = useRef(null);
  const timeRef = useRef(time);
  const layoutRef = useRef({
    firstX: 120,
    firstTime: song.notes[0].time,
    speed: FALLBACK_SPEED,
  });

  const moveScore = useCallback((currentTime) => {
    const container = ref.current;
    const layout = layoutRef.current;

    if (!container) {
      return;
    }

    const offset =
      -layout.firstX * NOTE_SCALE +
      (layout.firstTime - currentTime) * layout.speed * NOTE_SCALE;

    container.style.transform = `translateX(${offset}px)`;
  }, []);

  useEffect(() => {
    const container = ref.current;

    if (!container) {
      return;
    }

    container.innerHTML = "";

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(SCORE_WIDTH, 190);

    const context = renderer.getContext();
    const stave = new Stave(10, 58, SCORE_WIDTH - 30);
    const staveNotes = song.notes.map(
      (note) =>
        new StaveNote({
          clef: "treble",
          keys: [note.key],
          duration: "q",
        }),
    );

    stave.addClef("treble").setContext(context).draw();
    Formatter.FormatAndDraw(context, stave, staveNotes);

    const firstNote = staveNotes[0];
    const lastNote = staveNotes[staveNotes.length - 1];
    const firstTime = song.notes[0].time;
    const lastTime = song.notes[song.notes.length - 1].time;
    const firstX = firstNote.getAbsoluteX();
    const lastX = lastNote.getAbsoluteX();

    layoutRef.current = {
      firstX,
      firstTime,
      speed:
        lastTime === firstTime
          ? FALLBACK_SPEED
          : (lastX - firstX) / (lastTime - firstTime),
    };

    moveScore(timeRef.current);
  }, [moveScore, song]);

  useEffect(() => {
    timeRef.current = time;
    moveScore(time);
  }, [moveScore, time]);

  return <div className="scrolling-score" ref={ref} />;
}

export default ScrollingMelody;
