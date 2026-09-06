import { neon } from '@neondatabase/serverless'

type SqlFn = ReturnType<typeof neon<false, false>>

let cached: SqlFn | undefined

function getClient(): SqlFn {
  if (!cached) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set')
    }
    cached = neon(process.env.DATABASE_URL)
  }
  return cached
}

// Lazy wrapper: some platforms (e.g. Vercel "Sensitive" env vars) only expose
// DATABASE_URL to the running function, not to Next.js's build-time page-data
// collection step, which imports every route module just to inspect it.
// Reading process.env.DATABASE_URL eagerly at module scope broke the build.
// A Proxy (rather than a plain wrapper function) keeps sql's real, overloaded
// tagged-template type intact so call sites still get correctly typed rows.
export const sql = new Proxy(() => {}, {
  apply(_target, thisArg, args) {
    return Reflect.apply(getClient() as unknown as (...a: unknown[]) => unknown, thisArg, args)
  },
}) as unknown as SqlFn
