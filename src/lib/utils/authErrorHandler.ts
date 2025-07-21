import { AuthError } from '@supabase/supabase-js';

// Tipos de errores de autenticación
export type AuthErrorType = 
  | 'NETWORK_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'OAUTH_ERROR'
  | 'UNKNOWN_ERROR';

// Interfaz para respuesta de error estandarizada
export interface AuthErrorResponse {
  type: AuthErrorType;
  message: string;
  originalError?: any;
  timestamp: string;
}

// Mapeo de errores comunes
const ERROR_MAPPINGS: Record<string, AuthErrorType> = {
  'Invalid login credentials': 'INVALID_CREDENTIALS',
  'Email not confirmed': 'INVALID_CREDENTIALS',
  'Invalid access token': 'SESSION_EXPIRED',
  'JWT expired': 'SESSION_EXPIRED',
  'OAuth error': 'OAUTH_ERROR',
  'Network request failed': 'NETWORK_ERROR',
};

// Helper principal para manejo de errores
export const handleAuthError = (error: AuthError | Error | any): AuthErrorResponse => {
  const timestamp = new Date().toISOString();
  
  // Determinar tipo de error
  let errorType: AuthErrorType = 'UNKNOWN_ERROR';
  let message = 'Ha ocurrido un error inesperado';
  
  if (error?.message) {
    // Buscar en mapeo de errores conocidos
    for (const [errorPattern, type] of Object.entries(ERROR_MAPPINGS)) {
      if (error.message.includes(errorPattern)) {
        errorType = type;
        break;
      }
    }
    
    // Mensajes personalizados en español
    switch (errorType) {
      case 'INVALID_CREDENTIALS':
        message = 'Credenciales inválidas. Verifica tu email y contraseña.';
        break;
      case 'SESSION_EXPIRED':
        message = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        break;
      case 'OAUTH_ERROR':
        message = 'Error en la autenticación con Google. Inténtalo de nuevo.';
        break;
      case 'NETWORK_ERROR':
        message = 'Error de conexión. Verifica tu conexión a internet.';
        break;
      default:
        message = error.message || 'Error desconocido en la autenticación';
    }
  }
  
  const errorResponse: AuthErrorResponse = {
    type: errorType,
    message,
    originalError: error,
    timestamp
  };
  
  // Logging del error (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.group('🔐 Error de Autenticación');
    console.error('Tipo:', errorType);
    console.error('Mensaje:', message);
    console.error('Error original:', error);
    console.error('Timestamp:', timestamp);
    console.groupEnd();
  }
  
  // En producción, registrar errores críticos
  if (process.env.NODE_ENV === 'production' && errorType !== 'INVALID_CREDENTIALS') {
    // Aquí podrías integrar con servicios como Sentry, LogRocket, etc.
    console.error('Auth Error:', { type: errorType, message, timestamp });
  }
  
  return errorResponse;
};

// Helper para manejar métricas de autenticación
export const logAuthMetrics = (event: string, metadata?: Record<string, any>) => {
  const timestamp = new Date().toISOString();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Auth Metric: ${event}`, { timestamp, ...metadata });
  }
  
  // En producción, aquí podrías enviar métricas a servicios como Analytics, Mixpanel, etc.
  // trackEvent('auth_metric', { event, timestamp, ...metadata });
};

// Helper para validar configuración de OAuth
export const validateOAuthConfig = (scopes?: string[], redirectTo?: string) => {
  const errors: string[] = [];
  
  if (redirectTo && !isValidUrl(redirectTo)) {
    errors.push('URL de redirección inválida');
  }
  
  if (scopes && scopes.length === 0) {
    errors.push('Lista de scopes no puede estar vacía');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Utility para validar URLs
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}; 