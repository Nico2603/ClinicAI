import React, { useState } from 'react';
import { UserTemplate, GroundingMetadata } from '@/types';
import { NoteDisplay, SparklesIcon, LoadingSpinner, MicrophoneIcon, ClinicalScaleGenerator, EvidenceBasedConsultation } from '../';

interface TemplateNoteViewProps {
  selectedTemplate: UserTemplate | null;
  patientInfo: string;
  onPatientInfoChange: (info: string) => void;
  generatedNote: string;
  onGenerateNote: () => void;
  onUpdateNote: (note: string) => void;
  isGenerating: boolean;
  groundingMetadata?: GroundingMetadata;
  onChangeTemplate: () => void;
  onToggleRecording: () => void;
  isRecording: boolean;
  isSpeechApiAvailable: boolean;
  interimTranscript: string;
  transcriptError: string | null;
  onClearError: () => void;
  onNoteGenerated?: (note: string) => void;
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
  onChangeTemplate,
  onToggleRecording,
  isRecording,
  isSpeechApiAvailable,
  interimTranscript,
  transcriptError,
  onClearError,
  onNoteGenerated,
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
    { id: 'note', label: 'Generación de Nota', icon: '📝' },
    { id: 'evidence', label: 'Evidencia Científica', icon: '🔬' },
    { id: 'scales', label: 'Escalas Clínicas', icon: '📊' },
  ];

  return (
    <section 
      aria-labelledby="template-note-heading" 
      className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 md:mb-4">
        <h2 id="template-note-heading" className="text-base md:text-lg font-semibold text-primary mb-2 lg:mb-0">
          Nota con Plantilla: <span className="font-bold">{selectedTemplate.name}</span>
        </h2>
        <div className="lg:w-1/2 xl:w-1/3">
          <button
            onClick={onChangeTemplate}
            className="text-sm text-primary hover:text-primary-dark underline"
          >
            Cambiar plantilla
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'note' | 'evidence' | 'scales')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'note' && (
        <div className="space-y-6">
          <div className="mb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Información del Paciente
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {patientInfo.length} caracteres
              </span>
              {isSpeechApiAvailable && (
                <button
                  onClick={onToggleRecording}
                  className={`inline-flex items-center px-2 py-1 border border-neutral-300 dark:border-neutral-600 text-xs font-medium rounded transition-colors ${
                    isRecording
                      ? 'text-red-700 bg-red-50 border-red-300 dark:text-red-400 dark:bg-red-900/20 dark:border-red-600'
                      : 'text-neutral-700 bg-white hover:bg-neutral-50 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700'
                  }`}
                >
                  <MicrophoneIcon className="h-3 w-3 mr-1" />
                  {isRecording ? 'Detener' : 'Dictar'}
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <textarea
              value={patientInfo + interimTranscript}
              onChange={(e) => onPatientInfoChange(e.target.value)}
              placeholder="Ingrese la información del paciente que desea incluir en la nota..."
              className="w-full h-32 p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg resize-y bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:border-primary focus:ring-primary"
              disabled={isGenerating}
            />
            {isRecording && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs animate-pulse">
                Grabando...
              </div>
            )}
          </div>

          {transcriptError && (
            <div className="text-sm text-red-500 dark:text-red-400">
              Error de transcripción: {transcriptError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onGenerateNote}
              disabled={isGenerating || !patientInfo.trim()}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Generar Nota
                </>
              )}
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

          {generatedNote && (
            <div className="mt-6">
              <NoteDisplay
                note={generatedNote}
                title="Nota Generada"
                isLoading={isGenerating}
                groundingMetadata={groundingMetadata}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="space-y-6">
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
            onConsultationGenerated={(consultationText) => {
              if (onNoteGenerated) {
                onNoteGenerated(consultationText);
              }
            }}
            autoAnalyzeContent={generatedNote || patientInfo}
            enableAutoAnalysis={Boolean(generatedNote || patientInfo)}
          />
        </div>
      )}

      {activeTab === 'scales' && (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
              📊 Escalas Clínicas Inteligentes
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Aplique escalas clínicas automatizadas que se calculan inteligentemente tomando los datos 
              de la información del paciente o la nota generada.
            </p>
          </div>
          
          <ClinicalScaleGenerator 
            onScaleGenerated={(scaleText) => {
              if (onNoteGenerated) {
                onNoteGenerated(scaleText);
              }
            }}
            existingNoteContent={generatedNote || patientInfo}
          />
        </div>
      )}
    </section>
  );
}; 