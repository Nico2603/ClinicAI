'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 1️⃣ Intentar obtener tokens del fragmento (#)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Sesión mediante flujo implícito
          console.log('Procesando callback (flujo implícito)...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          // Limpiar el hash de la URL para evitar exponer tokens
          window.history.replaceState({}, document.title, window.location.pathname);

          console.log('Sesión establecida correctamente');
          router.replace('/');
          return;
        }

        // 2️⃣ Si no hay tokens en el fragmento, intentar flujo PKCE (?code)
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        if (code) {
          console.log('Procesando callback (flujo PKCE)...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          // Limpiar los parámetros de la URL
          window.history.replaceState({}, document.title, window.location.pathname);

          console.log('Sesión establecida correctamente (PKCE)');
          router.replace('/');
          return;
        }

        // 3️⃣ Sin tokens ni código => error
        console.error('No se encontraron credenciales en la URL');
        router.replace('/?error=no_tokens');
      } catch (error) {
        console.error('Error en el callback de autenticación:', error);
        router.replace('/?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Procesando autenticación...</h2>
        <p className="text-muted-foreground">Te redirigiremos en un momento</p>
      </div>
    </div>
  );
} 