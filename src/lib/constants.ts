import { SpecialtyBase, Templates } from '@/types';

export const DEFAULT_SPECIALTIES: SpecialtyBase[] = [
  { id: 'medicina_general', name: 'Medicina General' },
  { id: 'personalizada', name: 'Personalizada (Mi Plantilla)' },
  { id: 'ortopedia', name: 'Ortopedia y Traumatología' },
  { id: 'psiquiatria', name: 'Psiquiatría' },
  { id: 'cardiologia', name: 'Cardiología' },
  { id: 'dermatologia', name: 'Dermatología' },
  { id: 'endocrinologia', name: 'Endocrinología' },
  { id: 'gastroenterologia', name: 'Gastroenterología' },
  { id: 'ginecologia_obstetricia', name: 'Ginecología y Obstetricia' },
  { id: 'medicina_interna', name: 'Medicina Interna' },
  { id: 'neurologia', name: 'Neurología' },
  { id: 'oftalmologia', name: 'Oftalmología' },
  { id: 'oncologia', name: 'Oncología' },
  { id: 'pediatria', name: 'Pediatría' },
  { id: 'urologia', name: 'Urología' },
  { id: 'anestesiologia', name: 'Anestesiología' },
  { id: 'cirugia_general', name: 'Cirugía General' },
  { id: 'medicina_emergencias', name: 'Medicina de Emergencias' },
  { id: 'medicina_familiar', name: 'Medicina Familiar' },
  { id: 'neumologia', name: 'Neumología' },
  { id: 'otorrinolaringologia', name: 'Otorrinolaringología' },
  { id: 'radiologia', name: 'Radiología (Diagnóstico por Imágenes)' },
  { id: 'reumatologia', name: 'Reumatología' },
  // Especialidades de salud general relevantes en Colombia
  { id: 'nutricion_dietetica', name: 'Nutrición y Dietética' },
  { id: 'fisioterapia', name: 'Fisioterapia' },
  { id: 'psicologia_clinica', name: 'Psicología Clínica' },
  { id: 'fonoaudiologia', name: 'Fonoaudiología' },
  { id: 'optometria', name: 'Optometría' },
  { id: 'salud_ocupacional', name: 'Salud Ocupacional' },
  { id: 'odontologia_general', name: 'Odontología General' },
];

// Plantillas predefinidas eliminadas - ahora los usuarios crean sus propias plantillas personalizadas

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