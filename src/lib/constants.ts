import { SpecialtyBase, Templates } from '@/types';

// Especialidades básicas para el sistema de plantillas personalizadas
export const DEFAULT_SPECIALTIES: SpecialtyBase[] = [
  { id: 'medicina_general', name: 'Medicina General' },
  { id: 'personalizada', name: 'Personalizada (Mi Plantilla)' },
];

// Sistema de plantillas personalizadas - Los usuarios ahora crean sus propias plantillas
// Las plantillas se guardan en la tabla user_templates con nombres como:
// 'Plantilla 1', 'Plantilla 2', etc., que pueden ser renombradas posteriormente
// Cada plantilla puede contener una nota clínica completa y funcional

export const MEDICAL_SCALES = [
  { id: 'none', name: 'Seleccione una escala...' },
  { id: 'phq-9', name: 'PHQ-9 (Cuestionario de Salud del Paciente-9 para Depresión)' },
  { id: 'gad-7', name: 'GAD-7 (Trastorno de Ansiedad Generalizada-7)' },
  { id: 'gcs', name: 'Escala de Coma de Glasgow (GCS)' },
  { id: 'cha2ds2-vasc', name: 'CHA₂DS₂-VASc (Riesgo de ACV en Fibrilación Auricular)' },
  { id: 'moca', name: 'MoCA (Evaluación Cognitiva de Montreal)' },
  { id: 'audit-c', name: 'AUDIT-C (Identificación de Trastornos por Consumo de Alcohol)' },
];

// OpenAI GPT Models
export const OPENAI_MODEL_TEXT = 'gpt-4o-mini';
export const OPENAI_MODEL_ADVANCED = 'gpt-4o'; // For complex medical cases if needed
// export const OPENAI_MODEL_IMAGE = 'dall-e-3'; // If image generation were needed

// Plantillas por defecto para nuevos usuarios (opcionales)
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
];