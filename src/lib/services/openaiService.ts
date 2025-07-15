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

// Configuración de OpenAI optimizada
const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!API_KEY) {
  console.error("❌ NEXT_PUBLIC_OPENAI_API_KEY no está configurada. Por favor verifica tu archivo .env");
  console.error("La aplicación podría no funcionar correctamente sin esta clave.");
}

// Cliente OpenAI con timeout optimizado
const openai = new OpenAI({
  apiKey: API_KEY || '',
  dangerouslyAllowBrowser: true,
  timeout: 60000, // Aumentado a 60 segundos para operaciones complejas
  maxRetries: 2, // 2 reintentos para mayor confiabilidad
});

// =============================================================================
// UTILIDADES PARA COMPATIBILIDAD DE MODELOS
// =============================================================================

// Función para verificar si un modelo soporta mensajes de sistema
const supportsSystemMessages = (model: string): boolean => {
  // Los modelos o1 no soportan mensajes de sistema
  return !model.startsWith('o1');
};

// Función para adaptar mensajes según las capacidades del modelo
const adaptMessagesForModel = (model: string, systemMessage: string, userMessage: string) => {
  if (supportsSystemMessages(model)) {
    return [
      { role: "system" as const, content: systemMessage },
      { role: "user" as const, content: userMessage }
    ];
  } else {
    // Para modelos o1, combinar el mensaje de sistema con el mensaje de usuario
    const combinedMessage = `${systemMessage}\n\n${userMessage}`;
    return [{ role: "user" as const, content: combinedMessage }];
  }
};

// Función para adaptar parámetros según las capacidades del modelo
const adaptParametersForModel = (model: string, baseParams: any) => {
  if (model.startsWith('o1')) {
    // Los modelos o1 tienen parámetros limitados
    return {
      model,
      messages: baseParams.messages,
      // No incluir temperature, top_p para modelos o1
    };
  } else {
    return baseParams;
  }
};

// =============================================================================
// SISTEMA DE CACHÉ Y DEBOUNCING
// =============================================================================

// Cache simple en memoria para respuestas frecuentes
const responseCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Mapa de promesas pendientes para evitar múltiples llamadas simultáneas
const pendingRequests = new Map<string, Promise<any>>();

// Limpiar cache periódicamente (cada 10 minutos)
setInterval(() => {
  const now = Date.now();
  responseCache.forEach((value, key) => {
    if (now - value.timestamp > value.ttl) {
      responseCache.delete(key);
    }
  });
}, 10 * 60 * 1000);

// Función para generar clave de cache
const generateCacheKey = (functionName: string, ...args: any[]): string => {
  return `${functionName}:${JSON.stringify(args)}`;
};

// Función para obtener respuesta del cache
const getCachedResponse = (key: string): any | null => {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  responseCache.delete(key);
  return null;
};

// Función para guardar en cache
const setCachedResponse = (key: string, data: any, ttlMs: number = 5 * 60 * 1000): void => {
  responseCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs
  });
};

// Debouncing para múltiples llamadas simultáneas
const debounceRequest = async <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
  // Si ya hay una petición pendiente para esta clave, devolver esa promesa
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }

  // Crear nueva promesa y agregarla al mapa
  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
};

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

// Función para manejar errores de OpenAI optimizada
const handleOpenAIError = (error: unknown, context: string): Error => {
  console.error(`Error en ${context}:`, error);
  
  if (error instanceof Error) {
    // Manejar errores específicos de OpenAI
    if (error.message.includes('API key')) {
      return new Error(ERROR_MESSAGES.OPENAI_API_KEY_MISSING);
    }
    if (error.message.includes('rate limit')) {
      return new Error('Límite de API excedido. Intenta en unos momentos.');
    }
    if (error.message.includes('timeout') || error.message.includes('timed out') || error.message.includes('Request timed out')) {
      return new Error('Tiempo de espera agotado. Intenta con contenido más breve.');
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new Error('Error de conexión. Verifica tu internet.');
    }
    if (error.message.includes('invalid_request_error')) {
      return new Error('Contenido demasiado largo.');
    }
    if (error.message.includes('context_length_exceeded')) {
      return new Error('Contenido demasiado largo. Reduce el texto.');
    }
    if (error.message.includes('Unsupported value') && error.message.includes('system')) {
      return new Error('Error en configuración del modelo. El modelo no soporta mensajes de sistema.');
    }
    if (error.message.includes('Unsupported parameter')) {
      return new Error('Error en configuración del modelo. Parámetros no soportados.');
    }
    return new Error(`Error en ${context}: ${error.message}`);
  }
  
  return new Error(`Error desconocido en ${context}`);
};

