import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

interface AuthCallbackProps {
  children: React.ReactNode;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Verificar si hay tokens en la URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        setIsProcessing(true);
        console.log('🔄 Procesando callback de OAuth...');
        
        try {
          // Establecer la sesión con los tokens obtenidos
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('❌ Error al establecer sesión:', error);
          } else {
            console.log('✅ Sesión establecida correctamente');
          }
          
          // Limpiar la URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
        } catch (error) {
          console.error('❌ Error en handleCallback:', error);
        } finally {
          setIsProcessing(false);
        }
      }
    };

    handleCallback();
  }, []);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Procesando autenticación...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthCallback; 