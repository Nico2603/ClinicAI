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

const GENERIC_SOAP_TEMPLATE = `SUBJETIVO:
- [Información del paciente]

OBJETIVO:
- [Hallazgos del examen]

ANÁLISIS:
- [Impresión diagnóstica]

PLAN:
- [Tratamiento y seguimiento]`;

export const DEFAULT_TEMPLATES: Templates = {
  medicina_general: `MOTIVO DE CONSULTA:
- [Razón principal de la visita del paciente]

ANTECEDENTES:
- Personales Patológicos:
- Personales No Patológicos:
- Familiares:
- Farmacológicos:
- Alérgicos:

EXAMEN FÍSICO:
- Signos Vitales: TA:__, FC:__, FR:__, T:__°C, SatO2:__%
- General:
- Cabeza y Cuello:
- Cardiovascular:
- Respiratorio:
- Abdomen:
- Neurológico:
- Piel y Anexos:

IMPRESIÓN DIAGNÓSTICA:
- [Diagnóstico(s) presuntivo(s)]

PLAN DE MANEJO:
- Tratamiento farmacológico:
- Tratamiento no farmacológico:
- Exámenes complementarios solicitados:
- Educación al paciente:
- Cita de control:`,
  personalizada: `MI PLANTILLA PERSONALIZADA:
SECCIÓN 1:
- [Campo A]
- [Campo B]

SECCIÓN 2:
- [Detalles...]

CONCLUSIÓN:
- [Resumen y plan]
  
(Edita esta plantilla para crear tu formato ideal.)`,
  ortopedia: `SUBJETIVO:
- [Detalles del paciente sobre síntomas, inicio, duración, etc.]

OBJETIVO:
- Hallazgos del examen físico:
  - Inspección:
  - Palpación:
  - Rango de Movimiento:
  - Pruebas especiales:
- Resultados de estudios (Rayos X, MRI, etc.):

ANÁLISIS:
- Impresión diagnóstica principal:
- Diagnósticos diferenciales:

PLAN:
- Tratamiento propuesto (medicamentos, terapia, cirugía, etc.):
- Recomendaciones:
- Próxima cita / Seguimiento:`,
  psiquiatria: `MOTIVO DE CONSULTA:
- [Expresado por el paciente y/o acompañante]

ANTECEDENTES PERSONALES Y FAMILIARES:
- Psiquiátricos:
- Médicos:
- Consumo de sustancias:
- Historia de desarrollo:
- Historia familiar psiquiátrica:

EXAMEN MENTAL:
- Apariencia general y comportamiento:
- Estado de ánimo y afecto:
- Lenguaje y pensamiento (curso y contenido):
- Percepción:
- Cognición (orientación, atención, memoria):
- Insight y juicio:

IMPRESIÓN DIAGNÓSTICA (DSM-5/CIE-11 Ejes si aplica):
- Eje I:
- Eje II (si aplica):
- Diagnóstico principal:
- Diagnósticos diferenciales:

PLAN TERAPÉUTICO:
- Farmacológico:
- Psicoterapéutico:
- Intervenciones sociales/familiares:
- Recomendaciones:
- Seguimiento:`,
  cardiologia: GENERIC_SOAP_TEMPLATE,
  dermatologia: GENERIC_SOAP_TEMPLATE + `\n\nDESCRIPCIÓN DE LESIONES:\n- [Tipo, forma, tamaño, color, distribución]`,
  endocrinologia: GENERIC_SOAP_TEMPLATE,
  gastroenterologia: GENERIC_SOAP_TEMPLATE,
  ginecologia_obstetricia: `MOTIVO DE CONSULTA:
- [Razón principal]

ANTECEDENTES GINECO-OBSTÉTRICOS:
- G: P: A: C:
- FUM:
- Ciclos:
- Planificación:
- Citología (Fecha y resultado):
- Mamografía (Fecha y resultado):

EXAMEN FÍSICO (GENERAL Y GINECOLÓGICO):
- [Hallazgos]

IMPRESIÓN DIAGNÓSTICA:
- [Diagnóstico]

PLAN:
- [Manejo y recomendaciones]`,
  medicina_interna: GENERIC_SOAP_TEMPLATE,
  neurologia: GENERIC_SOAP_TEMPLATE + `\n\nEXAMEN NEUROLÓGICO DETALLADO:\n- Pares craneales:\n- Motor:\n- Sensitivo:\n- Reflejos:\n- Coordinación y marcha:`,
  oftalmologia: `MOTIVO DE CONSULTA:
- [Síntomas visuales]

ANTECEDENTES OFTALMOLÓGICOS:
- [Uso de gafas, cirugías, patologías previas]

AGUDEZA VISUAL (Sin corrección / Con corrección):
- OD:
- OI:

EXAMEN OFTALMOLÓGICO:
- Biomicroscopía:
- Presión Intraocular:
- Fondo de Ojo:

DIAGNÓSTICO:
- [Diagnóstico(s)]

PLAN:
- [Tratamiento, corrección óptica, seguimiento]`,
  oncologia: GENERIC_SOAP_TEMPLATE + `\n\nESTADIFICACIÓN (TNM):\n- T: N: M:\n\nPLAN ONCOLÓGICO:\n- [Quimioterapia, Radioterapia, Cirugía, Paliativo]`,
  pediatria: `MOTIVO DE CONSULTA:
- [Reportado por acompañante/paciente]

ANTECEDENTES PERINATALES Y DE DESARROLLO:
- [Datos relevantes]

VACUNACIÓN:
- [Esquema completo/incompleto]

EXAMEN FÍSICO (adaptado a edad):
- Peso: Talla: PC:
- [Hallazgos por sistemas]

IMPRESIÓN DIAGNÓSTICA:
- [Diagnóstico]

PLAN:
- [Tratamiento, recomendaciones, control de crecimiento y desarrollo]`,
  urologia: GENERIC_SOAP_TEMPLATE,
  anestesiologia: `EVALUACIÓN PREANESTÉSICA:
- Cirugía Propuesta:
- Antecedentes Médicos Relevantes:
- Alergias:
- Medicación Actual:
- Examen Físico (Vía aérea, Cardiovascular, Respiratorio):
- Clasificación ASA:

PLAN ANESTÉSICO:
- Tipo de Anestesia:
- Monitorización:
- Consideraciones Especiales:`,
  cirugia_general: GENERIC_SOAP_TEMPLATE + `\n\nPLAN QUIRÚRGICO:\n- Procedimiento:\n- Consentimiento informado: Sí/No`,
  medicina_emergencias: `TRIAGE: [Nivel] - HORA DE LLEGADA:
MOTIVO DE CONSULTA / EVENTO:
- [Descripción rápida]

EVALUACIÓN PRIMARIA (ABCDE):
- A:
- B:
- C:
- D:
- E:

EXAMEN FÍSICO DIRIGIDO:
- [Hallazgos relevantes]

IMPRESIÓN DIAGNÓSTICA INICIAL:
- [Sospechas]

PLAN INICIAL Y MANEJO EN URGENCIAS:
- [Intervenciones, medicamentos, exámenes solicitados]`,
  medicina_familiar: GENERIC_SOAP_TEMPLATE + `\n\nCONTEXTO FAMILIAR Y SOCIAL:\n- [Aspectos relevantes]`,
  neumologia: GENERIC_SOAP_TEMPLATE + `\n\nESPIROMETRÍA / PRUEBAS DE FUNCIÓN PULMONAR:\n- [Resultados principales]`,
  otorrinolaringologia: GENERIC_SOAP_TEMPLATE + `\n\nEXAMEN ORL:\n- Oído:\n- Nariz y Senos Paranasales:\n- Faringe/Laringe:`,
  radiologia: `ESTUDIO SOLICITADO:
- [Tipo de imagen, región anatómica]

HALLAZGOS:
- [Descripción detallada de los hallazgos imagenológicos]

IMPRESIÓN DIAGNÓSTICA:
- [Conclusión principal basada en los hallazgos]

RECOMENDACIONES (si aplica):
- [Sugerencias de estudios complementarios o correlación clínica]`,
  reumatologia: GENERIC_SOAP_TEMPLATE + `\n\nEXAMEN ARTICULAR DETALLADO:\n- [Articulaciones afectadas, inflamación, dolor, rango de movimiento]`,
  nutricion_dietetica: `MOTIVO DE CONSULTA NUTRICIONAL:
- [Objetivos del paciente]

VALORACIÓN ANTROPOMÉTRICA:
- Peso: Talla: IMC: Circunferencias:

HISTORIA DIETÉTICA (Recordatorio 24h / Frecuencia de consumo):
- [Hábitos alimentarios]

DIAGNÓSTICO NUTRICIONAL:
- [Identificación de problemas nutricionales]

PLAN DE INTERVENCIÓN NUTRICIONAL:
- Recomendaciones dietéticas:
- Plan de alimentación (si aplica):
- Educación nutricional:
- Metas y seguimiento:`,
  fisioterapia: `MOTIVO DE CONSULTA FISIOTERAPÉUTICA:
- [Dolor, limitación funcional, etc.]

EVALUACIÓN FISIOTERAPÉUTICA:
- Inspección y Palpación:
- Rangos de Movimiento Articular (ROM):
- Pruebas Musculares y Funcionales:
- Evaluación del Dolor (Escala, características):

DIAGNÓSTICO FISIOTERAPÉUTICO:
- [Disfunción principal]

PLAN DE TRATAMIENTO FISIOTERAPÉUTICO:
- Objetivos (corto y largo plazo):
- Intervenciones (Terapia manual, ejercicios, agentes físicos):
- Educación al paciente y ejercicios domiciliarios:
- Frecuencia y duración del tratamiento:`,
  psicologia_clinica: `MOTIVO DE CONSULTA PSICOLÓGICA:
- [Expresado por el paciente]

HISTORIA DEL PROBLEMA ACTUAL:
- [Inicio, curso, factores desencadenantes y mantenedores]

ANTECEDENTES RELEVANTES (Personales, familiares, sociales):
- [Información pertinente]

EXAMEN MENTAL (Observaciones y evaluación de áreas cognitivas, afectivas y comportamentales):
- [Descripción]

HIPÓTESIS DIAGNÓSTICA (Basada en criterios DSM/CIE o formulación clínica):
- [Impresión clínica]

PLAN DE INTERVENCIÓN PSICOLÓGICA:
- Objetivos terapéuticos:
- Enfoque terapéutico y técnicas:
- Frecuencia y duración estimada:
- Recomendaciones adicionales:`,
  fonoaudiologia: "PLANTILLA PARA FONOAUDIOLOGÍA",
  optometria: "PLANTILLA PARA OPTOMETRÍA",
  salud_ocupacional: "PLANTILLA PARA SALUD OCUPACIONAL",
  odontologia_general: `MOTIVO DE CONSULTA ODONTOLÓGICA:
- [Problema principal]

ANTECEDENTES MÉDICOS Y ODONTOLÓGICOS:
- [Relevantes para el tratamiento]

EXAMEN CLÍNICO EXTRAORAL E INTRAORAL:
- [Hallazgos]

ODONTOGRAMA:
- [Estado de cada pieza dental]

DIAGNÓSTICO ODONTOLÓGICO:
- [Caries, enfermedad periodontal, etc.]

PLAN DE TRATAMIENTO:
- Procedimientos propuestos:
- Fases del tratamiento:
- Pronóstico y recomendaciones:`,
};

export const MEDICAL_SCALES = [
  { id: 'none', name: 'Seleccione una escala...' },
  { id: 'phq-9', name: 'PHQ-9 (Cuestionario de Salud del Paciente-9 para Depresión)' },
  { id: 'gad-7', name: 'GAD-7 (Trastorno de Ansiedad Generalizada-7)' },
  { id: 'gcs', name: 'Escala de Coma de Glasgow (GCS)' },
  { id: 'cha2ds2-vasc', name: 'CHA₂DS₂-VASc (Riesgo de ACV en Fibrilación Auricular)' },
  { id: 'moca', name: 'MoCA (Evaluación Cognitiva de Montreal)' },
  { id: 'audit-c', name: 'AUDIT-C (Identificación de Trastornos por Consumo de Alcohol)' },
];


export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';
// export const GEMINI_MODEL_IMAGE = 'imagen-3.0-generate-002'; // If image generation were needed