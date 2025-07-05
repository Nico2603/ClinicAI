import type { Metadata, Viewport } from 'next'
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Notas-AI" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={inter.className + " min-h-screen"}>
        <ClientOnly fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        }>
          <Providers>
            <AuthProvider>
              <div className="flex flex-row min-h-screen w-full">
                {/* Sidebar a la izquierda */}
                {/* El Sidebar se inyecta desde el children en AuthenticatedApp, así que solo estructuramos el espacio */}
                {children}
              </div>
            </AuthProvider>
          </Providers>
        </ClientOnly>
        <footer className="w-full bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 mt-0 text-neutral-700 dark:text-neutral-200 transition-colors duration-300">
          <div className="container-app py-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            {/* Marca */}
            <div className="md:col-span-1 flex flex-col gap-2">
              <span className="text-2xl font-bold gradient-text">Notas<span className="text-primary">AI</span></span>
              <span className="text-xs text-neutral-600 dark:text-neutral-400">© {new Date().getFullYear()} Notas-AI.<br/>Todos los derechos reservados.</span>
            </div>
            {/* Legal */}
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-neutral-800 dark:text-neutral-100 mb-1">LEGAL</span>
              <a href="/legal" className="hover:underline text-neutral-700 dark:text-neutral-300">Términos y Condiciones</a>
            </div>
            {/* Contacto */}
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-neutral-800 dark:text-neutral-100 mb-1">CONTACTO</span>
              <span className="text-neutral-700 dark:text-neutral-300">2093 Philadelphia Pike #9001</span>
              <span className="text-neutral-700 dark:text-neutral-300">Claymont, DE, 19703, United States</span>
              <span className="text-neutral-700 dark:text-neutral-300">+1 (347) 654 4961</span>
              <span className="text-neutral-700 dark:text-neutral-300">talent@teilur.com</span>
            </div>
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 pb-2 px-4 text-xs text-neutral-500 dark:text-neutral-400 text-center">
            <span className="font-bold">AVISO LEGAL:</span> Notas-AI proporciona únicamente acompañamiento y asistencia basada en inteligencia artificial. No es un servicio de salud mental ni reemplaza la atención profesional. Consulta siempre a un profesional de la salud mental para diagnóstico o tratamiento.
            <br className="hidden md:block" />
            <span className="block mt-2 text-neutral-500 dark:text-neutral-500">En caso de emergencia, contacta a la línea nacional de salud mental de tu país.</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
