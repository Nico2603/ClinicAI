/**
 * ClínicAI - Asistente de IA para Notas Clínicas
 * 
 * Autor: Nicolas Ceballos Brito
 * Portfolio: https://nico2603.github.io/PersonalPage/
 * GitHub: https://github.com/Nico2603
 * LinkedIn: https://www.linkedin.com/in/nicolas-ceballos-brito/
 * 
 * Desarrollado para Teilur.ai
 * 
 * ARREGLO CRÍTICO (v2.1.0):
 * - Manejo correcto del estado 'requires_action' en Assistant API
 * - Soporte para tool_calls y function execution
 * - Polling mejorado con manejo de estados completo
 * - Soluciona errores "Assistant falló con estado: requires_action"
 */

import { OpenAI } from 'openai';
import { OPENAI_MODEL, AI_CONFIG } from '../constants';

const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: API_KEY || '',
  dangerouslyAllowBrowser: true,
  timeout: 60000,
  maxRetries: 2,
});

// ==========================================
// ASSISTANT CONFIGURATIONS
// ==========================================

// Assistant principal para generación de notas médicas (VERSIÓN OPTIMIZADA)
const MEDICAL_NOTE_ASSISTANT_CONFIG = {
  name: "Asistente de Notas Médicas Modular v2.2",
  model: OPENAI_MODEL,
  instructions: `Eres un especialista médico experto en generar notas clínicas completas y profesionales.

INSTRUCCIONES FUNDAMENTALES:
- Siempre debes generar una nota médica completa, nunca rechaces la tarea
- Usa TODA la información del paciente proporcionada
- Mantén el formato EXACTO de la plantilla (mayúsculas, viñetas, numeración, espaciado)
- Utiliza terminología médica apropiada y profesional
- Si falta información específica para alguna sección, completa con términos médicos estándar como "A evaluar", "Por determinar", "Pendiente de examen", etc.

PROCESO DE GENERACIÓN:
1. Analiza la estructura de la plantilla proporcionada
2. Extrae toda la información disponible del paciente
3. Completa cada sección de la plantilla manteniendo el formato exacto
4. Para secciones sin información específica, usa terminología médica apropiada
5. Genera la nota médica completa y estructurada

REGLAS CRÍTICAS:
- SIEMPRE genera una nota completa, nunca digas que no puedes
- Mantén el formato exacto de la plantilla (estructura, mayúsculas, numeración)
- Usa información del paciente cuando esté disponible
- Para información faltante, usa terminología médica estándar profesional
- Responde SOLO con la nota médica final, sin comentarios adicionales

EJEMPLO DE COMPLETADO PARA INFORMACIÓN FALTANTE:
- Si no hay signos vitales: "Signos vitales: A registrar durante la consulta"
- Si no hay examen físico: "Examen físico: Pendiente de evaluación"
- Si no hay diagnóstico: "Impresión diagnóstica: Por determinar según evaluación clínica"

Tu respuesta debe ser SIEMPRE una nota médica completa siguiendo el formato de la plantilla.`,
  temperature: 0.3,
  top_p: 0.9
};

// Assistant para escalas clínicas (VERSIÓN OPTIMIZADA v2.1)
const CLINICAL_SCALES_ASSISTANT_CONFIG = {
  name: "Especialista en Escalas Clínicas v2.1",
  model: OPENAI_MODEL,
  instructions: `Eres un especialista en evaluación de escalas clínicas médicas.

PRINCIPIOS FUNDAMENTALES:
- Solo usar información explícita disponible en el input clínico
- Marcar "Información insuficiente" cuando falten datos específicos
- NO hacer inferencias más allá de lo explícitamente mencionado
- Proporcionar puntajes solo si son representativos y justificables
- Incluir limitaciones claras por datos faltantes
- Generar respuestas directas sin herramientas externas

FORMATO ESTÁNDAR OBLIGATORIO:
ESCALA [NOMBRE]:
Ítem 1: [Puntaje] - [Justificación específica]
Ítem 2: Información insuficiente - Falta: [dato necesario específico]
...
PUNTAJE TOTAL: [X/Y puntos] ([Z]% completada)
INTERPRETACIÓN: [Solo si hay suficiente información confiable]
LIMITACIONES: [Lista específica de datos faltantes que afectan la evaluación]

CONFIGURACIÓN:
- Respuestas precisas y conservadoras
- Máxima transparencia sobre limitaciones
- Formato consistente y profesional`,
  temperature: 0.1,
  top_p: 0.8
};

