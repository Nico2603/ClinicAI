import { useState, useCallback } from 'react';
import { GroundingMetadata, UserTemplate, MissingDataInfo, GenerationResult } from '../types';
import { generateNoteFromTemplate } from '../lib/services/openaiService';
import { notesService } from '../lib/services/databaseService';
import { ERROR_MESSAGES } from '../lib/constants';
import { ProgressStep } from '../components/ui/ProgressBar';

// Definir las etapas del proceso de generación
const GENERATION_STEPS: ProgressStep[] = [
  {
    id: 'extracting',
    label: 'Extrayendo información subjetiva',
    description: 'Se está extrayendo la información subjetiva del paciente',
    completed: false,
    active: false,
  },
  {
    id: 'analyzing',
    label: 'Generando análisis clínico',
    description: 'Se está generando el análisis clínico mejorado',
    completed: false,
    active: false,
  },
  {
    id: 'structuring',
    label: 'Analizando estructura',
    description: 'Se está analizando y preservando la estructura de la plantilla',
    completed: false,
    active: false,
  },
  {
    id: 'integrating',
    label: 'Integrando componentes',
    description: 'Estamos coordinando la integración de todos los componentes',
    completed: false,
    active: false,
  },
  {
    id: 'verifying',
    label: 'Verificando formato',
    description: 'Verificando que la nota sea 100% fiel al formato de la plantilla',
    completed: false,
    active: false,
  },
  {
    id: 'extracting-missing',
    label: 'Identificando datos faltantes',
    description: 'Analizando qué información falta para completar la plantilla',
    completed: false,
    active: false,
  },
];

export const useTemplateNotes = () => {
  const [patientInfo, setPatientInfo] = useState<string>('');
  const [generatedNote, setGeneratedNote] = useState<string>('');
  const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | undefined>(undefined);
  const [missingData, setMissingData] = useState<MissingDataInfo | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>(GENERATION_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);

  // Función para actualizar el progreso
  const updateProgress = useCallback((stepIndex: number) => {
    setCurrentStepIndex(stepIndex);
    setProgressSteps(steps => 
      steps.map((step, index) => ({
        ...step,
        completed: index < stepIndex,
        active: index === stepIndex,
      }))
    );
  }, []);

  // Función para completar el progreso
  const completeProgress = useCallback(() => {
    setProgressSteps(steps => 
      steps.map(step => ({
        ...step,
        completed: true,
        active: false,
      }))
    );
    setCurrentStepIndex(GENERATION_STEPS.length - 1);
  }, []);

  // Función para resetear el progreso
  const resetProgress = useCallback(() => {
    setProgressSteps(GENERATION_STEPS.map(step => ({
      ...step,
      completed: false,
      active: false,
    })));
    setCurrentStepIndex(-1);
  }, []);

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
    resetProgress();

    try {
      // Simular progreso paso a paso
      
      // Paso 1: Extrayendo información subjetiva
      updateProgress(0);
      await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa para mostrar el progreso
      
      // Paso 2: Generando análisis clínico
      updateProgress(1);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Paso 3: Analizando estructura
      updateProgress(2);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Paso 4: Integrando componentes
      updateProgress(3);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Paso 5: Verificando formato
      updateProgress(4);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Paso 6: Identificando datos faltantes
      updateProgress(5);
      
      const result = await generateNoteFromTemplate(template.name, template.content, patientInfo);
      
      // Completar el progreso
      completeProgress();
      
      setGeneratedNote(result.text);
      setGroundingMetadata(result.groundingMetadata);
      setMissingData(result.missingData);

      // Guardar en Supabase (best-effort, no bloquea la UI)
      if (userId) {
        notesService.createNote({
          title: `Nota ${new Date().toLocaleString()}`,
          content: result.text,
          user_id: userId,
          user_template_id: template.id,
          is_private: true,
          tags: [],
        }).catch((dbErr) => {
          console.error('Error al guardar la nota en Supabase:', dbErr);
        });
      }

      return result.text;
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido al generar la nota.";
      setError(errorMessage);
      setGeneratedNote(`Error: ${errorMessage}`);
      resetProgress();
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [patientInfo, updateProgress, completeProgress, resetProgress]);

  const updateNote = useCallback((newNote: string) => {
    setGeneratedNote(newNote);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetState = useCallback(() => {
    setPatientInfo('');
    setGeneratedNote('');
    setGroundingMetadata(undefined);
    setMissingData(undefined);
    setError(null);
    resetProgress();
  }, [resetProgress]);

  return {
    patientInfo,
    setPatientInfo,
    generatedNote,
    groundingMetadata,
    missingData,
    isGenerating,
    error,
    generateNote,
    updateNote,
    clearError,
    resetState,
    progressSteps,
    currentStepIndex,
  };
}; 