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
// CONFIGURACIÓN Y VALIDACIÓN OPTIMIZADA
// =============================================================================

// Configuración de OpenAI optimizada para rendimiento
const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!API_KEY) {
  console.error("❌ NEXT_PUBLIC_OPENAI_API_KEY no está configurada. Por favor verifica tu archivo .env");
  console.error("La aplicación podría no funcionar correctamente sin esta clave.");
}

// Cliente OpenAI optimizado para velocidad
const openai = new OpenAI({
  apiKey: API_KEY || '',
  dangerouslyAllowBrowser: true,
  timeout: 15000, // Reducido de 35s a 15s para mejor UX
  maxRetries: 1, // Reducido de 2 a 1 para evitar esperas largas
});

// =============================================================================
// SISTEMA DE CACHE OPTIMIZADO
// =============================================================================

// Cache in-memory optimizado para respuestas de IA
const responseCache = new Map<string, { response: any; timestamp: number; }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos (aumentado de lo que había implícito)

// Generar clave de cache más eficiente
const generateCacheKey = (functionName: string, ...args: any[]): string => {
  // Usar hash simple en lugar de JSON.stringify para mejor rendimiento
  const argsHash = args.map(arg => {
    if (typeof arg === 'string') {
      return arg.length > 100 ? arg.substring(0, 100) + `_len${arg.length}` : arg;
    }
    return typeof arg + '_' + String(arg).substring(0, 50);
  }).join('|');
  
  return `${functionName}:${argsHash}`;
};

// Cache inteligente con limpieza automática
const getCachedResponse = (key: string) => {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.response;
  }
  if (cached) {
    responseCache.delete(key); // Limpiar cache expirado
  }
  return null;
};

const setCachedResponse = (key: string, response: any) => {
  // Limitar tamaño del cache (máximo 100 entradas)
  if (responseCache.size >= 100) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) {
      responseCache.delete(oldestKey);
    }
  }
  
  responseCache.set(key, { response, timestamp: Date.now() });
};

// =============================================================================
// UTILIDADES OPTIMIZADAS
// =============================================================================

// Función optimizada para crear mensajes
const createMessages = (systemMessage: string, userMessage: string) => {
  return [
    { role: "system" as const, content: systemMessage },
    { role: "user" as const, content: userMessage }
  ];
};

// =============================================================================
// PROTECCIÓN CONTRA LLAMADAS DUPLICADAS OPTIMIZADA
// =============================================================================

// Mapa optimizado de promesas pendientes
const pendingRequests = new Map<string, Promise<any>>();

// Protección contra llamadas duplicadas optimizada
const preventDuplicateRequests = async <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
  // Si ya hay una petición pendiente, devolver esa promesa
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }

  // Crear nueva promesa con limpieza automática
  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
};

// Validaciones optimizadas (ejecutar solo una vez por función)
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

