import { OpenAI } from 'openai';
import {
  OPENAI_MODEL_TEXT,
  OPENAI_MODEL_ADVANCED,
  OPENAI_MODEL_LATEST,
  OPENAI_MODEL_REASONING,
  MEDICAL_AI_MODELS,
  TEMPERATURE_CONFIG,
  TOKEN_LIMITS,
  ERROR_MESSAGES,
  VALIDATION_RULES
} from '../constants';
import { 
  GroundingMetadata, 
  ClinicalAnalysisResult,
  EvidenceConsultationRequest,
  EvidenceSearchResult,
  ClinicalFinding,
  ClinicalRecommendation
} from '../../types';

// =============================================================================
// CONFIGURACIÓN Y VALIDACIÓN
// =============================================================================

// Configuración de OpenAI
const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!API_KEY) {
  console.error("❌ NEXT_PUBLIC_OPENAI_API_KEY no está configurada. Por favor verifica tu archivo .env");
  console.error("La aplicación podría no funcionar correctamente sin esta clave.");
}

// Cliente OpenAI con timeout
const openai = new OpenAI({
  apiKey: API_KEY || '',
  dangerouslyAllowBrowser: true,
  timeout: 30000, // 30 segundos timeout
  maxRetries: 2, // Máximo 2 reintentos
});

// Funciones de validación
const validateApiKey = (): void => {
  if (!API_KEY) {
    throw new Error(ERROR_MESSAGES.OPENAI_API_KEY_MISSING);
  }
};

const validateInput = (input: string, minLength: number = 1): void => {
  if (!input || input.trim().length < minLength) {
    throw new Error('Input inválido: el texto debe tener al menos ' + minLength + ' caracteres');
  }
};

const validateTemplateInput = (templateContent: string, patientInfo: string): void => {
  validateInput(templateContent, 10);
  validateInput(patientInfo, VALIDATION_RULES.MIN_PATIENT_INFO_LENGTH);
  
  if (patientInfo.length > VALIDATION_RULES.MAX_PATIENT_INFO_LENGTH) {
    throw new Error('La información del paciente es demasiado larga');
  }
};

const validateClinicalInput = (clinicalInput: string): void => {
  validateInput(clinicalInput, VALIDATION_RULES.MIN_CLINICAL_INFO_LENGTH);
  
  if (clinicalInput.length > VALIDATION_RULES.MAX_CLINICAL_INFO_LENGTH) {
    throw new Error('La información clínica es demasiado larga');
  }
};

// Función para manejar errores de OpenAI
const handleOpenAIError = (error: unknown, context: string): Error => {
  console.error(`Error en ${context}:`, error);
  
  if (error instanceof Error) {
    // Manejar errores específicos de OpenAI
    if (error.message.includes('API key')) {
      return new Error(ERROR_MESSAGES.OPENAI_API_KEY_MISSING);
    }
    if (error.message.includes('rate limit')) {
      return new Error('Límite de API excedido. Por favor, inténtelo más tarde.');
    }
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      return new Error('El servicio tardó demasiado en responder. Por favor, inténtelo de nuevo con menos contenido.');
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new Error('Error de conexión. Verifique su conexión a internet.');
    }
    if (error.message.includes('invalid_request_error')) {
      return new Error('Solicitud inválida. El contenido puede ser demasiado largo.');
    }
    if (error.message.includes('context_length_exceeded')) {
      return new Error('El contenido es demasiado largo. Por favor, reduce el tamaño del texto.');
    }
    return new Error(`Error en ${context}: ${error.message}`);
  }
  
  return new Error(`Error desconocido en ${context}`);
};

// =============================================================================
// SERVICIOS PRINCIPALES
// =============================================================================

