-- schema.sql — Guild Productivity RPG (no study arena)
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

-- Users & avatars
CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY,
  email        TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  level        INTEGER NOT NULL DEFAULT 1,
  xp           INTEGER NOT NULL DEFAULT 0,
  hp           INTEGER NOT NULL DEFAULT 100,
  mana         INTEGER NOT NULL DEFAULT 50,
  gold         INTEGER NOT NULL DEFAULT 0,
  diamonds     INTEGER NOT NULL DEFAULT 0,
  guild_rank   TEXT NOT NULL DEFAULT 'Bronze'
);

CREATE TABLE IF NOT EXISTS avatars (
  user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  class       TEXT NOT NULL CHECK (class IN ('Warrior','Mage','Paladin','Rogue')),
  appearance  TEXT NOT NULL DEFAULT '{}',
  str         INTEGER NOT NULL DEFAULT 10,
  int         INTEGER NOT NULL DEFAULT 10
);

-- Quests & logs
CREATE TABLE IF NOT EXISTS quests (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('habit','daily','todo')),
  rank          TEXT NOT NULL DEFAULT 'E' CHECK (rank IN ('E','D','C','B','A','S')),
  notes         TEXT,
  tags          TEXT DEFAULT '[]',
  due_at        TEXT,
  repeats_rule  TEXT,
  difficulty    INTEGER NOT NULL DEFAULT 2,
  is_negative   INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subquests (
  id        INTEGER PRIMARY KEY,
  quest_id  INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  is_done   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quest_logs (
  id         INTEGER PRIMARY KEY,
  quest_id   INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_at  TEXT NOT NULL DEFAULT (datetime('now')),
  outcome    TEXT NOT NULL CHECK (outcome IN ('complete','fail','negative')),
  xp_delta   INTEGER NOT NULL,
  gold_delta INTEGER NOT NULL,
  hp_delta   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quests_user_type ON quests(user_id, type);
CREATE INDEX IF NOT EXISTS idx_quest_logs_user_time ON quest_logs(user_id, logged_at);

-- Streaks & check-ins
CREATE TABLE IF NOT EXISTS streaks (
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id  INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  count     INTEGER NOT NULL DEFAULT 0,
  last_day  TEXT NOT NULL,
  PRIMARY KEY (user_id, quest_id)
);

CREATE TABLE IF NOT EXISTS daily_checkins (
  user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_run INTEGER NOT NULL DEFAULT 0,
  last_day    TEXT NOT NULL
);

-- Focus / Pomodoro
CREATE TABLE IF NOT EXISTS focus_sessions (
  id          INTEGER PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id    INTEGER,
  started_at  TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at    TEXT,
  target_min  INTEGER NOT NULL DEFAULT 25,
  actual_min  INTEGER NOT NULL DEFAULT 0,
  outcome     TEXT CHECK (outcome IN ('success','abandoned','timeout'))
);

CREATE INDEX IF NOT EXISTS idx_focus_user_time ON focus_sessions(user_id, started_at);

-- Shop / inventory / economy
CREATE TABLE IF NOT EXISTS shop_items (
  id            INTEGER PRIMARY KEY,
  kind          TEXT NOT NULL CHECK (kind IN ('gear','cosmetic','pet','consumable','reward_slot')),
  name          TEXT NOT NULL,
  rarity        TEXT NOT NULL DEFAULT 'Common',
  cost_gold     INTEGER NOT NULL DEFAULT 0,
  cost_diamonds INTEGER NOT NULL DEFAULT 0,
  meta_json     TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS inventory (
  id        INTEGER PRIMARY KEY,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id   INTEGER NOT NULL REFERENCES shop_items(id),
  qty       INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS custom_rewards (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  cost_diamonds INTEGER NOT NULL DEFAULT 10,
  is_active     INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS economy_ledger (
  id             INTEGER PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta_gold     INTEGER NOT NULL DEFAULT 0,
  delta_diamonds INTEGER NOT NULL DEFAULT 0,
  reason         TEXT NOT NULL,
  meta_json      TEXT NOT NULL DEFAULT '{}',
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_user_time ON economy_ledger(user_id, created_at);

-- Achievements & narrative
CREATE TABLE IF NOT EXISTS achievements (
  id          INTEGER PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS narrative_events (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('promotion','demotion','questline','milestone')),
  text       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Optional FTS for quest search
CREATE VIRTUAL TABLE IF NOT EXISTS quest_search USING fts5(title, notes, content='quests', content_rowid='id');

CREATE TRIGGER IF NOT EXISTS quests_ai AFTER INSERT ON quests BEGIN
  INSERT INTO quest_search(rowid, title, notes) VALUES (new.id, new.title, new.notes);
END;
CREATE TRIGGER IF NOT EXISTS quests_ad AFTER DELETE ON quests BEGIN
  INSERT INTO quest_search(quest_search, rowid, title, notes) VALUES('delete', old.id, old.title, old.notes);
END;
CREATE TRIGGER IF NOT EXISTS quests_au AFTER UPDATE ON quests BEGIN
  INSERT INTO quest_search(quest_search, rowid, title, notes) VALUES('delete', old.id, old.title, old.notes);
  INSERT INTO quest_search(rowid, title, notes) VALUES (new.id, new.title, new.notes);
END;
