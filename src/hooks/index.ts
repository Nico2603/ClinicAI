// =============================================================================
// BARREL EXPORTS - HOOKS
// =============================================================================

// Hooks de estado de aplicación
export * from './useAppState';

// Hooks de notas y plantillas
export * from './useTemplateNotes';
export * from './useTemplateManager';



// Hooks de historial
export * from './useHistoryManager';

// Hooks de base de datos
export * from './useSimpleDatabase';
// export * from './useDatabase'; // Comentado - demasiado complejo para app simple

// Hooks de utilidades
export * from './useDarkMode';
export * from './useSpeechRecognition';

// Hooks de manejo de sesiones y utilidades
export * from './useSimpleSession';
export * from './useSimpleLoading';
// export * from './useSessionExpiry'; // Comentado - demasiado complejo para app simple
// export * from './useLoadingDetector'; // Comentado - demasiado complejo para app simple 