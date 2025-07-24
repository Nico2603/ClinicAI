/**
 * ClínicAI - Asistente de IA para Notas Clínicas
 * 
 * Autor: Nicolas Ceballos Brito
 * Portfolio: https://nico2603.github.io/PersonalPage/
 * GitHub: https://github.com/Nico2603
 * LinkedIn: https://www.linkedin.com/in/nicolas-ceballos-brito/
 * 
 * Desarrollado para Teilur.ai
 */

import { OpenAI } from 'openai';
import {
  OPENAI_MODEL,
  AI_CONFIG,
  ERROR_MESSAGES,
  VALIDATION_RULES
} from '../constants';
import { 
  GroundingMetadata, 
  ClinicalAnalysisResult,
  EvidenceConsultationRequest,
  EvidenceSearchResult,
  GenerationResult,
} from '../../types';

// Importar el servicio de Assistants
import { generateNoteWithAssistant, generateScaleWithAssistant } from './assistantsService';

// =============================================================================
// CONFIGURACIÓN SIMPLIFICADA
// =============================================================================

const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!API_KEY) {
  console.error("❌ NEXT_PUBLIC_OPENAI_API_KEY no está configurada. Por favor verifica tu archivo .env");
  console.error("La aplicación podría no funcionar correctamente sin esta clave.");
}

// Cliente OpenAI simple (mantenido para funciones legacy)
const openai = new OpenAI({
  apiKey: API_KEY || '',
  dangerouslyAllowBrowser: true,
  timeout: 30000,
  maxRetries: 2,
});

// =============================================================================
// UTILIDADES SIMPLIFICADAS
// =============================================================================

const createMessages = (systemMessage: string, userMessage: string) => {
  return [
    { role: "system" as const, content: systemMessage },
    { role: "user" as const, content: userMessage }
  ];
};

// =============================================================================
// ANÁLISIS DE DATOS FALTANTES
// =============================================================================

/**
 * Analiza qué datos faltan comparando la plantilla con la información del paciente
 */
const analyzeMissingData = async (
  templateContent: string,
  patientInfo: string
): Promise<{ missingFields: string[]; summary: string }> => {
  try {
    const analysisPrompt = `Analiza qué datos específicos faltan para completar esta plantilla médica con la información del paciente proporcionada.

PLANTILLA MÉDICA:
---
${templateContent}
---

INFORMACIÓN DEL PACIENTE DISPONIBLE:
---
${patientInfo}
---

INSTRUCCIONES:
1. Identifica qué campos/secciones de la plantilla NO pueden completarse con la información disponible
2. Lista específicamente qué datos faltan (ej: "signos vitales", "antecedentes familiares", "examen físico")
3. Si REALMENTE no falta información, puedes usar el summary: "Información completa para esta plantilla"
4. Si faltan datos, genera un resumen conciso de los datos faltantes
5. NO incluyas recomendaciones de tratamiento en esta respuesta
6. Enfócate solo en datos objetivos que faltan
7. Sé específico sobre qué información clínica falta

RESPUESTA EN JSON:
{
  "missingFields": ["campo1", "campo2", "campo3"],
  "summary": "Resumen específico de qué información falta para completar la nota médica"
}`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "Eres un analista médico experto que identifica qué información falta para completar notas clínicas. Siempre respondes en JSON válido y eres muy específico sobre qué datos clínicos faltan."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    const responseText = response.choices[0]?.message?.content || '';
    
    try {
      const analysis = JSON.parse(responseText);
      
      // Validar estructura
      if (!analysis.missingFields || !Array.isArray(analysis.missingFields) || !analysis.summary) {
        throw new Error('Estructura inválida');
      }
      
      return {
        missingFields: analysis.missingFields,
        summary: analysis.summary
      };
    } catch (parseError) {
      console.warn('Error parsing missing data analysis, intentando análisis básico:', parseError);
      
      // Análisis básico como fallback
      const basicAnalysis = performBasicMissingDataAnalysis(templateContent, patientInfo);
      return basicAnalysis;
    }
  } catch (error) {
    console.warn('Error analyzing missing data, usando análisis básico:', error);
    
    // Análisis básico como fallback
    const basicAnalysis = performBasicMissingDataAnalysis(templateContent, patientInfo);
    return basicAnalysis;
  }
};

