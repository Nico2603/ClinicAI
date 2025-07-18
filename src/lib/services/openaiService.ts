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
// SERVICIOS PRINCIPALES
// =============================================================================

export const generateNoteFromTemplate = async (
  specialtyName: string,
  templateContent: string,
  patientInfo: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateInput(templateContent, 10);
  validateInput(patientInfo, VALIDATION_RULES.MIN_TEXT_LENGTH);

  try {
    console.log('🔄 Iniciando generación modular de nota clínica...');
    
    // Paso 1: Extraer información subjetiva del paciente
    console.log('📋 Paso 1: Extrayendo información subjetiva...');
    const subjectiveResult = await extractSubjectiveInformation(patientInfo);
    const subjectiveInfo = subjectiveResult.text;
    
    // Paso 2: Generar análisis clínico mejorado
    console.log('🔬 Paso 2: Generando análisis clínico...');
    const clinicalAnalysisResult = await generateClinicalAnalysis(patientInfo, subjectiveInfo);
    const clinicalAnalysis = clinicalAnalysisResult.text;
    
    // Paso 3: Analizar estructura de la plantilla
    console.log('📝 Paso 3: Analizando estructura de plantilla...');
    const templateStructureResult = await analyzeTemplateStructure(templateContent);
    const templateStructure = templateStructureResult.text;
    
    // Paso 4: Integrar todos los componentes en la nota final
    console.log('🔗 Paso 4: Integrando componentes en nota final...');
    const finalNoteResult = await generateModularNote(
      templateContent,
      patientInfo,
      subjectiveInfo,
      clinicalAnalysis,
      templateStructure
    );
    
    console.log('✅ Generación modular completada exitosamente');
    
    return {
      text: finalNoteResult.text,
      groundingMetadata: {
        groundingChunks: [
          {
            web: {
              uri: 'internal://subjective-extraction',
              title: 'Información Subjetiva Extraída'
            }
          },
          {
            web: {
              uri: 'internal://clinical-analysis',
              title: 'Análisis Clínico Mejorado'
            }
          },
          {
            web: {
              uri: 'internal://template-structure',
              title: 'Estructura de Plantilla Analizada'
            }
          }
        ]
      }
    };
  } catch (error) {
    console.error('❌ Error en generación modular:', error);
    throw handleOpenAIError(error, 'generación modular de nota con plantilla');
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
    const systemMessage = "Especialista en actualización selectiva de notas clínicas. Preserva estructura original, modifica solo lo necesario.";
    
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
// FUNCIONES MODULARES PARA GENERACIÓN DE NOTAS
// =============================================================================

/**
 * Extrae y organiza la información subjetiva del paciente
 * (síntomas, molestias, lo que describe el paciente)
 */
export const extractSubjectiveInformation = async (
  patientInfo: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateInput(patientInfo, VALIDATION_RULES.MIN_TEXT_LENGTH);

  const prompt = `Eres un médico especialista en redacción clínica. Recibirás una historia clínica narrada de forma continua que puede incluir información sobre ingreso, evolución, diagnósticos, análisis, subjetivo y objetivo mezclados, paraclínicos, imágenes.

INFORMACIÓN DEL PACIENTE:
---
${patientInfo}
---

Tu tarea es:
1. LEER todo el texto cuidadosamente.
2. IDENTIFICAR y EXTRAER el fragmento que corresponde al **SUBJETIVO** del paciente: entendiéndolo como lo que es explícitamente referido por el paciente tal como síntomas, molestias, lo que describe el paciente, sin interpretaciones ni diagnósticos.
3. ORGANIZAR cada parte en frases claras y coherentes, manteniendo la lógica médica.
4. NO AÑADIR datos nuevos que no estén en el texto original.
5. NO INVENTAR diagnósticos ni signos clínicos adicionales.
6. NO utilizar información externa.

INSTRUCCIONES ESPECÍFICAS:
- Extrae ÚNICAMENTE lo que el paciente reporta subjetivamente
- Mantén las palabras exactas del paciente cuando sea posible
- Organiza los síntomas de forma cronológica si aplica
- Incluye características de los síntomas (intensidad, duración, factores que mejoran/empeoran)
- Si no hay información subjetiva clara, indica "No se especifica información subjetiva del paciente"

FORMATO DE RESPUESTA:
Responde SOLO con la información subjetiva extraída y organizada, sin comentarios adicionales.`;

  try {
    const systemMessage = "Especialista en extracción de información subjetiva de historias clínicas. Preservas exactamente lo que reporta el paciente sin añadir interpretaciones.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model: OPENAI_MODEL,
      messages,
      temperature: 0.3, // Temperatura baja para preservar exactitud
      max_tokens: AI_CONFIG.MAX_TOKENS,
      top_p: 0.8
    };
    
    const response = await openai.chat.completions.create(params);
    const result = response.choices[0]?.message?.content || '';
    
    if (!result.trim()) {
      throw new Error('No se pudo extraer información subjetiva válida');
    }
    
    return {
      text: result,
      groundingMetadata: { groundingChunks: [] }
    };
  } catch (error) {
    throw handleOpenAIError(error, 'extracción de información subjetiva');
  }
};

/**
 * Genera análisis clínico mejorado basado en la información del paciente
 */
export const generateClinicalAnalysis = async (
  patientInfo: string,
  subjectiveInfo?: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateInput(patientInfo, VALIDATION_RULES.MIN_TEXT_LENGTH);

  const prompt = `Eres un médico especialista en redacción clínica. Tu tarea es generar un análisis clínico profesional basado en la información del paciente.

INFORMACIÓN COMPLETA DEL PACIENTE:
---
${patientInfo}
---

${subjectiveInfo ? `INFORMACIÓN SUBJETIVA IDENTIFICADA:
---
${subjectiveInfo}
---` : ''}

Tu tarea es:
1. IDENTIFICAR y EXTRAER el fragmento que corresponde al **ANÁLISIS CLÍNICO**: interpretaciones, hipótesis diagnósticas, conclusiones del médico.
2. En el apartado de análisis clínico, vas a mejorar la redacción basado en la literatura y el lenguaje técnico médico, conservando el hilo conductor narrado.
3. Conservar la estructura del diagnóstico propuesto y encaminándolo hacia el plan de manejo propuesto acorde con los diagnósticos.
4. Conservar la lógica médica.
5. NO AÑADIR datos nuevos que no estén en el texto original.
6. NO INVENTAR diagnósticos ni signos clínicos adicionales.
7. NO utilizar información externa al caso.

INSTRUCCIONES ESPECÍFICAS:
- Mejora la redacción técnica manteniendo el contenido original
- Usa terminología médica precisa y actualizada
- Mantén la coherencia diagnóstica
- Estructura el análisis de forma lógica (presentación → interpretación → diagnóstico → plan)
- Si no hay análisis clínico claro, indica "Información insuficiente para análisis clínico detallado"

FORMATO DE RESPUESTA:
Responde SOLO con el análisis clínico mejorado, sin comentarios adicionales.`;

  try {
    const systemMessage = "Especialista en análisis clínico y redacción médica técnica. Mejoras la presentación profesional manteniendo fidelidad al contenido original.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model: OPENAI_MODEL,
      messages,
      temperature: 0.4, // Temperatura moderada para mejorar redacción sin cambiar contenido
      max_tokens: AI_CONFIG.MAX_TOKENS,
      top_p: 0.9
    };
    
    const response = await openai.chat.completions.create(params);
    const result = response.choices[0]?.message?.content || '';
    
    if (!result.trim()) {
      throw new Error('No se pudo generar análisis clínico válido');
    }
    
    return {
      text: result,
      groundingMetadata: { groundingChunks: [] }
    };
  } catch (error) {
    throw handleOpenAIError(error, 'generación de análisis clínico');
  }
};

