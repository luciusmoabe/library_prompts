import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Providers from '@/components/Providers'
import { ToastProvider } from '@/components/Toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'Promptly',
  description: 'Biblioteca de prompts do time',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  )
}
