import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Col, Container, ProgressBar, Row } from "react-bootstrap";
import { useMidiInput } from "../hooks/useMidiInput";
import {
  getNoteRecognitionProgress,
  getProfile,
  getRhythmProgress,
} from "../services/api";
import "./Dashboard.css";

const scorePercent = (value = 0) => Math.min(Math.max(value || 0, 0), 100);

function Dashboard() {
  const [user, setUser] = useState(null);
  const [noteProgress, setNoteProgress] = useState([]);
  const [rhythmProgress, setRhythmProgress] = useState([]);
  const navigate = useNavigate();
  const midiConnected = useMidiInput(() => {});

  const averageAccuracy = useMemo(() => {
    if (noteProgress.length === 0) {
      return 0;
    }

    const sum = noteProgress.reduce(
      (total, item) => total + (item.bestAccuracy || 0),
      0,
    );

    return Math.round(sum / noteProgress.length);
  }, [noteProgress]);

  const bestRhythmScore = useMemo(() => {
    if (rhythmProgress.length === 0) {
      return 0;
    }

    return Math.max(...rhythmProgress.map((item) => scorePercent(item.bestScore)));
  }, [rhythmProgress]);

  const rhythmAttempts = rhythmProgress.reduce(
    (total, item) => total + (item.attempts || 0),
    0,
  );
  const noteProgressPercent = Math.round((noteProgress.length / 30) * 100);
  const rhythmProgressPercent = Math.min(rhythmProgress.length * 34, 100);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    Promise.all([getProfile(), getNoteRecognitionProgress(), getRhythmProgress()])
      .then(([profileData, noteData, rhythmData]) => {
        setUser(profileData.user);
        setNoteProgress(noteData.progress || []);
        setRhythmProgress(rhythmData.progress || []);
      })
      .catch((error) => {
        console.error(error);
        localStorage.removeItem("token");
        navigate("/");
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <Container fluid className="dashboard-shell">
      <Container className="py-4">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-kicker">Panel treningu</span>
            <h1>Cześć{user ? `, ${user.username || user.email}` : ""}</h1>
            <p>Wybierz ćwiczenie i podłącz klawiaturę MIDI.</p>
          </div>
          <Button
            className="logout-btn"
            size="sm"
            variant="light"
            onClick={handleLogout}
          >
            Wyloguj
          </Button>
        </header>

        <Row className="g-3">
          <Col md={3}>
            <Card className="panel stat-card stat-levels">
              <Card.Body>
                <span>Poziomy nut</span>
                <strong>{noteProgress.length}/30</strong>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="panel stat-card stat-average">
              <Card.Body>
                <span>Średnia skuteczność</span>
                <strong>{averageAccuracy}%</strong>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="panel stat-card stat-rhythm">
              <Card.Body>
                <span>Najlepszy rytm</span>
                <strong>{bestRhythmScore}%</strong>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="panel stat-card stat-midi">
              <Card.Body>
                <span>MIDI</span>
                <strong>{midiConnected ? "połączone" : "brak"}</strong>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-3 mt-1">
          <Col lg={6}>
            <Card className="panel game-card note-mode">
              <Card.Body>
                <span className="mode-label">Tryb poziomów</span>
                <h2>Czytanie nut</h2>
                <p>Rozpoznaj nutę na pięciolinii i zagraj ją na MIDI.</p>
                <div className="mode-visual" aria-hidden="true" />
                <div className="mini-stats">
                  <span>Ukończone: {noteProgress.length}</span>
                  <span>Średnio: {averageAccuracy}%</span>
                </div>
                <Button variant="primary" onClick={() => navigate("/exercise")}>
                  Przejdź do poziomów
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6}>
            <Card className="panel game-card rhythm-mode">
              <Card.Body>
                <span className="mode-label">Tryb melodii</span>
                <h2>Gra rytmiczna</h2>
                <p>Wybierz melodię i zagraj nuty dokładnie w rytmie.</p>
                <div className="mode-visual" aria-hidden="true" />
                <div className="mini-stats">
                  <span>Melodie: {rhythmProgress.length}</span>
                  <span>Próby: {rhythmAttempts}</span>
                  <span>Rekord: {bestRhythmScore}%</span>
                </div>
                <Button variant="primary" onClick={() => navigate("/rhythm")}>
                  Otwórz bibliotekę
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="panel training-summary mt-3">
          <Card.Body>
            <h2>Podsumowanie treningu</h2>
            <Row className="g-3">
              <Col md={6}>
                <div className="progress-box">
                  <div>
                    <strong>Czytanie nut</strong>
                    <span>{noteProgressPercent}% ukończenia</span>
                  </div>
                  <ProgressBar now={noteProgressPercent} />
                </div>
              </Col>
              <Col md={6}>
                <div className="progress-box">
                  <div>
                    <strong>Gra rytmiczna</strong>
                    <span>{rhythmProgress.length}/3 melodie z wynikiem</span>
                  </div>
                  <ProgressBar now={rhythmProgressPercent} variant="success" />
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </Container>
  );
}

export default Dashboard;
