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

import { useState, useCallback } from 'react';
import { GroundingMetadata, UserTemplate, MissingDataInfo, GenerationResult } from '../types';
import { generateNoteFromTemplate } from '../lib/services/openaiService';
import { optimizeTemplateSet, preloadTemplateCache } from '../lib/services/contextManager';
import { notesService } from '../lib/services/databaseService';
import { ERROR_MESSAGES } from '../lib/constants';
import { ProgressStep } from '../components/ui/ProgressBar';
import { useSimpleUserTemplates } from './useSimpleDatabase';

// Definir las etapas del proceso de generación mejorado
const ENHANCED_GENERATION_STEPS: ProgressStep[] = [
  {
    id: 'initializing',
    label: 'Inicializando sistema inteligente',
    description: 'Preparando Assistants de OpenAI y optimizando contexto',
    completed: false,
    active: false,
  },
  {
    id: 'context-optimization',
    label: 'Optimizando contexto para múltiples plantillas',
    description: 'Analizando y priorizando plantillas disponibles',
    completed: false,
    active: false,
  },
  {
    id: 'assistant-processing',
    label: 'Procesando con Assistant especializado',
    description: 'El Assistant médico está generando tu nota con máxima precisión',
    completed: false,
    active: false,
  },
  {
    id: 'quality-validation',
    label: 'Validando calidad y estructura',
    description: 'Verificando fidelidad al formato y coherencia médica',
    completed: false,
    active: false,
  },
  {
    id: 'finalizing',
    label: 'Finalizando nota médica',
    description: 'Aplicando últimos ajustes y preparando resultado final',
    completed: false,
    active: false,
  }
];

