// =============================================================================
// CONSTANTES DE LA APLICACIÓN
// =============================================================================

// Configuración general de la aplicación
export const APP_NAME = 'ClinicAI';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Asistente de IA para notas clínicas';

// Configuración de plantillas
export const DEFAULT_TEMPLATE_NAME = 'Mi Plantilla';
export const MAX_TEMPLATE_NAME_LENGTH = 100;
export const MAX_TEMPLATE_CONTENT_LENGTH = 50000;

// =============================================================================
// CONFIGURACIÓN DE MODELOS DE IA OPTIMIZADA PARA RENDIMIENTO
// =============================================================================

// Modelos OpenAI Base - Optimizados para velocidad
export const OPENAI_MODEL_TEXT = 'gpt-4o-mini';
export const OPENAI_MODEL_ADVANCED = 'gpt-4o';
export const OPENAI_MODEL_LATEST = 'gpt-4o-mini';
export const OPENAI_MODEL_REASONING = 'o1-preview';

// =============================================================================
// CONFIGURACIÓN DE MODELOS POR FUNCIÓN MÉDICA - OPTIMIZADA
// =============================================================================

export const MEDICAL_AI_MODELS = {
  // Todas las funciones usando gpt-4o-mini para velocidad óptima
  CRITICAL_MEDICAL_FUNCTIONS: {
    generateNoteFromTemplate: 'gpt-4o-mini',           // Generación de notas médicas
    updateClinicalNote: 'gpt-4o-mini',                 // Actualización de notas
    generateMedicalScale: 'gpt-4o-mini',               // Escalas médicas
    analyzeClinicalContent: 'gpt-4o-mini',             // Análisis clínico
  },
  
  IMPORTANT_MEDICAL_FUNCTIONS: {
    searchEvidenceBasedRecommendations: 'gpt-4o-mini', // Búsqueda de evidencia médica
    generateSimplifiedEvidenceConsultation: 'gpt-4o-mini', // Consultas de evidencia
  },
  
  AUXILIARY_FUNCTIONS: {
    // No auxiliary functions currently needed
  }
} as const;

// =============================================================================
// CONFIGURACIÓN DE TEMPERATURA OPTIMIZADA PARA VELOCIDAD Y PRECISIÓN
// =============================================================================

export const TEMPERATURE_CONFIG = {
  // Funciones críticas - temperaturas bajas para velocidad y precisión
  CRITICAL_MEDICAL: 0.05,             // Reducido de 0.1 - mayor velocidad y precisión
  CLINICAL_REASONING: 0.1,            // Reducido de 0.15 - respuestas más rápidas
  
  // Funciones importantes - balance optimizado para velocidad
  TEMPLATE_GENERATION: 0.15,          // Reducido de 0.25 - más rápido
  EVIDENCE_SUGGESTIONS: 0.1,          // Reducido de 0.2 - más preciso y rápido
  CONSULTATION: 0.15,                 // Reducido de 0.2 - respuestas más directas
  
  // Funciones auxiliares - optimizadas para velocidad
  // No auxiliary functions currently needed
} as const;

// =============================================================================
// CONFIGURACIÓN DE TOKENS OPTIMIZADA PARA VELOCIDAD
// =============================================================================

export const TOKEN_LIMITS = {
  // Funciones críticas - límites reducidos para respuestas más rápidas
  CRITICAL_MEDICAL_NOTE: 2500,        // Reducido de 4000 - respuestas más concisas y rápidas
  CLINICAL_ANALYSIS: 3000,             // Reducido de 6000 - análisis más eficiente
  MEDICAL_SCALE: 1500,                 // Reducido de 3000 - escalas más directas
  
  // Funciones importantes - tokens optimizados para velocidad
  TEMPLATE_NOTE: 2000,                 // Reducido de 3000 - plantillas más eficientes
  EVIDENCE_SUGGESTIONS: 2500,          // Reducido de 4000 - evidencia más concisa
  CONSULTATION: 2000,                  // Reducido de 3500 - consultas más directas
  
  // Funciones auxiliares - tokens mínimos necesarios
  // No auxiliary functions currently needed
} as const;

// =============================================================================
// CONFIGURACIÓN DE SPEECH RECOGNITION
// =============================================================================

export const SPEECH_CONFIG = {
  LANGUAGE: 'es-CO',
  CONTINUOUS: true,
  INTERIM_RESULTS: true,
  MAX_ALTERNATIVES: 1,
} as const;

// =============================================================================
// CONFIGURACIÓN DE UI OPTIMIZADA
// =============================================================================

// Títulos de vistas
export const VIEW_TITLES = {
  'nota-plantilla': 'Nueva nota',
  'historial-notas': 'Historial',
  templates: 'Plantillas',
  'note-updater': 'Actualizar nota',
  'note-editor': 'Editor de Nota',
} as const;

// Colores del tema
export const THEME_COLORS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  SUCCESS: 'green',
  ERROR: 'red',
  WARNING: 'yellow',
  INFO: 'blue',
} as const;

