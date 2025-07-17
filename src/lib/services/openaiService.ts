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
  ClinicalFinding,
  ClinicalRecommendation
} from '../../types';

// =============================================================================
// CONFIGURACIÓN SIMPLIFICADA
// =============================================================================

const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!API_KEY) {
  console.error("❌ NEXT_PUBLIC_OPENAI_API_KEY no está configurada. Por favor verifica tu archivo .env");
  console.error("La aplicación podría no funcionar correctamente sin esta clave.");
}

// Cliente OpenAI simple
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
// SERVICIOS PRINCIPALES SIMPLIFICADOS
// =============================================================================

export const generateNoteFromTemplate = async (
  specialtyName: string,
  templateContent: string,
  patientInfo: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateInput(templateContent, 10);
  validateInput(patientInfo, VALIDATION_RULES.MIN_TEXT_LENGTH);

  // Prompt optimizado
  const prompt = `Eres un asistente médico experto en completar notas clínicas. Tu tarea es utilizar la información del paciente proporcionada para llenar una plantilla de nota médica.

INFORMACIÓN DEL PACIENTE:
"${patientInfo}"

PLANTILLA (formato únicamente):
---
${templateContent}
---

INSTRUCCIONES CRÍTICAS:

1. **FORMATO ES SAGRADO:**
   - Respeta EXACTAMENTE el formato de la plantilla: estructura, encabezados, mayúsculas/minúsculas, viñetas, numeración, sangrías, etc.
   - Si algo está en MAYÚSCULAS, mantenlo en MAYÚSCULAS.
   - Si algo está en minúsculas, mantenlo en minúsculas.
   - Si usa viñetas (-), mantén las viñetas.
   - Si usa numeración (1., 2.), mantén la numeración o si son números romanos también mantenlo.
   - La plantilla es solo un FORMATO/ESTRUCTURA, no contiene datos del paciente real.

2. **CONTENIDO:**
   - Usa ÚNICAMENTE la información del paciente proporcionada.
   - NO inventes datos que no estén en la información del paciente.
   - Si falta información para una sección, no dejes nunca el ítem vacío ni coloques nunca que falta un dato solo OMITE ESTA PARTE Y NO LA COLOQUES, al final de todo pon observaciones y un listado de datos que faltan y allí los concatenas.
   - Usa terminología médica precisa y profesional.
   - Siempre colocarlo todo en el mismo orden de la plantilla.
   - Pon especial cuidado en la parte de ítems subjetivos y análisis que no hay datos predeterminados allí se pone algo con un índice de redacción pero apegado a la información que tenemos del paciente SIN ALUCINAR NI INVENTAR NADA.

3. **IMPORTANTE:**
   - La plantilla puede contener ejemplos como "[Nombre del paciente]" o datos ficticios - IGNÓRALOS completamente.
   - Solo usa el FORMATO/ESTRUCTURA de la plantilla, nunca los datos de ejemplo.
   - Reemplaza todos los campos con información real del paciente o OMITE y no pongas el ítem si no hay datos.

4. **RESPUESTA:**
   - Responde SOLO con la nota médica completada.
   - No agregues comentarios, explicaciones, ni introducciones.

La plantilla es una ESTRUCTURA/FORMATO que debes seguir, no una fuente de datos del paciente.

Genera la nota médica completada:`;

  try {
    const systemMessage = "Eres un asistente médico experto especializado en generar notas clínicas precisas y profesionales. Sigues estrictamente el formato de las plantillas proporcionadas, nunca datos de ejemplo de plantillas.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model: OPENAI_MODEL,
      messages,
      temperature: AI_CONFIG.TEMPERATURE,
      max_tokens: AI_CONFIG.MAX_TOKENS,
      top_p: 0.9
    };
    
    const response = await openai.chat.completions.create(params);
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
  validateInput(clinicalInput, VALIDATION_RULES.MIN_TEXT_LENGTH);
  validateInput(scaleName, 2);

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
      groundingMetadata: { groundingChunks: [] }
    };
  } catch (error) {
    throw handleOpenAIError(error, 'generación de escala médica');
  }
};

export const updateClinicalNote = async (
  originalNote: string,
  newInformation: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateInput(originalNote, VALIDATION_RULES.MIN_TEXT_LENGTH);
  validateInput(newInformation, VALIDATION_RULES.MIN_TEXT_LENGTH);

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
    const systemMessage = "Especialista en actualización selectiva de notas clínicas. Preserva estructura original, modifica solo lo necesario.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model: OPENAI_MODEL,
      messages,
      temperature: AI_CONFIG.TEMPERATURE,
      max_tokens: AI_CONFIG.MAX_TOKENS,
      top_p: 0.8
    };
    
    const response = await openai.chat.completions.create(params);
    const generatedText = response.choices[0]?.message?.content || '';
    
    return { 
      text: generatedText, 
      groundingMetadata: undefined
    };
  } catch (error) {
    throw handleOpenAIError(error, 'actualización selectiva de nota clínica');
  }
}; 

export const analyzeClinicalContent = async (
  request: EvidenceConsultationRequest
): Promise<ClinicalAnalysisResult> => {
  validateApiKey();
  validateInput(request.clinicalContent, VALIDATION_RULES.MIN_TEXT_LENGTH);

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

export const generateSimplifiedEvidenceConsultation = async (
  clinicalContent: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateInput(clinicalContent, VALIDATION_RULES.MIN_TEXT_LENGTH);

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
    const systemMessage = "Médico especialista en medicina basada en evidencia. Análisis clínicos con recomendaciones respaldadas por literatura científica actual.";
    
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
    throw handleOpenAIError(error, 'generación de consulta basada en evidencia simplificada');
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
    model: OPENAI_MODEL,
    config: AI_CONFIG,
  };
}; 