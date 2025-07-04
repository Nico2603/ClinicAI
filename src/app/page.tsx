'use client';

import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedApp from '@/components/AuthenticatedApp';
import { Button } from '@/components/ui/button';
import { FaGoogle } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function HomePage() {
  const { user, isLoading, signIn, error: authError, mounted } = useAuth();
  const [urlError, setUrlError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Verificar si hay errores en la URL
    const error = searchParams.get('error');
    if (error) {
      switch (error) {
        case 'auth_failed':
          setUrlError('Error al establecer la sesión. Intenta de nuevo.');
          break;
        case 'no_tokens':
          setUrlError('No se recibieron los tokens de autenticación. Intenta de nuevo.');
          break;
        case 'callback_failed':
          setUrlError('Error en el proceso de autenticación. Intenta de nuevo.');
          break;
        default:
          setUrlError('Error desconocido en la autenticación. Intenta de nuevo.');
      }
    }
  }, [searchParams]);

  const displayError = authError || urlError;

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-soft border">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bienvenido a <span className="gradient-text">Notas-AI</span>
            </h1>
            <p className="text-muted-foreground mb-8">
              Tu asistente de IA para notas clínicas
            </p>
          </div>
          
          <div className="space-y-4">
            <Button
              onClick={signIn}
              className="w-full btn-primary flex items-center justify-center gap-2"
              size="lg"
              disabled={isLoading}
            >
              <FaGoogle className="h-5 w-5" />
              {isLoading ? 'Cargando...' : 'Iniciar sesión con Google'}
            </Button>
            
            {displayError && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
                {displayError}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <AuthenticatedApp />;
} 