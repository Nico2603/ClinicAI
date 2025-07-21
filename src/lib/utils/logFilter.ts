// Helper para filtrar logs verbosos en desarrollo vs producción

const isProduction = process.env.NODE_ENV === 'production';

// Patrones de logs que queremos silenciar en producción
const PRODUCTION_LOG_FILTERS = [
  'GoTrueClient@',
  '#_acquireLock',
  '#_useSession',
  '#__loadSession',
  '#_autoRefreshTokenTick',
  '#_handleVisibilityChange',
  '#_notifyAllSubscribers',
  '#_startAutoRefresh',
  '#_stopAutoRefresh',
  'lock acquired for storage key',
  'lock released for storage key'
];

// Patrones de logs que SÍ queremos ver en producción (errores importantes)
const PRODUCTION_ALLOWED_LOGS = [
  'error',
  'Error',
  'ERROR',
  'failed',
  'Failed',
  'FAILED',
  'Auth Error:',
  '❌',
  '⚠️'
];

// Función para determinar si un log debe mostrarse
export const shouldShowLog = (message: string): boolean => {
  if (!isProduction) {
    return true; // En desarrollo, mostrar todo
  }

  // En producción, verificar si es un error importante
  const isImportantLog = PRODUCTION_ALLOWED_LOGS.some(pattern => 
    message.includes(pattern)
  );

  if (isImportantLog) {
    return true;
  }

  // Verificar si es un log verboso que queremos filtrar
  const isVerboseLog = PRODUCTION_LOG_FILTERS.some(pattern => 
    message.includes(pattern)
  );

  return !isVerboseLog;
};

// Wrapper para console.log con filtrado
export const filteredLog = (...args: any[]) => {
  const message = args.join(' ');
  if (shouldShowLog(message)) {
    console.log(...args);
  }
};

// Wrapper para console.error (siempre mostrar)
export const filteredError = (...args: any[]) => {
  console.error(...args);
};

// Wrapper para console.warn con filtrado
export const filteredWarn = (...args: any[]) => {
  const message = args.join(' ');
  if (shouldShowLog(message)) {
    console.warn(...args);
  }
};

// Configurar filtrado global para console (opcional)
export const setupProductionLogFiltering = () => {
  if (isProduction && typeof window !== 'undefined') {
    const originalLog = console.log;
    const originalWarn = console.warn;

    console.log = (...args) => {
      const message = args.join(' ');
      if (shouldShowLog(message)) {
        originalLog(...args);
      }
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      if (shouldShowLog(message)) {
        originalWarn(...args);
      }
    };

    // No filtrar console.error - siempre importante
  }
};

// Logs especiales para desarrollo
export const devLog = (...args: any[]) => {
  if (!isProduction) {
    console.log('🔧 [DEV]', ...args);
  }
};

export const prodLog = (...args: any[]) => {
  if (isProduction) {
    console.log('🚀 [PROD]', ...args);
  }
}; 