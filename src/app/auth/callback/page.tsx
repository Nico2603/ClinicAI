'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { handleAuthError, delay, isClient } from '@/lib/utils';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finalizeAuth = async () => {
      if (!isClient()) return;

      try {
        // Primero verificar si hay parámetros de error en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (errorParam) {
          console.error('Error OAuth:', errorParam, errorDescription);
          setError(`Error de autenticación: ${errorDescription || errorParam}`);
          await delay(2000);
          router.replace('/?error=oauth_error');
          return;
        }

        // Procesar tokens del hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (!accessToken) {
          console.error('No se recibió access_token en el callback');
          setError('No se recibieron los tokens de autenticación');
          await delay(2000);
          router.replace('/?error=no_tokens');
          return;
        }

        // Dar tiempo a Supabase para procesar la autenticación
        await delay(1000);

        // Verificar que la sesión se haya establecido con retry
        let session = null;
        let sessionError = null;
        
        for (let i = 0; i < 3; i++) {
          const { data: { session: sessionData }, error: sessionErr } = await supabase.auth.getSession();
          session = sessionData;
          sessionError = sessionErr;
          
          if (session) break;
          if (i < 2) await delay(1000); // Esperar antes del siguiente intento
        }

        if (sessionError) {
          console.error('Error al obtener sesión:', sessionError);
          setError(handleAuthError(sessionError));
          await delay(2000);
          router.replace('/?error=session_error');
          return;
        }

        if (session) {
          // Sesión establecida correctamente
          console.log('Sesión establecida correctamente:', session.user.email);
          router.replace('/');
          return;
        }

        // Sin sesión después del callback
        console.error('No se pudo obtener la sesión luego del callback');
        setError('No se pudo establecer la sesión');
        await delay(2000);
        router.replace('/?error=no_session');

      } catch (error) {
        console.error('Error en el callback de autenticación:', error);
        setError(handleAuthError(error));
        await delay(2000);
        router.replace('/?error=callback_failed');
      }
    };

    // Ejecutar después de que el componente se monte
    const timeoutId = setTimeout(finalizeAuth, 100);
    
    return () => clearTimeout(timeoutId);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center max-w-md mx-auto p-6">
        {error ? (
          <div className="space-y-4">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Error de autenticación
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirigiendo a la página principal...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Procesando autenticación...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Te redirigiremos en un momento
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 