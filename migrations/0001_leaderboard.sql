-- Leaderboard (opt-in). Executar uma vez na base D1 "bradbury-leaderboard" (ver docs/leaderboard.md).

-- Um leitor: o nome que escolheu e o estado da sequência. O id é o hash SHA-256 da chave guardada no browser.
CREATE TABLE IF NOT EXISTS readers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL UNIQUE,
  streak INTEGER NOT NULL DEFAULT 0,
  best INTEGER NOT NULL DEFAULT 0,
  last_day TEXT,
  rest_day TEXT,
  hidden INTEGER NOT NULL DEFAULT 0,
  created TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS readers_live ON readers (hidden, last_day, streak);

-- Um dia completo (as três leituras marcadas nesse mesmo dia, pela data de Lisboa do servidor).
CREATE TABLE IF NOT EXISTS checkins (
  reader_id TEXT NOT NULL,
  day TEXT NOT NULL,
  PRIMARY KEY (reader_id, day)
);

CREATE INDEX IF NOT EXISTS checkins_day ON checkins (day);
