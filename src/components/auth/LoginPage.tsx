import React from 'react';
import LoginButton from './LoginButton';
import { Logo } from '../ui/Icons';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-3 sm:px-4 py-4 sm:py-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          {/* Logo */}
          <div className="mx-auto mb-4 sm:mb-6 flex justify-center">
            <Logo size="xl" className="h-16 sm:h-20" />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ClinicAI
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 px-2">
            Asistente inteligente para notas clínicas
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Iniciar sesión
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-2">
              Accede a tu cuenta para comenzar a crear notas clínicas con IA
            </p>
          </div>

          <LoginButton />

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 px-2 leading-relaxed">
              Al continuar, aceptas nuestros términos de servicio y política de privacidad
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-6 sm:mt-8">
          {/* Feature principal */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 sm:p-4 text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full mb-2">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Generación rápida</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Crea notas clínicas en segundos</p>
          </div>

          {/* Features secundarias */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 sm:p-4 text-center">
              <div className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900 rounded-full mb-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Seguro</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Datos protegidos</p>
            </div>
            
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 sm:p-4 text-center">
              <div className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 dark:bg-purple-900 rounded-full mb-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">IA avanzada</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Precisión médica</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 