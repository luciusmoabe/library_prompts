CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL CHECK (role IN ('Administrador', 'Editor', 'Leitor')),
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prompts (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  category     TEXT NOT NULL,
  content      TEXT NOT NULL,
  purpose      TEXT NOT NULL DEFAULT '',
  when_to_use  TEXT NOT NULL DEFAULT '',
  owner_id     INTEGER NOT NULL REFERENCES users(id),
  favorite     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE prompts ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT '';
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS when_to_use TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS prompt_attachments (
  id        SERIAL PRIMARY KEY,
  prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  size      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prompts_owner_id ON prompts(owner_id);
CREATE INDEX IF NOT EXISTS idx_prompt_attachments_prompt_id ON prompt_attachments(prompt_id);
