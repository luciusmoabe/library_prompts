'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/',
    })
    setLoading(false)
    if (result?.error) {
      setError('E-mail ou senha inválidos.')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <h1>✦ Promptly</h1>
        <p>Entre para acessar a biblioteca de prompts do time.</p>
        <form onSubmit={handleSubmit}>
          <label>
            E-mail
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Senha
            <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button className="use-button" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          {error && <p className="login-error">{error}</p>}
        </form>
      </div>
    </div>
  )
}
