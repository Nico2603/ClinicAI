import React from 'react';
import { Button } from './button';
import { LoadingSpinner } from './Icons';

interface LoadingFallbackProps {
  isLoading: boolean;
  error: string | null;
  hasTimeout?: boolean;
  onRetry?: () => void;
  loadingMessage?: string;
  emptyMessage?: string;
  className?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  isLoading,
  error,
  hasTimeout = false,
  onRetry,
  loadingMessage = 'Cargando...',
  emptyMessage = 'No hay contenido para mostrar.',
  className = ''
}) => {
  // Estado de carga
  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 space-y-4 ${className}`}>
        <LoadingSpinner className="text-primary" />
        <p className="text-gray-600 dark:text-gray-300 text-sm">{loadingMessage}</p>
      </div>
    );
  }

  // Estado de error con timeout
  if (error && hasTimeout) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 space-y-4 ${className}`}>
        <div className="bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300 rounded-lg p-4 text-center max-w-md">
          <div className="flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Carga Lenta</h3>
          <p className="text-sm mb-4">{error}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reintentar
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Estado de error general
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 space-y-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300 rounded-lg p-4 text-center max-w-md">
          <div className="flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Error de Conexión</h3>
          <p className="text-sm mb-4">{error}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reintentar
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Estado vacío (sin error, sin carga)
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center text-gray-500 dark:text-gray-400">
        <svg className="mx-auto h-12 w-12 mb-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    </div>
  );
}; 