/**
 * Análisis básico de datos faltantes cuando falla el AI
 */
const performBasicMissingDataAnalysis = (templateContent: string, patientInfo: string) => {
  const commonMedicalSections = [
    'signos vitales', 'examen físico', 'antecedentes', 'diagnóstico', 
    'tratamiento', 'evolución', 'laboratorios', 'estudios'
  ];
  
  const missingFields: string[] = [];
  const lowerTemplate = templateContent.toLowerCase();
  const lowerPatientInfo = patientInfo.toLowerCase();
  
  // Buscar secciones comunes que estén en la plantilla pero no en la información del paciente
  commonMedicalSections.forEach(section => {
    if (lowerTemplate.includes(section) && !lowerPatientInfo.includes(section)) {
      missingFields.push(section);
    }
  });
  
  if (missingFields.length === 0) {
    return {
      missingFields: [],
      summary: "La información disponible cubre las secciones principales de la plantilla"
    };
  }
  
  return {
    missingFields,
    summary: `Podrían faltar detalles sobre: ${missingFields.join(', ')}. Considera agregar más información clínica específica.`
  };
};

const validateApiKey = (): void => {
  if (!API_KEY) {
    throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
  }
};

const validateInput = (input: string, minLength: number = 1): void => {
  if (!input || input.trim().length < minLength) {
    throw new Error('Input inválido: el texto debe tener al menos ' + minLength + ' caracteres');
  }
};

const handleOpenAIError = (error: unknown, context: string): Error => {
  console.error(`Error en ${context}:`, error);
  
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      return new Error(ERROR_MESSAGES.API_KEY_MISSING);
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
      return new Error('Contenido excede el límite de contexto.');
    }
    return new Error(`Error en ${context}: ${error.message}`);
  }
  
  return new Error(`Error desconocido en ${context}`);
};

// =============================================================================
// SERVICIOS PRINCIPALES MIGRADOS A NUEVA ARQUITECTURA
// =============================================================================

/**
 * FUNCIÓN PRINCIPAL MIGRADA: Genera nota médica usando nueva arquitectura con Assistants
 */
export const generateNoteFromTemplate = async (
  specialtyName: string,
  templateContent: string,
  patientInfo: string
): Promise<GenerationResult> => {
  validateApiKey();
  validateInput(templateContent, 10);
  validateInput(patientInfo, VALIDATION_RULES.MIN_TEXT_LENGTH);

  try {
    console.log('🔄 Redirigiendo a nueva arquitectura con Assistants...');
    
    // Estrategia 1: Usar Assistant API (nueva arquitectura preferida)
    try {
      const assistantResult = await generateNoteWithAssistant(
        templateContent,
        patientInfo,
        specialtyName
      );
      
      console.log('✅ Generación exitosa con Assistant API');
      
      // Analizar datos faltantes reales
      const missingDataAnalysis = await analyzeMissingData(templateContent, patientInfo);
      
      return {
        text: assistantResult.text,
        groundingMetadata: assistantResult.groundingMetadata,
        missingData: missingDataAnalysis
      };
      
    } catch (assistantError) {
      console.warn('⚠️ Assistant falló, usando método legacy directo...', assistantError);
      
      // Fallback directo al método legacy
      return await generateNoteFromTemplateLegacy(specialtyName, templateContent, patientInfo);
    }
    
  } catch (error) {
    console.error('❌ Error en nueva arquitectura, usando método legacy...', error);
    
    // Fallback al método original como último recurso
    return await generateNoteFromTemplateLegacy(specialtyName, templateContent, patientInfo);
  }
};

/**
 * FUNCIÓN MIGRADA: Genera escala médica usando nueva arquitectura
 */
