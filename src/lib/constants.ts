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
// CONFIGURACIÓN DE MODELOS DE IA
// =============================================================================

// Modelos OpenAI
export const OPENAI_MODEL_TEXT = 'gpt-4o-mini';
export const OPENAI_MODEL_ADVANCED = 'gpt-4o';

// Configuración de temperatura para diferentes tipos de generación
export const TEMPERATURE_CONFIG = {
  TEMPLATE_GENERATION: 0.3,
  EVIDENCE_SUGGESTIONS: 0.2,
  CLINICAL_SCALES: 0.1,
  CONSULTATION: 0.2,
} as const;

// Configuración de tokens
export const TOKEN_LIMITS = {
  TEMPLATE_NOTE: 2000,
  EVIDENCE_SUGGESTIONS: 1500,
  CLINICAL_SCALE: 1000,
  CONSULTATION: 2000,
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
// ESCALAS MÉDICAS
// =============================================================================

export const MEDICAL_SCALES = [
  { id: 'none', name: 'Seleccione una escala...' },
  { id: 'phq-9', name: 'PHQ-9 (Cuestionario de Salud del Paciente-9 para Depresión)' },
  { id: 'gad-7', name: 'GAD-7 (Trastorno de Ansiedad Generalizada-7)' },
  { id: 'gcs', name: 'Escala de Coma de Glasgow (GCS)' },
  { id: 'cha2ds2-vasc', name: 'CHA₂DS₂-VASc (Riesgo de ACV en Fibrilación Auricular)' },
  { id: 'moca', name: 'MoCA (Evaluación Cognitiva de Montreal)' },
  { id: 'audit-c', name: 'AUDIT-C (Identificación de Trastornos por Consumo de Alcohol)' },
] as const;

// =============================================================================
// CONFIGURACIÓN DE UI
// =============================================================================

// Títulos de vistas
export const VIEW_TITLES = {
  templates: 'Editor de Plantillas',
  'nota-plantilla': 'Nota con Plantilla',
  'sugerencia-evidencia': 'Sugerencia basada en Evidencia',
  'escalas-clinicas': 'Escalas Clínicas',
  'consulta-evidencia': 'Consulta Basada en Evidencia',
  'note-updater': 'Actualizador de Notas',
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
  SCALE_INPUT_REQUIRED: 'Por favor, ingrese información clínica para la escala.',
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
    name: 'Plantilla 1',
    content: `NOTA CLÍNICA

DATOS DEL PACIENTE:
Nombre: [Nombre del paciente]
Edad: [Edad] años
Género: [Género]
Documento: [Tipo y número de documento]

MOTIVO DE CONSULTA:
[Descripción del motivo principal de la consulta]

HISTORIA DE LA ENFERMEDAD ACTUAL:
[Evolución temporal de los síntomas, características, factores desencadenantes, etc.]

REVISIÓN POR SISTEMAS:
[Síntomas asociados por sistemas]

ANTECEDENTES:
- Personales: [Enfermedades previas, cirugías, hospitalizaciones]
- Farmacológicos: [Medicamentos actuales, alergias]
- Familiares: [Antecedentes familiares relevantes]
- Sociales: [Hábitos, ocupación, estado civil]

EXAMEN FÍSICO:
- Signos vitales: FC: ___ lpm, FR: ___ rpm, TA: ___/__ mmHg, T°: ___°C, Sat O2: ___%
- Aspecto general: [Descripción del estado general del paciente]
- [Examen por sistemas relevantes]

ANÁLISIS:
[Impresión diagnóstica y diagnósticos diferenciales]

PLAN:
1. Diagnóstico:
   - [Estudios diagnósticos solicitados]
2. Tratamiento:
   - [Plan terapéutico]
3. Educación:
   - [Recomendaciones al paciente]
4. Control:
   - [Seguimiento programado]

MÉDICO: [Nombre del médico]
REGISTRO: [Número de registro médico]
FECHA: [Fecha de la consulta]`
  }
] as const;