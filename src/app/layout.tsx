import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import { AuthProvider } from '@/contexts/AuthContext'
import ClientOnly from '@/components/ClientOnly'

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
        <ClientOnly fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        }>
          <Providers>
            <AuthProvider>
              {children}
            </AuthProvider>
          </Providers>
        </ClientOnly>
      </body>
    </html>
  )
}
