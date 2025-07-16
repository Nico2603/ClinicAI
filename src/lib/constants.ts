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

// Modelos OpenAI Nuevos (2025) - Específicamente configurado
// GPT-4.1-mini-2025-04-14 - Características del modelo:
// ✅ Contexto: 1M tokens (masivo para análisis extensos)
// ✅ Salida máxima: 32K tokens (ideal para notas largas)
// ✅ Conocimiento: Hasta junio 2024 (actualizado)
// ✅ Costo: $0.40/$1.60 por millón de tokens (muy económico)
// ✅ Rendimiento: 87.5% MMLU, 65% GPQA (excelente)
// ✅ Soporte: Mensajes system, parámetros completos
// ✅ Capacidades: Texto + Imágenes, 50% más rápido que GPT-4o
export const OPENAI_MODEL_LATEST = 'gpt-4.1-mini-2025-04-14';       // Modelo específico GPT-4.1 Mini
export const OPENAI_MODEL_REASONING = 'o1-preview';                  // Especializado en razonamiento (con limitaciones)
export const OPENAI_MODEL_REASONING_MINI = 'o1-mini';               // Razonamiento económico (con limitaciones)

// =============================================================================
// CONFIGURACIÓN DE MODELOS POR FUNCIÓN MÉDICA
// =============================================================================

export const MEDICAL_AI_MODELS = {
  // Funciones CRÍTICAS - Usando específicamente gpt-4.1-mini-2025-04-14
  CRITICAL_MEDICAL_FUNCTIONS: {
    generateNoteFromTemplate: 'gpt-4.1-mini-2025-04-14',           // Generación de notas médicas - CRÍTICO
    updateClinicalNote: 'gpt-4.1-mini-2025-04-14',                 // Actualización de notas - CRÍTICO  
    generateMedicalScale: 'gpt-4.1-mini-2025-04-14',               // Escalas médicas - Modelo específico
    analyzeClinicalContent: 'gpt-4.1-mini-2025-04-14',             // Análisis clínico complejo - Modelo específico
  },
  
  // Funciones IMPORTANTES - Usando gpt-4.1-mini-2025-04-14 para consistencia
  IMPORTANT_MEDICAL_FUNCTIONS: {
    searchEvidenceBasedRecommendations: 'gpt-4.1-mini-2025-04-14', // Búsqueda de evidencia médica
    generateSimplifiedEvidenceConsultation: 'gpt-4.1-mini-2025-04-14', // Consultas de evidencia
  },
  
  // Funciones AUXILIARES - Pueden usar modelos económicos
  AUXILIARY_FUNCTIONS: {
    extractTemplateFormat: 'gpt-4o-mini',                          // Extracción de formato - tarea simple
  }
} as const;

// =============================================================================
// CONFIGURACIÓN DE TEMPERATURA OPTIMIZADA PARA GPT-4.1-MINI-2025-04-14
// =============================================================================

export const TEMPERATURE_CONFIG = {
  // Funciones críticas - máxima precisión para GPT-4.1-mini
  CRITICAL_MEDICAL: 0.1,              // Para notas médicas y escalas - precisión máxima
  CLINICAL_REASONING: 0.15,            // Para análisis clínico complejo - optimizado para GPT-4.1-mini
  
  // Funciones importantes - balance entre precisión y creatividad
  TEMPLATE_GENERATION: 0.25,           // Optimizado para GPT-4.1-mini
  EVIDENCE_SUGGESTIONS: 0.2,           // Búsqueda de evidencia precisa
  CONSULTATION: 0.2,                   // Consultas clínicas profesionales
  
  // Funciones auxiliares - pueden ser más creativas
  FORMAT_EXTRACTION: 0.1,              // Extracción precisa de formatos
} as const;

// =============================================================================
// CONFIGURACIÓN DE TOKENS OPTIMIZADA PARA GPT-4.1-MINI-2025-04-14
// (Aprovechando 1M contexto y 32K salida máxima)
// =============================================================================

export const TOKEN_LIMITS = {
  // Funciones críticas - aprovechando la capacidad del modelo
  CRITICAL_MEDICAL_NOTE: 4000,        // Aumentado para notas médicas extensas
  CLINICAL_ANALYSIS: 6000,             // Aumentado para análisis clínico complejo
  MEDICAL_SCALE: 3000,                 // Aumentado para escalas médicas detalladas
  
  // Funciones importantes - tokens moderados-altos
  TEMPLATE_NOTE: 3000,                 // Aumentado para plantillas complejas
  EVIDENCE_SUGGESTIONS: 4000,          // Aumentado para mejor evidencia científica
  CONSULTATION: 3500,                  // Aumentado para consultas detalladas
  
  // Funciones auxiliares - tokens básicos optimizados
  FORMAT_EXTRACTION: 2000,             // Aumentado ligeramente para mejor extracción
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