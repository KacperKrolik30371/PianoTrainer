const NOTE_NAMES = {
  0: "c",
  2: "d",
  4: "e",
  5: "f",
  7: "g",
  9: "a",
  11: "b",
};

export function midiToNoteKey(midi) {
  const name = NOTE_NAMES[midi % 12];

  if (!name) {
    return null;
  }

  return `${name}/${Math.floor(midi / 12) - 1}`;
}

export function buildWhiteNotes(startMidi, endMidi, clef) {
  const notes = [];

  for (let midi = startMidi; midi <= endMidi; midi += 1) {
    const key = midiToNoteKey(midi);

    if (key) {
      notes.push({ key, midi, clef });
    }
  }

  return notes;
}

export function buildMidiNoteMap(levels) {
  return new Map(
    levels.flatMap((level) => level.notes.map((note) => [note.midi, note])),
  );
}

export function getNextChallenge(level, previousChallenge) {
  const pool = level.notes.filter(
    (note) =>
      !previousChallenge ||
      note.key !== previousChallenge.key ||
      note.clef !== previousChallenge.clef,
  );

  const availableNotes = pool.length > 0 ? pool : level.notes;

  return availableNotes[Math.floor(Math.random() * availableNotes.length)];
}
