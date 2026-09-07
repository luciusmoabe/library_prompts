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

-- Tags substituindo categoria única
CREATE TABLE IF NOT EXISTS tags (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prompt_tags (
  prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  tag_id    INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (prompt_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag_id ON prompt_tags(tag_id);

-- Migração de dados: categories -> tags (idempotente; só age se a coluna
-- category ainda existir em prompts)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'category'
  ) THEN
    INSERT INTO tags (name) SELECT name FROM categories ON CONFLICT (name) DO NOTHING;
    INSERT INTO prompt_tags (prompt_id, tag_id)
      SELECT p.id, t.id FROM prompts p JOIN tags t ON t.name = p.category
      ON CONFLICT DO NOTHING;
    ALTER TABLE prompts DROP COLUMN category;
    DROP TABLE IF EXISTS categories;
  END IF;
END $$;

-- Histórico de versões
CREATE TABLE IF NOT EXISTS prompt_versions (
  id          SERIAL PRIMARY KEY,
  prompt_id   INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  content     TEXT NOT NULL,
  purpose     TEXT NOT NULL,
  when_to_use TEXT NOT NULL,
  edited_by   INTEGER REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);

-- Privacidade
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'shared'
  CHECK (visibility IN ('shared', 'private'));

-- Anexos reais (Vercel Blob)
ALTER TABLE prompt_attachments ADD COLUMN IF NOT EXISTS url TEXT;
