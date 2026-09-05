'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button className="icon-button" onClick={() => signOut({ callbackUrl: '/login' })}>
      Sair
    </button>
  )
}
