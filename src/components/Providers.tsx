'use client';

import React from 'react';
import { ThemeProvider } from './ThemeProvider';
import { Toaster } from 'sonner';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
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
  );
} 