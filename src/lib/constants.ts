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
// CONFIGURACIÓN SIMPLE DE IA
// =============================================================================

// Modelo único para toda la aplicación - simplicidad
export const OPENAI_MODEL = 'gpt-4o-2024-08-06';

// Configuración simple
export const AI_CONFIG = {
  TEMPERATURE: 0.1,          // Respuestas precisas
  MAX_TOKENS: 2000,          // Suficiente para notas médicas
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

// Configuración simple de animaciones
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
} as const;

// =============================================================================
// MENSAJES DE ERROR Y VALIDACIÓN OPTIMIZADOS
// =============================================================================

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es requerido.',
  TEMPLATE_ERROR: 'Error con la plantilla',
  NOTE_ERROR: 'Error al generar nota',
  API_KEY_MISSING: 'API key no configurada.',
  GENERIC_ERROR: 'Error inesperado. Intente nuevamente.',
} as const;

export const SUCCESS_MESSAGES = {
  SAVED: 'Guardado correctamente',
  CREATED: 'Creado correctamente',
  DELETED: 'Eliminado correctamente',
  GENERATED: 'Generado correctamente',
} as const;

// =============================================================================
// CONFIGURACIÓN SIMPLE DE VALIDACIÓN
// =============================================================================

export const VALIDATION_RULES = {
  MIN_TEXT_LENGTH: 3,         // Mínimo simple
  MAX_TEXT_LENGTH: 5000,      // Límite razonable
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
  DELETE: '¿Estás seguro de eliminar esto?',
  CLEAR_ALL: '¿Borrar todo?',
  DISCARD: '¿Descartar cambios?',
} as const;

// =============================================================================
// CONFIGURACIÓN DE CACHE LOCAL
// =============================================================================

export const CACHE_CONFIG = {
  TEMPLATES: {
    MAX_SIZE: 50,              // Máximo 50 plantillas en cache
    MAX_AGE: 30 * 60 * 1000,   // 30 minutos
    VERSION: 1,                 // Versión del cache (para invalidar automáticamente)
    STORAGE_PREFIX: 'notasai_template_cache',
    USAGE_PREFIX: 'notasai_template_usage'
  },
  PERFORMANCE: {
    BACKGROUND_SYNC_DELAY: 100,  // 100ms para sync en background
    CACHE_WRITE_DEBOUNCE: 500,   // 500ms debounce para escrituras
    LRU_CHECK_INTERVAL: 1000     // 1 segundo para verificar LRU
  }
} as const;

// =============================================================================
// CONFIGURACIÓN SIMPLE DE TIMEOUTS (ACTUALIZADA)
// =============================================================================

export const TIMEOUT_CONFIG = {
  DEFAULT: 10000,           // 10 segundos para operaciones generales
  AI_OPERATIONS: 30000,     // 30 segundos para IA
  CACHE_OPERATIONS: 5000,   // 5 segundos para operaciones de cache
  TEMPLATE_CREATION: 20000, // 20 segundos para crear plantillas
  TEMPLATE_UPDATE: 15000,   // 15 segundos para actualizar plantillas
  TEMPLATE_DELETE: 10000,   // 10 segundos para eliminar plantillas
  TEMPLATE_FETCH: 15000     // 15 segundos para cargar plantillas
} as const;