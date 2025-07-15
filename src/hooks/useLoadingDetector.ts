import { useState, useEffect, useRef, useCallback } from 'react';

export interface LoadingDetectorConfig {
  maxLoadingTime?: number;
  inactivityTimeout?: number;
  enabled?: boolean;
  onExcessiveLoading?: () => void;
  onInactivityDetected?: () => void;
  onForceReload?: () => void;
}

export interface LoadingState {
  isLoading: boolean;
  isStuck: boolean;
  isInactive: boolean;
  loadingDuration: number;
  lastActivity: number;
}

export const useLoadingDetector = ({
  maxLoadingTime = 10000, // 10 segundos por defecto
  inactivityTimeout = 30000, // 30 segundos por defecto
  enabled = true,
  onExcessiveLoading,
  onInactivityDetected,
  onForceReload
}: LoadingDetectorConfig) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    isStuck: false,
    isInactive: false,
    loadingDuration: 0,
    lastActivity: Date.now()
  });

  // Referencias para evitar closures obsoletos
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingStartRef = useRef<number | null>(null);
  const isTrackingRef = useRef<boolean>(false);

  // Referencias estables para los callbacks
  const callbacksRef = useRef({
    onExcessiveLoading,
    onInactivityDetected,
    onForceReload
  });

  // Actualizar referencias de callbacks
  useEffect(() => {
    callbacksRef.current = {
      onExcessiveLoading,
      onInactivityDetected,
      onForceReload
    };
  }, [onExcessiveLoading, onInactivityDetected, onForceReload]);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current);
      }
    };
  }, []);

  // Actualizar actividad
  const updateActivity = useCallback(() => {
    const now = Date.now();
    setLoadingState(prev => ({
      ...prev,
      lastActivity: now,
      isInactive: false
    }));
  }, []);

  // Iniciar seguimiento de carga - Memoizado sin dependencias que cambien
  const startLoadingTracking = useCallback(() => {
    // Evitar iniciar tracking múltiple
    if (isTrackingRef.current) {
      return;
    }

    const startTime = Date.now();
    loadingStartRef.current = startTime;
    isTrackingRef.current = true;
    
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      isStuck: false,
      loadingDuration: 0
    }));

    // Limpiar timer anterior si existe
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }

    // Timer para detectar carga excesiva
    loadingTimerRef.current = setTimeout(() => {
      // Solo mostrar warning si aún está cargando
      if (isTrackingRef.current) {
        setLoadingState(prev => ({
          ...prev,
          isStuck: true
        }));
        
        console.warn('⚠️ Estado de carga excesivo detectado');
        callbacksRef.current.onExcessiveLoading?.();
      }
    }, maxLoadingTime);

    console.log('🔄 Iniciando seguimiento de carga');
  }, [maxLoadingTime]); // Solo maxLoadingTime como dependencia

  // Detener seguimiento de carga - Memoizado de forma estable
  const stopLoadingTracking = useCallback(() => {
    // Solo detener si está tracking
    if (!isTrackingRef.current) {
      return;
    }

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
    isTrackingRef.current = false;

    console.log(`✅ Carga completada en ${duration}ms`);
  }, []); // Sin dependencias que cambien

  // Verificar si la página realmente está cargando
  const isPageReallyLoading = useCallback(() => {
    // Verificar indicadores de carga del navegador
    const hasActiveRequests = 
      (window as any).fetch?.activeRequests > 0 ||
      document.readyState === 'loading' ||
      (performance.getEntriesByType('navigation')[0] as any)?.loadEventEnd === 0;
    
    // Verificar elementos de carga en el DOM
    const hasLoadingElements = 
      document.querySelector('.loading') !== null ||
      document.querySelector('[data-loading="true"]') !== null ||
      document.querySelector('.spinner') !== null;
    
    return hasActiveRequests || hasLoadingElements;
  }, []);

  // Forzar recarga de emergencia - Memoizado de forma estable
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
      
      isTrackingRef.current = false;
      
      // Callback personalizado
      callbacksRef.current.onForceReload?.();
      
      // Forzar recarga con limpieza de cache
      window.location.reload();
    } catch (error) {
      console.error('❌ Error al forzar recarga:', error);
      // Fallback básico
      window.location.href = window.location.href;
    }
  }, []); // Sin dependencias que cambien

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
      callbacksRef.current.onInactivityDetected?.();
    }
    
    // Verificar si la carga está atascada solo si estamos tracking
    if (isTrackingRef.current && loadingState.isLoading && !isPageReallyLoading()) {
      console.warn('⚠️ Carga fantasma detectada');
      stopLoadingTracking();
    }
  }, [loadingState.lastActivity, loadingState.isLoading, inactivityTimeout, isPageReallyLoading, stopLoadingTracking]);

  // Inicializar monitoreo de actividad si está habilitado
  useEffect(() => {
    if (!enabled) return;

    // Configurar verificación periódica de salud de la aplicación
    activityCheckIntervalRef.current = setInterval(() => {
      checkApplicationHealth();
    }, 5000); // Verificar cada 5 segundos

    // Configurar listeners de actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Limpiar al desmontar o deshabilitar
    return () => {
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current);
      }
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [enabled, checkApplicationHealth, updateActivity]);

  // Detectar cambios de visibilidad de la página
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Página oculta - pausar tracking si es necesario
        console.log('📱 Página oculta - pausando monitoreo');
      } else {
        // Página visible - reanudar tracking
        console.log('📱 Página visible - reanudando monitoreo');
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, updateActivity]);

  // Detectar errores no manejados
  useEffect(() => {
    if (!enabled) return;

    const handleUnhandledError = (event: ErrorEvent) => {
      console.error('❌ Error no manejado detectado:', event.error);
      
      // Si hay carga atascada durante un error, forzar recarga
      if (isTrackingRef.current && loadingState.isStuck) {
        console.warn('🚨 Error durante carga atascada - considerando recarga de emergencia');
        forceEmergencyReload();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('❌ Promesa rechazada no manejada:', event.reason);
      
      // Si hay carga atascada durante un error, forzar recarga
      if (isTrackingRef.current && loadingState.isStuck) {
        console.warn('🚨 Promesa rechazada durante carga atascada - considerando recarga de emergencia');
        forceEmergencyReload();
      }
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [enabled, loadingState.isStuck, forceEmergencyReload]);

  return {
    ...loadingState,
    startLoadingTracking,
    stopLoadingTracking,
    forceEmergencyReload,
    updateActivity,
    checkApplicationHealth,
    isPageReallyLoading
  };
}; 