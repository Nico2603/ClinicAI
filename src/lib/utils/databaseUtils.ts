// =============================================================================
// UTILIDADES OPTIMIZADAS PARA LLAMADAS A LA BASE DE DATOS
// =============================================================================

// Configuración inteligente de timeouts por tipo de operación
export interface DatabaseCallOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  operationType?: 'fast' | 'standard' | 'complex' | 'ai_processing';
}

// Configuración de timeouts adaptativos por tipo de operación
const OPERATION_TIMEOUTS = {
  fast: 3000,           // 3s - Consultas simples, validaciones
  standard: 8000,       // 8s - CRUD básico, consultas complejas
  complex: 15000,       // 15s - Operaciones complejas de BD
  ai_processing: 45000, // 45s - Operaciones que incluyen procesamiento de IA
} as const;

// Configuración optimizada de reintentos por tipo
const RETRY_CONFIG = {
  fast: { maxRetries: 0, retryDelay: 0 },           // Sin reintentos para operaciones rápidas
  standard: { maxRetries: 1, retryDelay: 1000 },   // 1 reintento para operaciones estándar
  complex: { maxRetries: 1, retryDelay: 2000 },    // 1 reintento con delay mayor
  ai_processing: { maxRetries: 0, retryDelay: 0 }, // Sin reintentos para IA (timeout largo)
} as const;

export class DatabaseTimeoutError extends Error {
  constructor(message: string = 'La operación tardó demasiado tiempo') {
    super(message);
    this.name = 'DatabaseTimeoutError';
  }
}

export class DatabaseRetryError extends Error {
  constructor(message: string = 'Se agotaron los reintentos') {
    super(message);
    this.name = 'DatabaseRetryError';
  }
}

export class DatabaseConnectionError extends Error {
  constructor(message: string = 'Error de conexión a la base de datos') {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

/**
 * Crear una promesa con timeout optimizado
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = OPERATION_TIMEOUTS.standard,
  operationType: string = 'database operation'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new DatabaseTimeoutError(
          `${operationType} cancelada: timeout de ${timeoutMs}ms excedido`
        ));
      }, timeoutMs);
    })
  ]);
};

/**
 * Clasificación inteligente de errores para mejor manejo
 */
const classifyError = (error: any): { shouldRetry: boolean; errorType: string } => {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || '';

  // Errores que NO deben reintentar
  if (
    errorCode === 'PGRST116' ||  // Supabase RLS error
    errorCode === 'PGRST301' ||  // Supabase auth error
    errorMessage.includes('jwt') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden') ||
    error instanceof DatabaseTimeoutError
  ) {
    return { shouldRetry: false, errorType: 'authentication_or_timeout' };
  }

  // Errores de conexión que pueden reintentar
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorCode === 'ECONNRESET' ||
    errorCode === 'ENOTFOUND'
  ) {
    return { shouldRetry: true, errorType: 'connection' };
  }

  // Errores temporales del servidor
  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('server error') ||
    errorMessage.includes('internal error')
  ) {
    return { shouldRetry: true, errorType: 'server_temporary' };
  }

  // Por defecto, no reintentar errores desconocidos
  return { shouldRetry: false, errorType: 'unknown' };
};

/**
 * Sistema de retry inteligente optimizado
 */
export const withDatabaseRetry = async <T>(
  operation: () => Promise<T>,
  options: DatabaseCallOptions = {}
): Promise<T> => {
  const {
    maxRetries,
    retryDelay,
    exponentialBackoff = false,
    operationType = 'standard'
  } = options;

  // Obtener configuración por tipo de operación
  const typeConfig = RETRY_CONFIG[operationType as keyof typeof RETRY_CONFIG] || RETRY_CONFIG.standard;
  const finalMaxRetries = maxRetries ?? typeConfig.maxRetries;
  const finalRetryDelay = retryDelay ?? typeConfig.retryDelay;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= finalMaxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Clasificar el error para decidir si reintentar
      const { shouldRetry, errorType } = classifyError(error);
      
      if (!shouldRetry) {
        console.warn(`🚫 Error no reintentar (${errorType}):`, error);
        throw error;
      }
      
      // Si es el último intento, lanzar el error
      if (attempt === finalMaxRetries) {
        console.warn(`⚠️ Último intento fallido (${errorType}):`, error);
        break;
      }
      
      // Calcular delay para el próximo intento
      const delay = exponentialBackoff 
        ? finalRetryDelay * Math.pow(2, attempt)
        : finalRetryDelay;
      
      console.log(`🔄 Reintento ${attempt + 1}/${finalMaxRetries} en ${delay}ms (${errorType}):`, error);
      
      // Esperar antes del próximo intento
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new DatabaseRetryError(
    `Operación falló después de ${finalMaxRetries + 1} intentos: ${lastError?.message || 'Error desconocido'}`
  );
};

/**
 * Wrapper principal optimizado que combina timeout y retry inteligente
 */
