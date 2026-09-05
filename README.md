# Promptly

Biblioteca de prompts do time — Next.js (App Router, TypeScript) + Postgres (Neon) + autenticação real via next-auth.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Postgres no [Neon](https://neon.tech), acessado via `@neondatabase/serverless`
- Autenticação com `next-auth` (credenciais + bcrypt), papéis `Administrador` / `Editor` / `Leitor`
- Lint com [oxlint](https://oxc.rs)

## Configuração local

1. Copie `.env.example` para `.env.local` e preencha:
   - `DATABASE_URL`: connection string do Neon
   - `NEXTAUTH_SECRET`: um valor aleatório (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Rode o schema + seed (usuários, categorias e prompts de demonstração) contra o banco:
   ```bash
   npm run seed
   ```
4. Suba o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000`.

## Contas de demonstração (criadas pelo seed)

| Papel | E-mail | Senha |
|---|---|---|
| Administrador | `lucas@promptly.dev` | `admin` |
| Editor | `marina@promptly.dev` | `editor` |
| Leitor | `rafael@promptly.dev` | `leitor` |

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — serve o build de produção
- `npm run lint` — oxlint
- `npm run seed` — cria o schema (se não existir) e popula os dados de demonstração
