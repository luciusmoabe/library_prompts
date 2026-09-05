import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      role          TEXT NOT NULL CHECK (role IN ('Administrador', 'Editor', 'Leitor')),
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS prompts (
      id          SERIAL PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT NOT NULL,
      category    TEXT NOT NULL,
      content     TEXT NOT NULL,
      owner_id    INTEGER NOT NULL REFERENCES users(id),
      favorite    BOOLEAN NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS prompt_attachments (
      id        SERIAL PRIMARY KEY,
      prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
      name      TEXT NOT NULL,
      size      TEXT NOT NULL
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_prompts_owner_id ON prompts(owner_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_prompt_attachments_prompt_id ON prompt_attachments(prompt_id)`

  const seedUsers = [
    { name: 'Lucas Costa', email: 'lucas@promptly.dev', role: 'Administrador', password: 'admin' },
    { name: 'Marina Alves', email: 'marina@promptly.dev', role: 'Editor', password: 'editor' },
    { name: 'Rafael Lima', email: 'rafael@promptly.dev', role: 'Leitor', password: 'leitor' },
  ] as const

  const userIds: Record<string, number> = {}
  for (const user of seedUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10)
    const [row] = await sql`
      INSERT INTO users (name, email, role, password_hash)
      VALUES (${user.name}, ${user.email}, ${user.role}, ${passwordHash})
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, email
    `
    userIds[row.email] = row.id
  }

  const seedCategories = ['Marketing', 'Desenvolvimento', 'Produtividade', 'Pesquisa', 'Produto']
  for (const name of seedCategories) {
    await sql`INSERT INTO categories (name) VALUES (${name}) ON CONFLICT (name) DO NOTHING`
  }

  const existingPrompts = await sql`SELECT COUNT(*)::int AS count FROM prompts`
  let promptCount = 0
  let attachmentCount = 0

  if (existingPrompts[0].count === 0) {
    const [prompt1] = await sql`
      INSERT INTO prompts (title, description, category, content, owner_id, favorite)
      VALUES (
        'Estratégia de conteúdo',
        'Transforme ideias soltas em um plano editorial claro e acionável.',
        'Marketing',
        'Atue como estrategista de conteúdo. Crie um plano editorial para {{marca}}, considerando o público {{publico}} e o objetivo {{objetivo}}.',
        ${userIds['lucas@promptly.dev']},
        true
      )
      RETURNING id
    `
    const [prompt2] = await sql`
      INSERT INTO prompts (title, description, category, content, owner_id, favorite)
      VALUES (
        'Refatoração de código',
        'Revise código legado com foco em legibilidade, testes e manutenção.',
        'Desenvolvimento',
        E'Analise o código abaixo como um engenheiro sênior. Aponte riscos e escreva os testes essenciais.\n\n{{codigo}}',
        ${userIds['marina@promptly.dev']},
        true
      )
      RETURNING id
    `
    const [prompt3] = await sql`
      INSERT INTO prompts (title, description, category, content, owner_id, favorite)
      VALUES (
        'Síntese de reunião',
        'Converta transcrições longas em decisões e próximos passos.',
        'Produtividade',
        E'Resuma a reunião abaixo em decisões, responsáveis, prazos e perguntas em aberto.\n\n{{transcricao}}',
        ${userIds['lucas@promptly.dev']},
        false
      )
      RETURNING id
    `
    promptCount = 3

    await sql`
      INSERT INTO prompt_attachments (prompt_id, name, size)
      VALUES (${prompt2.id}, 'checklist-refatoracao.pdf', '248 KB')
    `
    attachmentCount = 1
    void prompt1
    void prompt3
  }

  console.log(`Seed concluído: ${seedUsers.length} usuários, ${seedCategories.length} categorias, ${promptCount} prompts, ${attachmentCount} anexos.`)
}

main().catch((err) => {
  console.error('Erro ao rodar o seed:', err)
  process.exit(1)
})