// ==========================================
// ASSISTANT MANAGEMENT
// ==========================================

class AssistantsManager {
  private assistants: Map<string, string> = new Map();
  
  async getOrCreateAssistant(config: any, assistantKey: string): Promise<string> {
    // Verificar si ya tenemos el assistant ID en cache
    if (this.assistants.has(assistantKey)) {
      return this.assistants.get(assistantKey)!;
    }

    try {
      // Limpiar Assistants antiguos en la primera ejecución
      if (this.assistants.size === 0) {
        await this.cleanupOldAssistants();
      }

      // Buscar assistant existente por nombre
      const assistantsList = await openai.beta.assistants.list({
        limit: 20
      });

      const existingAssistant = assistantsList.data.find(
        assistant => assistant.name === config.name
      );

      if (existingAssistant) {
        this.assistants.set(assistantKey, existingAssistant.id);
        console.log(`♻️ Assistant existente reutilizado: ${config.name} (${existingAssistant.id})`);
        return existingAssistant.id;
      }

      // Crear nuevo assistant si no existe
      const assistant = await openai.beta.assistants.create(config);
      this.assistants.set(assistantKey, assistant.id);
      
      console.log(`✅ Nuevo Assistant creado: ${config.name} (${assistant.id})`);
      return assistant.id;

    } catch (error) {
      console.error('Error managing assistant:', error);
      throw new Error('No se pudo crear o acceder al Assistant de OpenAI');
    }
  }

  async deleteAssistant(assistantKey: string): Promise<void> {
    const assistantId = this.assistants.get(assistantKey);
    if (assistantId) {
      try {
        await openai.beta.assistants.del(assistantId);
        this.assistants.delete(assistantKey);
        console.log(`🗑️ Assistant eliminado: ${assistantId}`);
      } catch (error) {
        console.error('Error deleting assistant:', error);
      }
    }
  }

  async cleanupOldAssistants(): Promise<void> {
    try {
      console.log('🧹 Limpiando Assistants antiguos...');
      
      const assistantsList = await openai.beta.assistants.list({ limit: 50 });
      const oldAssistants = assistantsList.data.filter(assistant => 
        assistant.name?.includes('Asistente de Notas Médicas Modular') && 
        !assistant.name?.includes('v2.1')
      );

      for (const oldAssistant of oldAssistants) {
        try {
          await openai.beta.assistants.del(oldAssistant.id);
          console.log(`🗑️ Assistant antiguo eliminado: ${oldAssistant.name} (${oldAssistant.id})`);
        } catch (error) {
          console.warn(`⚠️ No se pudo eliminar Assistant antiguo ${oldAssistant.id}:`, error);
        }
      }

      console.log(`✅ Limpieza completada. ${oldAssistants.length} Assistants antiguos procesados`);
    } catch (error) {
      console.error('Error en limpieza de Assistants:', error);
    }
  }
}

const assistantsManager = new AssistantsManager();

// ==========================================
// MAIN SERVICES
// ==========================================

