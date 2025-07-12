import { useState, useEffect, useCallback, useRef } from 'react';

interface LoadingDetectorConfig {
  // Tiempo máximo de carga en milisegundos (por defecto 15 segundos)
  maxLoadingTime?: number;
  // Tiempo de verificación de inactividad (por defecto 30 segundos)
  inactivityTimeout?: number;
  // Habilitar o deshabilitar el hook (por defecto true)
  enabled?: boolean;
  // Callback cuando se detecta carga excesiva
  onExcessiveLoading?: () => void;
  // Callback cuando se detecta inactividad
  onInactivityDetected?: () => void;
  // Callback para forzar recarga
  onForceReload?: () => void;
}

interface LoadingState {
  isLoading: boolean;
  isStuck: boolean;
  isInactive: boolean;
  loadingDuration: number;
  lastActivity: number;
}

export const useLoadingDetector = (config: LoadingDetectorConfig = {}) => {
  const {
    maxLoadingTime = 15000, // 15 segundos
    inactivityTimeout = 30000, // 30 segundos
    enabled = true,
    onExcessiveLoading,
    onInactivityDetected,
    onForceReload
  } = config;

  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    isStuck: false,
    isInactive: false,
    loadingDuration: 0,
    lastActivity: Date.now()
  });

  const loadingStartRef = useRef<number | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar si la página está realmente cargando
  const isPageReallyLoading = useCallback(() => {
    // Verificar si hay requests pendientes
    if (typeof window !== 'undefined') {
      // Verificar si hay elementos con indicadores de carga
      const loadingElements = document.querySelectorAll('[data-loading="true"], .loading, .spinner');
      
      // Verificar si hay requests de red pendientes (aproximación)
      const hasActiveRequests = (window as any).performance?.getEntriesByType?.('navigation')?.some(
        (entry: any) => entry.loadEventEnd === 0
      );
      
      return loadingElements.length > 0 || hasActiveRequests;
    }
    return false;
  }, []);

  // Registrar actividad del usuario
  const registerActivity = useCallback(() => {
    const now = Date.now();
    setLoadingState(prev => ({
      ...prev,
      lastActivity: now,
      isInactive: false
    }));
  }, []);

  // Iniciar seguimiento de carga
  const startLoadingTracking = useCallback(() => {
    const startTime = Date.now();
    loadingStartRef.current = startTime;
    
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      isStuck: false,
      loadingDuration: 0
    }));

    // Timer para detectar carga excesiva
    loadingTimerRef.current = setTimeout(() => {
      setLoadingState(prev => ({
        ...prev,
        isStuck: true
      }));
      
      console.warn('⚠️ Estado de carga excesivo detectado');
      onExcessiveLoading?.();
    }, maxLoadingTime);

    console.log('🔄 Iniciando seguimiento de carga');
  }, [maxLoadingTime, onExcessiveLoading]);

  // Detener seguimiento de carga
  const stopLoadingTracking = useCallback(() => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    
    const endTime = Date.now();
    const duration = loadingStartRef.current ? endTime - loadingStartRef.current : 0;
    
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      isStuck: false,
      loadingDuration: duration
    }));

    loadingStartRef.current = null;
    console.log(`✅ Carga completada en ${duration}ms`);
  }, []);

  // Forzar recarga de emergencia
  const forceEmergencyReload = useCallback(() => {
    console.log('🚨 Forzando recarga de emergencia');
    
    try {
      // Limpiar todos los timers
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current);
      }
      
      // Callback personalizado
      onForceReload?.();
      
      // Forzar recarga con limpieza de cache
      window.location.reload();
    } catch (error) {
      console.error('❌ Error al forzar recarga:', error);
      // Fallback básico
      window.location.href = window.location.href;
    }
  }, [onForceReload]);

  // Verificar estado de la aplicación
  const checkApplicationHealth = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - loadingState.lastActivity;
    
    // Verificar inactividad
    if (timeSinceLastActivity > inactivityTimeout) {
      setLoadingState(prev => ({
        ...prev,
        isInactive: true
      }));
      
      console.warn('⚠️ Inactividad detectada');
      onInactivityDetected?.();
    }
    
    // Verificar si la carga está atascada
    if (loadingState.isLoading && !isPageReallyLoading()) {
      console.warn('⚠️ Carga fantasma detectada');
      stopLoadingTracking();
    }
  }, [loadingState, inactivityTimeout, onInactivityDetected, isPageReallyLoading, stopLoadingTracking]);

  // Recuperar de estado problemático
  const recoverFromStuckState = useCallback(() => {
    console.log('🔄 Intentando recuperar de estado problemático');
    
    // Detener seguimiento actual
    stopLoadingTracking();
    
    // Limpiar estados
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      isStuck: false,
      isInactive: false
    }));
    
    // Registrar actividad
    registerActivity();
    
    // Si sigue atascado después de 3 segundos, forzar recarga
    setTimeout(() => {
      if (loadingState.isStuck || isPageReallyLoading()) {
        forceEmergencyReload();
      }
    }, 3000);
  }, [stopLoadingTracking, registerActivity, loadingState.isStuck, isPageReallyLoading, forceEmergencyReload]);

  // Configurar eventos de actividad
  useEffect(() => {
    if (!enabled) return;
    
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      registerActivity();
    };

    // Agregar listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      // Limpiar listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [registerActivity, enabled]);

  // Configurar verificación periódica de salud
  useEffect(() => {
    if (!enabled) return;
    
    activityCheckIntervalRef.current = setInterval(() => {
      checkApplicationHealth();
    }, 5000); // Verificar cada 5 segundos

    return () => {
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current);
      }
    };
  }, [checkApplicationHealth, enabled]);

  // Detectar cambios en el estado de carga del navegador
  useEffect(() => {
    if (!enabled) return;
    
    const handleBeforeUnload = () => {
      stopLoadingTracking();
    };

    const handleLoad = () => {
      stopLoadingTracking();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Página oculta, pausar seguimiento
        stopLoadingTracking();
      } else {
        // Página visible, registrar actividad
        registerActivity();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stopLoadingTracking, registerActivity, enabled]);

  // Limpiar timers al desmontar
  useEffect(() => {
    // Capturar los valores actuales de los refs para usar en la limpieza
    const loadingTimer = loadingTimerRef.current;
    const inactivityTimer = inactivityTimerRef.current;
    const activityCheckInterval = activityCheckIntervalRef.current;
    
    return () => {
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      if (activityCheckInterval) {
        clearInterval(activityCheckInterval);
      }
    };
  }, []);

  return {
    loadingState,
    startLoadingTracking,
    stopLoadingTracking,
    registerActivity,
    recoverFromStuckState,
    forceEmergencyReload,
    checkApplicationHealth,
    isPageReallyLoading
  };
}; 