export const safeDatabaseCall = async <T>(
  operation: () => Promise<T>,
  options: DatabaseCallOptions = {}
): Promise<T> => {
  const { 
    timeout, 
    operationType = 'standard',
    ...retryOptions 
  } = options;
  
  // Obtener timeout por tipo de operación
  const finalTimeout = timeout ?? OPERATION_TIMEOUTS[operationType as keyof typeof OPERATION_TIMEOUTS];
  
  // Log para debugging (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log(`🗃️ DB Operation: ${operationType} (timeout: ${finalTimeout}ms)`);
  }
  
  return withDatabaseRetry(
    () => withTimeout(operation(), finalTimeout, `${operationType} operation`),
    { ...retryOptions, operationType }
  );
};

/**
 * Wrapper específico para operaciones rápidas (sin reintentos)
 */
export const fastDatabaseCall = async <T>(operation: () => Promise<T>): Promise<T> => {
  return safeDatabaseCall(operation, { operationType: 'fast' });
};

/**
 * Wrapper específico para operaciones que incluyen procesamiento de IA
 */
export const aiDatabaseCall = async <T>(operation: () => Promise<T>): Promise<T> => {
  return safeDatabaseCall(operation, { operationType: 'ai_processing' });
};

/**
 * Wrapper específico para operaciones complejas
 */
export const complexDatabaseCall = async <T>(operation: () => Promise<T>): Promise<T> => {
  return safeDatabaseCall(operation, { operationType: 'complex' });
};

/**
 * Batch de operaciones con manejo inteligente de errores
 */
export const batchDatabaseCall = async <T>(
  operations: (() => Promise<T>)[],
  options: { 
    failFast?: boolean; 
    operationType?: DatabaseCallOptions['operationType'];
  } = {}
): Promise<(T | Error)[]> => {
  const { failFast = false, operationType = 'standard' } = options;
  
  if (failFast) {
    // Ejecutar todas las operaciones, fallar en el primer error
    return Promise.all(
      operations.map(op => safeDatabaseCall(op, { operationType }))
    );
  } else {
    // Ejecutar todas las operaciones, capturar errores individuales
    return Promise.allSettled(
      operations.map(op => safeDatabaseCall(op, { operationType }))
    ).then(results => 
      results.map(result => 
        result.status === 'fulfilled' ? result.value : new Error(result.reason)
      )
    );
  }
};

/**
 * Helper optimizado para mostrar errores de manera amigable al usuario
 */
export const getFriendlyErrorMessage = (error: Error): string => {
  if (error instanceof DatabaseTimeoutError) {
    // Mejorar mensaje específico para diferentes tipos de timeout
    if (error.message.includes('ai_processing')) {
      return 'El procesamiento con IA está tardando más de lo normal. El contenido puede ser muy extenso o hay alta demanda del servicio. Intenta con contenido más breve.';
    }
    if (error.message.includes('complex')) {
      return 'La operación está tardando más de lo esperado. Verifica tu conexión e intenta nuevamente.';
    }
    return 'La operación está tardando demasiado. Verifica tu conexión a internet e intenta nuevamente.';
  }
  
  if (error instanceof DatabaseRetryError) {
    return 'No se pudo completar la operación después de varios intentos. Verifica tu conexión e intenta más tarde.';
  }
  
  if (error instanceof DatabaseConnectionError) {
    return 'Problema de conectividad con la base de datos. Verifica tu conexión a internet.';
  }
  
  // Errores específicos de Supabase optimizados
  const supabaseError = error as any;
  
  if (supabaseError?.code === 'PGRST116') {
    return 'No tienes permisos para realizar esta operación. Verifica tu sesión.';
  }
  
  if (supabaseError?.code === 'PGRST301') {
    return 'Tu sesión ha expirado. Recarga la página e inicia sesión nuevamente.';
  }
  
  if (supabaseError?.message?.toLowerCase().includes('jwt')) {
    return 'Sesión expirada. Recarga la página e inicia sesión nuevamente.';
  }
  
  if (supabaseError?.message?.toLowerCase().includes('network')) {
    return 'Problema de conectividad. Verifica tu conexión a internet.';
  }
  
  if (supabaseError?.message?.toLowerCase().includes('rate limit')) {
    return 'Muchas solicitudes. Espera un momento e intenta nuevamente.';
  }
  
  // Error genérico optimizado
  return 'Error inesperado. Intenta nuevamente en unos momentos.';
};

/**
 * Utilidad para monitor de salud de la base de datos
 */
export const checkDatabaseHealth = async (): Promise<{
  isHealthy: boolean;
  responseTime: number;
  error?: string;
}> => {
  const startTime = Date.now();
  
  try {
    // Hacer una consulta simple para verificar conectividad
    await fastDatabaseCall(async () => {
      // Esta es una operación mínima que debe implementarse según el servicio de BD usado
      return Promise.resolve(true);
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      isHealthy: true,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      isHealthy: false,
      responseTime,
      error: getFriendlyErrorMessage(error as Error),
    };
  }
};

/**
 * Configuración exportada para uso en otros módulos
 */
export const DATABASE_CONFIG = {
  OPERATION_TIMEOUTS,
  RETRY_CONFIG,
} as const; 