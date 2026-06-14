const WHITE_PITCHES = [0, 2, 4, 5, 7, 9, 11];
const BLACK_PITCHES = [
  { pitch: 1, slot: 1 },
  { pitch: 3, slot: 2 },
  { pitch: 6, slot: 4 },
  { pitch: 8, slot: 5 },
  { pitch: 10, slot: 6 },
];
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteName(midi) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function keyClass(midi, targetMidi, pressedMidi, color) {
  return [
    `piano-key ${color}`,
    midi === targetMidi ? "target" : "",
    midi === pressedMidi && midi !== targetMidi ? "pressed" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function PracticeKeyboard({ notes, targetMidi, pressedMidi, onPlay }) {
  const noteMidis = notes.map((note) => note.midi);
  const startMidi = Math.min(...noteMidis) - (Math.min(...noteMidis) % 12);
  const maxMidi = Math.max(...noteMidis);
  const endMidi = maxMidi + (11 - (maxMidi % 12));
  const octaves = [];

  for (let midi = startMidi; midi <= endMidi; midi += 12) {
    octaves.push(midi);
  }

  return (
    <div className="practice-keyboard">
      <div className="keyboard-target">
        <span>Podświetlony klawisz</span>
        <strong>{targetMidi ? noteName(targetMidi) : "-"}</strong>
      </div>

      <div className="keyboard-scroll">
        <div className="keyboard-row">
          {octaves.map((octaveStart) => (
            <div className="keyboard-octave" key={octaveStart}>
              {WHITE_PITCHES.map((pitch) => {
                const midi = octaveStart + pitch;

                return (
                  <button
                    aria-label={noteName(midi)}
                    className={keyClass(midi, targetMidi, pressedMidi, "white")}
                    key={midi}
                    onClick={() => onPlay(midi)}
                    type="button"
                  >
                    <span>{noteName(midi)}</span>
                  </button>
                );
              })}

              {BLACK_PITCHES.map(({ pitch, slot }) => {
                const midi = octaveStart + pitch;

                return (
                  <button
                    aria-label={noteName(midi)}
                    className={keyClass(midi, targetMidi, pressedMidi, "black")}
                    key={midi}
                    onClick={() => onPlay(midi)}
                    style={{ "--slot": slot }}
                    type="button"
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PracticeKeyboard;