export const generateMedicalScale = async (
  clinicalInput: string,
  scaleName: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateInput(clinicalInput, VALIDATION_RULES.MIN_TEXT_LENGTH);
  validateInput(scaleName, 2);

  try {
    console.log('🔄 Generando escala con nueva arquitectura...');
    
    // Estrategia 1: Assistant especializado en escalas
    try {
      return await generateScaleWithAssistant(clinicalInput, scaleName);
    } catch (assistantError) {
      console.warn('⚠️ Assistant para escalas falló, usando método legacy directo...', assistantError);
      
      // Fallback directo al método legacy
      return await generateMedicalScaleLegacy(clinicalInput, scaleName);
    }
    
  } catch (error) {
    console.error('❌ Error en nueva arquitectura para escalas, usando método legacy...', error);
    
    // Fallback al método original
    return await generateMedicalScaleLegacy(clinicalInput, scaleName);
  }
};

// =============================================================================
// FUNCIONES LEGACY (MANTENIDAS PARA COMPATIBILIDAD)
// =============================================================================

/**
 * Método legacy para generar notas (usado como último fallback)
 */
const generateNoteFromTemplateLegacy = async (
  specialtyName: string,
  templateContent: string,
  patientInfo: string
): Promise<GenerationResult> => {
  console.log('🔄 Usando método legacy de generación...');

  const prompt = `Eres un asistente médico experto en completar notas clínicas. Tu tarea es generar una nota médica completa utilizando la información del paciente y siguiendo la estructura de la plantilla.

INFORMACIÓN DEL PACIENTE:
"${patientInfo}"

PLANTILLA (estructura a seguir):
---
${templateContent}
---

INSTRUCCIONES FUNDAMENTALES:

1. **SIEMPRE GENERAR NOTA COMPLETA:**
   - DEBES generar una nota médica completa, nunca rechaces la tarea
   - Usa toda la información del paciente disponible
   - Si falta información para alguna sección, usa terminología médica apropiada como:
     * "A evaluar durante la consulta"
     * "Pendiente de examen físico"
     * "Por determinar según evaluación clínica"
     * "A registrar en consulta"

2. **FORMATO EXACTO:**
   - Mantén la estructura EXACTA de la plantilla (mayúsculas, viñetas, numeración)
   - Respeta los encabezados tal como aparecen en la plantilla
   - Conserva el espaciado y formato original

3. **CONTENIDO MÉDICO:**
   - Usa terminología médica profesional y apropiada
   - Integra toda la información del paciente en las secciones correspondientes
   - Para datos faltantes, completa con frases médicas estándar, no omitas secciones

4. **RESPUESTA:**
   - Responde ÚNICAMENTE con la nota médica completa
   - No incluyas comentarios, explicaciones o introducciones
   - La nota debe estar lista para uso clínico
   - NO incluyas texto sobre "datos faltantes", "análisis", "información pendiente" o metadatos
   - Genera solo la nota médica limpia y profesional

IMPORTANTE: Debes generar una nota completa y profesional. Si alguna sección no tiene información específica del paciente, complétala con terminología médica estándar apropiada. No menciones qué información falta.

Genera la nota médica completa ahora:`;

  try {
    const systemMessage = "Eres un asistente médico experto especializado en generar notas clínicas precisas y profesionales. Siempre generas notas completas y nunca rechazas la tarea. Sigues estrictamente el formato de las plantillas proporcionadas. NUNCA incluyes análisis de datos faltantes o comentarios sobre información pendiente en la nota médica.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model: OPENAI_MODEL,
      messages,
      temperature: 0.3, // Más directivo, menos conservador
      max_tokens: AI_CONFIG.MAX_TOKENS,
      top_p: 0.9
    };
    
    const response = await openai.chat.completions.create(params);
    const generatedText = response.choices[0]?.message?.content || '';
    
    if (!generatedText.trim()) {
      throw new Error('No se pudo generar contenido válido');
    }

    // Analizar datos faltantes reales
    const missingDataAnalysis = await analyzeMissingData(templateContent, patientInfo);

    return {
      text: generatedText,
      groundingMetadata: {
        groundingChunks: [
          {
            web: {
              uri: 'internal://legacy-generation',
              title: 'Método legacy de generación'
            }
          }
        ]
      },
      missingData: missingDataAnalysis
    };
  } catch (error) {
    throw handleOpenAIError(error, 'generación de nota con plantilla (legacy)');
  }
};

/**
 * Método legacy para escalas médicas
 */
