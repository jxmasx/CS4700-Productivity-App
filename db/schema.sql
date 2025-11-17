--
-- File generated with SQLiteStudio v3.4.17 on Mon Nov 17 18:19:00 2025
--
-- Text encoding used: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: achievements
CREATE TABLE IF NOT EXISTS achievements (
  id          INTEGER PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_json TEXT NOT NULL DEFAULT '{}'
);

-- Table: avatars
CREATE TABLE IF NOT EXISTS avatars (
  user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  class       TEXT NOT NULL CHECK (class IN ('Warrior','Mage','Paladin','Rogue')),
  appearance  TEXT NOT NULL DEFAULT '{}',
  str         INTEGER NOT NULL DEFAULT 10,
  int         INTEGER NOT NULL DEFAULT 10
);

-- Table: custom_rewards
CREATE TABLE IF NOT EXISTS custom_rewards (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  cost_diamonds INTEGER NOT NULL DEFAULT 10,
  is_active     INTEGER NOT NULL DEFAULT 1
);

-- Table: daily_checkins
CREATE TABLE IF NOT EXISTS daily_checkins (
  user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_run INTEGER NOT NULL DEFAULT 0,
  last_day    TEXT NOT NULL
);

-- Table: economy_ledger
CREATE TABLE IF NOT EXISTS economy_ledger (
  id             INTEGER PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta_gold     INTEGER NOT NULL DEFAULT 0,
  delta_diamonds INTEGER NOT NULL DEFAULT 0,
  reason         TEXT NOT NULL,
  meta_json      TEXT NOT NULL DEFAULT '{}',
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table: focus_sessions
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

-- Table: inventory
CREATE TABLE IF NOT EXISTS inventory (
  id        INTEGER PRIMARY KEY,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id   INTEGER NOT NULL REFERENCES shop_items(id),
  qty       INTEGER NOT NULL DEFAULT 1
);

-- Table: narrative_events
CREATE TABLE IF NOT EXISTS narrative_events (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('promotion','demotion','questline','milestone')),
  text       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table: pending_rewards
CREATE TABLE IF NOT EXISTS pending_rewards (id TEXT PRIMARY KEY NOT NULL, user_id INTEGER NOT NULL, label TEXT, gold INTEGER NOT NULL, xp INTEGER NOT NULL);

-- Table: quest_logs
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

-- Table: quests
CREATE TABLE IF NOT EXISTS quests (id TEXT PRIMARY KEY NOT NULL, label TEXT NOT NULL, reward_xp INTEGER NOT NULL, reward_gold INTEGER, status_message TEXT);

-- Table: shop_items
CREATE TABLE IF NOT EXISTS shop_items (
  id            INTEGER PRIMARY KEY,
  kind          TEXT NOT NULL CHECK (kind IN ('gear','cosmetic','pet','consumable','reward_slot')),
  name          TEXT NOT NULL,
  rarity        TEXT NOT NULL DEFAULT 'Common',
  cost_gold     INTEGER NOT NULL DEFAULT 0,
  cost_diamonds INTEGER NOT NULL DEFAULT 0,
  meta_json     TEXT NOT NULL DEFAULT '{}'
);

-- Table: streaks
CREATE TABLE IF NOT EXISTS streaks (
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id  INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  count     INTEGER NOT NULL DEFAULT 0,
  last_day  TEXT NOT NULL,
  PRIMARY KEY (user_id, quest_id)
);

-- Table: tasks
CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY NOT NULL, user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE, title TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('Habit', 'Daily', 'To-Do')), category TEXT NOT NULL, difficulty TEXT NOT NULL, due_at TEXT, done INTEGER NOT NULL, poms_done INTEGER, poms_estimate INTEGER);

-- Table: user_achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, achievement_id)
);

-- Table: user_passwords
CREATE TABLE IF NOT EXISTS user_passwords (
            user_id INTEGER UNIQUE,
            pass_hash BLOB NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
          );

-- Table: user_quests
CREATE TABLE IF NOT EXISTS user_quests (id INTEGER PRIMARY KEY UNIQUE NOT NULL, user_id INTEGER NOT NULL REFERENCES users (id), quest_id TEXT NOT NULL REFERENCES quests (id), is_done INTEGER NOT NULL DEFAULT (0), completed_at TEXT NOT NULL);

-- Table: users
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), level INTEGER NOT NULL DEFAULT 1, xp INTEGER NOT NULL DEFAULT 0, xp_max INTEGER NOT NULL DEFAULT (100), hp INTEGER NOT NULL DEFAULT 100, mana INTEGER NOT NULL DEFAULT 50, gold INTEGER NOT NULL DEFAULT 0, diamonds INTEGER NOT NULL DEFAULT 0, guild_rank TEXT NOT NULL DEFAULT 'Bronze', guild_streak INTEGER NOT NULL DEFAULT (0), strength INTEGER NOT NULL DEFAULT (0), dexterity INTEGER NOT NULL DEFAULT (0), intelligence INTEGER NOT NULL DEFAULT (0), wisdom INTEGER NOT NULL DEFAULT (0), charisma INTEGER NOT NULL DEFAULT (0), user_class TEXT NOT NULL DEFAULT Classless, last_rollover TEXT);

-- Index: idx_focus_user_time
CREATE INDEX IF NOT EXISTS idx_focus_user_time ON focus_sessions(user_id, started_at);

-- Index: idx_inventory_user
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);

-- Index: idx_ledger_user_time
CREATE INDEX IF NOT EXISTS idx_ledger_user_time ON economy_ledger(user_id, created_at);

-- Index: idx_quest_logs_user_time
CREATE INDEX IF NOT EXISTS idx_quest_logs_user_time ON quest_logs(user_id, logged_at);

-- Trigger: quests_ad
CREATE TRIGGER IF NOT EXISTS quests_ad AFTER DELETE ON quests BEGIN INSERT INTO quest_search (quest_search, rowid, title, notes) VALUES ('delete', old.id, old.title, old.notes); END;

-- Trigger: quests_ai
CREATE TRIGGER IF NOT EXISTS quests_ai AFTER INSERT ON quests BEGIN INSERT INTO quest_search (rowid, title, notes) VALUES (new.id, new.title, new.notes); END;

-- Trigger: quests_au
CREATE TRIGGER IF NOT EXISTS quests_au AFTER UPDATE ON quests BEGIN INSERT INTO quest_search (quest_search, rowid, title, notes) VALUES ('delete', old.id, old.title, old.notes); INSERT INTO quest_search (rowid, title, notes) VALUES (new.id, new.title, new.notes); END;

COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
