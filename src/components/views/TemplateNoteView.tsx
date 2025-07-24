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

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserTemplate, GroundingMetadata, MissingDataInfo } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useAutoSave } from '../../hooks/useAutoSave';
import NoteDisplay from '../notes/NoteDisplay';
import EvidenceBasedConsultation from '../notes/EvidenceBasedConsultation';
import AIClinicalScales from '../notes/AIClinicalScales';
import { ProgressBar, type ProgressStep } from '../ui/ProgressBar';
import { TextareaWithSpeech } from '@/components';
import { Button } from '../ui/button';
import { DocumentTextIcon, EvidenceIcon, ScalesIcon } from '../ui/Icons';

interface TemplateNoteViewProps {
  selectedTemplate: UserTemplate | null;
  patientInfo: string;
  onPatientInfoChange: (value: string) => void;
  generatedNote: string;
  onGenerateNote: () => void;
  isGenerating: boolean;
  groundingMetadata?: GroundingMetadata;
  missingData?: MissingDataInfo;
  onChangeTemplate: () => void;
  onClearError: () => void;
  onEvidenceGenerated?: (evidence: string) => void;
  onScaleGenerated?: (scale: string) => void;
  progressSteps?: ProgressStep[];
  currentStepIndex?: number;
}

export const TemplateNoteView: React.FC<TemplateNoteViewProps> = ({
  selectedTemplate,
  patientInfo,
  onPatientInfoChange,
  generatedNote,
  onGenerateNote,
  isGenerating,
  groundingMetadata,
  missingData,
  onChangeTemplate,
  onClearError,
  onEvidenceGenerated,
  onScaleGenerated,
  progressSteps,
  currentStepIndex
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'note' | 'evidence' | 'scales'>('note');

  // Hook de auto-save para la información del paciente
  const {
    formatLastSaved,
    isSaving,
    hasUnsavedChanges,
    saveManually,
    createBlurHandler,
    saveStatus
  } = useAutoSave({
    content: patientInfo,
    template: selectedTemplate,
    patientInfo: patientInfo,
    interval: 30000, // 30 segundos
    onSave: (noteId) => {
      console.log('✅ Auto-guardado exitoso:', noteId);
    },
    onError: (error) => {
      console.error('❌ Error en auto-guardado:', error);
    }
  });

  // Hook de auto-save para la nota generada
  const {
    formatLastSaved: formatNoteSaved,
    isSaving: isNoteSaving,
    hasUnsavedChanges: hasNoteChanges,
    saveManually: saveNoteManually,
    createBlurHandler: createNoteBlurHandler
  } = useAutoSave({
    content: generatedNote,
    template: selectedTemplate,
    patientInfo: patientInfo,
    interval: 45000, // 45 segundos para notas generadas
    onSave: (noteId) => {
      console.log('✅ Auto-guardado de nota generada exitoso:', noteId);
    },
    onError: (error) => {
      console.error('❌ Error en auto-guardado de nota:', error);
    }
  });

  // Detectar cambios en el contenido del paciente para validación
  const [inputErrors, setInputErrors] = useState<string[]>([]);

  // Validación en tiempo real básica
  useEffect(() => {
    const errors: string[] = [];
    
    if (patientInfo.length > 0 && patientInfo.length < 10) {
      errors.push('La información del paciente es muy corta');
    }
    
    if (patientInfo.length > 5000) {
      errors.push('La información del paciente es demasiado larga');
    }
    
    setInputErrors(errors);
  }, [patientInfo]);

  // Memoizar botones de acción
  const renderActionButtons = useMemo(() => (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onGenerateNote}
        disabled={!selectedTemplate || !patientInfo.trim() || isGenerating || inputErrors.length > 0}
        className={`
          flex-1 min-w-[200px] inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white 
          ${!selectedTemplate || !patientInfo.trim() || isGenerating || inputErrors.length > 0
            ? 'bg-neutral-400 cursor-not-allowed' 
            : 'bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
          } 
          transition-colors
        `}
        data-tutorial="generate-note"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generando...
          </>
        ) : (
          <>
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generar Nota Médica
          </>
        )}
      </button>

      {!selectedTemplate && (
        <Button
          onClick={onChangeTemplate}
          variant="tertiary"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Seleccionar Plantilla
        </Button>
      )}
    </div>
  ), [selectedTemplate, patientInfo, isGenerating, inputErrors, onGenerateNote, onChangeTemplate]);

  if (!selectedTemplate) {
    return (
      <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-6">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">No hay plantilla seleccionada</h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Selecciona una plantilla para generar notas médicas personalizadas.
          </p>
          <div className="mt-6">
            <Button
              onClick={onChangeTemplate}
              variant="tertiary"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Seleccionar Plantilla
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con información de la plantilla seleccionada */}
      <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {selectedTemplate.name}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Plantilla seleccionada para generar notas médicas
            </p>
          </div>
          <Button
            onClick={onChangeTemplate}
            variant="tertiary"
            size="sm"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Cambiar Plantilla
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg overflow-hidden">
        <div className="border-b border-neutral-200 dark:border-neutral-700">
          <nav className="-mb-px flex space-x-8 px-4 md:px-6" aria-label="Tabs" data-tutorial="note-tabs">
            {[
              { id: 'note', name: 'Generar Nota', icon: <DocumentTextIcon className="h-5 w-5" /> },
              { id: 'evidence', name: 'Consulta Basada en Evidencia', icon: <EvidenceIcon className="h-5 w-5" /> },
              { id: 'scales', name: 'Escalas Clínicas', icon: <ScalesIcon className="h-5 w-5" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                data-tutorial={tab.id === 'evidence' ? 'evidence-tab' : tab.id === 'scales' ? 'scales-tab' : undefined}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido de las tabs */}
        <div className="p-4 md:p-6">
          {activeTab === 'note' && (
            <div className="space-y-6">
              <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
                  📝 Información del Paciente
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Ingrese la información del paciente que desea incluir en la nota.
                </p>
                
                {/* Indicadores de estado de auto-save */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    {isSaving && (
                      <span className="text-blue-600 dark:text-blue-400">💾 Guardando...</span>
                    )}
                    {formatLastSaved && !isSaving && (
                      <span className="text-green-600 dark:text-green-400">✅ {formatLastSaved}</span>
                    )}
                    {hasUnsavedChanges && !isSaving && (
                      <span className="text-yellow-600 dark:text-yellow-400">⚠️ Cambios sin guardar</span>
                    )}
                  </div>
                  {hasUnsavedChanges && (
                    <button
                      onClick={() => saveManually()}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Guardar ahora
                    </button>
                  )}
                </div>

                <div className="space-y-2" data-tutorial="patient-info">
                  <TextareaWithSpeech
                    id="patient-info"
                    value={patientInfo}
                    onChange={(e) => onPatientInfoChange(e.target.value)}
                    onBlur={createBlurHandler()}
                    rows={6}
                    placeholder="Ingrese la información del paciente que desea incluir en la nota..."
                    label="Información del Paciente"
                    showCharacterCount={true}
                    speechLanguage="es-ES"
                    className={`focus:border-primary focus:ring-1 focus:ring-primary ${
                      inputErrors.length > 0 ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  
                  {/* Errores de validación en tiempo real */}
                  {inputErrors.length > 0 && (
                    <div className="text-sm text-red-600 dark:text-red-400 space-y-1">
                      {inputErrors.map((error, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de progreso durante la generación */}
              {isGenerating && progressSteps && currentStepIndex !== undefined && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <ProgressBar 
                    steps={progressSteps}
                    currentStepIndex={currentStepIndex}
                  />
                </div>
              )}

              {/* Botones de acción */}
              {renderActionButtons}

              {/* Mostrar la nota generada con auto-save */}
              {generatedNote && (
                <div className="space-y-4">
                  {/* Indicadores de auto-save para la nota */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                      Nota Generada
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      {isNoteSaving && (
                        <span className="text-blue-600 dark:text-blue-400">💾 Guardando nota...</span>
                      )}
                      {formatNoteSaved && !isNoteSaving && (
                        <span className="text-green-600 dark:text-green-400">✅ {formatNoteSaved}</span>
                      )}
                      {hasNoteChanges && (
                        <button
                          onClick={() => saveNoteManually()}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Guardar nota ahora
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <NoteDisplay
                    note={generatedNote}
                    groundingMetadata={groundingMetadata}
                    missingData={missingData}
                    onNoteChange={createNoteBlurHandler()}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'evidence' && (
            <EvidenceBasedConsultation
              onEvidenceGenerated={onEvidenceGenerated}
            />
          )}

          {activeTab === 'scales' && (
            <AIClinicalScales
              onScaleGenerated={onScaleGenerated}
            />
          )}
        </div>
      </div>
    </div>
  );
}; 