export const useTemplateNotes = () => {
  // Estados principales
  const [patientInfo, setPatientInfo] = useState<string>('');
  const [generatedNote, setGeneratedNote] = useState<string>('');
  const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | undefined>();
  const [missingData, setMissingData] = useState<MissingDataInfo | undefined>();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de progreso mejorados
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>(ENHANCED_GENERATION_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);

  // Estados adicionales para la nueva arquitectura
  const [generationMethod, setGenerationMethod] = useState<'assistant' | 'function_calling' | 'traditional'>('assistant');
  const [contextOptimization, setContextOptimization] = useState<any>(null);
  const [tokensUsed, setTokensUsed] = useState<number>(0);

  // Hook para plantillas del usuario
  const { userTemplates } = useSimpleUserTemplates();

  // Utilidades de progreso
  const updateProgress = useCallback((stepIndex: number) => {
    setCurrentStepIndex(stepIndex);
    setProgressSteps(prevSteps => 
      prevSteps.map((step, index) => ({
        ...step,
        completed: index < stepIndex,
        active: index === stepIndex,
      }))
    );
  }, []);

  const completeProgress = useCallback(() => {
    setProgressSteps(prevSteps => 
      prevSteps.map(step => ({
        ...step,
        completed: true,
        active: false,
      }))
    );
    setCurrentStepIndex(ENHANCED_GENERATION_STEPS.length);
  }, []);

  const resetProgress = useCallback(() => {
    setProgressSteps(ENHANCED_GENERATION_STEPS.map(step => ({
      ...step,
      completed: false,
      active: false,
    })));
    setCurrentStepIndex(-1);
  }, []);

  // Función principal de generación con nueva arquitectura
  const generateNote = useCallback(async (template: UserTemplate, userId: string) => {
    if (!patientInfo.trim()) {
      setError(ERROR_MESSAGES.REQUIRED_FIELD);
      return null;
    }

    setError(null);
    setIsGenerating(true);
    setGeneratedNote('');
    setGroundingMetadata(undefined);
    setMissingData(undefined);
    setGenerationMethod('assistant');
    setContextOptimization(null);
    setTokensUsed(0);
    resetProgress();

    try {
      console.log('🚀 Iniciando generación con nueva arquitectura...');

      // Paso 1: Inicialización y precarga de cache
      updateProgress(0);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (userTemplates.length > 0) {
        await preloadTemplateCache(userTemplates);
      }

      // Paso 2: Optimización de contexto
      updateProgress(1);
      console.log('🔄 Optimizando contexto para múltiples plantillas...');
      
      const optimization = await optimizeTemplateSet(
        userTemplates,
        patientInfo,
        template.id
      );
      
      setContextOptimization(optimization);
      setTokensUsed(optimization.tokensUsed);
      
      console.log(`📊 Contexto optimizado: ${optimization.recommendation}`);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Paso 3: Generación con Assistant (método preferido)
      updateProgress(2);
      let result: any;
      
      // Usar servicio simplificado que maneja Assistant → Legacy fallback automáticamente
      console.log('🤖 Generando nota con servicio híbrido (Assistant → Legacy)...');
      result = await generateNoteFromTemplate(
        template.name,
        template.content,
        patientInfo
      );
      
      setGenerationMethod('assistant');
      console.log('✅ Generación exitosa con servicio híbrido');

      // Paso 4: Validación de calidad
      updateProgress(3);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validación básica del resultado
      if (!result.text || result.text.length < 50) {
        throw new Error('La nota generada es demasiado corta o está vacía');
      }

      // Paso 5: Finalización
      updateProgress(4);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      completeProgress();
      
      // Actualizar estados con resultados
      setGeneratedNote(result.text);
      setGroundingMetadata(result.groundingMetadata);
      setMissingData(result.missingData);

      console.log(`🎉 Generación completada con método: ${generationMethod}`);
      console.log(`📊 Tokens usados: ${result.tokensUsed || optimization.tokensUsed}`);

      // Guardar en Supabase (best-effort, no bloquea la UI)
      if (userId) {
        try {
                     await notesService.createNote({
             title: `Nota ${template.name} - ${new Date().toLocaleString()}`,
             content: result.text,
             user_id: userId,
             user_template_id: template.id,
             diagnosis: 'Generado automáticamente',
             treatment: 'Ver contenido de la nota',
             is_private: true,
             tags: [],
           }).catch(dbError => {
            console.warn('⚠️ Error guardando en BD (no crítico):', dbError);
          });
        } catch (dbError) {
          console.warn('⚠️ Error guardando nota (no crítico):', dbError);
        }
      }

      return result.text;

    } catch (error) {
      console.error('❌ Error en generación:', error);
      
      // Resetear progreso en caso de error
      resetProgress();
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido en la generación';
      
      setError(`Error generando nota: ${errorMessage}`);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [
    patientInfo, 
    userTemplates, 
    updateProgress, 
    completeProgress, 
    resetProgress,
    generationMethod
  ]);

  // Función para actualizar notas existentes
  const updateNote = useCallback(async (originalNote: string, newInformation: string) => {
    if (!originalNote.trim() || !newInformation.trim()) {
      setError('Se requiere tanto la nota original como la nueva información');
      return null;
    }

    setError(null);
    setIsGenerating(true);

    try {
      // Importar dinámicamente para evitar dependencias circulares
      const { updateClinicalNote } = await import('../lib/services/openaiService');
      
      const result = await updateClinicalNote(originalNote, newInformation);
      setGeneratedNote(result.text);
      setGroundingMetadata(result.groundingMetadata);
      
      return result.text;
    } catch (error) {
      console.error('Error actualizando nota:', error);
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.NOTE_ERROR;
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Resetear todo el estado
  const resetState = useCallback(() => {
    setPatientInfo('');
    setGeneratedNote('');
    setGroundingMetadata(undefined);
    setMissingData(undefined);
    setError(null);
    setGenerationMethod('assistant');
    setContextOptimization(null);
    setTokensUsed(0);
    resetProgress();
  }, [resetProgress]);

  return {
    // Estados principales
    patientInfo,
    setPatientInfo,
    generatedNote,
    groundingMetadata,
    missingData,
    isGenerating,
    error,

    // Estados de progreso
    progressSteps,
    currentStepIndex,

    // Estados adicionales de la nueva arquitectura
    generationMethod,
    contextOptimization,
    tokensUsed,

    // Funciones
    generateNote,
    updateNote,
    clearError,
    resetState,

    // Estadísticas y utilidades
    getGenerationStats: () => ({
      method: generationMethod,
      tokensUsed,
      contextOptimization: contextOptimization?.recommendation || 'No disponible',
      templatesAnalyzed: userTemplates.length,
      isOptimized: !!contextOptimization
    })
  };
}; 