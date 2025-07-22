/**
 * ClínicAI - Asistente de IA para Notas Clínicas
 * 
 * Autor: Nicolas Ceballos Brito
 * Portfolio: https://nico2603.github.io/PersonalPage/
 * GitHub: https://github.com/Nico2603
 * LinkedIn: https://www.linkedin.com/in/nicolas-ceballos-brito/
 * 
 * Desarrollado para Teilur.ai
 */

'use client';

import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedApp from '@/components/AuthenticatedApp';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginPage from '@/components/auth/LoginPage';

export default function HomePage() {
  const { user, isLoading, signIn, error: authError, mounted } = useAuth();
  const [urlError, setUrlError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
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

  // Timeout de seguridad para el estado de carga
  useEffect(() => {
    if (isLoading && mounted) {
      const timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15000); // 15 segundos timeout

      return () => clearTimeout(timeoutId);
    }
    return undefined; // Retornar undefined si no hay cleanup
  }, [isLoading, mounted]);

  const displayError = authError || urlError;

  // Mostrar indicador de carga solo si realmente está cargando y no ha pasado el timeout
  if ((!mounted || isLoading) && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si hubo timeout de carga, mostrar error
  if (loadingTimeout && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error de conexión</strong>
            <span className="block sm:inline"> - La aplicación está tardando demasiado en cargar. Por favor, recarga la página.</span>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Recargar página
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
} 