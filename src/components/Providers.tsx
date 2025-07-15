'use client';

import React from 'react';
import { ThemeProvider } from './ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
// Opcional: Importar ReactQueryDevtools para desarrollo
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configuración optimizada de QueryClient para mejor rendimiento
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 10 minutos para datos que cambian poco
      staleTime: 1000 * 60 * 10,
      // Cache en background por 15 minutos
      gcTime: 1000 * 60 * 15,
      // Reintentos reducidos para ser más rápido
      retry: 1,
      // Tiempo de espera más corto
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // No refetch automático en focus para evitar llamadas innecesarias
      refetchOnWindowFocus: false,
      // Solo refetch en reconexión si los datos están obsoletos
      refetchOnReconnect: 'always',
      // No refetch en mount si los datos están frescos
      refetchOnMount: true,
      // Configuración para consultas en segundo plano
      refetchInterval: false,
      // Networkmode optimized
      networkMode: 'online'
    },
    mutations: {
      // Reintentos para mutations críticas
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online'
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            },
          }}
        />
      </ThemeProvider>
      {/* Descomentar para desarrollo */}
      {/* {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  );
} 