export const generateNoteFromTemplate = async (
  specialtyName: string,
  templateContent: string,
  patientInfo: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateTemplateInput(templateContent, patientInfo);
  
  const prompt = `Eres un asistente médico experto en completar notas clínicas. Tu tarea es utilizar ÚNICAMENTE la información del paciente proporcionada para generar una nota médica siguiendo el formato de la plantilla.

INFORMACIÓN DEL PACIENTE:
"${patientInfo}"

PLANTILLA (SOLO FORMATO - NO CONTIENE DATOS REALES):
---
${templateContent}
---

🚨 INSTRUCCIONES CRÍTICAS - CUMPLIMIENTO OBLIGATORIO:

1. **LA PLANTILLA ES SOLO UN FORMATO ESTRUCTURAL:**
   - La plantilla contiene ÚNICAMENTE la estructura/formato que debes seguir
   - TODOS los datos en la plantilla son EJEMPLOS FICTICIOS que DEBES IGNORAR COMPLETAMENTE
   - Ejemplos como "[Nombre del paciente]", "Juan Pérez", "45 años", etc. son SOLO MARCADORES DE POSICIÓN
   - NUNCA uses, copies o te bases en ningún dato específico de la plantilla
   - La plantilla NO ES una fuente de información sobre el paciente real

2. **FORMATO ESTRUCTURAL SAGRADO:**
   - Respeta EXACTAMENTE: encabezados, mayúsculas/minúsculas, viñetas, numeración, sangrías, espacios
   - Conserva la jerarquía visual y organización de secciones
   - Mantén todos los elementos estructurales: dos puntos (:), guiones (-), números (1., 2.), etc.

3. **CONTENIDO EXCLUSIVAMENTE REAL:**
   - Usa SOLO la información del paciente proporcionada en la sección "INFORMACIÓN DEL PACIENTE"
   - NO inventes, asumas, deduzcas o completes datos faltantes
   - NO agregues información que no esté explícitamente mencionada
   - Si la información del paciente no menciona algo específico, NO lo incluyas

4. **MANEJO DE INFORMACIÓN FALTANTE:**
   - Si una sección de la plantilla no tiene información correspondiente en los datos del paciente, OMITE completamente esa sección
   - NO escribas: "Dato faltante", "No disponible", "A evaluar", "Pendiente", ni similares
   - NO dejes espacios en blanco ni marcadores de posición
   - Simplemente salta a la siguiente sección que sí tenga información

5. **OBSERVACIONES PARA DATOS FALTANTES:**
   - Al final de la nota, crea una sección "OBSERVACIONES:"
   - Lista ÚNICAMENTE las secciones/campos que no pudieron completarse por falta de información
   - Formato: "OBSERVACIONES: Secciones no completadas por falta de información: [lista específica]"
   - Solo incluye esta sección si efectivamente hay datos faltantes

6. **EJEMPLOS DE LO QUE NO DEBES HACER:**
   ❌ Usar "Juan Pérez" si aparece en la plantilla como ejemplo
   ❌ Copiar "45 años" de la plantilla si no está en la información del paciente
   ❌ Escribir "Dato faltante" en ninguna parte
   ❌ Inventar signos vitales, medicamentos, o diagnósticos
   ❌ Asumir información basada en síntomas mencionados

7. **RESPUESTA FINAL:**
   - Responde ÚNICAMENTE con la nota médica completada
   - No agregues comentarios, explicaciones, introducciones ni despedidas
   - La nota debe ser profesional y directamente utilizable

RECUERDA: La plantilla es un MOLDE VACÍO que defines la forma, pero NUNCA el contenido. Los datos del paciente son la ÚNICA fuente de información válida.`;

  try {
    const response = await openai.chat.completions.create({
      model: MEDICAL_AI_MODELS.CRITICAL_MEDICAL_FUNCTIONS.generateNoteFromTemplate,
      messages: [
        {
          role: "system",
          content: "Eres un asistente médico experto especializado en generar notas clínicas precisas y profesionales. NUNCA usas datos de las plantillas como información del paciente - las plantillas son SOLO formatos estructurales. Solo usas información explícitamente proporcionada del paciente real y omites secciones sin datos correspondientes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: TEMPERATURE_CONFIG.CRITICAL_MEDICAL,
      max_tokens: TOKEN_LIMITS.CRITICAL_MEDICAL_NOTE,
      top_p: 0.9
    });

    const generatedText = response.choices[0]?.message?.content || '';
    
    if (!generatedText.trim()) {
      throw new Error('No se pudo generar contenido válido');
    }

    return { 
      text: generatedText, 
      groundingMetadata: undefined
    };
  } catch (error) {
    throw handleOpenAIError(error, 'generación de nota con plantilla');
  }
};



export const generateMedicalScale = async (
  clinicalInput: string,
  scaleName: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateClinicalInput(clinicalInput);
  validateInput(scaleName, 2);

  const prompt = `Eres un asistente médico experto en la aplicación de escalas clínicas estandarizadas. Tu tarea es evaluar la escala "${scaleName}" basándote ÚNICAMENTE en la información clínica proporcionada.

INFORMACIÓN CLÍNICA DISPONIBLE:
"${clinicalInput}"

ESCALA A EVALUAR: ${scaleName}

🚨 **INSTRUCCIONES CRÍTICAS PARA APLICACIÓN DE ESCALAS:**

1. **ANÁLISIS ESTRICTO DE INFORMACIÓN:**
   - Lee detenidamente SOLO la información clínica proporcionada
   - Identifica únicamente los datos que correspondan a los ítems de la escala ${scaleName}
   - NO hagas inferencias o suposiciones más allá de lo explícitamente mencionado

2. **PUNTUACIÓN BASADA EN DATOS REALES:**
   - Asigna puntajes ÚNICAMENTE basándote en información específica disponible
   - Si la información para un ítem es insuficiente o no está disponible, marca claramente "Información insuficiente"
   - NO uses "juicio clínico" para inferir datos que no están presentes
   - NO inventes o asumas información que no esté explícitamente mencionada

3. **MANEJO DE INFORMACIÓN FALTANTE:**
   - Si faltan datos para evaluar ítems específicos, NO los puntúes
   - Indica claramente qué ítems no pudieron evaluarse y por qué
   - NO asumas valores "normales" o "probables" para datos faltantes

4. **CÁLCULO DE PUNTAJE TOTAL:**
   - Solo incluye en el cálculo los ítems que pudieron evaluarse con información real
   - Si faltan datos críticos para la escala, indica que el resultado puede ser incompleto
   - Menciona qué porcentaje de la escala pudo completarse

5. **INTERPRETACIÓN RESPONSABLE:**
   - Solo proporciona interpretación si el puntaje está basado en información suficiente
   - Si faltan datos importantes, indica las limitaciones de la interpretación
   - No hagas conclusiones definitivas con información incompleta

6. **FORMATO DE RESPUESTA CLARO:**
   - Presenta cada ítem de la escala con su puntaje y justificación
   - Indica claramente qué información se usó para cada puntuación
   - Lista los ítems que no pudieron evaluarse por falta de información
   - Proporciona puntaje total solo si es representativo

7. **ESTRUCTURA SUGERIDA:**
   
   ESCALA ${scaleName}:
   
   Ítem 1: [Puntaje] - Justificación basada en: [dato específico]
   Ítem 2: Información insuficiente - Falta: [dato específico necesario]
   ...
   
   PUNTAJE TOTAL: [X/Y puntos] ([Z]% de la escala completada)
   
   INTERPRETACIÓN: [Solo si hay suficiente información]
   
   LIMITACIONES: [Mencionar datos faltantes que afectan la evaluación]

8. **RESPUESTA FINAL:**
   - Proporciona ÚNICAMENTE el resultado de la escala
   - NO incluyas saludos, comentarios introductorios ni despedidas
   - La respuesta debe ser profesional y directamente utilizable

**REGLA FUNDAMENTAL:** Solo usa información explícitamente proporcionada. Si no hay suficiente información para evaluar la escala completa, sé transparente sobre las limitaciones.`;

  try {
    const response = await openai.chat.completions.create({
      model: MEDICAL_AI_MODELS.CRITICAL_MEDICAL_FUNCTIONS.generateMedicalScale,
      messages: [
        {
          role: "system",
          content: "Eres un asistente médico experto en la aplicación de escalas clínicas estandarizadas. SOLO usas información explícitamente proporcionada para puntuar escalas, NUNCA inventas datos. Eres transparente sobre limitaciones cuando falta información."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: TEMPERATURE_CONFIG.CLINICAL_REASONING,
      max_tokens: TOKEN_LIMITS.MEDICAL_SCALE,
      top_p: 0.9
    });

    const result = response.choices[0]?.message?.content || '';
    
    if (!result.trim()) {
      throw new Error('No se pudo generar contenido válido');
    }
    
    return {
      text: result,
      groundingMetadata: { groundingChunks: [] }
    };
  } catch (error) {
    throw handleOpenAIError(error, 'generación de escala médica');
  }
};

// =============================================================================
// SERVICIOS ADICIONALES (mantener funcionalidad existente)
// =============================================================================

export const generateTemplateFromClinicalNote = async (
  clinicalNote: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateClinicalInput(clinicalNote);

  const prompt = `Eres un experto en crear PLANTILLAS ESTRUCTURALES a partir de notas clínicas. Tu tarea es convertir la nota clínica en una plantilla que sirva como FORMATO PURO, eliminando TODOS los datos específicos del paciente.

🎯 OBJETIVO: Crear una plantilla que sea un MOLDE ESTRUCTURAL VACÍO, sin ningún dato real del paciente.

NOTA CLÍNICA ORIGINAL:
---
${clinicalNote}
---

🚨 INSTRUCCIONES CRÍTICAS PARA CREAR PLANTILLA FORMATO:

1. **PRESERVAR ESTRUCTURA EXACTA:**
   - Mantén EXACTAMENTE: encabezados, mayúsculas/minúsculas, viñetas, numeración, sangrías
   - Conserva todos los elementos visuales: dos puntos (:), guiones (-), números, espacios
   - Respeta la jerarquía y organización de secciones
   - NO cambies el orden ni elimines secciones estructurales

2. **ELIMINAR TODOS LOS DATOS ESPECÍFICOS:**
   - Nombres de pacientes → [Nombre del paciente]
   - Edades específicas → [Edad] años
   - Fechas específicas → [Fecha]
   - Números de documento → [Documento de identidad]
   - Diagnósticos específicos → [Diagnóstico]
   - Medicamentos específicos → [Medicamento]
   - Valores de laboratorio → [Valor de laboratorio]
   - Signos vitales → [Signos vitales]
   - Síntomas específicos → [Síntoma]
   - Nombres de médicos → [Nombre del médico]

3. **MARCADORES DESCRIPTIVOS GENERALES:**
   - Usa marcadores GENÉRICOS que describan el TIPO de dato, no el dato específico
   - Ejemplos correctos: [Motivo de consulta], [Antecedentes familiares], [Hallazgos del examen]
   - Ejemplos INCORRECTOS: [Dolor abdominal], [Diabetes], [Juan Pérez]
   - NO preserves información específica en los marcadores

4. **CONSERVAR ELEMENTOS ESTRUCTURALES NO ESPECÍFICOS:**
   - Mantén frases estructurales como "Signos vitales:", "Antecedentes:", "Plan:"
   - Conserva palabras de enlace y estructura médica general
   - Mantén terminología médica general no específica al paciente

5. **ELIMINAR INFORMACIÓN CONTEXTUAL ESPECÍFICA:**
   - NO conserves hallazgos específicos de la patología original
   - NO mantengas valores normales específicos si son del paciente particular
   - Reemplaza TODO lo que sea específico del caso particular

6. **AGREGAR NOTA EXPLICATIVA:**
   - Al final, agrega: "NOTA: Esta es una plantilla ESTRUCTURAL. Los marcadores entre corchetes deben reemplazarse con datos reales del paciente."

7. **RESPUESTA FINAL:**
   - Responde ÚNICAMENTE con la plantilla resultante
   - NO agregues comentarios, explicaciones adicionales, ni introducciones
   - La plantilla debe ser directamente utilizable como formato

RECUERDA: Estás creando un FORMATO REUTILIZABLE. Toda información específica del paciente original debe convertirse en marcadores genéricos. La plantilla resultante debe poder usarse para CUALQUIER paciente de cualquier edad, sexo o condición.`;

  try {
    const response = await openai.chat.completions.create({
      model: MEDICAL_AI_MODELS.IMPORTANT_MEDICAL_FUNCTIONS.generateTemplateFromClinicalNote,
      messages: [
        {
          role: "system",
          content: "Eres un experto en crear plantillas estructurales médicas. Tu especialidad es convertir notas clínicas en formatos reutilizables eliminando TODA información específica del paciente y creando marcadores genéricos. Las plantillas resultantes son moldes vacíos sin datos reales."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: TEMPERATURE_CONFIG.TEMPLATE_GENERATION,
      max_tokens: TOKEN_LIMITS.TEMPLATE_NOTE,
      top_p: 0.9
    });

    const generatedText = response.choices[0]?.message?.content || '';
    return {
      text: generatedText,
      groundingMetadata: undefined
    };
  } catch (error) {
    throw handleOpenAIError(error, 'generación de plantilla desde nota clínica');
  }
}; 

export const updateClinicalNote = async (
  originalNote: string,
  newInformation: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();

  const prompt = `Eres un asistente médico experto especializado en actualizar notas clínicas existentes con nueva información de manera precisa y selectiva. Tu tarea es integrar ÚNICAMENTE la nueva información proporcionada sin reescribir, inventar o modificar secciones que no requieren cambios.

**NOTA CLÍNICA ORIGINAL:**
---
${originalNote}
---

**NUEVA INFORMACIÓN A INTEGRAR:**
---
${newInformation}
---

🚨 **INSTRUCCIONES CRÍTICAS PARA ACTUALIZACIÓN:**

1. **PRESERVACIÓN ABSOLUTA DE LO EXISTENTE:**
   - Mantén EXACTAMENTE el mismo formato, estructura y estilo de la nota original
   - NO reescribas secciones que no requieren actualización
   - Conserva todos los encabezados, numeración, viñetas y sangrías tal como están
   - Preserva el orden y la estructura de las secciones existentes
   - NO modifiques el estilo de redacción original

2. **INTEGRACIÓN SOLO DE INFORMACIÓN NUEVA:**
   - Usa ÚNICAMENTE la nueva información proporcionada en la sección correspondiente
   - NO inventes, asumas, deduzcas o agregues información que no esté explícitamente en la nueva información
   - Si la nueva información no menciona algo específico, NO lo agregues
   - NO hagas inferencias basadas en la nueva información

3. **ACTUALIZACIÓN SELECTIVA PRECISA:**
   - Identifica específicamente qué sección(es) deben actualizarse con la nueva información
   - Solo modifica las partes exactas que la nueva información actualiza o complementa
   - Si la nueva información es adicional, agrégala sin modificar lo existente
   - Si la nueva información reemplaza datos existentes, reemplaza SOLO esos datos específicos

4. **MANEJO DE INFORMACIÓN FALTANTE:**
   - Si la nueva información no es suficiente para completar una sección, NO la completes
   - NO agregues "pendiente", "a evaluar", "dato faltante" u observaciones similares
   - Simplemente integra lo que está disponible y deja el resto sin modificar

5. **ANÁLISIS INTELIGENTE DE UBICACIÓN:**
   - Analiza dónde pertenece la nueva información (evolución, examen, tratamiento, etc.)
   - Respeta la lógica temporal y médica de la nota
   - Mantén la coherencia clínica entre la información original y la nueva
   - Coloca la nueva información en la sección más apropiada

6. **INTEGRACIÓN NATURAL:**
   - Integra la nueva información de forma fluida en el contexto existente
   - Usa el mismo estilo de redacción médica de la nota original
   - Mantén la terminología médica consistente
   - Respeta el tono y formato profesional

7. **FORMATO DE RESPUESTA:**
   - Devuelve la nota clínica completa con SOLO las modificaciones necesarias
   - NO incluyas comentarios, explicaciones o notas adicionales
   - La respuesta debe ser directamente la nota médica actualizada
   - NO agregues secciones de observaciones sobre los cambios

8. **EJEMPLOS DE ACTUALIZACIÓN CORRECTA:**
   - Nueva información: "Presión arterial: 140/90 mmHg" → Actualiza SOLO el valor en signos vitales
   - Nueva información: "Inició tratamiento con losartán" → Agrega SOLO eso al plan de tratamiento
   - Nueva información incompleta: NO inventes el resto de la información

**REGLA FUNDAMENTAL:** Solo actualiza lo que está explícitamente mencionado en la nueva información. NUNCA inventes, completes o asumas datos adicionales.`;

  try {
    const response = await openai.chat.completions.create({
      model: MEDICAL_AI_MODELS.CRITICAL_MEDICAL_FUNCTIONS.updateClinicalNote,
      messages: [
        {
          role: "system",
          content: "Eres un asistente médico experto especializado en actualizar notas clínicas de forma selectiva y precisa. SOLO usas información explícitamente proporcionada, NUNCA inventas datos adicionales. Preservas la estructura original y modificas únicamente lo estrictamente necesario."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: TEMPERATURE_CONFIG.CRITICAL_MEDICAL,
      max_tokens: TOKEN_LIMITS.CRITICAL_MEDICAL_NOTE,
      top_p: 0.8
    });

    const generatedText = response.choices[0]?.message?.content || '';
    return { 
      text: generatedText, 
      groundingMetadata: undefined
    };
  } catch (error) {
    throw handleOpenAIError(error, 'actualización selectiva de nota clínica');
  }
}; 

// ===== ANÁLISIS INTELIGENTE DE INFORMACIÓN CLÍNICA =====





// ===== CONSULTA CLÍNICA PARA IA BASADA EN EVIDENCIA =====

export const analyzeClinicalContent = async (
  request: EvidenceConsultationRequest
): Promise<ClinicalAnalysisResult> => {
  validateApiKey();

  const prompt = `Eres un asistente médico experto especializado en análisis clínico basado en evidencia científica. Tu tarea es analizar el contenido clínico proporcionado y generar recomendaciones basadas en la mejor evidencia disponible de fuentes científicas reconocidas.

CONTENIDO CLÍNICO PARA ANÁLISIS:
---
${request.clinicalContent}
---

TIPO DE CONSULTA: ${request.consultationType}

${request.focusAreas ? `ÁREAS DE ENFOQUE SOLICITADAS: ${request.focusAreas.join(', ')}` : ''}

${request.patientContext ? `CONTEXTO DEL PACIENTE:
- Edad: ${request.patientContext.age || 'No especificada'}
- Sexo: ${request.patientContext.sex || 'No especificado'}
- Comorbilidades: ${request.patientContext.comorbidities?.join(', ') || 'Ninguna reportada'}
- Alergias: ${request.patientContext.allergies?.join(', ') || 'Ninguna reportada'}
- Medicamentos actuales: ${request.patientContext.currentMedications?.join(', ') || 'Ninguno reportado'}` : ''}

INSTRUCCIONES PARA EL ANÁLISIS:

1. **EXTRACCIÓN DE HALLAZGOS CLÍNICOS:**
   - Identifica síntomas, signos, diagnósticos, tratamientos, resultados de laboratorio, signos vitales
   - Clasifica cada hallazgo por categoría y severidad
   - Asigna un nivel de confianza basado en la claridad de la información

2. **GENERACIÓN DE RECOMENDACIONES BASADAS EN EVIDENCIA:**
   - Para cada hallazgo, proporciona recomendaciones específicas basadas en guías clínicas actuales
   - Cita fuentes científicas reconocidas (PubMed, UpToDate, guías de sociedades médicas)
   - Clasifica las recomendaciones por fuerza y calidad de evidencia
   - Considera aplicabilidad específica al caso

3. **ANÁLISIS DE RIESGO Y BANDERAS ROJAS:**
   - Identifica factores de riesgo relevantes
   - Señala cualquier signo de alarma que requiera atención inmediata
   - Proporciona diagnósticos diferenciales relevantes

4. **PLAN DIAGNÓSTICO SUGERIDO:**
   - Recomienda estudios adicionales basados en los hallazgos
   - Prioriza según urgencia y utilidad diagnóstica

FORMATO DE RESPUESTA REQUERIDO (JSON válido):
{
  "findings": [
    {
      "id": "finding-1",
      "category": "symptom|sign|diagnosis|treatment|lab_result|vital_sign|medication|procedure",
      "description": "Descripción clara del hallazgo",
      "severity": "mild|moderate|severe|critical",
      "confidence": 0.85,
      "extractedText": "Texto original del que se extrajo"
    }
  ],
  "recommendations": [
    {
      "id": "rec-1",
      "category": "diagnostic|therapeutic|monitoring|prevention|prognosis|differential_diagnosis",
      "title": "Título breve de la recomendación",
      "description": "Descripción detallada de la recomendación",
      "strength": "strong|conditional|expert_opinion",
      "evidenceQuality": "high|moderate|low|very_low",
      "applicability": 0.90,
      "urgency": "immediate|urgent|routine|elective",
      "contraindications": ["contraindicación1"],
      "considerations": ["consideración1"],
      "followUp": "Seguimiento recomendado",
      "sources": [
        {
          "type": "pubmed|uptodate|clinicalkey|cochrane|guidelines",
          "title": "Título de la fuente",
          "authors": ["Autor1", "Autor2"],
          "journal": "Nombre de la revista",
          "year": 2023,
          "evidenceLevel": "A|B|C|D",
          "studyType": "rct|meta_analysis|cohort|case_control|case_series|expert_opinion"
        }
      ],
      "relatedFindings": ["finding-1"]
    }
  ],
  "riskFactors": ["factor de riesgo 1", "factor de riesgo 2"],
  "redFlags": ["bandera roja 1", "bandera roja 2"],
  "differentialDiagnoses": ["diagnóstico diferencial 1"],
  "suggestedWorkup": ["estudio sugerido 1", "estudio sugerido 2"],
  "confidence": 0.85,
  "analysisTimestamp": "${new Date().toISOString()}",
  "disclaimerText": "Esta información es para apoyo educativo y no sustituye el juicio clínico profesional. Siempre consulte las guías institucionales actuales y considere el contexto clínico completo."
}

CRITERIOS DE CALIDAD:
- Solo incluir recomendaciones con base científica sólida
- Priorizar evidencia de alta calidad (meta-análisis, RCTs, guías clínicas)
- Ser específico y práctico en las recomendaciones
- Considerar el contexto del paciente y aplicabilidad local
- Incluir disclaimers apropiados sobre limitaciones

Asegúrate de que la respuesta sea un JSON válido y completo.`;

  try {
    const response = await openai.chat.completions.create({
      model: MEDICAL_AI_MODELS.CRITICAL_MEDICAL_FUNCTIONS.analyzeClinicalContent,
      messages: [
        {
          role: "system",
          content: "Eres un asistente médico experto en análisis clínico basado en evidencia científica. Proporcionas recomendaciones precisas basadas en la mejor evidencia disponible, siempre en formato JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: TEMPERATURE_CONFIG.CLINICAL_REASONING,
      max_tokens: TOKEN_LIMITS.CLINICAL_ANALYSIS,
      top_p: 0.8
    });

    const responseText = response.choices[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(responseText);
      
      // Validar estructura mínima
      if (!parsed.findings || !parsed.recommendations) {
        throw new Error('Respuesta de IA inválida: falta estructura de análisis');
      }

      return parsed as ClinicalAnalysisResult;
    } catch (jsonError) {
      console.error('Error parsing clinical analysis response:', jsonError);
      throw new Error('La IA no pudo generar un análisis válido. Intenta con información clínica más específica.');
    }
  } catch (error) {
    throw handleOpenAIError(error, 'análisis de contenido clínico');
  }
};

export const searchEvidenceBasedRecommendations = async (
  query: string,
  clinicalContext?: string
): Promise<EvidenceSearchResult> => {
  validateApiKey();

  const prompt = `Eres un experto en medicina basada en evidencia con acceso a las principales bases de datos médicas. Tu tarea es buscar y proporcionar recomendaciones específicas basadas en la mejor evidencia científica disponible.

CONSULTA ESPECÍFICA: "${query}"

${clinicalContext ? `CONTEXTO CLÍNICO ADICIONAL:
---
${clinicalContext}
---` : ''}

INSTRUCCIONES:
1. Busca evidencia específica para la consulta planteada
2. Prioriza fuentes de alta calidad (PubMed, Cochrane, guías clínicas)
3. Proporciona recomendaciones prácticas y aplicables
4. Incluye niveles de evidencia y fuerza de recomendación
5. Considera contraindicaciones y consideraciones especiales

FORMATO DE RESPUESTA REQUERIDO (JSON válido):
{
  "query": "${query}",
  "sources": [
    {
      "type": "pubmed|uptodate|cochrane|guidelines",
      "title": "Título específico de la fuente",
      "authors": ["Apellido A", "Apellido B"],
      "journal": "Nombre de la revista",
      "year": 2023,
      "pmid": "12345678",
      "evidenceLevel": "A|B|C|D",
      "studyType": "meta_analysis|rct|cohort|guidelines"
    }
  ],
  "recommendations": [
    {
      "id": "search-rec-1",
      "category": "diagnostic|therapeutic|monitoring|prevention",
      "title": "Recomendación específica",
      "description": "Descripción detallada basada en evidencia",
      "strength": "strong|conditional|expert_opinion",
      "evidenceQuality": "high|moderate|low|very_low",
      "applicability": 0.85,
      "urgency": "immediate|urgent|routine|elective",
      "sources": [/* referencias a las fuentes arriba */],
      "relatedFindings": []
    }
  ],
  "searchTimestamp": "${new Date().toISOString()}",
  "totalResults": 5,
  "searchStrategy": "Descripción de la estrategia de búsqueda utilizada"
}

Enfócate en proporcionar información práctica y actualizada que sea directamente aplicable al contexto clínico.`;

  try {
    const response = await openai.chat.completions.create({
      model: MEDICAL_AI_MODELS.IMPORTANT_MEDICAL_FUNCTIONS.searchEvidenceBasedRecommendations,
      messages: [
        {
          role: "system",
          content: "Eres un experto en medicina basada en evidencia que proporciona búsquedas precisas en literatura médica. Respondes siempre en formato JSON válido con información científicamente respaldada."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: TEMPERATURE_CONFIG.EVIDENCE_SUGGESTIONS,
      max_tokens: TOKEN_LIMITS.EVIDENCE_SUGGESTIONS,
      top_p: 0.8
    });

    const responseText = response.choices[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(responseText);
      return parsed as EvidenceSearchResult;
    } catch (jsonError) {
      console.error('Error parsing evidence search response:', jsonError);
      throw new Error('La IA no pudo generar resultados de búsqueda válidos.');
    }
  } catch (error) {
    throw handleOpenAIError(error, 'búsqueda de recomendaciones basadas en evidencia');
  }
};

export const generateEvidenceBasedConsultation = async (
  clinicalContent: string,
  specificQuestions?: string[]
): Promise<{ analysis: ClinicalAnalysisResult; evidenceSearch?: EvidenceSearchResult }> => {
  validateApiKey();

  // Configurar la solicitud de consulta
  const consultationRequest: EvidenceConsultationRequest = {
    clinicalContent,
    consultationType: 'comprehensive',
    focusAreas: specificQuestions
  };

  try {
    // Realizar análisis clínico completo
    const analysis = await analyzeClinicalContent(consultationRequest);

    // Si hay preguntas específicas, realizar búsqueda adicional
    let evidenceSearch: EvidenceSearchResult | undefined;
    if (specificQuestions && specificQuestions.length > 0) {
      const combinedQuery = specificQuestions.join(' AND ');
      evidenceSearch = await searchEvidenceBasedRecommendations(combinedQuery, clinicalContent);
    }

    return {
      analysis,
      evidenceSearch
    };
  } catch (error) {
    throw handleOpenAIError(error, 'generación de consulta basada en evidencia');
  }
};

export const formatEvidenceBasedReport = async (
  analysisResult: ClinicalAnalysisResult,
  evidenceSearch?: EvidenceSearchResult,
  includeReferences: boolean = true
): Promise<string> => {
  let report = `**CONSULTA CLÍNICA BASADA EN EVIDENCIA**\n\n`;
  
  // Timestamp
  report += `Fecha del análisis: ${new Date(analysisResult.analysisTimestamp).toLocaleString('es-ES')}\n`;
  report += `Confianza del análisis: ${Math.round(analysisResult.confidence * 100)}%\n\n`;

  // Hallazgos clínicos principales
  if (analysisResult.findings.length > 0) {
    report += `**HALLAZGOS CLÍNICOS IDENTIFICADOS:**\n`;
    analysisResult.findings.forEach((finding, index) => {
      report += `${index + 1}. **${finding.category.toUpperCase()}**: ${finding.description}\n`;
      if (finding.severity) {
        report += `   - Severidad: ${finding.severity}\n`;
      }
      report += `   - Confianza: ${Math.round(finding.confidence * 100)}%\n\n`;
    });
  }

  // Banderas rojas
  if (analysisResult.redFlags.length > 0) {
    report += `**🚩 BANDERAS ROJAS - ATENCIÓN INMEDIATA:**\n`;
    analysisResult.redFlags.forEach(flag => {
      report += `• ${flag}\n`;
    });
    report += `\n`;
  }

  // Recomendaciones principales
  if (analysisResult.recommendations.length > 0) {
    report += `**RECOMENDACIONES BASADAS EN EVIDENCIA:**\n\n`;
    
    // Agrupar por urgencia
    const immediateRecs = analysisResult.recommendations.filter(r => r.urgency === 'immediate');
    const urgentRecs = analysisResult.recommendations.filter(r => r.urgency === 'urgent');
    const routineRecs = analysisResult.recommendations.filter(r => r.urgency === 'routine');

    if (immediateRecs.length > 0) {
      report += `**INMEDIATAS:**\n`;
      immediateRecs.forEach((rec, index) => {
        report += `${index + 1}. **${rec.title}**\n`;
        report += `   ${rec.description}\n`;
        report += `   - Fuerza: ${rec.strength} | Calidad evidencia: ${rec.evidenceQuality}\n`;
        if (rec.contraindications && rec.contraindications.length > 0) {
          report += `   - Contraindicaciones: ${rec.contraindications.join(', ')}\n`;
        }
        report += `\n`;
      });
    }

    if (urgentRecs.length > 0) {
      report += `**URGENTES:**\n`;
      urgentRecs.forEach((rec, index) => {
        report += `${index + 1}. **${rec.title}**\n`;
        report += `   ${rec.description}\n`;
        report += `   - Fuerza: ${rec.strength} | Calidad evidencia: ${rec.evidenceQuality}\n\n`;
      });
    }

    if (routineRecs.length > 0) {
      report += `**RUTINARIAS:**\n`;
      routineRecs.forEach((rec, index) => {
        report += `${index + 1}. **${rec.title}**\n`;
        report += `   ${rec.description}\n`;
        report += `   - Fuerza: ${rec.strength} | Calidad evidencia: ${rec.evidenceQuality}\n\n`;
      });
    }
  }

  // Diagnósticos diferenciales
  if (analysisResult.differentialDiagnoses.length > 0) {
    report += `**DIAGNÓSTICOS DIFERENCIALES A CONSIDERAR:**\n`;
    analysisResult.differentialDiagnoses.forEach(dx => {
      report += `• ${dx}\n`;
    });
    report += `\n`;
  }

  // Plan diagnóstico sugerido
  if (analysisResult.suggestedWorkup.length > 0) {
    report += `**PLAN DIAGNÓSTICO SUGERIDO:**\n`;
    analysisResult.suggestedWorkup.forEach(study => {
      report += `• ${study}\n`;
    });
    report += `\n`;
  }

  // Referencias principales (si se incluyen)
  if (includeReferences && analysisResult.recommendations.length > 0) {
    const allSources = analysisResult.recommendations
      .flatMap(rec => rec.sources)
      .filter((source, index, self) => 
        index === self.findIndex(s => s.title === source.title)
      );

    if (allSources.length > 0) {
      report += `**REFERENCIAS PRINCIPALES:**\n`;
      allSources.forEach((source, index) => {
        report += `${index + 1}. ${source.title}`;
        if (source.authors && source.authors.length > 0) {
          report += ` - ${source.authors.join(', ')}`;
        }
        if (source.journal && source.year) {
          report += ` (${source.journal}, ${source.year})`;
        }
        report += ` [Nivel evidencia: ${source.evidenceLevel}]\n`;
      });
      report += `\n`;
    }
  }

  // Evidencia adicional si existe
  if (evidenceSearch && evidenceSearch.recommendations.length > 0) {
    report += `**EVIDENCIA ADICIONAL ENCONTRADA:**\n`;
    evidenceSearch.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec.title}: ${rec.description}\n`;
    });
    report += `\n`;
  }

  // Disclaimer
  report += `**IMPORTANTE:**\n${analysisResult.disclaimerText}\n`;

  return report;
}; 

// ===== CONSULTA CLÍNICA SIMPLIFICADA BASADA EN EVIDENCIA =====

export const generateSimplifiedEvidenceConsultation = async (
  clinicalContent: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();

  const prompt = `Eres un médico especialista experto en medicina basada en evidencia. Analiza el siguiente contenido clínico y proporciona recomendaciones fundamentadas en evidencia científica actual.

CONTENIDO CLÍNICO:
---
${clinicalContent}
---

INSTRUCCIONES:
1. **ANÁLISIS CLÍNICO:**
   - Identifica los hallazgos principales
   - Evalúa la información disponible
   - Destaca aspectos relevantes o preocupantes

2. **RECOMENDACIONES BASADAS EN EVIDENCIA:**
   - Proporciona sugerencias diagnósticas fundamentadas
   - Incluye opciones terapéuticas respaldadas por evidencia
   - Menciona estudios complementarios si son necesarios
   - Sugiere seguimiento apropiado

3. **CITAS CIENTÍFICAS:**
   - Incluye referencias a estudios recientes
   - Cita guías clínicas relevantes
   - Menciona consensos de sociedades médicas
   - Especifica niveles de evidencia cuando sea apropiado

4. **FORMATO DE RESPUESTA:**
   - Estructura clara y profesional
   - Lenguaje médico apropiado
   - Citas científicas integradas naturalmente
   - Disclaimer sobre individualización del tratamiento

FUENTES RECOMENDADAS PARA CITAR:
- PubMed/MEDLINE
- Cochrane Library
- UpToDate
- Guías de sociedades médicas especializadas
- New England Journal of Medicine
- The Lancet
- JAMA
- BMJ

Proporciona un análisis completo y recomendaciones prácticas que apoyen la toma de decisiones clínicas.`;

  try {
    const response = await openai.chat.completions.create({
      model: MEDICAL_AI_MODELS.IMPORTANT_MEDICAL_FUNCTIONS.generateSimplifiedEvidenceConsultation,
      messages: [
        {
          role: "system",
          content: "Eres un médico especialista experto en medicina basada en evidencia. Proporcionas análisis clínicos completos con recomendaciones respaldadas por literatura científica actual. Siempre incluyes citas relevantes y mantienes un enfoque práctico y profesional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: TEMPERATURE_CONFIG.CONSULTATION,
      max_tokens: TOKEN_LIMITS.CONSULTATION,
      top_p: 0.9
    });

    const result = response.choices[0]?.message?.content || '';
    
    if (!result.trim()) {
      throw new Error('No se pudo generar contenido válido');
    }
    
    return {
      text: result,
      groundingMetadata: { groundingChunks: [] }
    };
  } catch (error) {
    throw handleOpenAIError(error, 'generación de consulta basada en evidencia simplificada');
  }
};

// ===== EXTRACCIÓN DE FORMATO DE PLANTILLA =====

export const extractTemplateFormat = async (
  templateContent: string
): Promise<string> => {
  validateApiKey();

  // Validar entrada
  if (!templateContent || typeof templateContent !== 'string') {
    throw new Error('El contenido de la plantilla no es válido');
  }

  const trimmedContent = templateContent.trim();
  if (trimmedContent.length === 0) {
    throw new Error('La plantilla está vacía');
  }

  if (trimmedContent.length > 15000) {
    throw new Error('La plantilla es demasiado larga. Por favor, reduce el contenido a menos de 15,000 caracteres.');
  }

  const prompt = `Eres un experto en crear MOLDES ESTRUCTURALES de documentos médicos. Tu tarea es extraer ÚNICAMENTE la estructura/formato de la plantilla, convirtiendo todos los datos específicos en marcadores genéricos.

🎯 OBJETIVO: Crear un FORMATO PURO reutilizable eliminando TODA información específica del paciente original.

PLANTILLA ORIGINAL:
---
${trimmedContent}
---

🚨 INSTRUCCIONES CRÍTICAS PARA EXTRACCIÓN DE FORMATO:

1. **PRESERVAR ESTRUCTURA VISUAL EXACTA:**
   - Mantén EXACTAMENTE: encabezados, mayúsculas/minúsculas, viñetas, numeración, sangrías
   - Conserva espacios en blanco, saltos de línea, tabulaciones
   - Preserva todos los elementos visuales: dos puntos (:), guiones (-), números, etc.
   - NO cambies la jerarquía ni organización de secciones

2. **ELIMINAR TODA INFORMACIÓN ESPECÍFICA:**
   - Nombres de pacientes → [Nombre del paciente]
   - Edades específicas → [Edad] años
   - Fechas específicas → [Fecha]
   - Números de documento → [Documento de identidad]
   - Síntomas específicos → [Describir síntoma]
   - Diagnósticos específicos → [Diagnóstico]
   - Medicamentos específicos → [Medicamento]
   - Valores de laboratorio específicos → [Valor de laboratorio]
   - Signos vitales específicos → [Signos vitales]
   - Nombres de médicos → [Nombre del médico]
   - Hallazgos específicos → [Hallazgos del examen]

3. **CREAR MARCADORES GENÉRICOS:**
   - Usa marcadores que describan el TIPO de información, no el contenido específico
   - Ejemplos CORRECTOS: [Motivo de consulta], [Antecedentes familiares], [Plan de tratamiento]
   - Ejemplos INCORRECTOS: [Dolor de cabeza], [Diabetes], [Paracetamol]
   - Los marcadores deben ser aplicables a CUALQUIER paciente

4. **CONSERVAR SOLO ELEMENTOS ESTRUCTURALES:**
   - Mantén etiquetas como "Nombre:", "Edad:", "Diagnóstico:", etc.
   - Conserva frases estructurales no específicas
   - Preserva numeración y viñetas de listas
   - Mantén encabezados de secciones

5. **ELIMINAR CONTEXTO ESPECÍFICO:**
   - NO conserves hallazgos específicos de una patología particular
   - NO mantengas valores específicos aunque sean "normales"
   - Reemplaza TODO lo que sea específico del paciente original
   - La plantilla debe ser universalmente aplicable

6. **TRANSFORMACIONES EJEMPLO:**
   - "Paciente: María González" → "Paciente: [Nombre del paciente]"
   - "Edad: 35 años" → "Edad: [Edad] años"
   - "Presenta dolor torácico opresivo" → "Presenta [Describir síntoma]"
   - "Losartán 50mg cada 12 horas" → "[Medicamento] [Dosis y frecuencia]"
   - "Presión arterial: 120/80 mmHg" → "Presión arterial: [Valor]"

7. **RESPUESTA FINAL:**
   - Responde ÚNICAMENTE con el formato extraído
   - NO agregues comentarios, explicaciones, ni introducciones
   - La plantilla debe ser un MOLDE VACÍO directamente utilizable

RESULTADO ESPERADO: Una plantilla estructural que mantenga la organización visual exacta pero que pueda usarse para CUALQUIER paciente, sin datos específicos del caso original.`;

  try {
    const response = await openai.chat.completions.create({
      model: MEDICAL_AI_MODELS.AUXILIARY_FUNCTIONS.extractTemplateFormat,
      messages: [
        {
          role: "system",
          content: "Eres un experto en crear moldes estructurales de documentos médicos. Tu especialidad es convertir plantillas con datos específicos en formatos puros reutilizables, eliminando TODA información del paciente original y creando marcadores genéricos universales."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: TEMPERATURE_CONFIG.FORMAT_EXTRACTION,
      max_tokens: TOKEN_LIMITS.FORMAT_EXTRACTION,
      top_p: 0.8
    });

    const result = response.choices[0]?.message?.content || '';
    
    if (!result.trim()) {
      throw new Error('No se pudo extraer el formato de la plantilla. Intenta con una plantilla más específica.');
    }

    return result;
  } catch (error) {
    throw handleOpenAIError(error, 'extracción de formato de plantilla');
  }
}; 

// =============================================================================
// UTILIDADES
// =============================================================================

export const validateOpenAIConfiguration = (): boolean => {
  return Boolean(API_KEY);
};

export const getOpenAIModelInfo = () => {
  return {
    textModel: OPENAI_MODEL_TEXT,
    advancedModel: OPENAI_MODEL_ADVANCED,
    latestModel: OPENAI_MODEL_LATEST,
    reasoningModel: OPENAI_MODEL_REASONING,
    medicalModels: MEDICAL_AI_MODELS,
    temperatureConfig: TEMPERATURE_CONFIG,
    tokenLimits: TOKEN_LIMITS,
  };
}; 