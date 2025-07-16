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
  const { timeout = 10000, retries = 1 } = options;

  // Crear promesa con timeout simple
  const callWithTimeout = async (): Promise<T> => {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operación tardó demasiado')), timeout)
      )
    ]);
  };

  // Intentar la operación con reintento simple
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await callWithTimeout();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // Esperar 1 segundo antes del reintento
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Operación falló después de reintentos');
};

// Función simple para mensajes de error amigables
export const getSimpleErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('timeout') || error.message.includes('tardó demasiado')) {
      return 'La operación está tardando mucho. Verifica tu conexión.';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Problema de conexión. Verifica tu internet.';
    }
    if (error.message.includes('jwt') || error.message.includes('unauthorized')) {
      return 'Sesión expirada. Recarga la página.';
    }
    if (error.message.includes('rate limit')) {
      return 'Muchas solicitudes. Espera un momento.';
    }
    return error.message;
  }
  
  return 'Error inesperado. Intenta de nuevo.';
}; 