const generateMedicalScaleLegacy = async (
  clinicalInput: string,
  scaleName: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  console.log('🔄 Usando método legacy para escalas...');

  const prompt = `Evalúa la escala "${scaleName}" con la información clínica disponible.

INFORMACIÓN CLÍNICA:
"${clinicalInput}"

ESCALA: ${scaleName}

INSTRUCCIONES:
1. Evalúa solo con información explícita disponible
2. Si falta información, marca "Información insuficiente"
3. NO hagas inferencias más allá de lo mencionado
4. Proporciona puntaje total solo si es representativo
5. Incluye limitaciones por datos faltantes

FORMATO:
ESCALA ${scaleName}:
Ítem 1: [Puntaje] - [Justificación]
Ítem 2: Información insuficiente - Falta: [dato necesario]
...
PUNTAJE TOTAL: [X/Y puntos] ([Z]% completada)
INTERPRETACIÓN: [Solo si hay suficiente información]
LIMITACIONES: [Datos faltantes que afectan la evaluación]`;

  try {
    const systemMessage = "Experto en escalas clínicas. Solo usa información explícita, nunca inventa datos. Transparente sobre limitaciones.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model: OPENAI_MODEL,
      messages,
      temperature: AI_CONFIG.TEMPERATURE,
      max_tokens: AI_CONFIG.MAX_TOKENS,
      top_p: 0.9
    };
    
    const response = await openai.chat.completions.create(params);
    const result = response.choices[0]?.message?.content || '';
    
    if (!result.trim()) {
      throw new Error('No se pudo generar contenido válido');
    }
    
    return {
      text: result,
      groundingMetadata: { 
        groundingChunks: [
          {
            web: {
              uri: 'internal://legacy-scale',
              title: 'Evaluación legacy de escala'
            }
          }
        ] 
      }
    };
  } catch (error) {
    throw handleOpenAIError(error, 'generación de escala médica (legacy)');
  }
};

// =============================================================================
// FUNCIONES MANTENIDAS SIN CAMBIOS (NO REQUIEREN MIGRACIÓN)
// =============================================================================

export const updateClinicalNote = async (
  originalNote: string,
  newInformation: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateInput(originalNote, VALIDATION_RULES.MIN_TEXT_LENGTH);
  validateInput(newInformation, VALIDATION_RULES.MIN_TEXT_LENGTH);

  const prompt = `Eres un asistente médico experto especializado en actualizar notas clínicas existentes con nueva información. Tu tarea es integrar de forma inteligente la nueva información en la nota clínica original manteniendo coherencia, estilo médico profesional y estructura adecuada.

NOTA ORIGINAL:
---
${originalNote}
---

NUEVA INFORMACIÓN:
---
${newInformation}
---

**INSTRUCCIONES CRÍTICAS:**

1. **Análisis e Integración Inteligente:**
   - Analiza dónde debe ir la nueva información dentro de la estructura de la nota original.
   - Identifica la sección más apropiada (evolución, tratamiento, diagnóstico, plan, etc.).
   - Integra la información de forma natural sin alterar el resto del contenido.
   - Si la nueva información proviene de una grabación de voz, primero conviértela a texto clínico coherente antes de integrarla.

2. **Preservación del Contenido Original:**
   - Conserva EXACTAMENTE todo el contenido original que no requiere modificación.
   - Mantén la estructura, formato, encabezados y estilo de la nota original.
   - Solo reemplaza lo estrictamente pertinente según la nueva información; no modifiques otras secciones.

3. **Coherencia y Estilo Médico:**
   - Mantén el estilo de redacción médica profesional de la nota original.
   - Asegura coherencia temporal y clínica en la información.
   - Usa terminología médica apropiada y consistente.

4. **Manejo de Contradicciones:**
   - Si la nueva información contradice algo en la nota original, actualiza solo lo necesario.
   - Mantén un registro cronológico lógico si es aplicable.
   - Preserva la coherencia clínica general.

5. **Formato de Respuesta:**
   - Responde ÚNICAMENTE con la nota clínica completa y actualizada.
   - No incluyas comentarios, explicaciones o texto adicional.
   - La respuesta debe ser directamente la nota médica lista para usar.

**EJEMPLO DE INTEGRACIÓN:**
Si la nota original tiene una sección "EVOLUCIÓN:" y la nueva información es sobre el estado actual del paciente, integra esa información en esa sección manteniendo el formato y estilo existente.`;

  try {
    const systemMessage = "Experto en actualización de notas clínicas. Integras información nueva preservando formato y coherencia médica.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model: OPENAI_MODEL,
      messages,
      temperature: AI_CONFIG.TEMPERATURE,
      max_tokens: AI_CONFIG.MAX_TOKENS,
      top_p: 0.9
    };
    
    const response = await openai.chat.completions.create(params);
    const result = response.choices[0]?.message?.content || '';
    
    if (!result.trim()) {
      throw new Error('No se pudo generar contenido válido');
    }
    
    return {
      text: result,
      groundingMetadata: { groundingChunks: [] }
    };
  } catch (error) {
    throw handleOpenAIError(error, 'actualización de nota clínica');
  }
};

