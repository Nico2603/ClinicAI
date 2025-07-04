import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import AuthenticatedApp from '../components/AuthenticatedApp';
import LoginPage from '../components/auth/LoginPage';
import { supabase } from '../lib/supabase';

const AuthCallbackHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Verificar si hay tokens en la URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        setIsProcessingCallback(true);
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
          setTimeout(() => setIsProcessingCallback(false), 1000);
        }
      }
    };

    handleCallback();
  }, []);

  if (isProcessingCallback) {
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

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, error } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
              Error de autenticación
            </h2>
            <p className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedApp /> : <LoginPage />;
};

const App: React.FC = () => {
  return (
    <AuthCallbackHandler>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AuthCallbackHandler>
  );
};

export default App;