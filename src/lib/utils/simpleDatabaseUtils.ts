// Utilidades simples de base de datos - reemplaza las complejas actuales

interface SimpleCallOptions {
  timeout?: number;
  retries?: number;
}

// Función simple para llamadas de base de datos
export const simpleDbCall = async <T>(
  operation: () => Promise<T>,
  options: SimpleCallOptions = {}
): Promise<T> => {
  const { timeout = 60000, retries = 1 } = options; // Aumentar timeout a 60 segundos y reducir reintentos

  // Crear promesa con timeout simple
  const callWithTimeout = async (): Promise<T> => {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout de operación de base de datos')), timeout)
      )
    ]);
  };

  // Intentar la operación con reintento simple
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Intento ${attempt + 1}/${retries + 1} de operación de base de datos`);
      const startTime = Date.now();
      const result = await callWithTimeout();
      const duration = Date.now() - startTime;
      console.log(`✅ Operación completada en ${duration}ms`);
      return result;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      console.log(`❌ Error en intento ${attempt + 1}:`, error);
      
      if (isLastAttempt) {
        throw error;
      }
      
      // Esperar 2 segundos antes del reintento
      console.log('⏳ Esperando antes del reintento...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Operación falló después de reintentos');
};

// Función simple para mensajes de error amigables
export const getSimpleErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Errores de timeout
    if (error.message.includes('Timeout de operación') || error.message.includes('timeout') || error.message.includes('tardó demasiado')) {
      return 'La operación tardó más de lo esperado. Por favor, intenta nuevamente.';
    }
    // Errores de conexión
    if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    }
    // Errores de autenticación
    if (error.message.includes('jwt') || error.message.includes('unauthorized') || error.message.includes('Invalid API key')) {
      return 'Sesión expirada. Por favor, recarga la página.';
    }
    // Errores de límite de uso
    if (error.message.includes('rate limit') || error.message.includes('Too Many Requests')) {
      return 'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.';
    }
    // Errores de base de datos específicos
    if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      return 'Ya existe una plantilla con ese nombre. Usa un nombre diferente.';
    }
    if (error.message.includes('foreign key') || error.message.includes('violates')) {
      return 'Error de datos. Por favor, intenta de nuevo.';
    }
    // Devolver el mensaje original si no coincide con ningún patrón conocido
    return error.message;
  }
  
  return 'Error inesperado. Por favor, intenta de nuevo.';
}; 