/**
 * Analiza y preserva la estructura de la plantilla
 */
export const analyzeTemplateStructure = async (
  templateContent: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateInput(templateContent, 10);

  const prompt = `Eres un especialista en análisis de estructuras de plantillas médicas. Tu tarea es analizar la estructura de una plantilla y extraer su formato exacto.

PLANTILLA A ANALIZAR:
---
${templateContent}
---

Tu tarea es:
1. IDENTIFICAR la estructura exacta de la plantilla (encabezados, subsecciones, formato)
2. PRESERVAR todos los elementos de formato: mayúsculas/minúsculas, viñetas, numeración, sangrías
3. IGNORAR completamente cualquier dato de ejemplo o ficticios en la plantilla
4. EXTRAER el esquema puro de la estructura

INSTRUCCIONES ESPECÍFICAS:
- Identifica cada sección y subsección
- Preserva el formato exacto (MAYÚSCULAS, minúsculas, viñetas -, números 1., 2., etc.)
- Ignora datos de ejemplo como "[Nombre del paciente]", "Juan Pérez", etc.
- Mantén la jerarquía y el orden de las secciones
- Identifica campos que requieren información del paciente vs campos fijos

FORMATO DE RESPUESTA:
Describe la estructura identificada de forma clara y organizada, preparada para ser usada como guía de formato.`;

  try {
    const systemMessage = "Especialista en análisis de estructuras de documentos médicos. Extraes el formato puro ignorando datos de ejemplo.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model: OPENAI_MODEL,
      messages,
      temperature: 0.2, // Temperatura muy baja para preservar estructura exacta
      max_tokens: AI_CONFIG.MAX_TOKENS,
      top_p: 0.7
    };
    
    const response = await openai.chat.completions.create(params);
    const result = response.choices[0]?.message?.content || '';
    
    if (!result.trim()) {
      throw new Error('No se pudo analizar la estructura de la plantilla');
    }
    
    return {
      text: result,
      groundingMetadata: { groundingChunks: [] }
    };
  } catch (error) {
    throw handleOpenAIError(error, 'análisis de estructura de plantilla');
  }
};

