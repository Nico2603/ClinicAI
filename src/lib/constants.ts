// =============================================================================
// CONSTANTES DE LA APLICACIÓN
// =============================================================================

// Configuración general de la aplicación
export const APP_NAME = 'Notas AI';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Asistente de IA para notas clínicas';

// Configuración de plantillas
export const DEFAULT_TEMPLATE_NAME = 'Mi Plantilla';
export const MAX_TEMPLATE_NAME_LENGTH = 100;
export const MAX_TEMPLATE_CONTENT_LENGTH = 50000;

// =============================================================================
// CONFIGURACIÓN DE MODELOS DE IA OPTIMIZADOS POR TAREA
// =============================================================================

// Modelos OpenAI Base
export const OPENAI_MODEL_TEXT = 'gpt-4o-mini';
export const OPENAI_MODEL_ADVANCED = 'gpt-4o';

// Modelos OpenAI Nuevos (2025)
export const OPENAI_MODEL_LATEST = 'gpt-4.1';          // Último modelo con ventana de contexto 1M
export const OPENAI_MODEL_REASONING = 'o1-preview';    // Especializado en razonamiento
export const OPENAI_MODEL_REASONING_MINI = 'o1-mini';  // Razonamiento económico

// =============================================================================
// CONFIGURACIÓN DE MODELOS POR FUNCIÓN MÉDICA
// =============================================================================

export const MEDICAL_AI_MODELS = {
  // Funciones CRÍTICAS - Requieren máxima precisión
  CRITICAL_MEDICAL_FUNCTIONS: {
    generateNoteFromTemplate: 'gpt-4.1',           // Generación de notas médicas - CRÍTICO
    updateClinicalNote: 'gpt-4.1',                 // Actualización de notas - CRÍTICO  
    generateMedicalScale: 'o1-preview',             // Escalas médicas - Requiere razonamiento
    analyzeClinicalContent: 'o1-preview',           // Análisis clínico complejo - Requiere razonamiento
  },
  
  // Funciones IMPORTANTES - Requieren buena calidad
  IMPORTANT_MEDICAL_FUNCTIONS: {
    generateTemplateFromClinicalNote: 'gpt-4o',    // Análisis estructural
    searchEvidenceBasedRecommendations: 'gpt-4o',  // Búsqueda de evidencia médica
    generateSimplifiedEvidenceConsultation: 'gpt-4o', // Consultas de evidencia
  },
  
  // Funciones AUXILIARES - Pueden usar modelos económicos
  AUXILIARY_FUNCTIONS: {
    extractTemplateFormat: 'gpt-4o-mini',          // Extracción de formato - tarea simple
  }
} as const;

// =============================================================================
// CONFIGURACIÓN DE TEMPERATURA OPTIMIZADA POR FUNCIÓN
// =============================================================================

export const TEMPERATURE_CONFIG = {
  // Funciones críticas - máxima precisión
  CRITICAL_MEDICAL: 0.1,              // Para notas médicas y escalas
  CLINICAL_REASONING: 0.2,             // Para análisis clínico complejo
  
  // Funciones importantes - buena precisión
  TEMPLATE_GENERATION: 0.3,
  EVIDENCE_SUGGESTIONS: 0.2,
  CONSULTATION: 0.2,
  
  // Funciones auxiliares - pueden ser más creativas
  FORMAT_EXTRACTION: 0.1,
} as const;

// =============================================================================
// CONFIGURACIÓN DE TOKENS OPTIMIZADA
// =============================================================================

export const TOKEN_LIMITS = {
  // Funciones críticas - más tokens para mejor análisis
  CRITICAL_MEDICAL_NOTE: 3000,        // Notas médicas pueden ser extensas
  CLINICAL_ANALYSIS: 4000,             // Análisis clínico complejo
  MEDICAL_SCALE: 2000,                 // Escalas médicas detalladas
  
  // Funciones importantes - tokens moderados
  TEMPLATE_NOTE: 2000,
  EVIDENCE_SUGGESTIONS: 2500,          // Aumentado para mejor evidencia
  CONSULTATION: 2000,
  
  // Funciones auxiliares - tokens básicos  
  FORMAT_EXTRACTION: 1500,
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
  'nota-plantilla': 'Generador de Nota',
  'historial-notas': 'Historial',
  templates: 'Editor de Plantillas',
  'note-updater': 'Actualizador de Notas',
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

// =============================================================================
// PLANTILLAS POR DEFECTO
// =============================================================================

export const DEFAULT_USER_TEMPLATES = [
  {
    name: 'Mi Plantilla',
    content: `NOTA CLÍNICA

INFORMACIÓN DEL PACIENTE:
Nombre: [Nombre del paciente]
Edad: [Edad] años
Género: [Género]
Documento: [Documento de identidad]

MOTIVO DE CONSULTA:
[Motivo de consulta]

HISTORIA DE LA ENFERMEDAD ACTUAL:
[Historia de la enfermedad actual]

REVISIÓN POR SISTEMAS:
[Revisión por sistemas]

ANTECEDENTES:
- Personales: [Antecedentes personales]
- Farmacológicos: [Medicamentos actuales]
- Familiares: [Antecedentes familiares]
- Sociales: [Antecedentes sociales]

EXAMEN FÍSICO:
- Signos vitales: [Signos vitales]
- Aspecto general: [Aspecto general]
- Examen por sistemas: [Hallazgos del examen]

ANÁLISIS:
[Impresión diagnóstica]

PLAN:
1. Diagnóstico: [Plan diagnóstico]
2. Tratamiento: [Plan terapéutico]
3. Educación al paciente: [Educación al paciente]
4. Seguimiento: [Plan de seguimiento]

MÉDICO: [Nombre del médico]
FECHA: [Fecha de la consulta]

NOTA: Esta es una plantilla ESTRUCTURAL que define únicamente el formato. Los marcadores entre corchetes deben reemplazarse con datos reales del paciente. Las secciones sin información serán omitidas.`
  }
] as const;