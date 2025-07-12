/**
 * Utilidades para forzar refresco completo de la aplicación
 * Similar a presionar Ctrl+Shift+R o F5 programáticamente
 */

export interface RefreshOptions {
  // Limpiar cache del navegador
  clearCache?: boolean;
  // Limpiar localStorage
  clearLocalStorage?: boolean;
  // Limpiar sessionStorage
  clearSessionStorage?: boolean;
  // Limpiar cookies de la aplicación
  clearCookies?: boolean;
  // Delay antes de recargar (en ms)
  delay?: number;
  // Callback antes de recargar
  beforeReload?: () => void;
  // Forzar recarga desde servidor
  forceReload?: boolean;
}

/**
 * Limpia el cache del navegador
 */
export const clearBrowserCache = async (): Promise<void> => {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✅ Cache del navegador limpiado');
    }
  } catch (error) {
    console.error('❌ Error al limpiar cache del navegador:', error);
  }
};

/**
 * Limpia el localStorage de la aplicación
 */
export const clearApplicationLocalStorage = (): void => {
  try {
    const keysToRemove: string[] = [];
    
    // Identificar claves de la aplicación
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('notasai_') || key.startsWith('supabase'))) {
        keysToRemove.push(key);
      }
    }
    
    // Remover las claves
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`✅ ${keysToRemove.length} elementos limpiados del localStorage`);
  } catch (error) {
    console.error('❌ Error al limpiar localStorage:', error);
  }
};

/**
 * Limpia el sessionStorage de la aplicación
 */
export const clearApplicationSessionStorage = (): void => {
  try {
    const keysToRemove: string[] = [];
    
    // Identificar claves de la aplicación
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('notasai_') || key.startsWith('supabase'))) {
        keysToRemove.push(key);
      }
    }
    
    // Remover las claves
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log(`✅ ${keysToRemove.length} elementos limpiados del sessionStorage`);
  } catch (error) {
    console.error('❌ Error al limpiar sessionStorage:', error);
  }
};

/**
 * Limpia las cookies de la aplicación
 */
