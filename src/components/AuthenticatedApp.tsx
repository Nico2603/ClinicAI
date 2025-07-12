'use client';

import React, { useEffect, useCallback } from 'react';

// Hooks
import { useAuth } from '@/contexts/AuthContext';
import { 
  useDarkMode, 
  useSpeechRecognition, 
  useAppState, 
  useTemplateNotes, 
  useAISuggestions, 
  useHistoryManager, 
  useTemplateManager 
} from '../hooks';

// Constants
import { ERROR_MESSAGES } from '../lib/constants';

// Components
import { 
  Sidebar,
  NoteUpdater,
  ClinicalScaleGenerator,
  EvidenceBasedConsultation,
  UserProfile,
  Footer,
  TemplatesView,
  TemplateNoteView,
  EvidenceSuggestionView
} from './';

const AuthenticatedApp: React.FC = () => {
  const { user } = useAuth();
  const [theme, toggleTheme] = useDarkMode();
  
  // Estado de la aplicación
  const {
    activeView,
    setActiveView,
    selectedTemplate,
    setSelectedTemplate,
    globalError,
    handleSelectTemplate,
    clearGlobalError,
    showError,
    getViewTitle,
  } = useAppState();

  // Gestión de plantillas
  const {
    userTemplates,
    handleSaveTemplate,
    handleCreateTemplate,
    handleDeleteTemplate,
    handleRenameTemplate,
  } = useTemplateManager(selectedTemplate, handleSelectTemplate);

  // Gestión de notas de plantilla
  const {
    patientInfo,
    setPatientInfo,
    generatedNote: generatedTemplateNote,
    groundingMetadata: templateNoteGrounding,
    isGenerating: isGeneratingTemplateNote,
    error: templateError,
    generateNote,
    updateNote: updateGeneratedTemplateNote,
    clearError: clearTemplateError,
    resetState: resetTemplateState,
  } = useTemplateNotes();

  // Gestión de sugerencias de IA
  const {
    suggestionInput: aiSuggestionInput,
    setSuggestionInput: setAiSuggestionInput,
    generatedSuggestion: generatedAISuggestion,
    groundingMetadata: aiSuggestionGrounding,
    isGenerating: isGeneratingAISuggestion,
    error: suggestionError,
    generateSuggestions,
    clearError: clearSuggestionError,
    resetState: resetSuggestionState,
    syncInputFromPatientInfo,
  } = useAISuggestions();

  // Gestión del historial
  const {
    historicNotes,
    addNoteToHistory,
    clearHistory,
    loadNoteFromHistory,
  } = useHistoryManager(user?.id || null);

  // Reconocimiento de voz
  const { 
    isRecording, 
    isSupported: isSpeechApiAvailable, 
    interimTranscript, 
    error: transcriptError, 
    startRecording, 
    stopRecording 
  } = useSpeechRecognition({
    onTranscript: (transcript) => {
      setPatientInfo(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + transcript + ' ');
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
    }
  });

  // Efecto para sincronizar datos entre hooks
  useEffect(() => {
    // Sincronizar input de sugerencias con información del paciente
    if (patientInfo && !aiSuggestionInput) {
      syncInputFromPatientInfo(patientInfo);
    }
  }, [patientInfo, aiSuggestionInput, syncInputFromPatientInfo]);

  // Manejadores de eventos
  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleGenerateTemplateNote = useCallback(async () => {
    if (!selectedTemplate) {
      showError(ERROR_MESSAGES.TEMPLATE_NOT_SELECTED);
      return;
    }

    clearGlobalError();
    clearTemplateError();

    try {
      const result = await generateNote(selectedTemplate, user?.id || '');
      
      if (result) {
        // Sincronizar con sugerencias de IA
        syncInputFromPatientInfo(patientInfo);
        
        // Agregar al historial
        addNoteToHistory({
          type: 'template',
          specialty_id: selectedTemplate.id,
          specialtyName: selectedTemplate.name,
          originalInput: patientInfo,
          content: result,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.NOTE_GENERATION_ERROR;
      showError(errorMessage);
    }
  }, [selectedTemplate, user?.id, generateNote, patientInfo, syncInputFromPatientInfo, addNoteToHistory, clearGlobalError, clearTemplateError, showError]);

  const handleGenerateAISuggestions = useCallback(async () => {
    clearGlobalError();
    clearSuggestionError();

    try {
      const result = await generateSuggestions();
      
      if (result) {
        // Agregar al historial
        addNoteToHistory({
          type: 'suggestion',
          originalInput: aiSuggestionInput,
          content: result,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.SUGGESTIONS_GENERATION_ERROR;
      showError(errorMessage);
    }
  }, [generateSuggestions, aiSuggestionInput, addNoteToHistory, clearGlobalError, clearSuggestionError, showError]);

  const handleLoadFromHistory = useCallback((note: any) => {
    loadNoteFromHistory(note, userTemplates, {
      setActiveView,
      setSelectedTemplate,
      setPatientInfo,
      setGeneratedNote: updateGeneratedTemplateNote,
      setSuggestionInput: setAiSuggestionInput,
      setGeneratedSuggestion: () => {}, // Se manejará en el hook
      clearMetadata: () => {
        // Limpiar metadatos de grounding
      },
    });
  }, [loadNoteFromHistory, userTemplates, setActiveView, setSelectedTemplate, setPatientInfo, updateGeneratedTemplateNote, setAiSuggestionInput]);

  const handleSaveTemplateWrapper = useCallback(async (newContent: string) => {
    if (!selectedTemplate) return;
    
    try {
      await handleSaveTemplate(selectedTemplate.id, newContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.TEMPLATE_SAVE_ERROR;
      showError(errorMessage);
    }
  }, [selectedTemplate, handleSaveTemplate, showError]);

  // Determinar el error actual a mostrar
  const currentError = globalError || templateError || suggestionError;

  return (
    <div className="w-full min-h-screen bg-neutral-100 dark:bg-neutral-900 font-sans">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <div className="md:ml-64 flex flex-col">
        <header className="bg-white dark:bg-neutral-800 shadow-sm p-3 md:p-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-base md:text-lg font-semibold text-neutral-800 dark:text-neutral-100 truncate mr-4">
            {getViewTitle(activeView)}
          </h1>
          <UserProfile />
        </header>

        <main className="flex-1 bg-neutral-100 dark:bg-neutral-900 p-3 md:p-4 space-y-4 md:space-y-6 overflow-y-auto">
          {currentError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300 rounded-lg shadow" role="alert">
              <p className="font-bold text-sm">Error:</p>
              <p className="text-sm">{currentError}</p>
            </div>
          )}

          {activeView === 'templates' && (
            <TemplatesView
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleSelectTemplate}
              onSaveTemplate={handleSaveTemplateWrapper}
              userId={user?.id}
            />
          )}

          {activeView === 'nota-plantilla' && (
            <TemplateNoteView
              selectedTemplate={selectedTemplate}
              patientInfo={patientInfo}
              onPatientInfoChange={setPatientInfo}
              generatedNote={generatedTemplateNote}
              onGenerateNote={handleGenerateTemplateNote}
              onUpdateNote={updateGeneratedTemplateNote}
              isGenerating={isGeneratingTemplateNote}
              groundingMetadata={templateNoteGrounding}
              onChangeTemplate={() => setActiveView('templates')}
              onToggleRecording={handleToggleRecording}
              isRecording={isRecording}
              isSpeechApiAvailable={isSpeechApiAvailable}
              interimTranscript={interimTranscript}
              transcriptError={transcriptError}
              onClearError={() => {
                clearGlobalError();
                clearTemplateError();
              }}
            />
          )}

          {activeView === 'sugerencia-evidencia' && (
            <EvidenceSuggestionView
              suggestionInput={aiSuggestionInput}
              onSuggestionInputChange={setAiSuggestionInput}
              generatedSuggestion={generatedAISuggestion}
              onGenerateSuggestions={handleGenerateAISuggestions}
              isGenerating={isGeneratingAISuggestion}
              groundingMetadata={aiSuggestionGrounding}
              onClearError={() => {
                clearGlobalError();
                clearSuggestionError();
              }}
            />
          )}

          {activeView === 'escalas-clinicas' && (
            <section aria-labelledby="escalas-clinicas-heading" className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5">
              <h2 id="escalas-clinicas-heading" className="sr-only">Escalas Clínicas</h2>
              <ClinicalScaleGenerator 
                onScaleGenerated={(scaleText) => {
                  addNoteToHistory({
                    type: 'scale',
                    originalInput: aiSuggestionInput,
                    content: scaleText,
                    scaleName: 'Escala Inteligente'
                  });
                }}
                existingNoteContent={generatedTemplateNote || aiSuggestionInput}
              />
            </section>
          )}

          {activeView === 'consulta-evidencia' && (
            <section aria-labelledby="consulta-evidencia-heading" className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5">
              <h2 id="consulta-evidencia-heading" className="sr-only">Consulta Basada en Evidencia</h2>
              <EvidenceBasedConsultation 
                onConsultationGenerated={(consultationText) => {
                  addNoteToHistory({
                    type: 'suggestion',
                    originalInput: aiSuggestionInput,
                    content: consultationText
                  });
                }}
                autoAnalyzeContent={generatedTemplateNote || aiSuggestionInput}
                enableAutoAnalysis={Boolean(generatedTemplateNote || aiSuggestionInput)}
              />
            </section>
          )}

          {activeView === 'note-updater' && (
            <section aria-labelledby="note-updater-heading" className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5">
              <h2 id="note-updater-heading" className="sr-only">Actualizador de Notas</h2>
              <NoteUpdater />
            </section>
          )}

        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AuthenticatedApp;