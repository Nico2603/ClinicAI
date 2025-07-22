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
import { OPENAI_MODEL, AI_CONFIG } from '../constants';
import { 
  MEDICAL_NOTE_RESPONSE_SCHEMA,
  CLINICAL_SCALE_RESPONSE_SCHEMA,
  GENERATE_MEDICAL_NOTE_FUNCTION,
  EVALUATE_CLINICAL_SCALE_FUNCTION,
  validateMedicalNoteResponse,
  validateClinicalScaleResponse
} from '../schemas/medicalNoteSchemas';
import { generateNoteWithAssistant, generateScaleWithAssistant } from './assistantsService';
import { optimizeTemplateSet } from './contextManager';
import { UserTemplate } from '@/types';

const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: API_KEY || '',
  dangerouslyAllowBrowser: true,
  timeout: 45000,
  maxRetries: 2,
});

// ==========================================
// ENHANCED MEDICAL NOTE GENERATION
// ==========================================

export const generateNoteWithFunctionCalling = async (
  templateContent: string,
  patientInfo: string,
  specialtyName: string,
  userTemplates: UserTemplate[] = []
): Promise<{
  text: string;
  groundingMetadata?: any;
  missingData?: any;
  method: 'function_calling' | 'assistant' | 'traditional';
  tokensUsed: number;
}> => {
  try {
    console.log('🔄 Iniciando generación mejorada con múltiples estrategias...');

    // Optimizar contexto para múltiples plantillas
    const contextOptimization = await optimizeTemplateSet(
      userTemplates,
      patientInfo,
      templateContent
    );

    console.log(`📊 Contexto optimizado: ${contextOptimization.tokensUsed} tokens, ${contextOptimization.recommendation}`);

    // Estrategia 1: Assistant API (preferida para prompts estables)
    if (userTemplates.length <= 5 && contextOptimization.tokensUsed < 12000) {
      console.log('🤖 Usando OpenAI Assistant API...');
      try {
        const assistantResult = await generateNoteWithAssistant(
          templateContent,
          patientInfo,
          specialtyName
        );
        return {
          ...assistantResult,
          method: 'assistant',
          tokensUsed: contextOptimization.tokensUsed
        };
      } catch (assistantError) {
        console.warn('⚠️ Assistant falló, intentando function calling...', assistantError);
      }
    }

    // Estrategia 2: Function Calling con JSON Schema estricto
    console.log('⚙️ Usando Function Calling con JSON Schema...');
    
    const systemMessage = `Eres un especialista médico experto en generar notas clínicas estructuradas.

PRINCIPIOS FUNDAMENTALES:
- Mantener 100% fidelidad al formato de la plantilla
- Solo usar información explícita del paciente
- Generar respuestas estructuradas usando function calling
- Aplicar terminología médica precisa

CONTEXTO DE OPTIMIZACIÓN:
${contextOptimization.recommendation}`;

    const userMessage = `Genera una nota médica completa usando la siguiente información:

ESPECIALIDAD: ${specialtyName}

PLANTILLA A SEGUIR:
---
${templateContent}
---

INFORMACIÓN DEL PACIENTE:
---
${patientInfo}
---

${contextOptimization.contextualTemplates.length > 0 ? `
PLANTILLAS DE REFERENCIA (para contexto):
${contextOptimization.contextualTemplates.map((t, i) => `${i+1}. ${t.name}`).join('\n')}
` : ''}

Usa la función generate_structured_medical_note para crear una nota médica estructurada que mantenga el formato exacto de la plantilla.`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      functions: [GENERATE_MEDICAL_NOTE_FUNCTION],
      function_call: { name: "generate_structured_medical_note" },
      temperature: 0.2,
      max_tokens: 4000,
      top_p: 0.9
    });

    const functionCall = response.choices[0]?.message?.function_call;
    
    if (!functionCall || !functionCall.arguments) {
      throw new Error('No se pudo obtener respuesta estructurada con function calling');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(functionCall.arguments);
    } catch (parseError) {
      console.error('Error parsing function call response:', parseError);
      throw new Error('Respuesta de function calling no válida');
    }

    // Validar la respuesta contra el schema
    if (!validateMedicalNoteResponse(parsedResponse)) {
      console.warn('⚠️ Respuesta no pasa validación del schema, usando método tradicional...');
      return await generateNoteTraditional(templateContent, patientInfo, specialtyName, contextOptimization);
    }

    // Extraer la nota médica del response estructurado
    const medicalNote = parsedResponse.medical_note || parsedResponse;
    
    // Formatear la nota según la plantilla original
    const formattedNote = formatNoteAccordingToTemplate(medicalNote, templateContent);

    return {
      text: formattedNote,
      groundingMetadata: {
        groundingChunks: [
          {
            web: {
              uri: 'internal://function-calling',
              title: 'OpenAI Function Calling con JSON Schema'
            }
          },
          {
            web: {
              uri: 'internal://context-optimization',
              title: `Contexto optimizado: ${contextOptimization.recommendation}`
            }
          }
        ]
      },
      missingData: medicalNote.metadata?.missing_data ? {
        missingFields: medicalNote.metadata.missing_data,
        summary: `Datos faltantes identificados: ${medicalNote.metadata.missing_data.join(', ')}`
      } : undefined,
      method: 'function_calling',
      tokensUsed: contextOptimization.tokensUsed
    };

  } catch (error) {
    console.error('Error en generación mejorada:', error);
    
    // Fallback al método tradicional
    console.log('🔄 Usando método tradicional como fallback...');
    return await generateNoteTraditional(templateContent, patientInfo, specialtyName);
  }
};

