'use client';

import { useAuth } from '@/contexts/AuthContext';
import AuthenticatedApp from '@/components/AuthenticatedApp';
import { Button } from '@/components/ui/button';
import { FaGoogle, FaStethoscope, FaShieldAlt, FaBrain, FaUsers, FaClock } from 'react-icons/fa';
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
      <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8 w-full">
        <div className="container max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center justify-items-center">
            
            {/* Columna izquierda - Información de la aplicación */}
            <div className="text-center lg:text-left space-y-8 w-full max-w-2xl">
              {/* Logo y título principal */}
              <div>
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-6 mx-auto lg:mx-0">
                  <FaStethoscope className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Notas-AI
                  </span>
                </h1>
                <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8">
                  El futuro de las notas clínicas está aquí
                </p>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-lg mx-auto lg:mx-0">
                  Transforma tu práctica médica con inteligencia artificial avanzada. 
                  Crea notas clínicas precisas, completas y profesionales en segundos.
                </p>
              </div>

              {/* Características principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <FaBrain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">IA Especializada</h3>
                    <p className="text-gray-600 dark:text-gray-400">Entrenada específicamente para terminología médica</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <FaClock className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ahorro de Tiempo</h3>
                    <p className="text-gray-600 dark:text-gray-400">Reduce el tiempo de documentación en un 80%</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <FaShieldAlt className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seguridad Total</h3>
                    <p className="text-gray-600 dark:text-gray-400">Cumple con estándares HIPAA y protección de datos</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                      <FaUsers className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Multi-especialidad</h3>
                    <p className="text-gray-600 dark:text-gray-400">Adaptado para todas las especialidades médicas</p>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">99%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Precisión</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">2min</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Promedio por nota</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">24/7</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Disponibilidad</div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Formulario de login */}
            <div className="w-full max-w-lg mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Comienza ahora
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Únete a miles de profesionales que ya confían en Notas-AI
                  </p>
                </div>

                <div className="space-y-6">
                  <Button
                    onClick={signIn}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
                    size="lg"
                    disabled={isLoading}
                  >
                    <FaGoogle className="h-5 w-5" />
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Cargando...
                      </>
                    ) : (
                      'Iniciar sesión con Google'
                    )}
                  </Button>
                  
                  {displayError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex">
                        <div className="text-red-400">
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800 dark:text-red-200">
                            {displayError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Al continuar, aceptas nuestros{' '}
                      <a href="/legal" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                        términos de servicio
                      </a>{' '}
                      y{' '}
                      <a href="/legal" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                        política de privacidad
                      </a>
                    </p>
                  </div>
                </div>

                {/* Beneficios adicionales */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 text-center">
                    ¿Por qué elegir Notas-AI?
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Gratis durante los primeros 30 días</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Sin cláusulas de permanencia</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AuthenticatedApp />;
} 