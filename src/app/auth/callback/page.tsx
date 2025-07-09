'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const finalizeAuth = async () => {
      try {
        // Esperar a que Supabase procese la URL y establezca la sesión automáticamente
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // Sesión encontrada, redirigir al inicio
          router.replace('/');
          return;
        }

        // Sin sesión => error
        console.error('No se pudo obtener la sesión luego del callback');
        router.replace('/?error=no_session');
      } catch (error) {
        console.error('Error en el callback de autenticación:', error);
        router.replace('/?error=callback_failed');
      }
    };

    finalizeAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Procesando autenticación...</h2>
        <p className="text-muted-foreground">Te redirigiremos en un momento</p>
      </div>
    </div>
  );
} 