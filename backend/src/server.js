const express = require("express");
const pool = require("./db/db");
const authRoutes = require("./routes/auth.routes");
const progressRoutes = require("./routes/progress.routes");
const authMiddleware = require("./middleware/auth.middleware");
const cors = require("cors");

const app = express();

app.use(express.json());

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/progress", progressRoutes);

app.get("/api/profile", authMiddleware, (req, res) => {
  res.json({
    user: req.user,
  });
});

app.get("/", (req, res) => {
  res.send("PianoTrainer API działa");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Błąd bazy danych");
  }
});

app.listen(3000, () => {
  console.log("Server uruchomiony na porcie 3000");
});
