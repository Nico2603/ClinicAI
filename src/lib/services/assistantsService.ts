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

// Assistant principal para generación de notas médicas
const MEDICAL_NOTE_ASSISTANT_CONFIG = {
  name: "Asistente de Notas Médicas Modular",
  model: OPENAI_MODEL,
  instructions: `Eres un especialista médico experto en generar notas clínicas siguiendo un proceso modular de 6 pasos:

PROCESO MODULAR ESTÁNDAR:
1. **EXTRACCIÓN SUBJETIVA**: Identificar síntomas y molestias reportadas por el paciente
2. **ANÁLISIS CLÍNICO**: Mejorar redacción técnica y estructura diagnóstica
3. **ANÁLISIS DE PLANTILLA**: Preservar formato exacto de la estructura
4. **INTEGRACIÓN**: Combinar todos los componentes coherentemente
5. **VERIFICACIÓN**: Asegurar 100% fidelidad al formato de plantilla
6. **DATOS FALTANTES**: Identificar información ausente

PRINCIPIOS CORE:
- NUNCA inventar información no proporcionada
- Mantener formato EXACTO de plantillas (mayúsculas, viñetas, numeración)
- Usar terminología médica precisa
- Omitir secciones sin datos disponibles
- Responder SOLO con la nota médica final, sin comentarios

CONFIGURACIÓN:
- Temperatura: 0.2 (precisión)
- Respuestas estructuradas
- Control de calidad estricto`,
  tools: [
    {
      type: "function",
      function: {
        name: "generate_structured_note",
        description: "Genera nota médica estructurada siguiendo plantilla específica",
        parameters: {
          type: "object",
          properties: {
            template_structure: {
              type: "string",
              description: "Estructura exacta de la plantilla médica"
            },
            patient_information: {
              type: "string", 
              description: "Información completa del paciente"
            },
            subjective_findings: {
              type: "string",
              description: "Información subjetiva extraída del paciente"
            },
            clinical_analysis: {
              type: "string", 
              description: "Análisis clínico mejorado"
            },
            missing_data_summary: {
              type: "string",
              description: "Resumen de datos faltantes identificados"
            }
          },
          required: ["template_structure", "patient_information"]
        }
      }
    }
  ],
  temperature: 0.2,
  top_p: 0.9
};

// Assistant para escalas clínicas
const CLINICAL_SCALES_ASSISTANT_CONFIG = {
  name: "Especialista en Escalas Clínicas",
  model: OPENAI_MODEL,
  instructions: `Eres un especialista en evaluación de escalas clínicas médicas.

PRINCIPIOS:
- Solo usar información explícita disponible
- Marcar "Información insuficiente" cuando falten datos
- NO hacer inferencias más allá de lo mencionado
- Proporcionar puntajes solo si son representativos
- Incluir limitaciones por datos faltantes

FORMATO ESTÁNDAR:
ESCALA [NOMBRE]:
Ítem 1: [Puntaje] - [Justificación]
Ítem 2: Información insuficiente - Falta: [dato necesario]
...
PUNTAJE TOTAL: [X/Y puntos] ([Z]% completada)
INTERPRETACIÓN: [Solo si hay suficiente información]
LIMITACIONES: [Datos faltantes que afectan la evaluación]`,
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
      // Buscar assistant existente por nombre
      const assistantsList = await openai.beta.assistants.list({
        limit: 20
      });

      const existingAssistant = assistantsList.data.find(
        assistant => assistant.name === config.name
      );

      if (existingAssistant) {
        this.assistants.set(assistantKey, existingAssistant.id);
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

    // 4. Esperar resultado con polling optimizado
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 60; // 60 segundos máximo

    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      if (attempts >= maxAttempts) {
        throw new Error('Timeout: El Assistant tardó demasiado en responder');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
      
      console.log(`⏳ Assistant procesando... (${attempts}s)`);
    }

    if (runStatus.status !== 'completed') {
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

    // Polling para resultado
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;

    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      if (attempts >= 30) {
        throw new Error('Timeout en evaluación de escala');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
    }

    if (runStatus.status !== 'completed') {
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