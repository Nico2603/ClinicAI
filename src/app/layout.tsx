import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import { AuthProvider } from '@/contexts/AuthContext'
import NoSSR from '@/components/NoSSR'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Notas-AI - Asistente de IA para Notas Clínicas',
  description: 'Genera notas clínicas profesionales con IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <NoSSR fallback={<div className="min-h-screen bg-gray-50" />}>
          <Providers>
            <AuthProvider>
              {children}
            </AuthProvider>
          </Providers>
        </NoSSR>
      </body>
    </html>
  )
}
