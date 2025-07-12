'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface SessionWarningDialogProps {
  // Tiempo en segundos para mostrar el aviso (por defecto 5 minutos)
  warningThreshold?: number;
  // Tiempo en segundos para auto-extender si no hay interacción (por defecto 1 minuto)
  autoExtendThreshold?: number;
}

export const SessionWarningDialog: React.FC<SessionWarningDialogProps> = ({
  warningThreshold = 300, // 5 minutos
  autoExtendThreshold = 60 // 1 minuto
}) => {
  const { sessionStatus, extendSession, forceRefresh } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isExtending, setIsExtending] = useState(false);

  // Formatear tiempo restante
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Manejar extensión de sesión
  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      const success = await extendSession();
      if (success) {
        setShowWarning(false);
        setCountdown(0);
        console.log('✅ Sesión extendida correctamente');
      } else {
        console.error('❌ Error al extender sesión');
      }
    } catch (error) {
      console.error('❌ Error al extender sesión:', error);
    } finally {
      setIsExtending(false);
    }
  };

  // Manejar cierre manual de sesión
  const handleForceRefresh = async () => {
    console.log('🔄 Usuario solicitó refresco manual');
    await forceRefresh();
  };

  // Efecto para controlar cuándo mostrar el aviso
  useEffect(() => {
    const timeRemaining = sessionStatus.timeRemaining;
    
    if (timeRemaining > 0 && timeRemaining <= warningThreshold) {
      setShowWarning(true);
      setCountdown(timeRemaining);
    } else if (timeRemaining <= 0 && sessionStatus.isExpired) {
      setShowWarning(true);
      setCountdown(0);
    } else {
      setShowWarning(false);
      setCountdown(0);
    }
  }, [sessionStatus.timeRemaining, sessionStatus.isExpired, warningThreshold]);

  // Efecto para countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-extender si queda muy poco tiempo
  useEffect(() => {
    if (countdown > 0 && countdown <= autoExtendThreshold && !isExtending) {
      console.log('🔄 Auto-extendiendo sesión...');
      handleExtendSession();
    }
  }, [countdown, autoExtendThreshold, isExtending]);

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {countdown === 0 ? 'Sesión Expirada' : 'Sesión Próxima a Expirar'}
            </h3>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {countdown === 0 ? (
              'Tu sesión ha expirado. Necesitas refrescar la página para continuar.'
            ) : (
              <>
                Tu sesión expirará en{' '}
                <span className="font-bold text-red-600 dark:text-red-400">
                  {formatTime(countdown)}
                </span>
                . ¿Deseas extender tu sesión?
              </>
            )}
          </p>
        </div>

        {sessionStatus.isStuck && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <p className="text-sm text-red-700 dark:text-red-400">
              ⚠️ La aplicación parece estar atascada. Recomendamos refrescar la página.
            </p>
          </div>
        )}

        <div className="flex space-x-3">
          {countdown > 0 ? (
            <>
              <Button
                onClick={handleExtendSession}
                disabled={isExtending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isExtending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Extendiendo...
                  </>
                ) : (
                  'Extender Sesión'
                )}
              </Button>
              <Button
                onClick={handleForceRefresh}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Refrescar Página
              </Button>
            </>
          ) : (
            <Button
              onClick={handleForceRefresh}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Refrescar Página
            </Button>
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {countdown > autoExtendThreshold ? (
              `Auto-extensión en ${formatTime(countdown - autoExtendThreshold)}`
            ) : (
              'Preparando auto-extensión...'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningDialog; 