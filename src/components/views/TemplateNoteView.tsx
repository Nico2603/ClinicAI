import React, { useState, useCallback } from 'react';
import { UserTemplate, GroundingMetadata, MissingDataInfo } from '@/types';
import { NoteDisplay, SparklesIcon, LoadingSpinner, AIClinicalScales, EvidenceBasedConsultation, TextareaWithSpeech, ProgressBar, ProgressStep } from '../';
import { Button } from '../ui/button';

interface TemplateNoteViewProps {
  selectedTemplate: UserTemplate | null;
  patientInfo: string;
  onPatientInfoChange: (info: string) => void;
  generatedNote: string;
  onGenerateNote: () => void;
  onUpdateNote: (note: string) => void;
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
  onUpdateNote,
  isGenerating,
  groundingMetadata,
  missingData,
  onChangeTemplate,
  onClearError,
  onEvidenceGenerated,
  onScaleGenerated,
  progressSteps = [],
  currentStepIndex = -1,
}) => {
  const [activeTab, setActiveTab] = useState<'note' | 'evidence' | 'scales'>('note');

  if (!selectedTemplate) {
    return (
      <section className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
            No hay plantillas seleccionadas
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Para generar notas, primero necesitas crear y seleccionar una plantilla personalizada.
          </p>
          <button
            onClick={onChangeTemplate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            Ir a Plantillas
          </button>
        </div>
      </section>
    );
  }

  const tabs = [
    { id: 'note', label: 'Generación de Nota', shortLabel: 'Nota', icon: '📝' },
    { id: 'evidence', label: 'Evidencia Científica', shortLabel: 'Evidencias', icon: '🔬' },
    { id: 'scales', label: 'Escalas Clínicas Calculadas por IA', shortLabel: 'Escalas', icon: '📊' },
  ];

  return (
    <section 
      aria-labelledby="template-note-heading" 
      className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-3 sm:p-4 md:p-5"
    >
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-3 md:mb-4">
        <h2 id="template-note-heading" className="text-sm sm:text-base md:text-lg font-semibold text-primary">
          Generador de Nota: <span className="font-bold break-words">{selectedTemplate.name}</span>
        </h2>
        {activeTab === 'note' && (
          <div className="w-full sm:w-auto">
            <button
              onClick={onChangeTemplate}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 hover:border-primary/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 touch-target"
            >
              <span className="mr-2">🔄</span>
              Cambiar plantilla
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 mb-4 sm:mb-6" data-tutorial="note-tabs">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'note' | 'evidence' | 'scales')}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap touch-target ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300'
              }`}
            >
              <span className="mr-1 sm:mr-2">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'note' && (
        <div className="space-y-6">
          <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
              📝 Información del Paciente
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Ingrese la información del paciente que desea incluir en la nota.
            </p>
            <div className="space-y-2" data-tutorial="patient-info">
              <TextareaWithSpeech
                id="patient-info"
                value={patientInfo}
                onChange={(e) => onPatientInfoChange(e.target.value)}
                rows={6}
                placeholder="Ingrese la información del paciente que desea incluir en la nota..."
                label="Información del Paciente"
                showCharacterCount={true}
                speechLanguage="es-ES"
                className="focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Barra de progreso durante la generación */}
          {isGenerating && progressSteps.length > 0 ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
              <ProgressBar 
                steps={progressSteps}
                currentStepIndex={currentStepIndex}
                className="max-w-md mx-auto"
              />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onGenerateNote}
                disabled={isGenerating || !patientInfo.trim()}
                data-tutorial="generate-note"
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                Generar Nota
              </button>
              {onClearError && (
                <button
                  onClick={onClearError}
                  className="inline-flex items-center px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          )}

          {generatedNote && (
            <div className="mt-6">
              <NoteDisplay
                note={generatedNote}
                title="Nota Generada"
                isLoading={isGenerating}
                groundingMetadata={groundingMetadata}
                missingData={missingData}
              />
            </div>
          )}
        </div>
      )}

      {/* Pestaña de Evidencia Científica - Siempre renderizada, solo oculta */}
      <div className={`space-y-6 ${activeTab === 'evidence' ? 'block' : 'hidden'}`} data-tutorial="evidence-tab">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            🔬 Recomendaciones Basadas en Evidencia Científica
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Obtenga recomendaciones clínicas fundamentadas en evidencia científica actual para mejorar 
            la calidad de sus decisiones médicas.
          </p>
        </div>
        
        <EvidenceBasedConsultation 
          key={`evidence-${selectedTemplate?.id || 'no-template'}`}
          onConsultationGenerated={(consultationText) => {
            if (onEvidenceGenerated) {
              onEvidenceGenerated(consultationText);
            }
          }}
          autoAnalyzeContent={generatedNote || patientInfo}
          enableAutoAnalysis={Boolean(generatedNote || patientInfo)}
        />
      </div>

      {/* Pestaña de Escalas Clínicas - Siempre renderizada, solo oculta */}
      <div className={`space-y-6 ${activeTab === 'scales' ? 'block' : 'hidden'}`} data-tutorial="scales-tab">
        <AIClinicalScales 
          onScaleGenerated={(scaleText: string) => {
            if (onScaleGenerated) {
              onScaleGenerated(scaleText);
            }
          }}
          autoAnalyzeContent={generatedNote || patientInfo}
          enableAutoAnalysis={Boolean(generatedNote || patientInfo)}
        />
      </div>
    </section>
  );
}; 