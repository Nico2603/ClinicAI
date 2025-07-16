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
// CONFIGURACIÓN DE MODELOS DE IA SIMPLIFICADA
// =============================================================================

// Modelos OpenAI Base - Simplificado para usar solo gpt-4o-mini
export const OPENAI_MODEL_TEXT = 'gpt-4o-mini';
export const OPENAI_MODEL_ADVANCED = 'gpt-4o';
export const OPENAI_MODEL_LATEST = 'gpt-4o-mini';
export const OPENAI_MODEL_REASONING = 'o1-preview';

// =============================================================================
// CONFIGURACIÓN DE MODELOS POR FUNCIÓN MÉDICA - SIMPLIFICADA
// =============================================================================

export const MEDICAL_AI_MODELS = {
  // Todas las funciones usando gpt-4o-mini para simplicidad
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
    extractTemplateFormat: 'gpt-4o-mini',              // Extracción de formato
  }
} as const;

// =============================================================================
// CONFIGURACIÓN DE TEMPERATURA OPTIMIZADA
// =============================================================================

export const TEMPERATURE_CONFIG = {
  // Funciones críticas - máxima precisión
  CRITICAL_MEDICAL: 0.1,              // Para notas médicas y escalas - precisión máxima
  CLINICAL_REASONING: 0.15,            // Para análisis clínico complejo
  
  // Funciones importantes - balance entre precisión y creatividad
  TEMPLATE_GENERATION: 0.25,           // Generación de plantillas
  EVIDENCE_SUGGESTIONS: 0.2,           // Búsqueda de evidencia precisa
  CONSULTATION: 0.2,                   // Consultas clínicas profesionales
  
  // Funciones auxiliares - pueden ser más creativas
  FORMAT_EXTRACTION: 0.1,              // Extracción precisa de formatos
} as const;

// =============================================================================
// CONFIGURACIÓN DE TOKENS OPTIMIZADA
// =============================================================================

export const TOKEN_LIMITS = {
  // Funciones críticas - límites apropiados para notas médicas
  CRITICAL_MEDICAL_NOTE: 4000,        // Para notas médicas extensas
  CLINICAL_ANALYSIS: 6000,             // Para análisis clínico complejo
  MEDICAL_SCALE: 3000,                 // Para escalas médicas detalladas
  
  // Funciones importantes - tokens moderados-altos
  TEMPLATE_NOTE: 3000,                 // Para plantillas complejas
  EVIDENCE_SUGGESTIONS: 4000,          // Para evidencia científica
  CONSULTATION: 3500,                  // Para consultas detalladas
  
  // Funciones auxiliares - tokens básicos
  FORMAT_EXTRACTION: 2000,             // Para extracción de formatos
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
// CONFIGURACIÓN DE UI
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

// Configuración de animaciones
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// =============================================================================
// MENSAJES DE ERROR Y VALIDACIÓN
// =============================================================================

export const ERROR_MESSAGES = {
  TEMPLATE_NOT_SELECTED: 'Por favor, seleccione una plantilla válida.',
  PATIENT_INFO_REQUIRED: 'Por favor, ingrese la información del paciente para la plantilla.',
  CLINICAL_INFO_REQUIRED: 'Por favor, ingrese la información clínica para generar sugerencias.',

  TEMPLATE_SAVE_ERROR: 'Error al guardar la plantilla',
  TEMPLATE_CREATE_ERROR: 'Error al crear la plantilla',
  TEMPLATE_DELETE_ERROR: 'Error al eliminar la plantilla',
  TEMPLATE_RENAME_ERROR: 'Error al renombrar la plantilla',
  NOTE_GENERATION_ERROR: 'Error desconocido al generar la nota',
  SUGGESTIONS_GENERATION_ERROR: 'Error desconocido al generar sugerencias',
  SPEECH_NOT_SUPPORTED: 'El dictado por voz no es compatible con este navegador.',
  OPENAI_API_KEY_MISSING: 'API key not configured for OpenAI.',
  GENERIC_ERROR: 'Ocurrió un error inesperado. Por favor, inténtelo de nuevo.',
} as const;

export const SUCCESS_MESSAGES = {
  TEMPLATE_SAVED: 'Plantilla guardada exitosamente',
  TEMPLATE_CREATED: 'Plantilla creada exitosamente',
  TEMPLATE_DELETED: 'Plantilla eliminada exitosamente',
  TEMPLATE_RENAMED: 'Plantilla renombrada exitosamente',
  NOTE_GENERATED: 'Nota generada exitosamente',
  SUGGESTIONS_GENERATED: 'Sugerencias generadas exitosamente',
} as const;

// =============================================================================
// CONFIGURACIÓN DE VALIDACIÓN
// =============================================================================

export const VALIDATION_RULES = {
  MIN_PATIENT_INFO_LENGTH: 10,
  MIN_CLINICAL_INFO_LENGTH: 5,
  MAX_PATIENT_INFO_LENGTH: 10000,
  MAX_CLINICAL_INFO_LENGTH: 10000,
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
// CONFIGURACIÓN DE CONFIRMACIONES
// =============================================================================

export const CONFIRMATION_MESSAGES = {
  DELETE_TEMPLATE: '¿Está seguro de que desea eliminar esta plantilla? Esta acción no se puede deshacer.',
  CLEAR_HISTORY: '¿Está seguro de que desea borrar todo el historial de notas? Esta acción no se puede deshacer.',
  DISCARD_CHANGES: '¿Está seguro de que desea descartar los cambios? Se perderán todos los cambios no guardados.',
} as const;