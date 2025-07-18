'use client';

import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedApp from '@/components/AuthenticatedApp';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Icons';
import { FaGoogle, FaShieldAlt, FaBrain, FaUsers, FaClock } from 'react-icons/fa';
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-3 sm:px-4 py-4 sm:py-8 w-full">
        <div className="container max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center justify-items-center">
            
            {/* Columna izquierda - Información de la aplicación */}
            <div className="text-center lg:text-left space-y-6 lg:space-y-8 w-full max-w-2xl order-2 lg:order-1">
              {/* Logo y título principal */}
              <div>
                <div className="inline-flex items-center justify-center mb-6 lg:mb-8 mx-auto lg:mx-0">
                  <Logo size="xl" className="h-24 sm:h-32" />
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-6 lg:mb-8 px-2">
                  El futuro de las notas clínicas está aquí
                </p>
                <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-lg mx-auto lg:mx-0 px-2">
                  Transforma tu práctica médica con inteligencia artificial avanzada. 
                  Crea notas clínicas precisas, completas y profesionales en segundos.
                </p>
              </div>

              {/* Características principales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-full mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">Generación Instantánea</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Crea notas profesionales en segundos con IA especializada</p>
                </div>
                
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-full mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">Totalmente Seguro</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Cumplimiento HIPAA y encriptación de extremo a extremo</p>
                </div>
                
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-full mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">IA Especializada</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Entrenada específicamente para terminología médica</p>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">99%</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Precisión</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">2min</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Promedio por nota</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">24/7</div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Disponibilidad</div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Formulario de login */}
            <div className="w-full max-w-md mx-auto order-1 lg:order-2">
              <LoginPage />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AuthenticatedApp />;
} 