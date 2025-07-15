import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface SessionExpiryConfig {
  // Tiempo de expiración en milisegundos (por defecto 55 minutos - 5 min antes del límite de Supabase)
  sessionTimeoutMs?: number;
  // Habilitar o deshabilitar el hook (por defecto true)
  enabled?: boolean;
  // Callback cuando la sesión expira
  onSessionExpiry?: () => void;
  // Callback para limpiar datos locales
  onCleanupLocalData?: () => void;
}

export const useSessionExpiry = (config: SessionExpiryConfig = {}) => {
  const {
    sessionTimeoutMs = 55 * 60 * 1000, // 55 minutos (5 min antes del límite de Supabase)
    enabled = true,
    onSessionExpiry,
    onCleanupLocalData
  } = config;

  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(true);

  // Limpiar datos locales específicos del usuario (simplificado)
  const clearUserLocalStorage = useCallback((userId?: string) => {
    if (!userId) return;
    
    try {
      // Solo limpiar claves específicas de la app
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.includes(userId) || key.startsWith('notasai_')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Error limpiando localStorage:', error);
    }
  }, []);

  // Reiniciar el timer de sesión
  const resetSessionTimer = useCallback(() => {
    if (!enabled) return;
    
    // Limpiar timer existente
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

    // Configurar nuevo timer - usar una función inline para evitar dependencia circular
    sessionTimeoutRef.current = setTimeout(async () => {
      if (!isActiveRef.current) return;
      
      console.log('🔄 Sesión expirada, renovando automáticamente...');
      
      try {
        // Intentar refrescar la sesión
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error || !data.session) {
          // Si no se puede refrescar, cerrar sesión
          console.log('❌ No se pudo renovar la sesión, cerrando...');
          const { data: { user } } = await supabase.auth.getUser();
          clearUserLocalStorage(user?.id);
          onCleanupLocalData?.();
          await supabase.auth.signOut();
          onSessionExpiry?.();
          return;
        }

        // Sesión renovada exitosamente
        console.log('✅ Sesión renovada automáticamente');
        // Llamar recursivamente para reiniciar el timer
        resetSessionTimer();
        
      } catch (error) {
        console.error('❌ Error durante renovación de sesión:', error);
        // En caso de error, simplemente cerrar sesión
        await supabase.auth.signOut();
        onSessionExpiry?.();
      }
    }, sessionTimeoutMs);
  }, [enabled, sessionTimeoutMs, clearUserLocalStorage, onCleanupLocalData, onSessionExpiry]);

  // Manejar expiración de sesión de forma más simple
  const handleSessionExpiry = useCallback(async () => {
    resetSessionTimer();
  }, [resetSessionTimer]);

  // Registrar actividad del usuario (simplificado)
  const registerActivity = useCallback(() => {
    if (!enabled) return;
    resetSessionTimer();
  }, [enabled, resetSessionTimer]);

  // Extender sesión manualmente
  const extendSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        return false;
      }

      resetSessionTimer();
      return true;
    } catch (error) {
      console.error('Error extendiendo sesión:', error);
      return false;
    }
  }, [resetSessionTimer]);

  // Configurar event listeners simplificados
  useEffect(() => {
    if (!enabled) return;

    // Inicializar timer
    resetSessionTimer();

    // Escuchar actividad del usuario (solo eventos importantes)
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const activityHandler = registerActivity;

    events.forEach(event => {
      document.addEventListener(event, activityHandler, { passive: true });
    });

    // Limpiar al desmontar
    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, activityHandler);
      });
      isActiveRef.current = false;
    };
  }, [enabled, resetSessionTimer, registerActivity]);

  return {
    extendSession,
    registerActivity,
    resetSessionTimer: resetSessionTimer
  };
}; 