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
    )
  `
  await sql`ALTER TABLE prompts ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT ''`
  await sql`ALTER TABLE prompts ADD COLUMN IF NOT EXISTS when_to_use TEXT NOT NULL DEFAULT ''`
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

  const seedPrompts = [
    {
      title: 'Estratégia de conteúdo',
      description: 'Transforme ideias soltas em um plano editorial claro e acionável.',
      category: 'Marketing',
      content:
        'Atue como estrategista de conteúdo. Crie um plano editorial para {{marca}}, considerando o público {{publico}} e o objetivo {{objetivo}}.',
      purpose: 'Estrutura um plano editorial completo a partir de poucas informações sobre a marca, o público e o objetivo da campanha.',
      whenToUse: 'Quando você precisa organizar a produção de conteúdo do mês, mas ainda não tem um plano formal — só ideias soltas.',
      ownerEmail: 'lucas@promptly.dev',
      favorite: true,
    },
    {
      title: 'Refatoração de código',
      description: 'Revise código legado com foco em legibilidade, testes e manutenção.',
      category: 'Desenvolvimento',
      content: 'Analise o código abaixo como um engenheiro sênior. Aponte riscos e escreva os testes essenciais.\n\n{{codigo}}',
      purpose: 'Revisa um trecho de código legado, apontando riscos técnicos e sugerindo os testes automatizados mais importantes.',
      whenToUse: 'Antes de mexer em um código antigo sem testes, ou quando quer uma segunda opinião técnica antes de um PR.',
      ownerEmail: 'marina@promptly.dev',
      favorite: true,
    },
    {
      title: 'Síntese de reunião',
      description: 'Converta transcrições longas em decisões e próximos passos.',
      category: 'Produtividade',
      content: 'Resuma a reunião abaixo em decisões, responsáveis, prazos e perguntas em aberto.\n\n{{transcricao}}',
      purpose: 'Transforma a transcrição bruta de uma reunião em um resumo objetivo: decisões, responsáveis, prazos e pendências.',
      whenToUse: 'Logo depois de uma reunião longa, quando ninguém tem tempo de reler a transcrição inteira para extrair os próximos passos.',
      ownerEmail: 'lucas@promptly.dev',
      favorite: false,
    },
  ] as const

  if (existingPrompts[0].count === 0) {
    const insertedIds: number[] = []
    for (const p of seedPrompts) {
      const [row] = await sql`
        INSERT INTO prompts (title, description, category, content, purpose, when_to_use, owner_id, favorite)
        VALUES (${p.title}, ${p.description}, ${p.category}, ${p.content}, ${p.purpose}, ${p.whenToUse}, ${userIds[p.ownerEmail]}, ${p.favorite})
        RETURNING id
      `
      insertedIds.push(row.id)
    }
    promptCount = seedPrompts.length

    await sql`
      INSERT INTO prompt_attachments (prompt_id, name, size)
      VALUES (${insertedIds[1]}, 'checklist-refatoracao.pdf', '248 KB')
    `
    attachmentCount = 1
  }

  // Backfill purpose/when_to_use on rows created before these columns existed.
  for (const p of seedPrompts) {
    await sql`
      UPDATE prompts SET purpose = ${p.purpose}, when_to_use = ${p.whenToUse}
      WHERE title = ${p.title} AND purpose = ''
    `
  }

  console.log(`Seed concluído: ${seedUsers.length} usuários, ${seedCategories.length} categorias, ${promptCount} prompts, ${attachmentCount} anexos.`)
}

main().catch((err) => {
  console.error('Erro ao rodar o seed:', err)
  process.exit(1)
})
