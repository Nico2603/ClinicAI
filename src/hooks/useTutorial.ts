import { useState, useCallback } from 'react';
import { ActiveView } from '../types';

// Definición de un paso del tutorial
export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string; // Selector CSS del elemento a destacar
  placement: 'top' | 'bottom' | 'left' | 'right';
  view: ActiveView; // Vista en la que debe estar la aplicación
  action?: () => void; // Acción opcional a ejecutar antes de mostrar el paso
}

// Definición de todos los pasos del tutorial
const TUTORIAL_STEPS: TutorialStep[] = [
  // === SECCIÓN: PLANTILLAS ===
  {
    id: 'sidebar-templates',
    title: '🔧 Gestión de Plantillas',
    content: 'Aquí puedes crear y gestionar tus plantillas personalizadas. Las plantillas te permiten estructurar el formato de tus notas médicas.',
    target: '[data-nav-item="templates"]',
    placement: 'right',
    view: 'templates'
  },
  {
    id: 'templates-create',
    title: '➕ Crear Nueva Plantilla',
    content: 'Haz clic aquí para crear una nueva plantilla personalizada según tu especialidad médica.',
    target: '[data-tutorial="create-template"]',
    placement: 'bottom',
    view: 'templates'
  },
  {
    id: 'templates-list',
    title: '📋 Lista de Plantillas',
    content: 'Aquí verás todas tus plantillas creadas. Puedes editarlas, eliminarlas o seleccionarlas para generar notas.',
    target: '[data-tutorial="templates-list"]',
    placement: 'top',
    view: 'templates'
  },

  // === SECCIÓN: NUEVA NOTA ===
  {
    id: 'sidebar-note',
    title: '📝 Generación de Notas',
    content: 'Esta sección te permite generar notas médicas usando IA basándose en tus plantillas personalizadas.',
    target: '[data-nav-item="nota-plantilla"]',
    placement: 'right',
    view: 'nota-plantilla'
  },
  {
    id: 'patient-info',
    title: '👤 Información del Paciente',
    content: 'Escribe aquí toda la información subjetiva del paciente. La IA utilizará estos datos para generar la nota estructurada.',
    target: '[data-tutorial="patient-info"]',
    placement: 'bottom',
    view: 'nota-plantilla'
  },
  {
    id: 'generate-note',
    title: '🚀 Generar Nota',
    content: 'Haz clic aquí para que la IA genere tu nota médica siguiendo el formato de tu plantilla seleccionada.',
    target: '[data-tutorial="generate-note"]',
    placement: 'top',
    view: 'nota-plantilla'
  },
  {
    id: 'note-tabs',
    title: '📑 Pestañas de Funcionalidades',
    content: 'Aquí tienes tres funcionalidades principales: Generación de notas, Evidencia científica y Escalas clínicas.',
    target: '[data-tutorial="note-tabs"]',
    placement: 'bottom',
    view: 'nota-plantilla'
  },

  // === PESTAÑA: EVIDENCIA CIENTÍFICA ===
  {
    id: 'evidence-tab',
    title: '🔬 Evidencia Científica',
    content: 'Esta funcionalidad genera evidencia científica basada en el caso clínico que describiste.',
    target: '[data-tutorial="evidence-tab"]',
    placement: 'bottom',
    view: 'nota-plantilla'
  },
  {
    id: 'evidence-generate',
    title: '📚 Generar Evidencia',
    content: 'La IA buscará y generará evidencia científica relevante para tu caso clínico actual.',
    target: '[data-tutorial="evidence-generate"]',
    placement: 'top',
    view: 'nota-plantilla'
  },

  // === PESTAÑA: ESCALAS CLÍNICAS ===
  {
    id: 'scales-tab',
    title: '📊 Escalas Clínicas',
    content: 'Aquí puedes generar y calcular escalas clínicas usando IA basándose en la información del paciente.',
    target: '[data-tutorial="scales-tab"]',
    placement: 'bottom',
    view: 'nota-plantilla'
  },
  {
    id: 'scales-generate',
    title: '🧮 Calcular Escalas',
    content: 'La IA calculará escalas clínicas apropiadas según los datos del paciente que proporcionaste.',
    target: '[data-tutorial="scales-generate"]',
    placement: 'top',
    view: 'nota-plantilla'
  },

  // === SECCIÓN: ACTUALIZAR NOTA ===
  {
    id: 'sidebar-updater',
    title: '✏️ Actualizar Notas',
    content: 'Esta herramienta te permite mejorar o actualizar notas médicas existentes usando IA.',
    target: '[data-nav-item="note-updater"]',
    placement: 'right',
    view: 'note-updater'
  },
  {
    id: 'note-input',
    title: '📄 Nota a Actualizar',
    content: 'Pega aquí la nota que quieres mejorar o actualizar. La IA la analizará y sugerirá mejoras.',
    target: '[data-tutorial="note-input"]',
    placement: 'bottom',
    view: 'note-updater'
  },
  {
    id: 'update-note',
    title: '🔄 Procesar Actualización',
    content: 'Haz clic aquí para que la IA analice y mejore tu nota médica existente.',
    target: '[data-tutorial="update-note"]',
    placement: 'top',
    view: 'note-updater'
  },

  // === SECCIÓN: HISTORIAL ===
  {
    id: 'sidebar-history',
    title: '📚 Historial de Notas',
    content: 'Aquí puedes ver y gestionar todas las notas, evidencias y escalas que has generado anteriormente.',
    target: '[data-nav-item="historial-notas"]',
    placement: 'right',
    view: 'historial-notas'
  },
  {
    id: 'history-tabs',
    title: '🗂️ Tipos de Historial',
    content: 'El historial está organizado en tres categorías: Notas médicas, Evidencias científicas y Escalas clínicas.',
    target: '[data-tutorial="history-tabs"]',
    placement: 'bottom',
    view: 'historial-notas'
  },
  {
    id: 'history-actions',
    title: '⚡ Acciones Rápidas',
    content: 'Puedes editar, cargar en el actualizador o eliminar cualquier elemento de tu historial.',
    target: '[data-tutorial="history-actions"]',
    placement: 'top',
    view: 'historial-notas'
  },

  // === FINALIZACIÓN ===
  {
    id: 'tutorial-complete',
    title: '🎉 ¡Tutorial Completado!',
    content: '¡Perfecto! Ya conoces todas las funcionalidades de ClinicAI. Ahora puedes empezar a crear tus plantillas y generar notas médicas con IA.',
    target: '[data-tutorial="user-profile"]',
    placement: 'bottom',
    view: 'templates'
  }
];

export const useTutorial = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const startTutorial = useCallback(() => {
    setIsActive(true);
    setCurrentStepIndex(0);
  }, []);

  const stopTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      stopTutorial();
    }
  }, [currentStepIndex, stopTutorial]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const skipTutorial = useCallback(() => {
    stopTutorial();
  }, [stopTutorial]);

  // Función para ir a un paso específico
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < TUTORIAL_STEPS.length) {
      setCurrentStepIndex(stepIndex);
    }
  }, []);

  return {
    // Estado
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps: TUTORIAL_STEPS.length,
    isFirstStep,
    isLastStep,
    
    // Acciones
    startTutorial,
    stopTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    goToStep,
    
    // Datos
    allSteps: TUTORIAL_STEPS
  };
}; 