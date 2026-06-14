import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  ProgressBar,
  Row,
} from "react-bootstrap";
import NoteStave from "../components/NoteStave";
import PracticeKeyboard from "../components/PracticeKeyboard";
import {
  ANSWERS_PER_LEVEL,
  DIFFICULTIES,
  LEVELS,
  PASS_ACCURACY,
  getAccuracy,
  getLevelTime,
  getProgressForDifficulty,
} from "../game/noteRecognition";
import { buildMidiNoteMap, getNextChallenge } from "../game/music";
import { useMidiInput } from "../hooks/useMidiInput";
import {
  getNoteRecognitionProgress,
  saveNoteRecognitionProgress,
} from "../services/api";
import "./Exercise.css";

const INITIAL_DIFFICULTY = "easy";

function Exercise() {
  const navigate = useNavigate();
  const currentChallengeRef = useRef(null);
  const difficultyRef = useRef(INITIAL_DIFFICULTY);
  const levelIndexRef = useRef(0);
  const levelCompletedRef = useRef(false);

  const [screen, setScreen] = useState("map");
  const [difficulty, setDifficulty] = useState(INITIAL_DIFFICULTY);
  const [progress, setProgress] = useState([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");

  const [levelIndex, setLevelIndex] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [result, setResult] = useState("");
  const [timeLeft, setTimeLeft] = useState(getLevelTime(LEVELS[0], difficulty));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [pressedMidi, setPressedMidi] = useState(null);

  const currentLevel = LEVELS[levelIndex];
  const currentTimeLimit = getLevelTime(currentLevel, difficulty);
  const accuracy = getAccuracy(correctAnswers, wrongAnswers);
  const elapsedTime = elapsedSeconds.toFixed(1);
  const isLastLevel = levelIndex === LEVELS.length - 1;
  const midiNoteMap = useMemo(() => buildMidiNoteMap(LEVELS), []);
  const progressStats = useMemo(
    () => getProgressForDifficulty(progress, difficulty),
    [progress, difficulty],
  );

  const showNextChallenge = (targetLevelIndex = levelIndexRef.current) => {
    const challenge = getNextChallenge(
      LEVELS[targetLevelIndex],
      currentChallengeRef.current,
    );

    setCurrentChallenge(challenge);
    setPressedMidi(null);
    setTimeLeft(getLevelTime(LEVELS[targetLevelIndex], difficultyRef.current));
    setResult("");
  };

  const startRound = (targetLevelIndex) => {
    if (targetLevelIndex + 1 > progressStats.unlockedLevel) {
      return;
    }

    levelIndexRef.current = targetLevelIndex;
    levelCompletedRef.current = false;

    setScreen("round");
    setLevelIndex(targetLevelIndex);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setResult("");
    setSaveStatus("");
    setElapsedSeconds(0);
    setLevelCompleted(false);
    showNextChallenge(targetLevelIndex);
  };

  const startPractice = (targetLevelIndex) => {
    if (targetLevelIndex + 1 > progressStats.unlockedLevel) {
      return;
    }

    levelIndexRef.current = targetLevelIndex;
    levelCompletedRef.current = false;

    setScreen("practice");
    setLevelIndex(targetLevelIndex);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setResult("");
    setSaveStatus("");
    setElapsedSeconds(0);
    setLevelCompleted(false);
    showNextChallenge(targetLevelIndex);
  };

  const saveCompletedLevel = async (finalAccuracy, finalTime) => {
    try {
      setSaveStatus("Zapisywanie postępu...");

      const data = await saveNoteRecognitionProgress({
        difficulty: difficultyRef.current,
        levelNumber: levelIndexRef.current + 1,
        accuracy: finalAccuracy,
        timeSeconds: finalTime,
      });

      setProgress((previous) => [
        ...previous.filter(
          (item) =>
            item.difficulty !== data.progress.difficulty ||
            item.levelNumber !== data.progress.levelNumber,
        ),
        data.progress,
      ]);
      setSaveStatus("Postęp zapisany.");
    } catch (error) {
      console.error(error);
      setSaveStatus("Nie udało się zapisać postępu.");
    }
  };

  const finishRound = (finalCorrectAnswers) => {
    const finalAccuracy = getAccuracy(finalCorrectAnswers, wrongAnswers);
    const finalTime = Number(elapsedSeconds.toFixed(1));
    const passed = finalAccuracy >= PASS_ACCURACY;

    levelCompletedRef.current = true;
    setLevelCompleted(true);
    setResult(
      passed
        ? isLastLevel
          ? "Ukończono cały trening"
          : "Poziom ukończony"
        : `Wymagane minimum ${PASS_ACCURACY}% skuteczności`,
    );

    if (passed) {
      saveCompletedLevel(finalAccuracy, finalTime);
    }
  };

  function checkAnswer(playedNote) {
    if (levelCompletedRef.current || !currentChallengeRef.current) {
      return;
    }

    if (playedNote.key !== currentChallengeRef.current.key) {
      setWrongAnswers((prev) => prev + 1);
      setResult("Niepoprawna nuta");
      setTimeout(() => showNextChallenge(), 800);
      return;
    }

    setCorrectAnswers((prev) => {
      const nextCorrect = prev + 1;

      if (nextCorrect >= ANSWERS_PER_LEVEL) {
        finishRound(nextCorrect);
        return nextCorrect;
      }

      setResult("Poprawnie");
      setTimeout(() => showNextChallenge(), 450);
      return nextCorrect;
    });
  }

  function checkPracticeAnswer(playedNote, midiNote) {
    if (!currentChallengeRef.current) {
      return;
    }

    setPressedMidi(midiNote);

    if (!playedNote || playedNote.key !== currentChallengeRef.current.key) {
      setResult("Jeszcze raz");
      return;
    }

    setResult("Dobrze");
    setTimeout(() => showNextChallenge(), 500);
  }

  const midiConnected = useMidiInput((midiNote) => {
    const playedNote = midiNoteMap.get(midiNote);

    if (screen === "practice") {
      checkPracticeAnswer(playedNote, midiNote);
      return;
    }

    if (playedNote) {
      checkAnswer(playedNote);
    }
  });

  const playPracticeKey = (midiNote) => {
    checkPracticeAnswer(midiNoteMap.get(midiNote), midiNote);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    getNoteRecognitionProgress()
      .then((data) => setProgress(data.progress || []))
      .catch((error) => {
        console.error(error);
        setSaveStatus("Nie udało się wczytać postępu.");
      })
      .finally(() => setProgressLoading(false));
  }, [navigate]);

  useEffect(() => {
    currentChallengeRef.current = currentChallenge;
  }, [currentChallenge]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    levelIndexRef.current = levelIndex;
  }, [levelIndex]);

  useEffect(() => {
    levelCompletedRef.current = levelCompleted;
  }, [levelCompleted]);

  useEffect(() => {
    if (screen !== "round" || levelCompleted) {
      return undefined;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => Number((prev + 0.1).toFixed(1)));
    }, 100);

    return () => clearInterval(interval);
  }, [screen, levelCompleted]);

  useEffect(() => {
    if (screen !== "round" || levelCompleted || !currentChallenge) {
      return undefined;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 50) {
          return prev - 50;
        }

        clearInterval(interval);
        setWrongAnswers((prevWrong) => prevWrong + 1);
        setResult("Koniec czasu");
        setTimeout(() => showNextChallenge(), 800);
        return currentTimeLimit;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentChallenge, screen, levelCompleted, currentTimeLimit]);

  const progressColor =
    timeLeft > currentTimeLimit * 0.6
      ? "success"
      : timeLeft > currentTimeLimit * 0.3
        ? "warning"
        : "danger";

  if (screen === "map") {
    return (
      <Container fluid className={`exercise-shell difficulty-${difficulty}`}>
        <Container className="py-4">
          <div className="exercise-topbar">
            <div>
              <Badge bg="dark" className="mb-2">
                Tryb: rozpoznawanie nut
              </Badge>
              <h1>Poziomy</h1>
              <p>Wybierz odblokowany poziom albo powtórz już ukończony.</p>
            </div>

            <div className="topbar-actions">
              <Button
                variant="light"
                onClick={() => startPractice(progressStats.unlockedLevel - 1)}
              >
                Tryb ćwiczeń
              </Button>
              <Button variant="light" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>

          <div className="difficulty-tabs">
            {Object.entries(DIFFICULTIES).map(([key, value]) => (
              <button
                className={`difficulty-tab ${difficulty === key ? "active" : ""}`}
                key={key}
                type="button"
                onClick={() => setDifficulty(key)}
              >
                <strong>{value.label}</strong>
                <span>{value.subtitle}</span>
                <small>
                  {(getLevelTime(LEVELS[0], key) / 1000).toFixed(1)}s na nutę
                </small>
              </button>
            ))}
          </div>

          <section className="level-grid">
            {LEVELS.map((level, index) => {
              const levelNumber = index + 1;
              const completed = progressStats.completedNumbers.has(levelNumber);
              const unlocked = levelNumber <= progressStats.unlockedLevel;
              const current = levelNumber === progressStats.unlockedLevel;
              const stats = progressStats.completed.find(
                (item) => item.levelNumber === levelNumber,
              );

              return (
                <Card
                  className={`level-card ${
                    completed ? "completed" : current ? "current" : ""
                  } ${unlocked ? "" : "locked"}`}
                  key={level.name}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Badge
                        bg={
                          completed
                            ? "success"
                            : current
                              ? "primary"
                              : "secondary"
                        }
                      >
                        Poziom {levelNumber}
                      </Badge>
                      {!unlocked && <Badge bg="dark">Zablokowany</Badge>}
                    </div>

                    <h5>{level.name}</h5>
                    <p className="text-muted small">{level.description}</p>

                    {completed && (
                      <div className="small">
                        <div>Skuteczność: {stats.bestAccuracy}%</div>
                        <div>Czas: {stats.bestTimeSeconds}s</div>
                      </div>
                    )}

                    <div className="level-actions">
                      <Button
                        disabled={!unlocked}
                        onClick={() => startRound(index)}
                      >
                        {completed ? "Powtórz" : current ? "Graj" : "Zablokowane"}
                      </Button>
                      <Button
                        disabled={!unlocked}
                        onClick={() => startPractice(index)}
                        variant="outline-primary"
                      >
                        Ćwicz
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </section>

          <Row className="g-3 mt-4">
            <Col md={4}>
              <Card className="summary-card">
                <Card.Body>
                  <span>Ukończone</span>
                  <strong>
                    {progressStats.completed.length}/{LEVELS.length}
                  </strong>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="summary-card">
                <Card.Body>
                  <span>Tempo</span>
                  <strong>{DIFFICULTIES[difficulty].label}</strong>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="summary-card">
                <Card.Body>
                  <span>Status MIDI</span>
                  <strong>{midiConnected ? "Połączone" : "Brak"}</strong>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {(progressLoading || saveStatus) && (
            <p className="map-status">
              {progressLoading ? "Wczytywanie postępu..." : saveStatus}
            </p>
          )}
        </Container>
      </Container>
    );
  }

  if (screen === "practice") {
    return (
      <Container fluid className={`exercise-shell difficulty-${difficulty}`}>
        <Container className="py-4">
          <Card className="exercise-panel practice-panel">
            <Card.Body className="p-4">
              <div className="round-header">
                <div>
                  <Badge bg="success">Tryb ćwiczeń</Badge>
                  <h1>{currentLevel.name}</h1>
                  <p>{currentLevel.description}</p>
                </div>

                <div className="topbar-actions">
                  <Button
                    onClick={() => showNextChallenge()}
                    variant="outline-secondary"
                  >
                    Następna nuta
                  </Button>
                  <Button
                    onClick={() => setScreen("map")}
                    variant="outline-secondary"
                  >
                    Poziomy
                  </Button>
                </div>
              </div>

              <NoteStave note={currentChallenge} />

              <h3 className="result-line">
                {result || "Zagraj podświetlony klawisz"}
              </h3>

              <PracticeKeyboard
                notes={currentLevel.notes}
                onPlay={playPracticeKey}
                pressedMidi={pressedMidi}
                targetMidi={currentChallenge?.midi}
              />
            </Card.Body>
          </Card>
        </Container>
      </Container>
    );
  }

  return (
    <Container fluid className={`exercise-shell difficulty-${difficulty}`}>
      <Container className="py-4">
        <Card className="exercise-panel">
          <Card.Body className="p-4">
            {!levelCompleted && (
              <>
                <div className="round-header">
                  <div>
                    <Badge bg="primary">
                      Poziom {levelIndex + 1}/{LEVELS.length}
                    </Badge>
                    <h1>{currentLevel.name}</h1>
                    <p>{currentLevel.description}</p>
                  </div>

                  <Button
                    variant="outline-secondary"
                    onClick={() => setScreen("map")}
                  >
                    Poziomy
                  </Button>
                </div>

                <Row className="g-3 mb-4">
                  <Col md={4}>
                    <div className="metric-tile">
                      <span>Postęp</span>
                      <strong>
                        {correctAnswers}/{ANSWERS_PER_LEVEL}
                      </strong>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="metric-tile">
                      <span>Skuteczność</span>
                      <strong>{accuracy}%</strong>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="metric-tile">
                      <span>Trudność</span>
                      <strong>{DIFFICULTIES[difficulty].label}</strong>
                    </div>
                  </Col>
                </Row>

                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <strong>{(timeLeft / 1000).toFixed(1)}s</strong>
                    <span className="text-muted">
                      Pozostało {ANSWERS_PER_LEVEL - correctAnswers}
                    </span>
                  </div>
                  <ProgressBar
                    now={(timeLeft / currentTimeLimit) * 100}
                    variant={progressColor}
                  />
                </div>

                <NoteStave note={currentChallenge} />

                <h3 className="result-line">{result}</h3>
                <p className="round-hint">
                  Zagraj wyświetloną nutę na klawiaturze MIDI.
                </p>
              </>
            )}

            {levelCompleted && (
              <div className="finish-screen">
                <Badge bg={accuracy >= PASS_ACCURACY ? "success" : "warning"}>
                  Runda zakończona
                </Badge>
                <h1>
                  {accuracy >= PASS_ACCURACY
                    ? isLastLevel
                      ? "Cały trening ukończony"
                      : "Poziom zaliczony"
                    : "Spróbuj jeszcze raz"}
                </h1>
                <p>{saveStatus || result}</p>

                <div className="finish-stats">
                  <div>
                    <span>Czas</span>
                    <strong>{elapsedTime}s</strong>
                  </div>
                  <div>
                    <span>Skuteczność</span>
                    <strong>{accuracy}%</strong>
                  </div>
                  <div>
                    <span>Błędy</span>
                    <strong>{wrongAnswers}</strong>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-3 justify-content-center mt-4">
                  <Button onClick={() => setScreen("map")}>Poziomy</Button>
                  <Button
                    variant="secondary"
                    onClick={() => startRound(levelIndex)}
                  >
                    Powtórz poziom
                  </Button>
                  {accuracy >= PASS_ACCURACY && !isLastLevel && (
                    <Button
                      variant="success"
                      onClick={() => startRound(levelIndex + 1)}
                    >
                      Następny poziom
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </Container>
  );
}

export default Exercise;