/**
 * Función coordinadora que integra todos los componentes para generar la nota final
 */
export const generateModularNote = async (
  templateContent: string,
  patientInfo: string,
  subjectiveInfo: string,
  clinicalAnalysis: string,
  templateStructure: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateInput(templateContent, 10);
  validateInput(patientInfo, VALIDATION_RULES.MIN_TEXT_LENGTH);

  const prompt = `Eres un especialista en generación de notas clínicas que integra múltiples componentes especializados. Tu tarea es crear la nota final perfecta.

PLANTILLA ORIGINAL (solo para referencia de formato):
---
${templateContent}
---

ESTRUCTURA DE PLANTILLA ANALIZADA:
---
${templateStructure}
---

INFORMACIÓN SUBJETIVA DEL PACIENTE:
---
${subjectiveInfo}
---

ANÁLISIS CLÍNICO MEJORADO:
---
${clinicalAnalysis}
---

INFORMACIÓN COMPLETA DEL PACIENTE:
---
${patientInfo}
---

Tu tarea es:
1. **INTEGRAR** toda la información de forma coherente siguiendo la estructura de la plantilla
2. **COLOCAR** cada componente en la sección apropiada de la plantilla
3. **COMPLETAR** campos faltantes usando únicamente la información del paciente disponible
4. **PRESERVAR** el formato exacto de la plantilla
5. **OMITIR** secciones donde no hay información disponible (sin indicar que falta)
6. **CREAR** una nota médica profesional y completa

INSTRUCCIONES CRÍTICAS:
- Usa la estructura de plantilla como guía de formato EXACTO
- Integra la información subjetiva en las secciones apropiadas
- Coloca el análisis clínico en las secciones de evaluación/diagnóstico
- Completa otros campos con información del paciente disponible
- NO inventes información que no esté en los datos proporcionados
- OMITE secciones sin información disponible
- Al final, bajo "OBSERVACIONES:", lista datos que faltan

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con la nota médica completada, lista para usar.`;

  try {
    const systemMessage = "Especialista en integración de componentes clínicos para generar notas médicas finales perfectas. Combinas información especializada manteniendo formato profesional.";
    
    const messages = createMessages(systemMessage, prompt);
    
    const params = {
      model: OPENAI_MODEL,
      messages,
      temperature: 0.3, // Temperatura controlada para integración precisa
      max_tokens: AI_CONFIG.MAX_TOKENS,
      top_p: 0.9
    };
    
    const response = await openai.chat.completions.create(params);
    const result = response.choices[0]?.message?.content || '';
    
    if (!result.trim()) {
      throw new Error('No se pudo generar la nota integrada');
    }
    
    return {
      text: result,
      groundingMetadata: { groundingChunks: [] }
    };
  } catch (error) {
    throw handleOpenAIError(error, 'generación de nota integrada');
  }
};

/**
 * Función de respaldo con implementación original (por si se necesita fallback)
 */
export const generateNoteFromTemplateFallback = async (
  specialtyName: string,
  templateContent: string,
  patientInfo: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  validateApiKey();
  validateInput(templateContent, 10);
  validateInput(patientInfo, VALIDATION_RULES.MIN_TEXT_LENGTH);

  // Prompt optimizado original
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
    throw handleOpenAIError(error, 'generación de nota con plantilla (fallback)');
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