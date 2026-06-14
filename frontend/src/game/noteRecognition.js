import { buildWhiteNotes } from "./music.js";

export const ANSWERS_PER_LEVEL = 10;
export const PASS_ACCURACY = 70;

export const DIFFICULTIES = {
  easy: {
    label: "Łatwy",
    subtitle: "spokojne tempo",
    timeMultiplier: 1.3,
  },
  medium: {
    label: "Średni",
    subtitle: "rytm treningowy",
    timeMultiplier: 1,
  },
  hard: {
    label: "Trudny",
    subtitle: "szybka reakcja",
    timeMultiplier: 0.72,
  },
};

export const LEVELS = [
  {
    name: "Pierwsze kroki",
    description: "C4-G4, prawa ręka",
    baseTime: 5000,
    notes: buildWhiteNotes(60, 67, "treble"),
  },
  {
    name: "Pełna oktawa",
    description: "C4-C5, prawa ręka",
    baseTime: 5000,
    notes: buildWhiteNotes(60, 72, "treble"),
  },
  {
    name: "Niżej i wyżej",
    description: "A3-E5 w kluczu wiolinowym",
    baseTime: 4800,
    notes: buildWhiteNotes(57, 76, "treble"),
  },
  {
    name: "Szeroki wiolinowy",
    description: "G3-G5 w kluczu wiolinowym",
    baseTime: 4600,
    notes: buildWhiteNotes(55, 79, "treble"),
  },
  {
    name: "Lewa ręka",
    description: "C3-G3 w kluczu basowym",
    baseTime: 5000,
    notes: buildWhiteNotes(48, 55, "bass"),
  },
  {
    name: "Basowa oktawa",
    description: "C3-C4 w kluczu basowym",
    baseTime: 4800,
    notes: buildWhiteNotes(48, 60, "bass"),
  },
  {
    name: "Niski rejestr",
    description: "F2-C4 w kluczu basowym",
    baseTime: 4600,
    notes: buildWhiteNotes(41, 60, "bass"),
  },
  {
    name: "Obie ręce",
    description: "C3-C5, oba klucze",
    baseTime: 4400,
    notes: [
      ...buildWhiteNotes(48, 59, "bass"),
      ...buildWhiteNotes(60, 72, "treble"),
    ],
  },
  {
    name: "Cała pięciolinia",
    description: "F2-G5, oba klucze",
    baseTime: 4200,
    notes: [
      ...buildWhiteNotes(41, 59, "bass"),
      ...buildWhiteNotes(60, 79, "treble"),
    ],
  },
  {
    name: "Mistrz nut",
    description: "C2-C6, pełny zakres białych klawiszy",
    baseTime: 4000,
    notes: [
      ...buildWhiteNotes(36, 59, "bass"),
      ...buildWhiteNotes(60, 84, "treble"),
    ],
  },
];

export function getLevelTime(level, difficulty) {
  return Math.round(level.baseTime * DIFFICULTIES[difficulty].timeMultiplier);
}

export function getAccuracy(correctAnswers, wrongAnswers) {
  const totalAnswers = correctAnswers + wrongAnswers;

  if (totalAnswers === 0) {
    return 0;
  }

  return Math.round((correctAnswers / totalAnswers) * 100);
}

export function getProgressForDifficulty(progress, difficulty) {
  const completed = progress.filter((item) => item.difficulty === difficulty);
  const completedNumbers = new Set(completed.map((item) => item.levelNumber));
  const highestCompleted = completed.reduce(
    (highest, item) => Math.max(highest, item.levelNumber),
    0,
  );

  return {
    completed,
    completedNumbers,
    unlockedLevel: Math.min(highestCompleted + 1, LEVELS.length),
  };
}
