import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Card, Form, Button } from "react-bootstrap";

function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);

        navigate("/dashboard");
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error(error);

      setError("Błąd połączenia z serwerem");
    }
  };

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
      }}
    >
      <Card
        className="shadow-lg border-0"
        style={{
          width: "460px",
          borderRadius: "24px",
          background: "#ffffff",
        }}
      >
        <Card.Body className="p-5">
          <h1
            className="text-center mb-2"
            style={{
              fontSize: "3rem",
              fontWeight: "800",
              letterSpacing: "-2px",
            }}
          >
            🎹 PianoTrainer
          </h1>

          <p
            className="text-center text-muted mb-4"
            style={{
              fontSize: "0.95rem",
            }}
          >
            Nauka gry na instrumencie klawiszowym z wykorzystaniem MIDI
          </p>

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Email lub nazwa użytkownika</Form.Label>

              <Form.Control
                required
                size="lg"
                type="text"
                placeholder="Podaj email lub nazwę użytkownika"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Hasło</Form.Label>

              <Form.Control
                required
                size="lg"
                type="password"
                placeholder="Podaj hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>

            <Button variant="dark" type="submit" size="lg" className="w-100">
              Zaloguj
            </Button>

            {error && (
              <div className="text-danger text-center mt-3">{error}</div>
            )}
          </Form>

          <div className="text-center mt-4">
            Nie masz konta? <Link to="/register">Zarejestruj się</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;
