// Utilidades para manejar llamadas a la base de datos con timeout y retry
export interface DatabaseCallOptions {
  timeout?: number; // Timeout en milisegundos (por defecto 10 segundos)
  maxRetries?: number; // Número máximo de reintentos (por defecto 3)
  retryDelay?: number; // Delay inicial entre reintentos en ms (por defecto 1000)
  exponentialBackoff?: boolean; // Si usar backoff exponencial (por defecto true)
}

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

/**
 * Crear una promesa con timeout
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new DatabaseTimeoutError(`Operación cancelada: timeout de ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
};

/**
 * Retry automático con backoff exponencial específico para base de datos
 */
export const withDatabaseRetry = async <T>(
  operation: () => Promise<T>,
  options: DatabaseCallOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true
  } = options;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // No reintente en ciertos tipos de errores
      if (
        error instanceof DatabaseTimeoutError ||
        (error as any)?.code === 'PGRST116' || // Supabase RLS error
        (error as any)?.code === 'PGRST301'    // Supabase auth error
      ) {
        throw error;
      }
      
      // Si es el último intento, lance el error
      if (attempt === maxRetries) {
        break;
      }
      
      // Calcular delay para el próximo intento
      const delay = exponentialBackoff 
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay;
      
      console.warn(`Intento ${attempt + 1} falló, reintentando en ${delay}ms:`, error);
      
      // Esperar antes del próximo intento
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new DatabaseRetryError(
    `Operación falló después de ${maxRetries + 1} intentos: ${lastError?.message || 'Error desconocido'}`
  );
};

/**
 * Wrapper principal que combina timeout y retry
 */
export const safeDatabaseCall = async <T>(
  operation: () => Promise<T>,
  options: DatabaseCallOptions = {}
): Promise<T> => {
  const { timeout = 10000, ...retryOptions } = options;
  
  return withDatabaseRetry(
    () => withTimeout(operation(), timeout),
    retryOptions
  );
};

/**
 * Helper para mostrar errores de manera amigable al usuario
 */
export const getFriendlyErrorMessage = (error: Error): string => {
  if (error instanceof DatabaseTimeoutError) {
    // Mejorar mensaje específico para plantillas que involucran procesamiento IA
    if (error.message.includes('30000ms')) {
      return 'La creación de la plantilla está tardando más de lo normal. Esto puede deberse al procesamiento con IA. Por favor, verifica tu conexión e intenta con una plantilla más corta.';
    }
    return 'La operación está tardando demasiado. Por favor, verifica tu conexión a internet e intenta nuevamente.';
  }
  
  if (error instanceof DatabaseRetryError) {
    return 'No se pudo completar la operación después de varios intentos. Por favor, verifica tu conexión e intenta más tarde.';
  }
  
  // Errores específicos de Supabase
  const supabaseError = error as any;
  
  if (supabaseError?.code === 'PGRST116') {
    return 'No tienes permisos para realizar esta operación.';
  }
  
  if (supabaseError?.code === 'PGRST301') {
    return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
  }
  
  if (supabaseError?.message?.includes('JWT')) {
    return 'Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.';
  }
  
  if (supabaseError?.message?.includes('network')) {
    return 'Problema de conectividad. Verifica tu conexión a internet.';
  }
  
  // Error genérico
  return 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
}; 