import React, { useState, useCallback } from 'react';
import { UserTemplate, GroundingMetadata } from '@/types';
import { NoteDisplay, SparklesIcon, LoadingSpinner, MicrophoneIcon, AIClinicalScales, EvidenceBasedConsultation } from '../';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

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
  onClearError: () => void;
  onEvidenceGenerated?: (evidence: string) => void;
  onScaleGenerated?: (scale: string) => void;
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
  onClearError,
  onEvidenceGenerated,
  onScaleGenerated,
}) => {
  const [activeTab, setActiveTab] = useState<'note' | 'evidence' | 'scales'>('note');

  // Función estable para manejar transcripciones
  const handleTranscript = useCallback((transcript: string) => {
    onPatientInfoChange(patientInfo + (patientInfo.endsWith(' ') || patientInfo === '' ? '' : ' ') + transcript + ' ');
  }, [patientInfo, onPatientInfoChange]);

  // Hook de reconocimiento de voz
  const { 
    isRecording, 
    isSupported: isSpeechApiAvailable, 
    interimTranscript, 
    error: transcriptError, 
    startRecording, 
    stopRecording 
  } = useSpeechRecognition({
    onTranscript: handleTranscript,
    onError: (error) => {
      console.error('Speech recognition error:', error);
    }
  });

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

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
    { id: 'scales', label: 'Escalas Clínicas Calculadas por IA', icon: '📊' },
  ];

  return (
    <section 
      aria-labelledby="template-note-heading" 
      className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 md:mb-4">
        <h2 id="template-note-heading" className="text-base md:text-lg font-semibold text-primary mb-2 lg:mb-0">
          Generador de Nota: <span className="font-bold">{selectedTemplate.name}</span>
        </h2>
        {activeTab === 'note' && (
          <div className="lg:w-1/2 xl:w-1/3">
            <button
              onClick={onChangeTemplate}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 hover:border-primary/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
            >
              <span className="mr-2">🔄</span>
              Cambiar plantilla
            </button>
          </div>
        )}
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
          <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
              📝 Información del Paciente
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Ingrese la información del paciente que desea incluir en la nota. Puede usar el micrófono para dictar.
            </p>
            <div className="relative">
              <label htmlFor="patient-info" className="sr-only">
                Información del paciente
              </label>
              <textarea
                id="patient-info"
                value={patientInfo}
                onChange={(e) => onPatientInfoChange(e.target.value)}
                rows={6}
                className="w-full p-3 pr-12 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                placeholder="Ingrese la información del paciente que desea incluir en la nota..."
              />
              
              {isSpeechApiAvailable && (
                <button
                  onClick={handleToggleRecording}
                  className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-neutral-200 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-500'
                  }`}
                  title={isRecording ? 'Detener grabación' : 'Iniciar grabación de voz'}
                >
                  <MicrophoneIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {interimTranscript && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Transcribiendo:</span> {interimTranscript}
              </div>
            )}
            
            {transcriptError && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-sm text-red-800 dark:text-red-200">
                <span className="font-medium">Error de transcripción:</span> {transcriptError}
              </div>
            )}
          </div>

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

      {/* Pestaña de Evidencia Científica - Siempre renderizada, solo oculta */}
      <div className={`space-y-6 ${activeTab === 'evidence' ? 'block' : 'hidden'}`}>
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
            if (onEvidenceGenerated) {
              onEvidenceGenerated(consultationText);
            }
          }}
          autoAnalyzeContent={generatedNote || patientInfo}
          enableAutoAnalysis={Boolean(generatedNote || patientInfo)}
        />
      </div>

      {/* Pestaña de Escalas Clínicas - Siempre renderizada, solo oculta */}
      <div className={`space-y-6 ${activeTab === 'scales' ? 'block' : 'hidden'}`}>
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