// Configuración de animaciones optimizada
export const ANIMATION_DURATION = {
  FAST: 100,     // Reducido de 150 - animaciones más rápidas
  NORMAL: 200,   // Reducido de 300 - mejor percepción de velocidad
  SLOW: 350,     // Reducido de 500 - menos espera
} as const;

// =============================================================================
// MENSAJES DE ERROR Y VALIDACIÓN OPTIMIZADOS
// =============================================================================

export const ERROR_MESSAGES = {
  TEMPLATE_NOT_SELECTED: 'Seleccione una plantilla válida.',
  PATIENT_INFO_REQUIRED: 'Ingrese la información del paciente.',
  CLINICAL_INFO_REQUIRED: 'Ingrese la información clínica.',

  TEMPLATE_SAVE_ERROR: 'Error al guardar plantilla',
  TEMPLATE_CREATE_ERROR: 'Error al crear plantilla',
  TEMPLATE_DELETE_ERROR: 'Error al eliminar plantilla',
  TEMPLATE_RENAME_ERROR: 'Error al renombrar plantilla',
  NOTE_GENERATION_ERROR: 'Error al generar nota',
  SUGGESTIONS_GENERATION_ERROR: 'Error al generar sugerencias',
  SPEECH_NOT_SUPPORTED: 'Dictado no compatible con este navegador.',
  OPENAI_API_KEY_MISSING: 'API key no configurada.',
  GENERIC_ERROR: 'Error inesperado. Intente nuevamente.',
} as const;

export const SUCCESS_MESSAGES = {
  TEMPLATE_SAVED: 'Plantilla guardada',
  TEMPLATE_CREATED: 'Plantilla creada',
  TEMPLATE_DELETED: 'Plantilla eliminada',
  TEMPLATE_RENAMED: 'Plantilla renombrada',
  NOTE_GENERATED: 'Nota generada',
  SUGGESTIONS_GENERATED: 'Sugerencias generadas',
} as const;

// =============================================================================
// CONFIGURACIÓN DE VALIDACIÓN OPTIMIZADA
// =============================================================================

export const VALIDATION_RULES = {
  MIN_PATIENT_INFO_LENGTH: 5,         // Reducido de 10 - menos restricciones
  MIN_CLINICAL_INFO_LENGTH: 3,        // Reducido de 5 - más flexible
  MAX_PATIENT_INFO_LENGTH: 8000,      // Reducido de 10000 - evitar prompts muy largos
  MAX_CLINICAL_INFO_LENGTH: 8000,     // Reducido de 10000 - mejor rendimiento
  MIN_TEMPLATE_NAME_LENGTH: 1,
  MAX_TEMPLATE_NAME_LENGTH: 100,
} as const;

// =============================================================================
// CONFIGURACIÓN DE ALMACENAMIENTO
// =============================================================================

export const STORAGE_KEYS = {
  THEME: 'notasai_theme',
  HISTORY_PREFIX: 'notasai_history_',
  USER_PREFERENCES: 'notasai_preferences',
} as const;

// =============================================================================
// CONFIGURACIÓN DE CONFIRMACIONES SIMPLIFICADAS
// =============================================================================

export const CONFIRMATION_MESSAGES = {
  DELETE_TEMPLATE: '¿Eliminar esta plantilla? No se puede deshacer.',
  CLEAR_HISTORY: '¿Borrar todo el historial? No se puede deshacer.',
  DISCARD_CHANGES: '¿Descartar cambios? Se perderán los cambios no guardados.',
} as const;

// =============================================================================
// CONFIGURACIÓN DE RENDIMIENTO ADICIONAL
// =============================================================================

// Configuración de timeouts optimizada
export const TIMEOUT_CONFIG = {
  FAST_OPERATIONS: 5000,       // 5 segundos para operaciones rápidas
  STANDARD_OPERATIONS: 15000,  // 15 segundos para operaciones estándar
  COMPLEX_OPERATIONS: 30000,   // 30 segundos para operaciones complejas (IA)
  DATABASE_OPERATIONS: 8000,   // 8 segundos para operaciones de BD
} as const;

// Configuración de cache optimizada
export const CACHE_CONFIG = {
  SHORT_CACHE: 10 * 60 * 1000,    // 10 minutos para datos dinámicos
  MEDIUM_CACHE: 30 * 60 * 1000,   // 30 minutos para datos semi-estáticos
  LONG_CACHE: 60 * 60 * 1000,     // 1 hora para datos estáticos
  MAX_CACHE_SIZE: 100,             // Máximo 100 entradas por cache
} as const;

// Configuración de retry optimizada
export const RETRY_CONFIG = {
  MAX_RETRIES: 1,           // Solo 1 reintento para evitar esperas largas
  RETRY_DELAY: 1000,        // 1 segundo entre reintentos
  EXPONENTIAL_BACKOFF: false, // Deshabilitado para mayor velocidad
} as const;