import { ERROR_MESSAGES } from '../constants';

// =============================================================================
// TIPOS DE ERRORES PERSONALIZADOS
// =============================================================================

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  API = 'API',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  CONFIGURATION = 'CONFIGURATION',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ErrorDetails {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  context?: string;
  originalError?: Error;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context?: string;
  public readonly timestamp: Date;
  public readonly userId?: string;
  public readonly metadata?: Record<string, any>;

  constructor(details: Omit<ErrorDetails, 'timestamp'>) {
    super(details.message);
    this.name = 'AppError';
    this.type = details.type;
    this.severity = details.severity;
    this.context = details.context;
    this.timestamp = new Date();
    this.userId = details.userId;
    this.metadata = details.metadata;

    // Mantener el stack trace original si existe
    if (details.originalError && details.originalError.stack) {
      this.stack = details.originalError.stack;
    }
  }

  public toJSON(): ErrorDetails {
    return {
      type: this.type,
      severity: this.severity,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      userId: this.userId,
      metadata: this.metadata,
    };
  }
}

// =============================================================================
// CLASES DE ERRORES ESPECÍFICOS
// =============================================================================

export class ValidationError extends AppError {
  constructor(message: string, context?: string, metadata?: Record<string, any>) {
    super({
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      message,
      context,
      metadata,
    });
  }
}

export class APIError extends AppError {
  constructor(message: string, context?: string, originalError?: Error, metadata?: Record<string, any>) {
    super({
      type: ErrorType.API,
      severity: ErrorSeverity.HIGH,
      message,
      context,
      originalError,
      metadata,
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, context?: string, metadata?: Record<string, any>) {
    super({
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      message,
      context,
      metadata,
    });
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, context?: string, metadata?: Record<string, any>) {
    super({
      type: ErrorType.CONFIGURATION,
      severity: ErrorSeverity.CRITICAL,
      message,
      context,
      metadata,
    });
  }
}

// =============================================================================
// UTILIDADES DE MANEJO DE ERRORES
// =============================================================================

export const createError = (
  type: ErrorType,
  severity: ErrorSeverity,
  message: string,
  context?: string,
  originalError?: Error,
  metadata?: Record<string, any>
): AppError => {
  return new AppError({
    type,
    severity,
    message,
    context,
    originalError,
    metadata,
  });
};

export const wrapError = (
  error: unknown,
  context: string,
  type: ErrorType = ErrorType.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return createError(type, severity, error.message, context, error);
  }

  return createError(type, severity, String(error), context);
};

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

export const getErrorMessage = (error: unknown): string => {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return ERROR_MESSAGES.GENERIC_ERROR;
};

export const getErrorContext = (error: unknown): string | undefined => {
  if (isAppError(error)) {
    return error.context;
  }

  return undefined;
};

// =============================================================================
// UTILIDADES DE LOGGING
// =============================================================================

export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  context?: string;
  metadata?: Record<string, any>;
}

export const logError = (error: AppError, additionalContext?: string): void => {
  const logEntry: LogEntry = {
    level: 'error',
    message: error.message,
    timestamp: error.timestamp,
    context: additionalContext || error.context,
    metadata: {
      type: error.type,
      severity: error.severity,
      userId: error.userId,
      ...error.metadata,
    },
  };

  // En desarrollo, usar console.error con detalles completos
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error:', logEntry);
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } else {
    // En producción, usar un servicio de logging más robusto
    console.error(JSON.stringify(logEntry));
  }
};

export const logWarning = (message: string, context?: string, metadata?: Record<string, any>): void => {
  const logEntry: LogEntry = {
    level: 'warn',
    message,
    timestamp: new Date(),
    context,
    metadata,
  };

  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Warning:', logEntry);
  } else {
    console.warn(JSON.stringify(logEntry));
  }
};

export const logInfo = (message: string, context?: string, metadata?: Record<string, any>): void => {
  const logEntry: LogEntry = {
    level: 'info',
    message,
    timestamp: new Date(),
    context,
    metadata,
  };

  if (process.env.NODE_ENV === 'development') {
    console.info('ℹ️ Info:', logEntry);
  } else {
    console.info(JSON.stringify(logEntry));
  }
};

// =============================================================================
// UTILIDADES DE RETRY Y RECUPERACIÓN
// =============================================================================

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
}

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> => {
  let lastError: unknown;
  let delay = options.delayMs;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Si es el último intento, lanzar el error
      if (attempt === options.maxAttempts) {
        break;
      }

      // Verificar si se debe reintentar
      if (options.shouldRetry && !options.shouldRetry(error)) {
        break;
      }

      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Incrementar el delay para backoff exponencial
      if (options.backoffMultiplier) {
        delay *= options.backoffMultiplier;
      }
    }
  }

  throw lastError;
};

export const shouldRetryAPIError = (error: unknown): boolean => {
  if (isAppError(error) && error.type === ErrorType.API) {
    // Reintentar para errores temporales
    return error.message.includes('timeout') || 
           error.message.includes('network') || 
           error.message.includes('rate limit');
  }

  return false;
};

// =============================================================================
// UTILIDADES DE NOTIFICACIÓN AL USUARIO
// =============================================================================

export const getUserFriendlyMessage = (error: unknown): string => {
  if (isAppError(error)) {
    switch (error.type) {
      case ErrorType.VALIDATION:
        return error.message; // Los errores de validación ya son user-friendly
      case ErrorType.API:
        return 'Hubo un problema al conectar con el servidor. Por favor, inténtelo de nuevo.';
      case ErrorType.AUTHENTICATION:
        return 'Sesión expirada. Por favor, inicie sesión nuevamente.';
      case ErrorType.AUTHORIZATION:
        return 'No tiene permisos para realizar esta acción.';
      case ErrorType.NETWORK:
        return 'Problema de conexión. Verifique su internet e inténtelo de nuevo.';
      case ErrorType.STORAGE:
        return 'Error al acceder al almacenamiento. Por favor, inténtelo de nuevo.';
      case ErrorType.CONFIGURATION:
        return 'Error de configuración. Por favor, contacte al administrador.';
      default:
        return ERROR_MESSAGES.GENERIC_ERROR;
    }
  }

  return ERROR_MESSAGES.GENERIC_ERROR;
};

export const shouldShowToUser = (error: unknown): boolean => {
  if (isAppError(error)) {
    // No mostrar errores de configuración o críticos al usuario
    return error.severity !== ErrorSeverity.CRITICAL;
  }

  return true;
}; 