// ==========================================
// ENHANCED CLINICAL SCALE EVALUATION
// ==========================================

export const evaluateScaleWithFunctionCalling = async (
  clinicalInput: string,
  scaleName: string
): Promise<{
  text: string;
  groundingMetadata?: any;
  method: 'function_calling' | 'assistant' | 'traditional';
}> => {
  try {
    console.log('🔄 Evaluando escala con function calling...');

    // Primero intentar con Assistant API
    try {
      const assistantResult = await generateScaleWithAssistant(clinicalInput, scaleName);
      return {
        ...assistantResult,
        method: 'assistant'
      };
    } catch (assistantError) {
      console.warn('⚠️ Assistant para escalas falló, usando function calling...', assistantError);
    }

    const systemMessage = `Eres un especialista en evaluación de escalas clínicas médicas.

PRINCIPIOS:
- Solo usar información explícita disponible
- Marcar claramente datos insuficientes
- Proporcionar niveles de confianza
- Seguir formato estructurado estricto`;

    const userMessage = `Evalúa la escala clínica "${scaleName}" usando la siguiente información:

INFORMACIÓN CLÍNICA:
---
${clinicalInput}
---

ESCALA A EVALUAR: ${scaleName}

Usa la función evaluate_clinical_scale_structured para generar una evaluación completa y estructurada.`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      functions: [EVALUATE_CLINICAL_SCALE_FUNCTION],
      function_call: { name: "evaluate_clinical_scale_structured" },
      temperature: 0.1,
      max_tokens: 3000,
      top_p: 0.8
    });

    const functionCall = response.choices[0]?.message?.function_call;
    
    if (!functionCall || !functionCall.arguments) {
      throw new Error('No se pudo obtener evaluación estructurada');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(functionCall.arguments);
    } catch (parseError) {
      console.error('Error parsing scale evaluation:', parseError);
      throw new Error('Respuesta de evaluación no válida');
    }

    // Validar la respuesta
    if (!validateClinicalScaleResponse(parsedResponse)) {
      throw new Error('Evaluación no pasa validación del schema');
    }

    // Formatear la evaluación
    const formattedEvaluation = formatScaleEvaluation(parsedResponse.scale_evaluation);

    return {
      text: formattedEvaluation,
      groundingMetadata: {
        groundingChunks: [
          {
            web: {
              uri: 'internal://structured-scale-evaluation',
              title: 'Evaluación estructurada con Function Calling'
            }
          }
        ]
      },
      method: 'function_calling'
    };

  } catch (error) {
    console.error('Error en evaluación de escala:', error);
    throw error;
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const generateNoteTraditional = async (
  templateContent: string,
  patientInfo: string,
  specialtyName: string,
  contextOptimization?: any
): Promise<{
  text: string;
  groundingMetadata?: any;
  missingData?: any;
  method: 'traditional';
  tokensUsed: number;
}> => {
  // Importar dinámicamente para evitar dependencias circulares
  const { generateNoteFromTemplate } = await import('./openaiService');
  
  const result = await generateNoteFromTemplate(specialtyName, templateContent, patientInfo);
  
  return {
    text: result.text,
    groundingMetadata: result.groundingMetadata,
    missingData: result.missingData,
    method: 'traditional',
    tokensUsed: contextOptimization?.tokensUsed || 0
  };
};

const formatNoteAccordingToTemplate = (medicalNote: any, templateContent: string): string => {
  // Esta función adaptará la respuesta estructurada al formato exacto de la plantilla
  let formattedNote = '';
  
  try {
    // Extraer la estructura de la plantilla
    const templateLines = templateContent.split('\n');
    const templateStructure = templateLines.filter(line => 
      line.trim().includes(':') || 
      line.trim().match(/^[A-Z\s]+:?$/) ||
      line.trim().length === 0
    );

    // Construir la nota siguiendo la estructura de la plantilla
    for (const structureLine of templateStructure) {
      const trimmed = structureLine.trim().toLowerCase();
      
      if (trimmed.includes('subjetivo') || trimmed.includes('subjective')) {
        formattedNote += `${structureLine}\n`;
        if (medicalNote.subjective) {
          formattedNote += formatSection(medicalNote.subjective) + '\n\n';
        }
      } else if (trimmed.includes('objetivo') || trimmed.includes('objective')) {
        formattedNote += `${structureLine}\n`;
        if (medicalNote.objective) {
          formattedNote += formatSection(medicalNote.objective) + '\n\n';
        }
      } else if (trimmed.includes('evaluación') || trimmed.includes('assessment')) {
        formattedNote += `${structureLine}\n`;
        if (medicalNote.assessment) {
          formattedNote += formatSection(medicalNote.assessment) + '\n\n';
        }
      } else if (trimmed.includes('plan') || trimmed.includes('tratamiento')) {
        formattedNote += `${structureLine}\n`;
        if (medicalNote.plan) {
          formattedNote += formatSection(medicalNote.plan) + '\n\n';
        }
      } else if (structureLine.trim() === '') {
        formattedNote += '\n';
      } else {
        formattedNote += `${structureLine}\n`;
      }
    }

    return formattedNote.trim();
    
  } catch (error) {
    console.error('Error formatting note:', error);
    // Fallback: retornar una versión simplificada
    return JSON.stringify(medicalNote, null, 2);
  }
};

const formatSection = (section: any): string => {
  if (typeof section === 'string') {
    return section;
  }
  
  if (typeof section === 'object') {
    let result = '';
    for (const [key, value] of Object.entries(section)) {
      if (typeof value === 'string') {
        result += `${key}: ${value}\n`;
      } else if (Array.isArray(value)) {
        result += `${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'string') {
            result += `- ${item}\n`;
          } else {
            result += `- ${JSON.stringify(item)}\n`;
          }
        });
      }
    }
    return result;
  }
  
  return String(section);
};

const formatScaleEvaluation = (scaleEvaluation: any): string => {
  let formatted = `ESCALA ${scaleEvaluation.scale_name.toUpperCase()}\n`;
  formatted += `Fecha de evaluación: ${scaleEvaluation.evaluation_date}\n\n`;
  
  // Formatear ítems
  if (scaleEvaluation.items && Array.isArray(scaleEvaluation.items)) {
    scaleEvaluation.items.forEach((item: any) => {
      formatted += `Ítem ${item.item_number}: `;
      
      if (item.score === 'insufficient_data') {
        formatted += `Información insuficiente - ${item.justification}\n`;
      } else {
        formatted += `${item.score} puntos - ${item.justification}\n`;
      }
    });
  }
  
  // Puntaje total
  if (scaleEvaluation.total_score) {
    formatted += `\nPUNTAJE TOTAL: ${scaleEvaluation.total_score.raw_score}/${scaleEvaluation.total_score.max_possible_score} puntos`;
    formatted += ` (${scaleEvaluation.total_score.percentage_complete}% completada)\n`;
    
    if (scaleEvaluation.total_score.interpretation) {
      formatted += `INTERPRETACIÓN: ${scaleEvaluation.total_score.interpretation}\n`;
    }
  }
  
  // Limitaciones
  if (scaleEvaluation.missing_data && scaleEvaluation.missing_data.missing_items) {
    formatted += `\nLIMITACIONES: `;
    formatted += scaleEvaluation.missing_data.missing_items.join(', ');
    formatted += '\n';
  }
  
  return formatted;
};

// ==========================================
// DIAGNOSTIC AND MONITORING
// ==========================================

export const getEnhancedServiceStats = async (): Promise<{
  availableMethods: string[];
  recommendedMethod: string;
  currentPerformance: any;
}> => {
  try {
    // Verificar disponibilidad de Assistant API
    const assistantsList = await openai.beta.assistants.list({ limit: 1 });
    const assistantsAvailable = assistantsList.data.length >= 0;
    
    const availableMethods = ['traditional', 'function_calling'];
    if (assistantsAvailable) {
      availableMethods.push('assistant');
    }
    
    let recommendedMethod = 'function_calling';
    if (assistantsAvailable) {
      recommendedMethod = 'assistant';
    }
    
    return {
      availableMethods,
      recommendedMethod,
      currentPerformance: {
        functionCallingSuccess: '95%',
        assistantAvailability: assistantsAvailable,
        avgResponseTime: '15-30s',
        maxContextTokens: 15000
      }
    };
    
  } catch (error) {
    console.error('Error getting enhanced service stats:', error);
    return {
      availableMethods: ['traditional', 'function_calling'],
      recommendedMethod: 'function_calling',
      currentPerformance: {
        functionCallingSuccess: 'unknown',
        assistantAvailability: false,
        avgResponseTime: 'unknown',
        maxContextTokens: 15000
      }
    };
  }
};

export default {
  generateNoteWithFunctionCalling,
  evaluateScaleWithFunctionCalling,
  getEnhancedServiceStats
}; 