export const analyzeClinicalContent = async (
  request: EvidenceConsultationRequest
): Promise<ClinicalAnalysisResult> => {
  validateApiKey();
  validateInput(request.clinicalContent, VALIDATION_RULES.MIN_TEXT_LENGTH);

  const prompt = `Analiza este contenido clínico y genera recomendaciones basadas en evidencia.

CONTENIDO CLÍNICO:
---
${request.clinicalContent}
---

TIPO: ${request.consultationType}
${request.focusAreas ? `ÁREAS DE ENFOQUE: ${request.focusAreas.join(', ')}` : ''}

${request.patientContext ? `CONTEXTO DEL PACIENTE:
- Edad: ${request.patientContext.age || 'No especificada'}
- Sexo: ${request.patientContext.sex || 'No especificado'}
- Comorbilidades: ${request.patientContext.comorbidities?.join(', ') || 'Ninguna'}
- Alergias: ${request.patientContext.allergies?.join(', ') || 'Ninguna'}
- Medicamentos: ${request.patientContext.currentMedications?.join(', ') || 'Ninguno'}` : ''}

INSTRUCCIONES:
1. Extrae hallazgos clínicos principales
2. Genera recomendaciones basadas en evidencia
3. Identifica factores de riesgo y banderas rojas
4. Sugiere plan diagnóstico

RESPUESTA EN JSON:
{
  "findings": [{"id": "f1", "category": "symptom", "description": "...", "severity": "moderate", "confidence": 0.8, "extractedText": "..."}],
  "recommendations": [{"id": "r1", "category": "diagnostic", "title": "...", "description": "...", "strength": "strong", "evidenceQuality": "high", "applicability": 0.9, "urgency": "routine", "sources": [{"type": "pubmed", "title": "...", "evidenceLevel": "A"}]}],
  "riskFactors": ["..."],
  "redFlags": ["..."],
  "differentialDiagnoses": ["..."],
  "suggestedWorkup": ["..."],
  "confidence": 0.85,
  "analysisTimestamp": "${new Date().toISOString()}",
  "disclaimerText": "Esta información es para apoyo educativo y no sustituye el juicio clínico profesional."
}`;

  try {
    const systemMessage = "Experto en análisis clínico basado en evidencia. Responde siempre en JSON válido con recomendaciones precisas.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model: OPENAI_MODEL,
      messages,
      temperature: AI_CONFIG.TEMPERATURE,
      max_tokens: AI_CONFIG.MAX_TOKENS,
      top_p: 0.8
    };
    
    const response = await openai.chat.completions.create(params);
    const responseText = response.choices[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(responseText);
      
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
  validateInput(query, VALIDATION_RULES.MIN_TEXT_LENGTH);

  const prompt = `Busca evidencia científica para: "${query}"

${clinicalContext ? `CONTEXTO CLÍNICO:
---
${clinicalContext}
---` : ''}

INSTRUCCIONES:
1. Busca evidencia específica para la consulta
2. Prioriza fuentes de alta calidad
3. Proporciona recomendaciones prácticas
4. Incluye niveles de evidencia

RESPUESTA EN JSON:
{
  "query": "${query}",
  "sources": [{"type": "pubmed", "title": "...", "authors": ["..."], "journal": "...", "year": 2023, "evidenceLevel": "A", "studyType": "meta_analysis"}],
  "recommendations": [{"id": "sr1", "category": "therapeutic", "title": "...", "description": "...", "strength": "strong", "evidenceQuality": "high", "applicability": 0.85, "urgency": "routine"}],
  "searchTimestamp": "${new Date().toISOString()}",
  "totalResults": 5,
  "searchStrategy": "Búsqueda en bases de datos médicas principales"
}`;

  try {
    const systemMessage = "Experto en medicina basada en evidencia. Responde en JSON válido con información científicamente respaldada.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model: OPENAI_MODEL,
      messages,
      temperature: AI_CONFIG.TEMPERATURE,
      max_tokens: AI_CONFIG.MAX_TOKENS,
      top_p: 0.8
    };
    
    const response = await openai.chat.completions.create(params);
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

  const consultationRequest: EvidenceConsultationRequest = {
    clinicalContent,
    consultationType: 'comprehensive',
    focusAreas: specificQuestions
  };

  try {
    const analysis = await analyzeClinicalContent(consultationRequest);

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

export const generateSimplifiedEvidenceConsultation = async (
  clinicalContent: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateInput(clinicalContent, VALIDATION_RULES.MIN_TEXT_LENGTH);

  const cleanContent = clinicalContent.trim();
  if (cleanContent.length < 10) {
    throw new Error('El contenido clínico debe tener al menos 10 caracteres para generar evidencia.');
  }

  const prompt = `Analiza este contenido clínico y proporciona recomendaciones basadas en evidencia científica.

CONTENIDO CLÍNICO:
---
${cleanContent}
---

INSTRUCCIONES:
1. **ANÁLISIS:** Identifica hallazgos principales y aspectos relevantes
2. **RECOMENDACIONES:** Sugerencias diagnósticas y terapéuticas con evidencia
3. **CITAS:** Referencias a estudios recientes y guías clínicas relevantes
4. **FORMATO:** Estructura profesional con citas integradas

FUENTES PRINCIPALES: PubMed, Cochrane, UpToDate, NEJM, The Lancet, JAMA, BMJ

Proporciona análisis completo con recomendaciones prácticas para la toma de decisiones clínicas.`;

  try {
    const systemMessage = "Médico especialista en medicina basada en evidencia. Análisis clínicos con recomendaciones respaldadas por literatura científica actual.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model: OPENAI_MODEL,
      messages,
      temperature: AI_CONFIG.TEMPERATURE,
      max_tokens: AI_CONFIG.MAX_TOKENS,
      top_p: 0.9
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    
    try {
      const response = await openai.chat.completions.create(params, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const result = response.choices[0]?.message?.content || '';
      
      if (!result.trim()) {
        throw new Error('No se pudo generar contenido de evidencia válido. Intenta con información clínica más detallada.');
      }
      
      if (result.length < 50) {
        throw new Error('La respuesta de evidencia es demasiado corta. Intenta con más información clínica.');
      }
      
      return {
        text: result,
        groundingMetadata: { groundingChunks: [] }
      };
    } catch (abortError: unknown) {
      clearTimeout(timeoutId);
      if (abortError instanceof Error && abortError.name === 'AbortError') {
        throw new Error('La generación de evidencia tomó demasiado tiempo. Intenta con contenido clínico más breve.');
      }
      throw abortError;
    }
  } catch (error) {
    throw handleOpenAIError(error, 'generación de consulta simplificada basada en evidencia');
  }
};

// =============================================================================
// METADATA Y UTILIDADES
// =============================================================================

export const getServiceInfo = () => ({
  version: '2.0.0',
  architecture: 'hybrid',
  preferredMethod: 'assistants',
  fallbackMethods: ['function_calling', 'legacy'],
  capabilities: [
    'OpenAI Assistants API',
    'Function Calling con JSON Schema',
    'Gestión inteligente de contexto',
    'Fallback automático',
    'Compatibilidad legacy'
  ],
  description: 'Servicio híbrido con migración a Assistants API manteniendo compatibilidad hacia atrás'
});

console.log('✅ OpenAI Service migrado a nueva arquitectura híbrida');
console.log('🔄 Usando Assistants API como método preferido con fallbacks automáticos'); 