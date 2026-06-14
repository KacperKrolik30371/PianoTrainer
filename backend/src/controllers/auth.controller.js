const pool = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await pool.query(
      `
      SELECT *
      FROM users
      WHERE email = $1
         OR username = $2
      `,
      [email, username],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "Użytkownik o takiej nazwie lub emailu już istnieje",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `
      INSERT INTO users
      (username, email, password_hash)
      VALUES ($1, $2, $3)
      `,
      [username, email, passwordHash],
    );

    res.status(201).json({
      message: "Użytkownik utworzony",
    });
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(400).json({
        message: "Użytkownik o takiej nazwie lub emailu już istnieje",
      });
    }

    res.status(500).json({
      message: "Błąd serwera",
    });
  }
};

const login = async (req, res) => {
  try {
    const { login, password } = req.body;

    console.log("LOGIN:", login);

    const result = await pool.query(
      `
      SELECT *
      FROM users
      WHERE email = $1
         OR username = $1
      `,
      [login],
    );

    console.log("USER:", result.rows);

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Nieprawidłowy login lub hasło",
      });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Nieprawidłowy login lub hasło",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
      },
      "tajny_klucz",
      {
        expiresIn: "24h",
      },
    );

    res.json({
      token,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Błąd serwera",
    });
  }
};

module.exports = {
  register,
  login,
};
