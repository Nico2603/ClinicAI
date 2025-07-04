'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Obtener el hash de la URL que contiene los parámetros de autenticación
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const expiresAt = hashParams.get('expires_at');
        const providerToken = hashParams.get('provider_token');

        if (accessToken && refreshToken) {
          // Establecer la sesión manualmente
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error estableciendo sesión:', error);
            router.push('/?error=auth_failed');
            return;
          }

          if (data.session) {
            console.log('Sesión establecida correctamente');
            // Redirigir a la página principal
            router.push('/');
          }
        } else {
          console.error('No se encontraron tokens en la URL');
          router.push('/?error=no_tokens');
        }
      } catch (error) {
        console.error('Error en el callback de autenticación:', error);
        router.push('/?error=callback_failed');
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