// =============================================================================
// SERVICIOS PRINCIPALES OPTIMIZADOS
// =============================================================================

export const generateNoteFromTemplate = async (
  specialtyName: string,
  templateContent: string,
  patientInfo: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateTemplateInput(templateContent, patientInfo);
  
  // Generar clave de cache
  const cacheKey = generateCacheKey('generateNoteFromTemplate', specialtyName, templateContent, patientInfo);
  
  // Verificar cache primero
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log('✅ Respuesta obtenida del cache');
    return cached;
  }

  // Usar debouncing para evitar llamadas duplicadas
  return debounceRequest(cacheKey, async () => {
    const prompt = `Eres un asistente médico experto en completar notas clínicas. Tu tarea es utilizar ÚNICAMENTE la información del paciente proporcionada para generar una nota médica siguiendo el formato de la plantilla.

INFORMACIÓN DEL PACIENTE:
"${patientInfo}"

PLANTILLA (SOLO FORMATO - NO CONTIENE DATOS REALES):
---
${templateContent}
---

INSTRUCCIONES CRÍTICAS:
1. USA ÚNICAMENTE la información del paciente proporcionada arriba
2. NO uses datos de ejemplo de la plantilla como información real del paciente
3. Si no tienes información específica para una sección, omítela o usa "No reportado"
4. Mantén el formato profesional y estructurado de la plantilla
5. Sé conciso pero completo con la información disponible

Genera la nota médica completada:`;

    try {
      const model = MEDICAL_AI_MODELS.CRITICAL_MEDICAL_FUNCTIONS.generateNoteFromTemplate;
      const systemMessage = "Eres un asistente médico experto especializado en generar notas clínicas precisas y profesionales. NUNCA usas datos de las plantillas como información del paciente - las plantillas son SOLO formatos estructurales. Solo usas información explícitamente proporcionada del paciente real y omites secciones sin datos correspondientes.";
      
      const messages = adaptMessagesForModel(model, systemMessage, prompt);
      
      const baseParams = {
        model,
        messages,
        temperature: TEMPERATURE_CONFIG.CRITICAL_MEDICAL,
        max_tokens: TOKEN_LIMITS.CRITICAL_MEDICAL_NOTE,
        top_p: 0.9
      };
      
      const adaptedParams = adaptParametersForModel(model, baseParams);
      const response = await openai.chat.completions.create(adaptedParams);

      const generatedText = response.choices[0]?.message?.content || '';
      
      if (!generatedText.trim()) {
        throw new Error('No se pudo generar contenido válido');
      }

      const result = { 
        text: generatedText, 
        groundingMetadata: undefined
      };

      // Guardar en cache por 5 minutos
      setCachedResponse(cacheKey, result, 5 * 60 * 1000);

      return result;
    } catch (error) {
      throw handleOpenAIError(error, 'generación de nota con plantilla');
    }
  });
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
    const model = MEDICAL_AI_MODELS.CRITICAL_MEDICAL_FUNCTIONS.generateMedicalScale;
    const systemMessage = "Eres un asistente médico experto en la aplicación de escalas clínicas estandarizadas. SOLO usas información explícitamente proporcionada para puntuar escalas, NUNCA inventas datos. Eres transparente sobre limitaciones cuando falta información.";
    
    const messages = adaptMessagesForModel(model, systemMessage, prompt);
    
    const baseParams = {
      model,
      messages,
      temperature: TEMPERATURE_CONFIG.CLINICAL_REASONING,
      max_tokens: TOKEN_LIMITS.MEDICAL_SCALE,
      top_p: 0.9
    };
    
    const adaptedParams = adaptParametersForModel(model, baseParams);
    const response = await openai.chat.completions.create(adaptedParams);

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
    const model = MEDICAL_AI_MODELS.CRITICAL_MEDICAL_FUNCTIONS.updateClinicalNote;
    const systemMessage = "Eres un asistente médico experto especializado en actualizar notas clínicas de forma selectiva y precisa. SOLO usas información explícitamente proporcionada, NUNCA inventas datos adicionales. Preservas la estructura original y modificas únicamente lo estrictamente necesario.";
    
    const messages = adaptMessagesForModel(model, systemMessage, prompt);
    
    const baseParams = {
      model,
      messages,
      temperature: TEMPERATURE_CONFIG.CRITICAL_MEDICAL,
      max_tokens: TOKEN_LIMITS.CRITICAL_MEDICAL_NOTE,
      top_p: 0.8
    };
    
    const adaptedParams = adaptParametersForModel(model, baseParams);
    const response = await openai.chat.completions.create(adaptedParams);

    const generatedText = response.choices[0]?.message?.content || '';
    return { 
      text: generatedText, 
      groundingMetadata: undefined
    };
  } catch (error) {
    throw handleOpenAIError(error, 'actualización selectiva de nota clínica');
  }
}; 

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
    const model = MEDICAL_AI_MODELS.CRITICAL_MEDICAL_FUNCTIONS.analyzeClinicalContent;
    const systemMessage = "Eres un asistente médico experto en análisis clínico basado en evidencia científica. Proporcionas recomendaciones precisas basadas en la mejor evidencia disponible, siempre en formato JSON válido.";
    
    const messages = adaptMessagesForModel(model, systemMessage, prompt);
    
    const baseParams = {
      model,
      messages,
      temperature: TEMPERATURE_CONFIG.CLINICAL_REASONING,
      max_tokens: TOKEN_LIMITS.CLINICAL_ANALYSIS,
      top_p: 0.8
    };
    
    const adaptedParams = adaptParametersForModel(model, baseParams);
    const response = await openai.chat.completions.create(adaptedParams);

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
    const model = MEDICAL_AI_MODELS.IMPORTANT_MEDICAL_FUNCTIONS.searchEvidenceBasedRecommendations;
    const systemMessage = "Eres un experto en medicina basada en evidencia que proporciona búsquedas precisas en literatura médica. Respondes siempre en formato JSON válido con información científicamente respaldada.";
    
    const messages = adaptMessagesForModel(model, systemMessage, prompt);
    
    const baseParams = {
      model,
      messages,
      temperature: TEMPERATURE_CONFIG.EVIDENCE_SUGGESTIONS,
      max_tokens: TOKEN_LIMITS.EVIDENCE_SUGGESTIONS,
      top_p: 0.8
    };
    
    const adaptedParams = adaptParametersForModel(model, baseParams);
    const response = await openai.chat.completions.create(adaptedParams);

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
  
  // Generar clave de cache
  const cacheKey = generateCacheKey('generateSimplifiedEvidenceConsultation', clinicalContent);
  
  // Verificar cache primero
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log('✅ Consulta obtenida del cache');
    return cached;
  }

  // Usar debouncing para evitar llamadas duplicadas
  return debounceRequest(cacheKey, async () => {
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
    const model = MEDICAL_AI_MODELS.IMPORTANT_MEDICAL_FUNCTIONS.generateSimplifiedEvidenceConsultation;
    const systemMessage = "Eres un médico especialista experto en medicina basada en evidencia. Proporcionas análisis clínicos completos con recomendaciones respaldadas por literatura científica actual. Siempre incluyes citas relevantes y mantienes un enfoque práctico y profesional.";
    
    const messages = adaptMessagesForModel(model, systemMessage, prompt);
    
    const baseParams = {
      model,
      messages,
      temperature: TEMPERATURE_CONFIG.CONSULTATION,
      max_tokens: TOKEN_LIMITS.CONSULTATION,
      top_p: 0.9
    };
    
    const adaptedParams = adaptParametersForModel(model, baseParams);
    const response = await openai.chat.completions.create(adaptedParams);

    const result = response.choices[0]?.message?.content || '';
    
    if (!result.trim()) {
      throw new Error('No se pudo generar contenido válido');
    }
    
    const response_data = {
      text: result,
      groundingMetadata: { groundingChunks: [] }
    };

    // Guardar en cache por 10 minutos
    setCachedResponse(cacheKey, response_data, 10 * 60 * 1000);
    
    return response_data;
  } catch (error) {
    throw handleOpenAIError(error, 'generación de consulta basada en evidencia simplificada');
  }
  });
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
    const model = MEDICAL_AI_MODELS.AUXILIARY_FUNCTIONS.extractTemplateFormat;
    const systemMessage = "Eres un experto en crear moldes estructurales de documentos médicos. Tu especialidad es convertir plantillas con datos específicos en formatos puros reutilizables, eliminando TODA información del paciente original y creando marcadores genéricos universales.";
    
    const messages = adaptMessagesForModel(model, systemMessage, prompt);
    
    const baseParams = {
      model,
      messages,
      temperature: TEMPERATURE_CONFIG.FORMAT_EXTRACTION,
      max_tokens: TOKEN_LIMITS.FORMAT_EXTRACTION,
      top_p: 0.8
    };
    
    const adaptedParams = adaptParametersForModel(model, baseParams);
    const response = await openai.chat.completions.create(adaptedParams);

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