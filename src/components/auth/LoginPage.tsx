import React from 'react';
import LoginButton from './LoginButton';
import { Logo } from '../ui/Icons';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Logo */}
          <div className="mb-8">
            <Logo size="xl" className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              ClinicAI
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Asistente inteligente para notas clínicas
            </p>
          </div>

          {/* Botón de login */}
          <div className="mb-6">
            <LoginButton />
          </div>

          {/* Términos */}
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 