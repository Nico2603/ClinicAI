// =============================================================================
// BARREL EXPORTS - UTILIDADES
// =============================================================================

// Utilidades de formato
export * from './formatUtils';

// Utilidades simples - reemplazan las complejas
export * from './simpleValidation';
export * from './simpleDatabaseUtils';

// Utilidades de autenticación
export { 
  handleAuthError as authErrorHandler,
  logAuthMetrics,
  validateOAuthConfig,
  type AuthErrorResponse,
  type AuthErrorType 
} from './authErrorHandler';

// Utilidades de logging
export * from './logFilter';

// Re-exportar utilidades existentes del archivo utils.ts principal
export * from '../utils'; 