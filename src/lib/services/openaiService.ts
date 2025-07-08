import OpenAI from 'openai';
import { OPENAI_MODEL_TEXT } from '../constants';
import { 
  GroundingMetadata, 
  ScaleSearchResult, 
  GeneratedScaleResult, 
  ScaleGenerationRequest, 
  ClinicalScale,
  ClinicalAnalysisResult,
  EvidenceConsultationRequest,
  EvidenceSearchResult,
  ClinicalFinding,
  ClinicalRecommendation
} from '../../types';

// ✅ Para Next.js usamos process.env
const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!API_KEY) {
  console.error("❌ NEXT_PUBLIC_OPENAI_API_KEY no está configurada. Por favor verifica tu archivo .env");
  console.error("La aplicación podría no funcionar correctamente sin esta clave.");
}

// Inicializar OpenAI client
const openai = new OpenAI({
  apiKey: API_KEY || '',
  dangerouslyAllowBrowser: true // Permitir uso en el navegador (Next.js)
});

export const generateNoteFromTemplate = async (
  specialtyName: string,
  templateContent: string,
  patientInfo: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  if (!API_KEY) throw new Error("API key not configured for OpenAI.");
  
  const prompt = `Contexto: Eres un asistente experto en la redacción de notas médicas altamente precisas y profesionales para la especialidad de ${specialtyName}.
Tu tarea principal es completar la siguiente plantilla de nota médica utilizando la información del paciente proporcionada.

Especialidad: ${specialtyName}
Información del paciente (transcripción o datos ingresados): "${patientInfo}"

Plantilla a completar:
---
${templateContent}
---

Instrucciones Críticas para la Generación de la Nota:
1.  **Coherencia y Terminología Médica:**
    *   El contenido generado debe ser lógicamente coherente y reflejar un razonamiento clínico sólido.
    *   Utiliza terminología médica precisa, formal y estandarizada, apropiada para la especialidad de ${specialtyName}.
    *   Evita la ambigüedad y asegúrate de que la información sea clara y concisa.
2.  **Adherencia Estricta al Formato de la Plantilla (Tipografía/Estilo de Texto):**
    *   Debes replicar EXACTAMENTE la estructura, los encabezados, el uso de mayúsculas/minúsculas, la puntuación y cualquier otro elemento de formato presente en la plantilla original.
    *   Si un encabezado en la plantilla está en MAYÚSCULAS (ej. "ANTECEDENTES:"), tu respuesta DEBE mantener ese encabezado en MAYÚSCULAS.
    *   Si la plantilla utiliza viñetas, guiones, numeración o sangrías específicas, tu respuesta DEBE seguir el mismo estilo.
    *   Considera esto como si estuvieras "calcando" el estilo de la plantilla mientras llenas los campos. La "tipografía" o "caligrafía" se refiere a esta fidelidad visual y estructural.
3.  **Contenido y Profesionalismo:**
    *   Sé conciso pero completo. No omitas información relevante si está disponible.
    *   Si alguna sección de la plantilla no es applicable o no hay información proporcionada para ella en la "Información del paciente", indícalo de forma profesional (ej. "No refiere", "Sin hallazgos patológicos", "No aplica", "Información no disponible"). No dejes campos completamente vacíos sin una justificación implícita o explícita.
    *   La nota debe seguir las mejores prácticas clínicas, idealmente adaptadas al contexto de Colombia si es relevante.
4.  **Respuesta Final:**
    *   Responde ÚNICAMENTE con el contenido de la nota médica completada. No incluyas introducciones, saludos, comentarios adicionales ni la frase "Aquí está la nota completada:" o similares. Tu respuesta debe ser directamente la nota.

Ejemplo de fidelidad de formato:
Si la plantilla dice:
   "DIAGNÓSTICO PRINCIPAL:
   - [Detallar aquí]"
Y la información del paciente sugiere "Cefalea tensional".
Tu respuesta para esa sección DEBE SER:
   "DIAGNÓSTICO PRINCIPAL:
   - Cefalea tensional"
(Manteniendo las mayúsculas del encabezado y el formato de viñeta).`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL_TEXT,
      messages: [
        {
          role: "system",
          content: "Eres un asistente médico experto especializado en generar notas clínicas precisas y profesionales. Sigues estrictamente el formato de las plantillas proporcionadas."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Baja temperatura para respuestas más consistentes y precisas
      max_tokens: 2000,
      top_p: 0.9
    });

    const generatedText = response.choices[0]?.message?.content || '';
    return { 
      text: generatedText, 
      groundingMetadata: undefined // OpenAI no proporciona grounding metadata como Gemini
    };
  } catch (error) {
    console.error('Error generating note from template:', error);
    throw new Error(`Error al generar nota con IA: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateAISuggestions = async (
  clinicalInput: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  if (!API_KEY) throw new Error("API key not configured for OpenAI.");

  const prompt = `Contexto: Eres un asistente médico experto capaz de analizar información de pacientes y ofrecer ideas y recomendaciones. La IA está conectada con información actualizada y se esfuerza por basar las sugerencias en conocimiento científico.
Tarea: Basado en la siguiente información clínica proporcionada por el usuario, genera un análisis que incluya posibles consideraciones, recomendaciones, sugerencias de próximos pasos o puntos clave a destacar. No te limites a una estructura de nota fija. No se deben ofrecer recomendaciones sin una base de evidencia o conocimiento establecido.
Información proporcionada: "${clinicalInput}"

Instrucciones adicionales:
- Sé claro y directo.
- Enfócate en ofrecer valor adicional más allá de una simple reestructuración de la información.
- Puedes sugerir preguntas adicionales que el médico podría hacer, o áreas que podrían requerir más investigación.
- Si la pregunta parece referirse a eventos muy recientes o información que podría requerir datos actualizados, menciona que se debe verificar con fuentes médicas actualizadas.
- Evita usar formato Markdown, negrillas ** ** o viñetas *; responde en texto plano con oraciones completas.
- Responde de forma útil y profesional.`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL_TEXT,
      messages: [
        {
          role: "system",
          content: "Eres un asistente médico experto que proporciona análisis clínico y sugerencias basadas en evidencia científica actualizada."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5, // Temperatura moderada para balance entre creatividad y precisión
      max_tokens: 1500,
      top_p: 0.9
    });

    const generatedText = response.choices[0]?.message?.content || '';
    return { 
      text: generatedText, 
      groundingMetadata: undefined // OpenAI no proporciona grounding metadata
    };
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    throw new Error(`Error al generar sugerencias con IA: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateMedicalScale = async (
  clinicalInput: string,
  scaleName: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  if (!API_KEY) throw new Error("API key not configured for OpenAI.");

  const prompt = `Contexto: Eres un asistente médico experto en la aplicación de escalas clínicas estandarizadas.
Tarea: Basado en la siguiente "Información Clínica", evalúa y completa la escala "${scaleName}". Debes presentar el resultado en un formato claro y profesional, listo para ser copiado y pegado en una historia clínica.

Información Clínica Proporcionada:
"${clinicalInput}"

Escala a Aplicar: ${scaleName}

Instrucciones para la Generación:
1.  **Analiza la Información:** Lee detenidamente la información clínica para encontrar datos que correspondan a los ítems de la escala ${scaleName}.
2.  **Puntúa cada Ítem:** Asigna un puntaje a cada ítem de la escala basándote en la información. Si la información para un ítem es insuficiente, usa tu juicio clínico para inferir o indica "No se puede determinar". No inventes datos que no tengan base en el texto.
3.  **Calcula el Puntaje Total:** Suma los puntajes de los ítems para obtener el resultado total de la escala.
4.  **Proporciona una Interpretación:** Basado en el puntaje total, ofrece una interpretación clínica estandarizada (ej. "Riesgo bajo", "Síntomas depresivos moderados", "Ansiedad severa").
5.  **Formato de Respuesta:** La respuesta debe ser ÚNICAMENTE el resultado de la escala. No incluyas saludos ni comentarios introductorios. La estructura debe ser:
    *   Un encabezado claro (ej. "Evaluación con Escala PHQ-9").
    *   Una lista de cada ítem de la escala con su puntaje correspondiente.
    *   El "Puntaje Total".
    *   Una sección de "Interpretación Clínica".

Ejemplo de formato de respuesta deseado (para PHQ-9):
---
**Evaluación con Escala PHQ-9**

- Poco interés o placer en hacer las cosas: [Puntaje]
- Sentirse desanimado/a, deprimido/a o sin esperanzas: [Puntaje]
- Problemas para dormir o dormir demasiado: [Puntaje]
- Sentirse cansado/a o con poca energía: [Puntaje]
- Poco apetito o comer en exceso: [Puntaje]
- Sentirse mal consigo mismo/a o como un fracaso: [Puntaje]
- Dificultad para concentrarse: [Puntaje]
- Moverse o hablar tan lento que otros lo han notado, o ser muy inquieto/a: [Puntaje]
- Pensamientos de que estaría mejor muerto/a o de hacerse daño: [Puntaje]

**Puntaje Total:** [Suma de los puntajes]

**Interpretación Clínica:** [Ej: Síntomas depresivos moderadamente severos. Se recomienda evaluación de salud mental.]
---`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL_TEXT,
      messages: [
        {
          role: "system",
          content: "Eres un asistente médico experto especializado en la aplicación y evaluación de escalas clínicas estandarizadas. Proporcionas evaluaciones precisas y profesionales."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2, // Temperatura muy baja para máxima precisión en escalas
      max_tokens: 1500,
      top_p: 0.8
    });

    const generatedText = response.choices[0]?.message?.content || '';
    return { 
      text: generatedText, 
      groundingMetadata: undefined // OpenAI no proporciona grounding metadata
    };
  } catch (error) {
    console.error('Error generating medical scale:', error);
    throw new Error(`Error al generar la escala con IA: ${error instanceof Error ? error.message : String(error)}`);
  }
}; 

// Agrego función para generar plantilla desde una nota clínica con IA

export const generateTemplateFromClinicalNote = async (
  clinicalNote: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  if (!API_KEY) throw new Error("API key not configured for OpenAI.");

  const prompt = `Eres un asistente experto en redacción de notas clínicas. Tu tarea es transformar la nota clínica que recibirás a continuación en una PLANTILLA.

Instrucciones detalladas:
1. Sustituye toda información clínica específica del paciente (nombres, fechas, edades, resultados numéricos, dosis, valores de laboratorio, signos vitales, etc.) por marcadores en MAYÚSCULAS entre corchetes, por ejemplo: [NOMBRE PACIENTE], [EDAD], [PRESIÓN ARTERIAL]. No inventes marcadores que no correspondan al contenido.
2. Conserva exactamente la estructura, encabezados, sangrías, puntuación, mayúsculas/minúsculas y estilo tipográfico del texto original.
3. No alteres información genérica que sea válida para la patología (ej. "examen físico normal" o formularios predefinidos).
4. Corrige discretamente errores ortográficos o de coherencia que encuentres.
5. Si detectas que falta información clave dentro del contexto, coloca el marcador [FALTA DATO] en el lugar correspondiente.
6. Tu respuesta debe ser ÚNICAMENTE la plantilla resultante, lista para copiar y pegar. No añadas comentarios, títulos ni explicaciones adicionales.

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
    console.error('Error generating template from clinical note:', error);
    throw new Error(`Error al generar plantilla con IA: ${error instanceof Error ? error.message : String(error)}`);
  }
}; 

export const updateClinicalNote = async (
  originalNote: string,
  newInformation: string
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  if (!API_KEY) throw new Error("API key not configured for OpenAI.");

  const prompt = `Eres un asistente médico experto especializado en actualizar notas clínicas existentes con nueva información. Tu tarea es integrar de forma inteligente la nueva información en la nota clínica original manteniendo coherencia, estilo médico profesional y estructura adecuada.

**NOTA CLÍNICA ORIGINAL:**
---
${originalNote}
---

**NUEVA INFORMACIÓN A INTEGRAR:**
---
${newInformation}
---

**INSTRUCCIONES CRÍTICAS:**

1. **Análisis e Integración Inteligente:**
   - Analiza dónde debe ir la nueva información dentro de la estructura de la nota original
   - Identifica la sección más apropiada (evolución, tratamiento, diagnóstico, plan, etc.)
   - Integra la información de forma natural sin alterar el resto del contenido

2. **Preservación del Contenido Original:**
   - Conserva EXACTAMENTE todo el contenido original que no requiere modificación
   - Mantén la estructura, formato, encabezados y estilo de la nota original
   - No elimines información previa a menos que sea contradictoria con la nueva información

3. **Coherencia y Estilo Médico:**
   - Mantén el estilo de redacción médica profesional de la nota original
   - Asegura coherencia temporal y clínica en la información
   - Usa terminología médica apropiada y consistente

4. **Manejo de Contradicciones:**
   - Si la nueva información contradice algo en la nota original, actualiza solo lo necesario
   - Mantén un registro cronológico lógico si es aplicable
   - Preserva la coherencia clínica general

5. **Formato de Respuesta:**
   - Responde ÚNICAMENTE con la nota clínica completa y actualizada
   - No incluyas comentarios, explicaciones o texto adicional
   - La respuesta debe ser directamente la nota médica lista para usar

**EJEMPLO DE INTEGRACIÓN:**
Si la nota original tiene una sección "EVOLUCIÓN:" y la nueva información es sobre el estado actual del paciente, integra esa información en esa sección manteniendo el formato y estilo existente.`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL_TEXT,
      messages: [
        {
          role: "system",
          content: "Eres un asistente médico experto especializado en actualizar notas clínicas de forma inteligente y precisa. Integras nueva información preservando el contenido original y manteniendo coherencia médica profesional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2, // Temperatura muy baja para máxima precisión y conservación
      max_tokens: 2500,
      top_p: 0.9
    });

    const generatedText = response.choices[0]?.message?.content || '';
    return { 
      text: generatedText, 
      groundingMetadata: undefined
    };
  } catch (error) {
    console.error('Error updating clinical note:', error);
    throw new Error(`Error al actualizar nota clínica con IA: ${error instanceof Error ? error.message : String(error)}`);
  }
}; 

// ===== GENERADOR INTELIGENTE DE ESCALAS CLÍNICAS =====

export const searchClinicalScales = async (
  searchQuery: string
): Promise<ScaleSearchResult[]> => {
  if (!API_KEY) throw new Error("API key not configured for OpenAI.");

  const prompt = `Eres un experto en escalas clínicas y herramientas de evaluación médica. Tu tarea es buscar escalas clínicas reales y estandarizadas basándote en la consulta del usuario.

CONSULTA DE BÚSQUEDA: "${searchQuery}"

INSTRUCCIONES:
1. Identifica las escalas clínicas más relevantes y reconocidas científicamente que coincidan con la consulta
2. Prioriza escalas ampliamente validadas y utilizadas en la práctica clínica
3. Incluye escalas de diferentes categorías cuando sea apropiado
4. Responde en formato JSON VÁLIDO con un array de objetos

FORMATO DE RESPUESTA REQUERIDO (JSON válido):
{
  "scales": [
    {
      "name": "Nombre exacto de la escala",
      "description": "Descripción clara y concisa de qué evalúa la escala",
      "category": "Categoría médica (ej: Psiquiatría, Neurología, Cuidados intensivos)",
      "confidence": 0.95,
      "isStandardized": true
    }
  ]
}

EJEMPLOS DE CATEGORÍAS:
- Psiquiatría y Salud Mental
- Neurología
- Cuidados Intensivos
- Cardiología
- Dolor
- Calidad de Vida
- Funcionalidad
- Geriatría
- Pediatría

CRITERIOS DE INCLUSIÓN:
- Solo escalas clínicas reconocidas y validadas
- Con evidencia científica sólida
- Utilizadas en práctica clínica actual
- Confidence entre 0.7 y 1.0

Máximo 8 resultados, ordenados por relevancia.`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL_TEXT,
      messages: [
        {
          role: "system",
          content: "Eres un experto en escalas clínicas que proporciona información precisa sobre herramientas de evaluación médica estandarizadas. Respondes siempre en formato JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1500,
      top_p: 0.8
    });

    const responseText = response.choices[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(responseText);
      return parsed.scales || [];
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      // Fallback: intentar extraer información básica
      return [{
        name: searchQuery,
        description: `Escala clínica relacionada con: ${searchQuery}`,
        category: "General",
        confidence: 0.7,
        isStandardized: true
      }];
    }
  } catch (error) {
    console.error('Error searching clinical scales:', error);
    throw new Error(`Error al buscar escalas clínicas: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateIntelligentClinicalScale = async (
  request: ScaleGenerationRequest
): Promise<GeneratedScaleResult> => {
  if (!API_KEY) throw new Error("API key not configured for OpenAI.");

  const prompt = `Eres un experto en escalas clínicas y evaluación médica. Tu tarea es generar una escala clínica completa, precisa y funcional basándote en la información proporcionada.

ESCALA SOLICITADA: "${request.scaleName}"
DATOS CLÍNICOS DISPONIBLES:
---
${request.clinicalData}
---

${request.existingNoteContent ? `CONTENIDO DE NOTA EXISTENTE:
---
${request.existingNoteContent}
---` : ''}

INSTRUCCIONES PARA LA GENERACIÓN:

1. **ESTRUCTURA DE LA ESCALA:**
   - Genera una representación completa y precisa de la escala "${request.scaleName}"
   - Incluye todos los ítems/criterios estándar de la escala
   - Mantén la estructura y puntaje oficial de la escala

2. **ANÁLISIS DE DATOS:**
   - Analiza los datos clínicos proporcionados
   - Identifica qué ítems de la escala pueden ser completados con la información disponible
   - Señala qué información falta para completar la escala

3. **AUTOCOMPLETADO INTELIGENTE:**
   - Completa automáticamente los ítems que tengan suficiente información
   - Usa juicio clínico conservador para inferencias razonables
   - Marca claramente los ítems autocompletados

4. **CÁLCULO Y INTERPRETACIÓN:**
   - Calcula el puntaje total si es posible
   - Proporciona la interpretación clínica estándar
   - Incluye recomendaciones basadas en el resultado

FORMATO DE RESPUESTA REQUERIDO (JSON válido):
{
  "scale": {
    "id": "id-único",
    "name": "Nombre exacto de la escala",
    "description": "Descripción de qué evalúa",
    "category": "Categoría médica",
    "items": [
      {
        "id": "item-1",
        "text": "Texto del ítem/criterio",
        "type": "select|number|checkbox",
        "options": ["opción1", "opción2"] // si apply,
        "range": {"min": 0, "max": 4} // si aplica,
        "value": "valor asignado o null",
        "required": true
      }
    ],
    "scoring": [
      {
        "range": {"min": 0, "max": 4},
        "level": "Leve",
        "description": "Interpretación del rango",
        "recommendations": ["recomendación1"]
      }
    ]
  },
  "autocompletedItems": ["IDs de ítems autocompletados"],
  "missingFields": ["campos que faltan por diligenciar"],
  "totalScore": 15, // si se puede calcular
  "interpretation": "Interpretación clínica del resultado",
  "confidence": 0.85
}

ESCALAS COMUNES DE REFERENCIA:
- Glasgow Coma Scale (GCS): 3-15 puntos
- PHQ-9: 0-27 puntos para depresión
- GAD-7: 0-21 puntos para ansiedad
- APACHE II: 0-71 puntos para mortalidad en UCI
- NIHSS: 0-42 puntos para ACV
- Escala de Norton: 5-20 puntos para úlceras por presión

Asegúrate de que la respuesta sea un JSON válido y completo.`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL_TEXT,
      messages: [
        {
          role: "system",
          content: "Eres un experto en escalas clínicas que genera evaluaciones precisas y estructuradas. Respondes siempre en formato JSON válido con información médica precisa."
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
      
      // Validar estructura mínima
      if (!parsed.scale || !parsed.scale.name) {
        throw new Error('Respuesta de IA inválida: falta estructura de escala');
      }

      return {
        scale: parsed.scale,
        autocompletedItems: parsed.autocompletedItems || [],
        missingFields: parsed.missingFields || [],
        totalScore: parsed.totalScore,
        interpretation: parsed.interpretation,
        confidence: parsed.confidence || 0.8
      };
    } catch (jsonError) {
      console.error('Error parsing scale generation response:', jsonError);
      throw new Error('La IA no pudo generar una escala válida. Intenta con más información clínica.');
    }
  } catch (error) {
    console.error('Error generating intelligent clinical scale:', error);
    throw new Error(`Error al generar escala clínica: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const formatScaleForNote = async (
  scaleResult: GeneratedScaleResult,
  includeInterpretation: boolean = true
): Promise<string> => {
  const { scale, totalScore, interpretation } = scaleResult;
  
  let formattedScale = `**EVALUACIÓN CON ${scale.name.toUpperCase()}**\n\n`;
  
  // Agregar descripción si existe
  if (scale.description) {
    formattedScale += `${scale.description}\n\n`;
  }
  
  // Agregar ítems con valores
  scale.items.forEach((item, index) => {
    const itemValue = item.value !== null && item.value !== undefined ? item.value : '[PENDIENTE]';
    formattedScale += `${index + 1}. ${item.text}: ${itemValue}\n`;
  });
  
  // Agregar puntaje total si existe
  if (totalScore !== undefined) {
    formattedScale += `\n**PUNTAJE TOTAL:** ${totalScore}\n`;
  }
  
  // Agregar interpretación si se solicita
  if (includeInterpretation && interpretation) {
    formattedScale += `\n**INTERPRETACIÓN CLÍNICA:**\n${interpretation}\n`;
  }
  
  // Agregar campos faltantes si existen
  if (scaleResult.missingFields.length > 0) {
    formattedScale += `\n**CAMPOS PENDIENTES POR EVALUAR:**\n`;
    scaleResult.missingFields.forEach(field => {
      formattedScale += `- ${field}\n`;
    });
  }
  
  return formattedScale;
};

// ===== CONSULTA CLÍNICA PARA IA BASADA EN EVIDENCIA =====

export const analyzeClinicalContent = async (
  request: EvidenceConsultationRequest
): Promise<ClinicalAnalysisResult> => {
  if (!API_KEY) throw new Error("API key not configured for OpenAI.");

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
    console.error('Error analyzing clinical content:', error);
    throw new Error(`Error al analizar contenido clínico: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const searchEvidenceBasedRecommendations = async (
  query: string,
  clinicalContext?: string
): Promise<EvidenceSearchResult> => {
  if (!API_KEY) throw new Error("API key not configured for OpenAI.");

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
    console.error('Error searching evidence-based recommendations:', error);
    throw new Error(`Error al buscar recomendaciones basadas en evidencia: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateEvidenceBasedConsultation = async (
  clinicalContent: string,
  specificQuestions?: string[]
): Promise<{ analysis: ClinicalAnalysisResult; evidenceSearch?: EvidenceSearchResult }> => {
  if (!API_KEY) throw new Error("API key not configured for OpenAI.");

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
    console.error('Error generating evidence-based consultation:', error);
    throw new Error(`Error al generar consulta basada en evidencia: ${error instanceof Error ? error.message : String(error)}`);
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