// Función optimizada para manejar errores de OpenAI
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
      return new Error('Contenido excede el límite de contexto.');
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
  
  // Generar clave de cache optimizada
  const cacheKey = generateCacheKey('generateNoteFromTemplate', specialtyName, templateContent, patientInfo);
  
  // Verificar cache primero
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log('📋 Respuesta obtenida desde cache');
    return cached;
  }

  // Usar protección contra llamadas duplicadas
  return preventDuplicateRequests(cacheKey, async () => {
    // Prompt optimizado - más conciso pero igual de efectivo
    const prompt = `Completa esta nota médica usando SOLO la información del paciente proporcionada.

INFORMACIÓN DEL PACIENTE:
"${patientInfo}"

PLANTILLA (formato únicamente):
---
${templateContent}
---

INSTRUCCIONES:
1. Usa ÚNICAMENTE la información del paciente
2. NO uses datos de ejemplo de la plantilla
3. Si falta información, omite la sección o marca "No reportado"
4. Mantén el formato estructurado de la plantilla
5. Sé conciso pero completo

Genera la nota médica completada:`;

    try {
      const model = 'gpt-4o-mini';
      const systemMessage = "Asistente médico experto en notas clínicas. Usa solo información del paciente real, nunca datos de ejemplo de plantillas.";
      
      const messages = createMessages(systemMessage, prompt);
      
      const params = {
        model,
        messages,
        temperature: TEMPERATURE_CONFIG.CRITICAL_MEDICAL,
        max_tokens: TOKEN_LIMITS.CRITICAL_MEDICAL_NOTE,
        top_p: 0.9
      };
      
      const response = await openai.chat.completions.create(params);

      const generatedText = response.choices[0]?.message?.content || '';
      
      if (!generatedText.trim()) {
        throw new Error('No se pudo generar contenido válido');
      }

      const result = { 
        text: generatedText, 
        groundingMetadata: undefined
      };
      
      // Guardar en cache
      setCachedResponse(cacheKey, result);
      
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

  // Verificar cache
  const cacheKey = generateCacheKey('generateMedicalScale', clinicalInput, scaleName);
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log('🎯 Escala obtenida desde cache');
    return cached;
  }

  // Prompt optimizado para escalas médicas
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
    const model = 'gpt-4o-mini';
    const systemMessage = "Experto en escalas clínicas. Solo usa información explícita, nunca inventa datos. Transparente sobre limitaciones.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model,
      messages,
      temperature: TEMPERATURE_CONFIG.CLINICAL_REASONING,
      max_tokens: TOKEN_LIMITS.MEDICAL_SCALE,
      top_p: 0.9
    };
    
    const response = await openai.chat.completions.create(params);

    const result = response.choices[0]?.message?.content || '';
    
    if (!result.trim()) {
      throw new Error('No se pudo generar contenido válido');
    }
    
    const finalResult = {
      text: result,
      groundingMetadata: { groundingChunks: [] }
    };
    
    // Guardar en cache
    setCachedResponse(cacheKey, finalResult);
    
    return finalResult;
  } catch (error) {
    throw handleOpenAIError(error, 'generación de escala médica');
  }
};

export const updateClinicalNote = async (
  originalNote: string,
  newInformation: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();

  // Verificar cache
  const cacheKey = generateCacheKey('updateClinicalNote', originalNote, newInformation);
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log('📝 Actualización obtenida desde cache');
    return cached;
  }

  // Prompt optimizado para actualización de notas
  const prompt = `Actualiza esta nota clínica integrando ÚNICAMENTE la nueva información proporcionada.

**NOTA ORIGINAL:**
---
${originalNote}
---

**NUEVA INFORMACIÓN:**
---
${newInformation}
---

INSTRUCCIONES:
1. Preserva el formato y estructura exactos de la nota original
2. Integra SOLO la nueva información proporcionada
3. NO reescribas secciones que no requieren actualización
4. Mantén el mismo estilo de redacción médica
5. Si la nueva información reemplaza datos existentes, reemplaza SOLO esos datos específicos

Devuelve la nota clínica completa actualizada:`;

  try {
    const model = 'gpt-4o-mini';
    const systemMessage = "Especialista en actualización selectiva de notas clínicas. Preserva estructura original, modifica solo lo necesario.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model,
      messages,
      temperature: TEMPERATURE_CONFIG.CRITICAL_MEDICAL,
      max_tokens: TOKEN_LIMITS.CRITICAL_MEDICAL_NOTE,
      top_p: 0.8
    };
    
    const response = await openai.chat.completions.create(params);

    const generatedText = response.choices[0]?.message?.content || '';
    
    const result = { 
      text: generatedText, 
      groundingMetadata: undefined
    };
    
    // Guardar en cache
    setCachedResponse(cacheKey, result);
    
    return result;
  } catch (error) {
    throw handleOpenAIError(error, 'actualización selectiva de nota clínica');
  }
}; 

// ===== ANÁLISIS CLÍNICO OPTIMIZADO =====

