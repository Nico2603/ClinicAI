'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/supabase';
import { handleAuthError } from '@/lib/utils/authErrorHandler';
import { quickAuthDebug } from '@/lib/utils/authDebugger';
import { devLog, prodLog } from '@/lib/utils/logFilter';
import { delay, isClient } from '@/lib/utils';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finalizeAuth = async () => {
      if (!isClient()) return;

      try {
        // Verificar si hay parámetros de error en la URL
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

        // Detectar tipo de flujo
        const authCode = urlParams.get('code');
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (authCode) {
          devLog('🔐 Flujo PKCE detectado - Supabase procesará automáticamente...');
          prodLog('🔐 Procesando autenticación...');
        } else if (accessToken) {
          devLog('🔐 Flujo implícito detectado - Supabase procesará automáticamente...');
          prodLog('🔐 Procesando autenticación...');
        }

        // Esperar a que Supabase procese la autenticación automáticamente
        // (detectSessionInUrl: true se encarga de todo)
        await delay(2000);

        // Ejecutar diagnóstico después de que Supabase procese todo
        if (process.env.NODE_ENV === 'development') {
          devLog('🔍 Ejecutando diagnóstico post-procesamiento...');
          quickAuthDebug();
        }
        
        // Verificar que la sesión se haya establecido
        let session = null;
        let sessionError = null;
        
        for (let i = 0; i < 5; i++) {
          const { session: sessionData, error: sessionErr } = await auth.getSession();
          session = sessionData;
          sessionError = sessionErr;
          
          if (session) {
            prodLog('✅ Autenticación completada exitosamente');
            devLog('✅ Sesión establecida correctamente:', session.user?.email);
            // Limpiar URL de parámetros sensibles
            window.history.replaceState({}, document.title, window.location.pathname);
            router.replace('/');
            return;
          }
          
          if (i < 4) await delay(1000); // Esperar antes del siguiente intento
        }

        // Si llegamos aquí, hubo un problema
        if (sessionError) {
          console.error('❌ Error al obtener sesión:', sessionError);
          const authError = handleAuthError(sessionError);
          setError(authError.message);
        } else {
          console.error('❌ No se pudo establecer la sesión después del callback');
          setError('No se pudo establecer la sesión de usuario');
        }
        
        await delay(2000);
        router.replace('/?error=session_failed');

      } catch (error) {
        console.error('Error en el callback de autenticación:', error);
        const authError = handleAuthError(error);
        setError(authError.message);
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