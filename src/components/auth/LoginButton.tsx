import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginButtonProps {
  className?: string;
}

const LoginButton: React.FC<LoginButtonProps> = ({ className = '' }) => {
  const { signIn, isLoading, error } = useAuth();

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (err) {
      console.error('Error during sign in:', err);
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="w-full max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl flex items-center justify-center px-6 py-3 md:px-8 md:py-4 lg:px-10 lg:py-5 xl:px-12 xl:py-6 2xl:px-14 2xl:py-7 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 2xl:w-10 2xl:h-10 mr-3 lg:mr-4 xl:mr-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isLoading ? 'Iniciando sesión...' : 'Continuar con Google'}
      </button>
      
      {error && (
        <div className="w-full max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl p-3 lg:p-4 xl:p-5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm lg:text-base xl:text-lg 2xl:text-xl rounded-lg text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default LoginButton; 