export const analyzeClinicalContent = async (
  request: EvidenceConsultationRequest
): Promise<ClinicalAnalysisResult> => {
  validateApiKey();

  // Verificar cache
  const cacheKey = generateCacheKey('analyzeClinicalContent', request.clinicalContent, request.consultationType);
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log('🔬 Análisis obtenido desde cache');
    return cached;
  }

  // Prompt optimizado para análisis clínico
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
    const model = 'gpt-4o-mini';
    const systemMessage = "Experto en análisis clínico basado en evidencia. Responde siempre en JSON válido con recomendaciones precisas.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model,
      messages,
      temperature: TEMPERATURE_CONFIG.CLINICAL_REASONING,
      max_tokens: TOKEN_LIMITS.CLINICAL_ANALYSIS,
      top_p: 0.8
    };
    
    const response = await openai.chat.completions.create(params);

    const responseText = response.choices[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(responseText);
      
      // Validar estructura mínima
      if (!parsed.findings || !parsed.recommendations) {
        throw new Error('Respuesta de IA inválida: falta estructura de análisis');
      }

      // Guardar en cache
      setCachedResponse(cacheKey, parsed);
      
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

  // Verificar cache
  const cacheKey = generateCacheKey('searchEvidenceBasedRecommendations', query, clinicalContext || '');
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log('🔍 Búsqueda obtenida desde cache');
    return cached;
  }

  // Prompt optimizado para búsqueda de evidencia
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
    const model = 'gpt-4o-mini';
    const systemMessage = "Experto en medicina basada en evidencia. Responde en JSON válido con información científicamente respaldada.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model,
      messages,
      temperature: TEMPERATURE_CONFIG.EVIDENCE_SUGGESTIONS,
      max_tokens: TOKEN_LIMITS.EVIDENCE_SUGGESTIONS,
      top_p: 0.8
    };
    
    const response = await openai.chat.completions.create(params);

    const responseText = response.choices[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(responseText);
      
      // Guardar en cache
      setCachedResponse(cacheKey, parsed);
      
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

// ===== CONSULTA CLÍNICA SIMPLIFICADA OPTIMIZADA =====

export const generateSimplifiedEvidenceConsultation = async (
  clinicalContent: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  
  // Verificar cache
  const cacheKey = generateCacheKey('generateSimplifiedEvidenceConsultation', clinicalContent);
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log('🩺 Consulta obtenida desde cache');
    return cached;
  }

  // Usar protección contra llamadas duplicadas
  return preventDuplicateRequests(cacheKey, async () => {
    // Prompt optimizado para consulta simplificada
    const prompt = `Analiza este contenido clínico y proporciona recomendaciones basadas en evidencia científica.

CONTENIDO CLÍNICO:
---
${clinicalContent}
---

INSTRUCCIONES:
1. **ANÁLISIS:** Identifica hallazgos principales y aspectos relevantes
2. **RECOMENDACIONES:** Sugerencias diagnósticas y terapéuticas con evidencia
3. **CITAS:** Referencias a estudios recientes y guías clínicas relevantes
4. **FORMATO:** Estructura profesional con citas integradas

FUENTES PRINCIPALES: PubMed, Cochrane, UpToDate, NEJM, The Lancet, JAMA, BMJ

Proporciona análisis completo con recomendaciones prácticas para la toma de decisiones clínicas.`;

    try {
      const model = 'gpt-4o-mini';
      const systemMessage = "Médico especialista en medicina basada en evidencia. Análisis clínicos con recomendaciones respaldadas por literatura científica actual.";
      
      const messages = createMessages(systemMessage, prompt);
      
      const params = {
        model,
        messages,
        temperature: TEMPERATURE_CONFIG.CONSULTATION,
        max_tokens: TOKEN_LIMITS.CONSULTATION,
        top_p: 0.9
      };
      
      const response = await openai.chat.completions.create(params);

      const result = response.choices[0]?.message?.content || '';
      
      if (!result.trim()) {
        throw new Error('No se pudo generar contenido válido');
      }
      
      const finalResult = {
        text: result,
        groundingMetadata: { groundingChunks: [] }
      };
      
      // Guardar en cache
      setCachedResponse(cacheKey, finalResult);
      
      return finalResult;
    } catch (error) {
      throw handleOpenAIError(error, 'generación de consulta basada en evidencia simplificada');
    }
  });
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