export const clearApplicationCookies = (): void => {
  try {
    const cookies = document.cookie.split(';');
    const domain = window.location.hostname;
    
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Limpiar cookies relacionadas con la aplicación
      if (name.includes('notasai') || name.includes('supabase') || name.includes('auth')) {
        // Limpiar para el dominio actual
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        
        // Limpiar para subdominio
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${domain}`;
      }
    });
    
    console.log('✅ Cookies de la aplicación limpiadas');
  } catch (error) {
    console.error('❌ Error al limpiar cookies:', error);
  }
};

/**
 * Limpia todos los datos de la aplicación
 */
export const clearAllApplicationData = async (): Promise<void> => {
  console.log('🧹 Iniciando limpieza completa de datos...');
  
  try {
    // Limpiar en paralelo
    await Promise.all([
      clearBrowserCache(),
      Promise.resolve(clearApplicationLocalStorage()),
      Promise.resolve(clearApplicationSessionStorage()),
      Promise.resolve(clearApplicationCookies())
    ]);
    
    console.log('✅ Limpieza completa de datos finalizada');
  } catch (error) {
    console.error('❌ Error durante la limpieza completa:', error);
  }
};

/**
 * Fuerza la recarga de la página con limpieza de cache
 * Similar a Ctrl+Shift+R
 */
export const forceHardReload = (): void => {
  try {
    // Método 1: Usar location.reload(true) si está disponible
    if (typeof (window.location as any).reload === 'function') {
      (window.location as any).reload(true);
      return;
    }
    
    // Método 2: Usar location.reload() con cache-busting
    const url = new URL(window.location.href);
    url.searchParams.set('_t', Date.now().toString());
    window.location.href = url.toString();
  } catch (error) {
    console.error('❌ Error al forzar recarga:', error);
    // Fallback básico
    window.location.reload();
  }
};

/**
 * Fuerza una recarga completa con limpieza de datos
 */
export const forceCompleteRefresh = async (options: RefreshOptions = {}): Promise<void> => {
  const {
    clearCache = true,
    clearLocalStorage = true,
    clearSessionStorage = true,
    clearCookies = false,
    delay = 0,
    beforeReload,
    forceReload = true
  } = options;
  
  console.log('🔄 Iniciando refresco completo de la aplicación...');
  
  try {
    // Ejecutar callback antes de recargar
    beforeReload?.();
    
    // Limpiar datos según las opciones
    if (clearCache) {
      await clearBrowserCache();
    }
    
    if (clearLocalStorage) {
      clearApplicationLocalStorage();
    }
    
    if (clearSessionStorage) {
      clearApplicationSessionStorage();
    }
    
    if (clearCookies) {
      clearApplicationCookies();
    }
    
    // Aplicar delay si se especifica
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Forzar recarga
    if (forceReload) {
      forceHardReload();
    } else {
      window.location.reload();
    }
    
  } catch (error) {
    console.error('❌ Error durante el refresco completo:', error);
    // Fallback: recarga básica
    window.location.reload();
  }
};

/**
 * Detecta si la aplicación está en un estado problemático
 */
export const detectProblematicState = (): {
  isProblematic: boolean;
  issues: string[];
} => {
  const issues: string[] = [];
  
  try {
    // Verificar si hay elementos de carga atascados
    const stuckLoaders = document.querySelectorAll('[data-loading="true"]');
    if (stuckLoaders.length > 0) {
      issues.push(`${stuckLoaders.length} elementos de carga atascados`);
    }
    
    // Verificar si hay errores de JavaScript
    const hasJSErrors = (window as any).__JS_ERRORS__ || [];
    if (hasJSErrors.length > 0) {
      issues.push(`${hasJSErrors.length} errores de JavaScript`);
    }
    
    // Verificar si la página ha estado cargando por mucho tiempo
    const loadStartTime = performance.timing?.navigationStart || 0;
    const currentTime = Date.now();
    const loadTime = currentTime - loadStartTime;
    
    if (loadTime > 30000) { // 30 segundos
      issues.push('Tiempo de carga excesivo');
    }
    
    // Verificar si hay requests pendientes por mucho tiempo
    const pendingRequests = performance.getEntriesByType('xmlhttprequest')
      .filter((entry: any) => entry.responseEnd === 0);
    
    if (pendingRequests.length > 0) {
      issues.push(`${pendingRequests.length} requests pendientes`);
    }
    
    return {
      isProblematic: issues.length > 0,
      issues
    };
    
  } catch (error) {
    console.error('❌ Error al detectar estado problemático:', error);
    return {
      isProblematic: false,
      issues: []
    };
  }
};

/**
 * Maneja el refresco automático en caso de problemas
 */
export const handleAutomaticRefresh = async (maxRetries: number = 3): Promise<void> => {
  let retryCount = 0;
  
  const checkAndRefresh = async (): Promise<void> => {
    const { isProblematic, issues } = detectProblematicState();
    
    if (isProblematic && retryCount < maxRetries) {
      console.warn(`⚠️ Estado problemático detectado (intento ${retryCount + 1}/${maxRetries}):`, issues);
      
      retryCount++;
      
      // Esperar un poco antes de refrescar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Forzar refresco completo
      await forceCompleteRefresh({
        clearCache: true,
        clearLocalStorage: retryCount >= 2, // Solo limpiar localStorage después del segundo intento
        clearSessionStorage: true,
        delay: 1000
      });
      
      return;
    }
    
    if (retryCount >= maxRetries) {
      console.error('❌ Número máximo de reintentos alcanzado');
      // Último recurso: refresco básico
      window.location.reload();
    }
  };
  
  await checkAndRefresh();
};

/**
 * Configura el manejo automático de problemas
 */
export const setupAutomaticRecovery = (options: {
  checkInterval?: number;
  maxRetries?: number;
  enableAutoRefresh?: boolean;
} = {}): (() => void) => {
  const {
    checkInterval = 30000, // 30 segundos
    maxRetries = 3,
    enableAutoRefresh = true
  } = options;
  
  let intervalId: NodeJS.Timeout | null = null;
  
  if (enableAutoRefresh) {
    intervalId = setInterval(async () => {
      const { isProblematic, issues } = detectProblematicState();
      
      if (isProblematic) {
        console.warn('⚠️ Problemas detectados, iniciando recuperación automática:', issues);
        await handleAutomaticRefresh(maxRetries);
      }
    }, checkInterval);
  }
  
  // Retornar función de limpieza
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}; 