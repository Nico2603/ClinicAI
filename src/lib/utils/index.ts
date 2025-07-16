// =============================================================================
// BARREL EXPORTS - UTILIDADES
// =============================================================================

// Utilidades de validación simples
// export * from './validationUtils'; // Eliminado - reemplazado por simpleValidation

// Utilidades de formato
export * from './formatUtils';

// Utilidades simples - reemplazan las complejas
export * from './simpleValidation';
export * from './simpleDatabaseUtils';

// Re-exportar utilidades existentes del archivo utils.ts principal
export * from '../utils'; 