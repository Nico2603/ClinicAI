// Utilidades simples de base de datos - optimizadas para plantillas

interface SimpleCallOptions {
  timeout?: number;
  retries?: number;
  operation?: string; // Para logging más específico
}

// Función optimizada para llamadas de base de datos
export const simpleDbCall = async <T>(
  operation: () => Promise<T>,
  options: SimpleCallOptions = {}
): Promise<T> => {
  const { timeout = 30000, retries = 2, operation: operationName = 'base de datos' } = options;

  // Crear promesa con timeout optimizado
  const callWithTimeout = async (): Promise<T> => {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout de ${timeout / 1000}s en operación: ${operationName}`)), timeout)
      )
    ]);
  };

  // Intentar la operación con reintento optimizado
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const startTime = Date.now();
      const result = await callWithTimeout();
      const duration = Date.now() - startTime;
      
      if (duration > 5000) {
        console.warn(`⚠️ Operación lenta (${duration}ms): ${operationName}`);
      } else {
        console.log(`✅ ${operationName} completada en ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      console.error(`❌ Error en ${operationName} (intento ${attempt + 1}/${retries + 1}):`, errorMessage);
      
      if (isLastAttempt) {
        throw new Error(`Error en ${operationName}: ${errorMessage}`);
      }
      
      // Esperar tiempo progresivo antes del reintento
      const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.log(`⏳ Reintentando en ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error(`Operación ${operationName} falló después de ${retries + 1} intentos`);
};

// Función mejorada para mensajes de error específicos
export const getSimpleErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    
    // Errores de timeout específicos
    if (msg.includes('timeout') || msg.includes('tardó demasiado')) {
      if (msg.includes('plantilla')) {
        return 'El guardado de la plantilla está tardando más de lo esperado. Tu conexión podría ser lenta.';
      }
      return 'La operación tardó más de lo esperado. Verifica tu conexión.';
    }
    
    // Errores de conexión
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
      return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    }
    
    // Errores de autenticación
    if (msg.includes('jwt') || msg.includes('unauthorized') || msg.includes('invalid api key')) {
      return 'Tu sesión ha expirado. Por favor, recarga la página.';
    }
    
    // Errores de límite de uso
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Demasiadas solicitudes. Espera 10 segundos antes de intentar de nuevo.';
    }
    
    // Errores de base de datos específicos para plantillas
    if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
      return 'Ya existe una plantilla con ese nombre. Usa un nombre diferente.';
    }
    
    if (msg.includes('foreign key') || msg.includes('violates')) {
      return 'Error de validación de datos. Verifica que todos los campos sean correctos.';
    }
    
    // Errores específicos de Supabase
    if (msg.includes('permission denied') || msg.includes('rls')) {
      return 'No tienes permisos para realizar esta acción. Recarga la página e intenta de nuevo.';
    }
    
    // Si es un error conocido de plantillas, mantener el mensaje original
    if (msg.includes('plantilla') || msg.includes('template')) {
      return error.message;
    }
    
    return error.message;
  }
  
  return 'Error inesperado. Por favor, intenta de nuevo.';
}; 