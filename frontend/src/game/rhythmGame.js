export const RHYTHM_SONGS = [
  {
    key: "c-to-g-and-back",
    title: "C do G i z powrotem",
    description: "Pierwsza melodia do ćwiczenia równego tempa.",
    bpm: 80,
    notes: [
      { id: 1, label: "C4", key: "c/4", midi: 60, time: 1.2 },
      { id: 2, label: "D4", key: "d/4", midi: 62, time: 2.0 },
      { id: 3, label: "E4", key: "e/4", midi: 64, time: 2.8 },
      { id: 4, label: "F4", key: "f/4", midi: 65, time: 3.6 },
      { id: 5, label: "G4", key: "g/4", midi: 67, time: 4.4 },
      { id: 6, label: "F4", key: "f/4", midi: 65, time: 5.2 },
      { id: 7, label: "E4", key: "e/4", midi: 64, time: 6.0 },
      { id: 8, label: "D4", key: "d/4", midi: 62, time: 6.8 },
      { id: 9, label: "C4", key: "c/4", midi: 60, time: 7.6 },
    ],
  },
  {
    key: "small-jump",
    title: "Mały skok",
    description: "Krótka sekwencja z powrotem do C.",
    bpm: 88,
    notes: [
      { id: 1, label: "C4", key: "c/4", midi: 60, time: 1.0 },
      { id: 2, label: "E4", key: "e/4", midi: 64, time: 1.8 },
      { id: 3, label: "G4", key: "g/4", midi: 67, time: 2.6 },
      { id: 4, label: "E4", key: "e/4", midi: 64, time: 3.4 },
      { id: 5, label: "D4", key: "d/4", midi: 62, time: 4.2 },
      { id: 6, label: "C4", key: "c/4", midi: 60, time: 5.0 },
    ],
  },
  {
    key: "step-up",
    title: "Wejście w górę",
    description: "Równe kroki od C do A.",
    bpm: 92,
    notes: [
      { id: 1, label: "C4", key: "c/4", midi: 60, time: 1.0 },
      { id: 2, label: "D4", key: "d/4", midi: 62, time: 1.7 },
      { id: 3, label: "E4", key: "e/4", midi: 64, time: 2.4 },
      { id: 4, label: "F4", key: "f/4", midi: 65, time: 3.1 },
      { id: 5, label: "G4", key: "g/4", midi: 67, time: 3.8 },
      { id: 6, label: "A4", key: "a/4", midi: 69, time: 4.5 },
    ],
  },
];

export const HIT_WINDOW = 0.28;

export const HIT_GRADES = [
  { name: "Perfect", className: "perfect", maxError: 0.07, points: 100 },
  { name: "Good", className: "good", maxError: 0.14, points: 75 },
  { name: "Ok", className: "ok", maxError: 0.24, points: 45 },
];

export function getHitGrade(error) {
  return (
    HIT_GRADES.find((grade) => error <= grade.maxError) || {
      name: "Miss",
      className: "miss",
      points: 0,
    }
  );
}

export function getRhythmAccuracy(results, noteCount) {
  if (noteCount === 0) {
    return 0;
  }

  const points = results.reduce((sum, result) => sum + result.points, 0);

  return Math.round(points / noteCount);
}
