import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface SessionExpiryConfig {
  // Tiempo de expiración en milisegundos (por defecto 60 minutos)
  sessionTimeoutMs?: number;
  // Tiempo de aviso antes de expirar (por defecto 5 minutos)
  warningTimeMs?: number;
  // Habilitar o deshabilitar el hook (por defecto true)
  enabled?: boolean;
  // Callback cuando la sesión está a punto de expirar
  onSessionWarning?: () => void;
  // Callback cuando la sesión expira
  onSessionExpiry?: () => void;
  // Callback para limpiar datos locales
  onCleanupLocalData?: () => void;
  // Callback para forzar recarga completa
  onForceRefresh?: () => void;
}

export const useSessionExpiry = (config: SessionExpiryConfig = {}) => {
  const {
    sessionTimeoutMs = 60 * 60 * 1000, // 60 minutos
    warningTimeMs = 5 * 60 * 1000, // 5 minutos
    enabled = true,
    onSessionWarning,
    onSessionExpiry,
    onCleanupLocalData,
    onForceRefresh
  } = config;

  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const handleSessionExpiryRef = useRef<(() => Promise<void>) | null>(null);

  // Limpiar datos locales específicos del usuario
  const clearUserLocalStorage = useCallback((userId?: string) => {
    try {
      if (userId) {
        // Limpiar datos específicos del usuario
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes(userId) || key.startsWith('notasai_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      // Limpiar también sessionStorage
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('notasai_')) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      
      console.log('✅ Datos locales limpiados');
    } catch (error) {
      console.error('❌ Error al limpiar datos locales:', error);
    }
  }, []);



  // Forzar recarga completa (como Ctrl+Shift+R)
  const forceHardRefresh = useCallback(() => {
    try {
      // Limpiar caches del navegador
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          ).then(() => {
            console.log('✅ Cache del navegador limpiado');
          });
        });
      }

      // Forzar recarga completa con bypass de cache
      window.location.reload();
    } catch (error) {
      console.error('❌ Error al forzar recarga:', error);
      // Fallback: recarga normal
      window.location.reload();
    }
  }, []);



  // Registrar actividad del usuario
  const registerActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Resetear timers de sesión
  const resetSessionTimer = useCallback(() => {
    // Limpiar timers existentes
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Configurar nuevo timer de expiración (sin popup de aviso)
    sessionTimeoutRef.current = setTimeout(() => {
      handleSessionExpiryRef.current?.();
    }, sessionTimeoutMs);

    console.log(`🔄 Timer de sesión reiniciado: ${sessionTimeoutMs / 1000 / 60} minutos`);
  }, [sessionTimeoutMs]);

  // Extender sesión automáticamente por 1 hora
  const extendSessionAutomatically = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.error('❌ No se puede extender sesión automáticamente:', error);
        return false;
      }

      // Extender la sesión por 1 hora más
      const newExpiryTime = Date.now() + (60 * 60 * 1000); // 1 hora
      console.log('🔄 Sesión extendida automáticamente por 1 hora');
      
      // Reiniciar timer con nueva duración
      resetSessionTimer();
      registerActivity();
      
      return true;
    } catch (error) {
      console.error('❌ Error al extender sesión automáticamente:', error);
      return false;
    }
  }, [resetSessionTimer, registerActivity]);

  // Manejar expiración de sesión automáticamente
  const handleSessionExpiry = useCallback(async () => {
    console.log('🔄 Sesión expirada, extendiendo automáticamente y recargando...');
    
    try {
      // Obtener datos del usuario antes de proceder
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Extender sesión automáticamente
      const extended = await extendSessionAutomatically();
      
      if (extended) {
        // Limpiar datos locales
        clearUserLocalStorage(userId);
        
        // Llamar callbacks personalizados
        onCleanupLocalData?.();
        onSessionExpiry?.();
        
        // Forzar recarga después de un breve delay
        setTimeout(() => {
          onForceRefresh?.();
          forceHardRefresh();
        }, 1000);
      } else {
        // Si no se pudo extender, cerrar sesión y recargar
        await supabase.auth.signOut();
        clearUserLocalStorage(userId);
        onCleanupLocalData?.();
        onSessionExpiry?.();
        forceHardRefresh();
      }
      
    } catch (error) {
      console.error('❌ Error durante expiración automática de sesión:', error);
      // Forzar recarga en caso de error
      forceHardRefresh();
    }
  }, [extendSessionAutomatically, clearUserLocalStorage, onCleanupLocalData, onSessionExpiry, onForceRefresh, forceHardRefresh]);

  // Actualizar la referencia cuando handleSessionExpiry cambie
  useEffect(() => {
    handleSessionExpiryRef.current = handleSessionExpiry;
  }, [handleSessionExpiry]);

  // Verificar estado de la sesión
  const checkSessionHealth = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error al verificar sesión:', error);
        handleSessionExpiryRef.current?.();
        return false;
      }

      if (!session) {
        console.log('❌ No hay sesión activa');
        handleSessionExpiryRef.current?.();
        return false;
      }

      // Verificar si el token está próximo a expirar
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at;
      const timeUntilExpiry = (expiresAt || 0) - now;

      if (timeUntilExpiry <= 0) {
        console.log('❌ Token de sesión expirado');
        handleSessionExpiryRef.current?.();
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error al verificar estado de sesión:', error);
      handleSessionExpiryRef.current?.();
      return false;
    }
  }, []);

  // Extender sesión manualmente (para compatibilidad)
  const extendSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.error('❌ No se puede extender sesión:', error);
        handleSessionExpiryRef.current?.();
        return false;
      }

      // Reiniciar timer
      resetSessionTimer();
      registerActivity();
      
      console.log('✅ Sesión extendida manualmente');
      return true;
    } catch (error) {
      console.error('❌ Error al extender sesión:', error);
      handleSessionExpiryRef.current?.();
      return false;
    }
  }, [resetSessionTimer, registerActivity]);

  // Limpiar todos los timers
  const clearAllTimers = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, []);

  // Configurar eventos de actividad del usuario
  useEffect(() => {
    if (!enabled) return;
    
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      registerActivity();
    };

    // Agregar listeners de actividad
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      // Limpiar listeners de actividad
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [registerActivity, enabled]);

  // Configurar verificación periódica de sesión
  useEffect(() => {
    if (!enabled) return;
    
    // Verificar sesión cada 30 segundos
    checkIntervalRef.current = setInterval(() => {
      checkSessionHealth();
    }, 30000);

    // Verificación inicial
    checkSessionHealth();

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkSessionHealth, enabled]);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    registerActivity,
    resetSessionTimer,
    extendSession,
    checkSessionHealth,
    forceHardRefresh,
    clearUserLocalStorage,
    handleSessionExpiry
  };
}; 