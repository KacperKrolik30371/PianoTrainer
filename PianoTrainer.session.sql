SELECT id, username, email
FROM users;

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

CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  metronome BOOLEAN NOT NULL DEFAULT TRUE,
  note_labels BOOLEAN NOT NULL DEFAULT TRUE,
  sound_effects BOOLEAN NOT NULL DEFAULT TRUE,
  input_delay INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