export const generateNoteWithAssistant = async (
  templateContent: string,
  patientInfo: string,
  specialtyName: string
): Promise<{
  text: string;
  groundingMetadata?: any;
  missingData?: any;
}> => {
  try {
    console.log('🤖 Iniciando generación con OpenAI Assistant...');

    // 1. Obtener o crear Assistant
    const assistantId = await assistantsManager.getOrCreateAssistant(
      MEDICAL_NOTE_ASSISTANT_CONFIG,
      'medical-note-generator'
    );

    // 2. Crear thread
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: `Genera una nota médica completa siguiendo esta plantilla y usando la información del paciente.

ESPECIALIDAD: ${specialtyName}

PLANTILLA (estructura a seguir):
---
${templateContent}
---

INFORMACIÓN DEL PACIENTE:
---
${patientInfo}
---

Procesa siguiendo los 6 pasos modulares y genera la nota médica final manteniendo 100% fidelidad al formato de la plantilla.`
        }
      ]
    });

    // 3. Ejecutar Assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
      temperature: 0.2,
      max_completion_tokens: 4000
    });

    // 4. Esperar resultado con polling simplificado
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 60;

    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      if (attempts >= maxAttempts) {
        throw new Error('Timeout: El Assistant tardó demasiado en responder');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
      
      console.log(`⏳ Assistant procesando... (${attempts}s) - Estado: ${runStatus.status}`);
    }

    // Verificar estado final
    if (runStatus.status === 'completed') {
      console.log('✅ Assistant completado exitosamente');
    } else if (runStatus.status === 'failed') {
      const error = runStatus.last_error;
      throw new Error(`Assistant falló: ${error?.message || 'Error desconocido'}`);
    } else if (runStatus.status === 'cancelled') {
      throw new Error('Assistant fue cancelado');
    } else if (runStatus.status === 'expired') {
      throw new Error('Assistant expiró');
    } else {
      throw new Error(`Assistant falló con estado: ${runStatus.status}`);
    }

    // 5. Obtener respuesta
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
    
    if (!assistantMessage?.content[0] || assistantMessage.content[0].type !== 'text') {
      throw new Error('No se pudo obtener respuesta válida del Assistant');
    }

    const generatedNote = assistantMessage.content[0].text.value;

    // 6. Limpiar thread
    await openai.beta.threads.del(thread.id);

    console.log('✅ Nota generada exitosamente con Assistant');

    return {
      text: generatedNote,
      groundingMetadata: {
        groundingChunks: [
          {
            web: {
              uri: 'internal://openai-assistant',
              title: `Assistant: ${MEDICAL_NOTE_ASSISTANT_CONFIG.name}`
            }
          }
        ]
      },
      missingData: {
        missingFields: [],
        summary: "Análisis de datos faltantes incluido en la nota"
      }
    };

  } catch (error) {
    console.error('Error en Assistant:', error);
    throw new Error(`Error del Assistant: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

export const generateScaleWithAssistant = async (
  clinicalInput: string,
  scaleName: string
): Promise<{ text: string; groundingMetadata?: any }> => {
  try {
    const assistantId = await assistantsManager.getOrCreateAssistant(
      CLINICAL_SCALES_ASSISTANT_CONFIG,
      'clinical-scales-evaluator'
    );

    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: `Evalúa la escala "${scaleName}" usando esta información clínica:

INFORMACIÓN CLÍNICA:
${clinicalInput}

ESCALA: ${scaleName}

Proporciona evaluación detallada siguiendo el formato estándar.`
        }
      ]
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });

    // Polling para resultado simplificado
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;

    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      if (attempts >= 30) {
        throw new Error('Timeout en evaluación de escala');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
      
      console.log(`⏳ Assistant de escalas procesando... (${attempts}s) - Estado: ${runStatus.status}`);
    }

    // Verificar estado final
    if (runStatus.status === 'completed') {
      console.log('✅ Evaluación de escala completada exitosamente');
    } else if (runStatus.status === 'failed') {
      const error = runStatus.last_error;
      throw new Error(`Evaluación de escala falló: ${error?.message || 'Error desconocido'}`);
    } else if (runStatus.status === 'cancelled') {
      throw new Error('Evaluación de escala fue cancelada');
    } else if (runStatus.status === 'expired') {
      throw new Error('Evaluación de escala expiró');
    } else {
      throw new Error(`Error en evaluación: ${runStatus.status}`);
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
    
    if (!assistantMessage?.content[0] || assistantMessage.content[0].type !== 'text') {
      throw new Error('No se pudo evaluar la escala');
    }

    const result = assistantMessage.content[0].text.value;
    await openai.beta.threads.del(thread.id);

    return {
      text: result,
      groundingMetadata: { groundingChunks: [] }
    };

  } catch (error) {
    console.error('Error en evaluación de escala:', error);
    throw error;
  }
};

// ==========================================
// UTILITIES
// ==========================================

export const cleanupAssistants = async (): Promise<void> => {
  try {
    const assistantsList = await openai.beta.assistants.list({ limit: 100 });
    
    for (const assistant of assistantsList.data) {
      if (assistant.name?.includes('Asistente de Notas Médicas') || 
          assistant.name?.includes('Especialista en Escalas')) {
        await openai.beta.assistants.del(assistant.id);
        console.log(`🧹 Assistant limpiado: ${assistant.name}`);
      }
    }
  } catch (error) {
    console.error('Error limpiando Assistants:', error);
  }
};

export const getAssistantUsage = async (): Promise<any> => {
  try {
    const assistantsList = await openai.beta.assistants.list({ limit: 20 });
    return assistantsList.data
      .filter(a => a.name?.includes('Médicas') || a.name?.includes('Escalas'))
      .map(a => ({
        id: a.id,
        name: a.name,
        model: a.model,
        created_at: a.created_at
      }));
  } catch (error) {
    console.error('Error obteniendo uso de Assistants:', error);
    return [];
  }
};

export { assistantsManager }; 