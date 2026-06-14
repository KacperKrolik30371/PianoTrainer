import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.includes("@")) {
      setError("Podaj poprawny adres email");
      return;
    }

    if (password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków");
      return;
    }

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Konto zostało utworzone");

        setTimeout(() => {
          navigate("/");
        }, 1500);
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
            Utwórz nowe konto
          </p>

          <Form onSubmit={handleRegister}>
            <Form.Group className="mb-3">
              <Form.Label>Nazwa użytkownika</Form.Label>

              <Form.Control
                required
                size="lg"
                type="text"
                placeholder="Podaj nazwę użytkownika"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>

              <Form.Control
                required
                size="lg"
                type="email"
                placeholder="Podaj email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
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

            <Form.Group className="mb-4">
              <Form.Label>Powtórz hasło</Form.Label>

              <Form.Control
                required
                size="lg"
                type="password"
                placeholder="Powtórz hasło"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Form.Group>

            <Button variant="dark" type="submit" size="lg" className="w-100">
              Utwórz konto
            </Button>

            {error && (
              <Alert variant="danger" className="mt-3">
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" className="mt-3">
                {success}
              </Alert>
            )}
          </Form>

          <div className="text-center mt-4">
            Masz już konto? <Link to="/">Zaloguj się</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Register;
