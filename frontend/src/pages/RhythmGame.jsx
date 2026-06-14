import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import MelodyPreview from "../components/MelodyPreview";
import ScrollingMelody from "../components/ScrollingMelody";
import {
  HIT_WINDOW,
  RHYTHM_SONGS,
  getHitGrade,
  getRhythmAccuracy,
} from "../game/rhythmGame";
import { useMidiInput } from "../hooks/useMidiInput";
import { getRhythmProgress, saveRhythmProgress } from "../services/api";
import "./RhythmGame.css";

const scorePercent = (value = 0) => Math.min(Math.max(value || 0, 0), 100);

function RhythmGame() {
  const navigate = useNavigate();
  const startedAtRef = useRef(0);
  const timeRef = useRef(0);
  const resultsRef = useRef([]);
  const [songKey, setSongKey] = useState(RHYTHM_SONGS[0].key);
  const [progress, setProgress] = useState([]);
  const [screen, setScreen] = useState("library");
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [time, setTime] = useState(0);
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [message, setMessage] = useState("");

  const song = RHYTHM_SONGS.find((item) => item.key === songKey);
  const getSongStats = (key) =>
    progress.find((item) => item.songKey === key) || {
      bestScore: 0,
      bestAccuracy: 0,
      attempts: 0,
    };
  const score = getRhythmAccuracy(results, song.notes.length);
  const currentStats = getSongStats(song.key);
  const highScore = Math.max(scorePercent(currentStats.bestScore), finished ? score : 0);
  const completedSongs = progress.filter((item) => item.bestScore > 0).length;
  const libraryBestScore =
    progress.length === 0
      ? 0
      : Math.max(...progress.map((item) => scorePercent(item.bestScore)));

  const resetGame = () => {
    startedAtRef.current = 0;
    timeRef.current = 0;
    resultsRef.current = [];
    setRunning(false);
    setFinished(false);
    setCountdown(null);
    setTime(0);
    setResults([]);
    setFeedback(null);
    setMessage("");
  };

  const startSong = (key) => {
    setSongKey(key);
    setScreen("game");
    resetGame();
  };

  const startGame = () => {
    resetGame();
    setCountdown(3);
    setMessage("Przygotuj palce.");
  };

  const saveResult = useCallback(async (finalScore, finalAccuracy) => {
    try {
      const data = await saveRhythmProgress({
        songKey: song.key,
        score: finalScore,
        accuracy: finalAccuracy,
      });

      setProgress((previous) => [
        ...previous.filter((item) => item.songKey !== data.progress.songKey),
        data.progress,
      ]);
      setMessage("Wynik zapisany.");
    } catch (error) {
      console.error(error);
      setMessage("Nie udało się zapisać wyniku.");
    }
  }, [song.key]);

  const isHandled = (id) =>
    resultsRef.current.some((result) => result.id === id);

  const findClosestNote = (matchesNote = () => true) =>
    song.notes
      .filter((item) => !isHandled(item.id) && matchesNote(item))
      .map((item) => ({
        note: item,
        error: Math.abs(item.time - timeRef.current),
      }))
      .sort((a, b) => a.error - b.error)[0];

  const showFeedback = (className, text) => {
    setFeedback({
      id: `${className}-${timeRef.current}-${resultsRef.current.length}`,
      className,
      text,
    });
    setMessage(text);
  };

  const addResult = (note, grade) => {
    const result = {
      id: note.id,
      className: grade.className,
      points: grade.points,
    };

    resultsRef.current = [...resultsRef.current, result];
    setResults((previous) => [...previous, result]);
    showFeedback(grade.className, grade.name);
  };

  const hitCurrentNote = () => {
    if (!running || finished) {
      return;
    }

    const closest = findClosestNote();

    if (!closest || closest.error > HIT_WINDOW) {
      showFeedback("miss", "Miss");
      return;
    }

    addResult(closest.note, getHitGrade(closest.error));
  };

  const hitNote = (midiNote) => {
    if (!running || finished) {
      return;
    }

    const closest = findClosestNote((item) => item.midi === midiNote);

    if (!closest || closest.error > HIT_WINDOW) {
      showFeedback("miss", "Nie trafione");
      return;
    }

    addResult(closest.note, getHitGrade(closest.error));
  };

  useMidiInput(hitNote);

  useEffect(() => {
    if (countdown === null) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(null);
        setRunning(true);
        setMessage("Start!");
        return;
      }

      setCountdown((previous) => previous - 1);
    }, 800);

    return () => clearTimeout(timeout);
  }, [countdown]);

  useEffect(() => {
    getRhythmProgress()
      .then((data) => setProgress(data.progress || []))
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (!running || finished) {
      return undefined;
    }

    let frameId = 0;

    const tick = (now) => {
      if (startedAtRef.current === 0) {
        startedAtRef.current = now;
      }

      const nextTime = (now - startedAtRef.current) / 1000;
      timeRef.current = nextTime;
      const handled = new Set(resultsRef.current.map((result) => result.id));
      const missed = song.notes
        .filter(
          (note) => note.time + HIT_WINDOW < nextTime && !handled.has(note.id),
        )
        .map((note) => note.id);

      if (missed.length > 0) {
        const missedResults = missed.map((id) => ({
          id,
          className: "miss",
          points: 0,
        }));

        resultsRef.current = [...resultsRef.current, ...missedResults];
        setResults((previous) => [...previous, ...missedResults]);
        setFeedback({
          id: `miss-${nextTime}`,
          className: "miss",
          text: "Miss",
        });
        setMessage("Miss");
      }

      setTime(nextTime);

      if (nextTime >= song.notes[song.notes.length - 1].time + HIT_WINDOW + 0.25) {
        const finalAccuracy = getRhythmAccuracy(resultsRef.current, song.notes.length);

        setRunning(false);
        setFinished(true);
        saveResult(finalAccuracy, finalAccuracy);
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [running, finished, song, saveResult]);

  if (screen === "library") {
    return (
      <Container fluid className="rhythm-shell rhythm-library">
        <Container className="py-4">
          <div className="rhythm-top rhythm-hero">
            <div>
              <span className="rhythm-kicker">Biblioteka utworów</span>
              <h1>Biblioteka melodii</h1>
              <p>Wybierz piosenkę i zagraj nuty dokładnie w rytmie.</p>
            </div>
            <div className="rhythm-top-side">
              <div className="library-stats">
                <span>
                  <strong>{RHYTHM_SONGS.length}</strong>
                  melodie
                </span>
                <span>
                  <strong>{completedSongs}</strong>
                  z wynikiem
                </span>
                <span>
                  <strong>{libraryBestScore}%</strong>
                  rekord
                </span>
              </div>
              <Button className="top-button" variant="light" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>

          <Row className="g-3">
            {RHYTHM_SONGS.map((item, index) => {
              const stats = getSongStats(item.key);
              const bestScore = scorePercent(stats.bestScore);

              return (
                <Col lg={4} md={6} key={item.key}>
                  <Card className="song-card h-100">
                    <Card.Body>
                      <div className="song-card-head">
                        <span>Melodia {index + 1}</span>
                        <strong>{item.bpm} BPM</strong>
                      </div>
                      <h2>{item.title}</h2>
                      <p>{item.description}</p>
                      <MelodyPreview notes={item.notes} />
                      <div
                        className="song-score"
                        style={{ "--score": `${bestScore}%` }}
                      />
                      <div className="song-stats">
                        <span>Rekord: {bestScore}%</span>
                        <span>Próby: {stats.attempts}</span>
                        <span>Nuty: {item.notes.length}</span>
                      </div>
                      <Button className="song-button" onClick={() => startSong(item.key)}>
                        Graj
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Container>
      </Container>
    );
  }

  return (
    <Container fluid className="rhythm-shell">
      <Container className="py-4">
        <div className="rhythm-top">
          <div>
            <h1>{song.title}</h1>
            <p>Nuty płyną po pięciolinii. Zagraj je przy czerwonej linii.</p>
          </div>
          <Button className="top-button" variant="outline-light" onClick={() => setScreen("library")}>
            Biblioteka
          </Button>
        </div>

        <Card className="rhythm-panel">
          <Card.Body>
            <div className="rhythm-actions">
              <div>
                <p className="mb-0">Zagraj nutę dokładnie na czerwonej linii.</p>
              </div>
              <div className="rhythm-buttons">
                <Button onClick={startGame} disabled={running || countdown !== null}>
                  Rozpocznij
                </Button>
              </div>
            </div>

            <div className="staff-stage" onClick={hitCurrentNote}>
              {countdown !== null && (
                <div className="countdown">{countdown === 0 ? "Start" : countdown}</div>
              )}
              <div className="hit-line" />
              <ScrollingMelody song={song} time={time} />
              {feedback && (
                <div className={`hit-feedback ${feedback.className}`} key={feedback.id}>
                  {feedback.text}
                </div>
              )}
            </div>

            <div className="rhythm-stats">
              <span>Wynik: {score}%</span>
              <span>Rekord melodii: {highScore}%</span>
            </div>

            {finished && (
              <div className="result-box">
                <h2>Wynik końcowy: {score}%</h2>
                <p>Najlepszy wynik tej melodii: {highScore}%</p>
                <Button onClick={startGame}>Zagraj ponownie</Button>
              </div>
            )}

            <p className="rhythm-message">
              {finished ? message || "Koniec melodii" : message}
            </p>
          </Card.Body>
        </Card>
      </Container>
    </Container>
  );
}

export default RhythmGame;
