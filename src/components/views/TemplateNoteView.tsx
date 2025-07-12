import React from 'react';
import { UserTemplate, GroundingMetadata } from '@/types';
import { NoteDisplay, SparklesIcon, LoadingSpinner, MicrophoneIcon } from '../';

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
}) => {
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
      
      <div className="mb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <label htmlFor="patient-info" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Información del Paciente (para plantilla)
        </label>
        {isSpeechApiAvailable && (
          <button
            onClick={onToggleRecording}
            disabled={!isSpeechApiAvailable} 
            className={`p-2 rounded-full transition-colors shrink-0 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-secondary hover:bg-secondary-dark text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isRecording ? 'Detener dictado' : 'Iniciar dictado por voz'}
            aria-label={isRecording ? 'Detener dictado por voz' : 'Iniciar dictado por voz para información del paciente'}
          >
            <MicrophoneIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      
      <textarea
        id="patient-info"
        value={patientInfo}
        onChange={(e) => { onPatientInfoChange(e.target.value); onClearError(); }}
        rows={5}
        className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100 mb-1 transition-colors text-sm md:text-base"
        placeholder="Ingrese aquí los datos del paciente, síntomas, observaciones para completar la plantilla... o use el botón de micrófono para dictar."
      />
      
      {!isSpeechApiAvailable && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-2">
          El dictado por voz no es compatible con este navegador.
        </p>
      )}
      
      {interimTranscript && (
        <p className="text-sm text-neutral-600 dark:text-neutral-300 p-2 bg-neutral-100 dark:bg-neutral-700/50 rounded-md my-2">
          <i>{interimTranscript}</i>
        </p>
      )}
      
      {transcriptError && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1 mb-2">
          {transcriptError}
        </p>
      )}
      
      <button
        onClick={onGenerateNote}
        disabled={isGenerating || isRecording}
        className="w-full mt-3 inline-flex items-center justify-center px-4 md:px-6 py-3 border border-transparent text-sm md:text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-60 dark:focus:ring-offset-neutral-900 transition-colors"
      >
        {isGenerating ? (
          <> <LoadingSpinner className="text-white mr-2" /> Generando Nota...</>
        ) : (
          <> <SparklesIcon className="h-5 w-5 mr-2" /> Generar Nota con Plantilla </>
        )}
      </button>
      
      <NoteDisplay
        note={generatedNote}
        onNoteChange={onUpdateNote}
        title={`Nota Clínica: ${selectedTemplate.name}`}
        isLoading={isGenerating}
        groundingMetadata={groundingMetadata}
      />
    </section>
  );
}; 