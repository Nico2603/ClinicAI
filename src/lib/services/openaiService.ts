import OpenAI from 'openai';
import { 
  OPENAI_MODEL_TEXT, 
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
  
  const prompt = `Eres un asistente médico experto en completar notas clínicas. Tu tarea es utilizar la información del paciente proporcionada para llenar una plantilla de nota médica.

INFORMACIÓN DEL PACIENTE:
"${patientInfo}"

PLANTILLA A COMPLETAR:
---
${templateContent}
---

INSTRUCCIONES CRÍTICAS:

1. **FORMATO ES SAGRADO:**
   - Respeta EXACTAMENTE el formato de la plantilla: estructura, encabezados, mayúsculas/minúsculas, viñetas, numeración, sangrías, etc.
   - Si un encabezado está en MAYÚSCULAS, mantenlo en MAYÚSCULAS.
   - Si usa viñetas (-), mantén las viñetas.
   - Si usa numeración (1., 2.), mantén la numeración.
   - La plantilla es solo un FORMATO/ESTRUCTURA, no contiene datos del paciente real.

2. **CONTENIDO:**
   - Usa ÚNICAMENTE la información del paciente proporcionada.
   - NO inventes datos que no estén en la información del paciente.
   - Si falta información para una sección, OMITE completamente esa sección en lugar de escribir "Dato faltante".
   - Usa terminología médica precisa y profesional.

3. **MANEJO DE DATOS FALTANTES:**
   - NO escribas "Dato faltante" ni "Falta dato" en ninguna parte de la nota.
   - Si falta información para completar una sección, simplemente omite esa sección.
   - Al final de la nota, agrega una sección llamada "OBSERVACIONES:" que liste los campos o secciones que no pudieron ser completados por falta de información.
   - Formato de la sección de observaciones: "OBSERVACIONES: Los siguientes datos no pudieron ser completados por falta de información: [lista de campos faltantes]"

4. **IMPORTANTE:**
   - La plantilla puede contener ejemplos como "[Nombre del paciente]" o datos ficticios - IGNÓRALOS completamente.
   - Solo usa el FORMATO/ESTRUCTURA de la plantilla, nunca los datos de ejemplo.
   - Reemplaza todos los campos con información real del paciente o omite la sección si no hay datos.
   - NUNCA copies ni reutilices los valores de ejemplo que vengan en la plantilla.

5. **RESPUESTA:**
   - Responde SOLO con la nota médica completada.
   - No agregues comentarios, explicaciones, ni introducciones.

La plantilla es una ESTRUCTURA/FORMATO que debes seguir, no una fuente de datos del paciente.`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL_TEXT,
      messages: [
        {
          role: "system",
          content: "Eres un asistente médico experto especializado en generar notas clínicas precisas y profesionales. Sigues estrictamente el formato de las plantillas proporcionadas y manejas los datos faltantes de manera profesional."
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

  const prompt = `Contexto: Eres un asistente médico experto en la aplicación de escalas clínicas estandarizadas.
Tarea: Basado en la siguiente "Información Clínica", evalúa y completa la escala "${scaleName}". Debes presentar el resultado en un formato claro y profesional, listo para ser copiado y pegado en una historia clínica.

Información Clínica Proporcionada:
"${clinicalInput}"

Escala a Aplicar: ${scaleName}

Instrucciones para la Generación:
1. **Analiza la Información:** Lee detenidamente la información clínica para encontrar datos que correspondan a los ítems de la escala ${scaleName}.
2. **Puntúa cada Ítem:** Asigna un puntaje a cada ítem de la escala basándote en la información. Si la información para un ítem es insuficiente, usa tu juicio clínico para inferir o indica "No se puede determinar". No inventes datos que no tengan base en el texto.
3. **Calcula el Puntaje Total:** Suma los puntajes de los ítems para obtener el resultado total de la escala.
4. **Proporciona una Interpretación:** Basado en el puntaje total, ofrece una interpretación clínica estandarizada (ej. "Riesgo bajo", "Síntomas depresivos moderados", "Ansiedad severa").
5. **Formato de Respuesta:** La respuesta debe ser ÚNICAMENTE el resultado de la escala. No incluyas saludos ni comentarios introductorios.

Proporciona un resultado preciso y basado en estándares clínicos reconocidos.`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL_TEXT,
      messages: [
        {
          role: "system",
          content: "Eres un asistente médico experto en la aplicación de escalas clínicas estandarizadas. Aplicas las escalas con precisión y proporcionas interpretaciones basadas en estándares clínicos reconocidos."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: TEMPERATURE_CONFIG.CLINICAL_SCALES,
      max_tokens: TOKEN_LIMITS.CLINICAL_SCALE,
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

  const prompt = `Eres un asistente experto en redacción de notas clínicas. Tu tarea es transformar la nota clínica que recibirás a continuación en una PLANTILLA.

Instrucciones detalladas:
1. Detecta automáticamente la especialidad o tipo de nota clínica recibida (ej. Ortopedia, Medicina Interna, Ginecología) y utiliza esta información para contextualizar las correcciones.
2. Identifica todas las variables que deben ser reemplazadas (edad, fecha, diagnósticos, signos vitales, valores numéricos, etc.) y sustitúyelas por marcadores en MAYÚSCULAS entre corchetes, por ejemplo: [EDAD], [DX PRINCIPAL], [PRESIÓN ARTERIAL].
3. Reemplaza TODOS los datos clínicos específicos por marcadores entre corchetes sin alterar la redacción ni la estructura original.
4. No modifiques aquello que no requiera cambio y conserva los hallazgos que apliquen para la patología (p. ej., examen físico normal en un cuadro benigno).
5. Corrige ortografía y redacción dentro del mismo tono clínico sin inventar información nueva para no alterar la coherencia.
6. Si falta un dato importante, coloca el marcador [FALTA DATO POR PREGUNTAR] en el lugar correspondiente.
7. Conserva mayúsculas, minúsculas, sangrías, tabulaciones, estilo clínico exacto y formato institucional del texto.
8. Si la información proviene de una grabación de voz, conviértela a texto clínico coherente e intégrala en la sección correspondiente.
9. Tu respuesta debe ser ÚNICAMENTE la plantilla resultante, lista para copiar y pegar; no añadas comentarios, títulos ni explicaciones adicionales.

Nota clínica a convertir:
---
${clinicalNote}
---`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL_TEXT,
      messages: [
        {
          role: "system",
          content: "Eres un asistente médico experto en generar plantillas a partir de notas clínicas. Sigues estrictamente las instrucciones para reemplazar datos específicos por marcadores y mantienes el formato original."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.25, // Alta conservaduría para minimizar cambios innecesarios
      max_tokens: 1800,
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

  const prompt = `Eres un asistente médico experto especializado en actualizar notas clínicas existentes con nueva información de manera precisa y selectiva. Tu tarea es integrar ÚNICAMENTE la nueva información proporcionada sin reescribir o modificar las secciones que no requieren cambios.

**NOTA CLÍNICA ORIGINAL:**
---
${originalNote}
---

**NUEVA INFORMACIÓN A INTEGRAR:**
---
${newInformation}
---

**INSTRUCCIONES CRÍTICAS:**

1. **PRESERVACIÓN ABSOLUTA:**
   - Mantén EXACTAMENTE el mismo formato, estructura y estilo de la nota original.
   - NO reescribas secciones que no requieren actualización.
   - Conserva todos los encabezados, numeración, viñetas y sangrías tal como están.
   - Preserva el orden y la estructura de las secciones existentes.

2. **ACTUALIZACIÓN SELECTIVA:**
   - Identifica específicamente qué sección(es) de la nota original deben actualizarse con la nueva información.
   - Solo modifica o agrega contenido en las secciones directamente relacionadas con la nueva información.
   - Si la nueva información es adicional (no contradictoria), agrégala a la sección correspondiente.
   - Si la nueva información actualiza datos existentes, reemplaza solo esos datos específicos.

3. **ANÁLISIS INTELIGENTE:**
   - Analiza la nueva información para determinar a qué sección(es) pertenece (evolución, examen físico, tratamiento, etc.).
   - Respeta la lógica temporal y médica de la nota.
   - Mantén la coherencia clínica entre la información original y la nueva.

4. **INTEGRACIÓN NATURAL:**
   - Integra la nueva información de forma fluida y natural en el contexto existente.
   - Usa el mismo estilo de redacción médica de la nota original.
   - Mantén la terminología médica consistente con la nota original.

5. **FORMATO DE RESPUESTA:**
   - Devuelve la nota clínica completa con solo las modificaciones necesarias.
   - NO incluyas comentarios, explicaciones o notas adicionales.
   - La respuesta debe ser directamente la nota médica actualizada.

**EJEMPLO DE ACTUALIZACIÓN:**
Si la nueva información es sobre signos vitales actuales y la nota original ya tiene una sección de signos vitales, actualiza solo esa sección manteniendo todo lo demás idéntico.

**IMPORTANTE:** Solo actualiza lo que realmente requiere cambio según la nueva información proporcionada.`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL_TEXT,
      messages: [
        {
          role: "system",
          content: "Eres un asistente médico experto especializado en actualizar notas clínicas de forma selectiva y precisa. Preservas la estructura original y solo modificas lo estrictamente necesario basado en nueva información médica."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Temperatura muy baja para máxima precisión y conservación
      max_tokens: 2500,
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
      model: OPENAI_MODEL_TEXT,
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
      temperature: 0.1,
      max_tokens: 3000,
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
      model: OPENAI_MODEL_TEXT,
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
      temperature: 0.1,
      max_tokens: 2500,
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
      model: OPENAI_MODEL_TEXT,
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
      temperature: 0.2,
      max_tokens: 2000,
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

  const prompt = `Eres un asistente médico experto en análisis de estructuras de documentos clínicos. Tu tarea es extraer el FORMATO/ESTRUCTURA de la plantilla de historia clínica proporcionada, eliminando todos los datos específicos del paciente.

PLANTILLA ORIGINAL:
---
${trimmedContent}
---

INSTRUCCIONES CRÍTICAS:

1. **EXTRAER SOLO EL FORMATO:**
   - Mantén EXACTAMENTE la estructura: encabezados, mayúsculas/minúsculas, viñetas, numeración, sangrías, espacios en blanco.
   - Preserva todos los signos de puntuación, dos puntos, guiones, etc.
   - Mantén la jerarquía y organización visual.

2. **ELIMINAR DATOS ESPECÍFICOS:**
   - Reemplaza nombres de pacientes con: [Nombre del paciente]
   - Reemplaza edades con: [Edad]
   - Reemplaza fechas con: [Fecha]
   - Reemplaza números de documento con: [Documento]
   - Reemplaza síntomas específicos con: [Describir síntoma]
   - Reemplaza medicamentos con: [Medicamento]
   - Reemplaza diagnósticos con: [Diagnóstico]
   - Reemplaza valores de laboratorio con: [Valor]
   - Reemplaza signos vitales con: [Valor]

3. **MANTENER ELEMENTOS ESTRUCTURALES:**
   - Todos los encabezados deben permanecer idénticos
   - Todas las etiquetas y campos deben mantenerse
   - Los formatos de lista (viñetas, números) deben preservarse
   - Los espacios y saltos de línea deben mantenerse

4. **EJEMPLO DE TRANSFORMACIÓN:**
   - "Paciente: Juan Pérez" → "Paciente: [Nombre del paciente]"
   - "Edad: 45 años" → "Edad: [Edad] años"
   - "Presenta cefalea intensa" → "Presenta [Describir síntoma]"
   - "Paracetamol 500mg" → "[Medicamento] [Dosis]"

5. **RESPUESTA:**
   - Responde SOLO con el formato extraído
   - No agregues comentarios ni explicaciones
   - Mantén exactamente la misma estructura visual

El resultado debe ser una plantilla en blanco que preserve la estructura pero que pueda ser llenada con datos de cualquier paciente.`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL_TEXT,
      messages: [
        {
          role: "system",
          content: "Eres un asistente médico experto en análisis de estructuras de documentos clínicos. Tu especialidad es extraer formatos y estructuras de plantillas médicas manteniendo la organización visual exacta pero eliminando datos específicos del paciente."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Muy baja para consistencia máxima
      max_tokens: 2000,
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
    temperatureConfig: TEMPERATURE_CONFIG,
    tokenLimits: TOKEN_LIMITS,
  };
}; 