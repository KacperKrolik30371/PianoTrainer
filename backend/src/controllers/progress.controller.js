const pool = require("../db/db");

const ALLOWED_DIFFICULTIES = ["easy", "medium", "hard"];

const ensureProgressTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS note_recognition_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      difficulty VARCHAR(16) NOT NULL,
      level_number INTEGER NOT NULL,
      best_accuracy INTEGER NOT NULL DEFAULT 0,
      best_time_seconds NUMERIC(8, 1),
      attempts INTEGER NOT NULL DEFAULT 1,
      completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, difficulty, level_number),
      CONSTRAINT note_recognition_difficulty_check
        CHECK (difficulty IN ('easy', 'medium', 'hard')),
      CONSTRAINT note_recognition_level_check
        CHECK (level_number BETWEEN 1 AND 10)
    );
  `);
};

const ensureRhythmProgressTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rhythm_game_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      song_key VARCHAR(64) NOT NULL,
      best_score INTEGER NOT NULL DEFAULT 0,
      best_accuracy INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 1,
      completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, song_key)
    );
  `);
};

const ensureUserSettingsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      metronome BOOLEAN NOT NULL DEFAULT TRUE,
      note_labels BOOLEAN NOT NULL DEFAULT TRUE,
      sound_effects BOOLEAN NOT NULL DEFAULT TRUE,
      input_delay INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
};

const getProgress = async (req, res) => {
  try {
    await ensureProgressTable();

    const result = await pool.query(
      `
      SELECT difficulty,
             level_number AS "levelNumber",
             best_accuracy AS "bestAccuracy",
             best_time_seconds AS "bestTimeSeconds",
             attempts,
             completed_at AS "completedAt"
      FROM note_recognition_progress
      WHERE user_id = $1
      ORDER BY difficulty, level_number
      `,
      [req.user.userId],
    );

    res.json({
      progress: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Blad podczas pobierania postepu",
    });
  }
};

const saveProgress = async (req, res) => {
  try {
    await ensureProgressTable();

    const { difficulty, levelNumber, accuracy, timeSeconds } = req.body;

    if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({
        message: "Nieprawidlowy poziom trudnosci",
      });
    }

    if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > 10) {
      return res.status(400).json({
        message: "Nieprawidlowy numer poziomu",
      });
    }

    const safeAccuracy = Math.max(0, Math.min(100, Number(accuracy) || 0));
    const safeTime = Math.max(0, Number(timeSeconds) || 0);

    const result = await pool.query(
      `
      INSERT INTO note_recognition_progress
        (user_id, difficulty, level_number, best_accuracy, best_time_seconds)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, difficulty, level_number)
      DO UPDATE SET
        best_accuracy = GREATEST(
          note_recognition_progress.best_accuracy,
          EXCLUDED.best_accuracy
        ),
        best_time_seconds = CASE
          WHEN note_recognition_progress.best_time_seconds IS NULL
            THEN EXCLUDED.best_time_seconds
          ELSE LEAST(
            note_recognition_progress.best_time_seconds,
            EXCLUDED.best_time_seconds
          )
        END,
        attempts = note_recognition_progress.attempts + 1,
        completed_at = NOW(),
        updated_at = NOW()
      RETURNING difficulty,
                level_number AS "levelNumber",
                best_accuracy AS "bestAccuracy",
                best_time_seconds AS "bestTimeSeconds",
                attempts,
                completed_at AS "completedAt"
      `,
      [req.user.userId, difficulty, levelNumber, safeAccuracy, safeTime],
    );

    res.json({
      progress: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Blad podczas zapisywania postepu",
    });
  }
};

const getRhythmProgress = async (req, res) => {
  try {
    await ensureRhythmProgressTable();

    const result = await pool.query(
      `
      SELECT song_key AS "songKey",
             best_score AS "bestScore",
             best_accuracy AS "bestAccuracy",
             attempts,
             completed_at AS "completedAt"
      FROM rhythm_game_progress
      WHERE user_id = $1
      ORDER BY completed_at DESC
      `,
      [req.user.userId],
    );

    res.json({
      progress: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Blad podczas pobierania postepu rytmu",
    });
  }
};

const saveRhythmProgress = async (req, res) => {
  try {
    await ensureRhythmProgressTable();

    const { songKey, score, accuracy } = req.body;

    if (!songKey || typeof songKey !== "string") {
      return res.status(400).json({
        message: "Nieprawidlowa melodia",
      });
    }

    const safeScore = Math.max(0, Number(score) || 0);
    const safeAccuracy = Math.max(0, Math.min(100, Number(accuracy) || 0));

    const result = await pool.query(
      `
      INSERT INTO rhythm_game_progress
        (user_id, song_key, best_score, best_accuracy)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, song_key)
      DO UPDATE SET
        best_score = GREATEST(
          rhythm_game_progress.best_score,
          EXCLUDED.best_score
        ),
        best_accuracy = GREATEST(
          rhythm_game_progress.best_accuracy,
          EXCLUDED.best_accuracy
        ),
        attempts = rhythm_game_progress.attempts + 1,
        completed_at = NOW(),
        updated_at = NOW()
      RETURNING song_key AS "songKey",
                best_score AS "bestScore",
                best_accuracy AS "bestAccuracy",
                attempts,
                completed_at AS "completedAt"
      `,
      [req.user.userId, songKey, safeScore, safeAccuracy],
    );

    res.json({
      progress: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Blad podczas zapisywania postepu rytmu",
    });
  }
};

const getSettings = async (req, res) => {
  try {
    await ensureUserSettingsTable();

    await pool.query(
      `
      INSERT INTO user_settings (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
      `,
      [req.user.userId],
    );

    const result = await pool.query(
      `
      SELECT metronome,
             note_labels AS "noteLabels",
             sound_effects AS "soundEffects",
             input_delay AS "inputDelay"
      FROM user_settings
      WHERE user_id = $1
      `,
      [req.user.userId],
    );

    res.json({
      settings: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Blad podczas pobierania ustawien",
    });
  }
};

const saveSettings = async (req, res) => {
  try {
    await ensureUserSettingsTable();

    const {
      metronome = true,
      noteLabels = true,
      soundEffects = true,
      inputDelay = 0,
    } = req.body;

    const safeInputDelay = Math.max(0, Math.min(300, Number(inputDelay) || 0));

    const result = await pool.query(
      `
      INSERT INTO user_settings
        (user_id, metronome, note_labels, sound_effects, input_delay)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id)
      DO UPDATE SET
        metronome = EXCLUDED.metronome,
        note_labels = EXCLUDED.note_labels,
        sound_effects = EXCLUDED.sound_effects,
        input_delay = EXCLUDED.input_delay,
        updated_at = NOW()
      RETURNING metronome,
                note_labels AS "noteLabels",
                sound_effects AS "soundEffects",
                input_delay AS "inputDelay"
      `,
      [
        req.user.userId,
        Boolean(metronome),
        Boolean(noteLabels),
        Boolean(soundEffects),
        safeInputDelay,
      ],
    );

    res.json({
      settings: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Blad podczas zapisywania ustawien",
    });
  }
};

module.exports = {
  getProgress,
  saveProgress,
  getRhythmProgress,
  saveRhythmProgress,
  getSettings,
  saveSettings,
};
