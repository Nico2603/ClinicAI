import React from 'react';
import LoginButton from './LoginButton';
import { Logo } from '../ui/Icons';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm md:max-w-lg lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-10 lg:p-16 xl:p-20 2xl:p-24 text-center">
          {/* Logo más grande */}
          <div className="mb-6 md:mb-8 lg:mb-12 xl:mb-16">
            <Logo size="xl" className="h-20 w-20 md:h-28 md:w-28 lg:h-36 lg:w-36 xl:h-40 xl:w-40 2xl:h-44 2xl:w-44 mx-auto mb-4 md:mb-6 lg:mb-8" />
            
            {/* Frase principal llamativa */}
            <h2 className="text-lg md:text-xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-semibold text-gray-900 dark:text-white mb-2 md:mb-3 lg:mb-4 xl:mb-6">
              Genera tu historia clínica con rapidez
            </h2>
            
            {/* Descripción atractiva */}
            <p className="text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl text-gray-600 dark:text-gray-300 mb-4 md:mb-6 lg:mb-8 xl:mb-10 max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto leading-relaxed">
              Transforma tu práctica médica con IA especializada. 
              Crea notas profesionales y precisas en segundos.
            </p>
          </div>

          {/* Botón de login */}
          <div className="mb-6 md:mb-8 lg:mb-12 xl:mb-16">
            <LoginButton />
          </div>

          {/* Beneficios clave */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 lg:gap-8 xl:gap-12 mb-6 md:mb-8 lg:mb-12 xl:mb-16 max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 lg:w-14 lg:h-14 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 bg-blue-100 dark:bg-blue-900 rounded-full mb-2 lg:mb-4">
                <svg className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 xl:w-8 xl:h-8 2xl:w-10 2xl:h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-xs md:text-sm lg:text-lg xl:text-xl 2xl:text-2xl font-medium text-gray-700 dark:text-gray-300">Rápido</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 lg:w-14 lg:h-14 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 bg-green-100 dark:bg-green-900 rounded-full mb-2 lg:mb-4">
                <svg className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 xl:w-8 xl:h-8 2xl:w-10 2xl:h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs md:text-sm lg:text-lg xl:text-xl 2xl:text-2xl font-medium text-gray-700 dark:text-gray-300">Seguro</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 lg:w-14 lg:h-14 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 bg-purple-100 dark:bg-purple-900 rounded-full mb-2 lg:mb-4">
                <svg className="w-4 h-4 md:w-5 md:h-5 lg:w-7 lg:h-7 xl:w-8 xl:h-8 2xl:w-10 2xl:h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-xs md:text-sm lg:text-lg xl:text-xl 2xl:text-2xl font-medium text-gray-700 dark:text-gray-300">Inteligente</p>
            </div>
          </div>

          {/* Términos */}
          <p className="text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl lg:max-w-3xl xl:max-w-4xl mx-auto">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 