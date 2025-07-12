'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Types
import {
  UserTemplate,
  GroundingMetadata,
  HistoricNote,
  ActiveView
} from '../types';

// No longer needed - MEDICAL_SCALES removed for intelligent scale generation

// Hooks
import { useDarkMode } from '../hooks/useDarkMode';
import { useAuth } from '@/contexts/AuthContext';
import { useUserTemplates } from '../hooks/useDatabase';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

// Services
import { 
  getUserStoredHistoricNotes,
  addUserHistoricNoteEntry
} from '../lib/services/storageService';
import { generateNoteFromTemplate, generateAISuggestions, generateMedicalScale } from '../lib/services/openaiService';
import { notesService } from '../lib/services/databaseService';

// Components
import Sidebar from './ui/Sidebar';
import CustomTemplateManager from './notes/CustomTemplateManager';
import TemplateEditor from './notes/TemplateEditor';
import NoteDisplay from './notes/NoteDisplay';
import NoteUpdater from './notes/NoteUpdater';
import ClinicalScaleGenerator from './notes/ClinicalScaleGenerator';
import EvidenceBasedConsultation from './notes/EvidenceBasedConsultation';
import HistoryView from './HistoryView';
import UserProfile from './auth/UserProfile';
import { SparklesIcon, LoadingSpinner, LightBulbIcon, MicrophoneIcon, CalculatorIcon } from './ui/Icons';
import { Footer } from './ui/Footer';
import MyNotesView from './MyNotesView';

const AuthenticatedApp: React.FC = () => {
  const { user } = useAuth();
  const [theme, toggleTheme] = useDarkMode();
  const [activeView, setActiveView] = useState<ActiveView>('templates');
  const { userTemplates, createUserTemplate, updateUserTemplate, deleteUserTemplate, renameUserTemplate } = useUserTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<UserTemplate | null>(null);
  const [historicNotes, setHistoricNotes] = useState<HistoricNote[]>([]);

  const [patientInfo, setPatientInfo] = useState<string>('');
  const [generatedTemplateNote, setGeneratedTemplateNote] = useState<string>('');
  const [templateNoteGrounding, setTemplateNoteGrounding] = useState<GroundingMetadata | undefined>(undefined);
  const [isGeneratingTemplateNote, setIsGeneratingTemplateNote] = useState<boolean>(false);

  const [aiSuggestionInput, setAiSuggestionInput] = useState<string>('');
  const [generatedAISuggestion, setGeneratedAISuggestion] = useState<string>('');
  const [aiSuggestionGrounding, setAiSuggestionGrounding] = useState<GroundingMetadata | undefined>(undefined);
  const [isGeneratingAISuggestion, setIsGeneratingAISuggestion] = useState<boolean>(false);

  // Legacy scale variables removed - now using intelligent scale generator
  
  const [error, setError] = useState<string | null>(null);

  // Speech Recognition usando hook personalizado
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

  useEffect(() => {
    if (!user) return;

    // Load user-specific historic notes
    setHistoricNotes(getUserStoredHistoricNotes(user.id));

    // Set first template as selected when templates are loaded
    if (userTemplates.length > 0 && !selectedTemplate) {
      const firstTemplate = userTemplates[0];
      if (firstTemplate) {
        setSelectedTemplate(firstTemplate);
      }
    }
  }, [user, userTemplates, selectedTemplate]);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSelectTemplate = (template: UserTemplate) => {
    setSelectedTemplate(template);
    setError(null);
  };

  const handleSaveTemplate = useCallback(async (newContent: string) => {
    if (!user || !selectedTemplate) return;
    try {
      await updateUserTemplate(selectedTemplate.id, { content: newContent });
    } catch (error) {
      console.error('Error al guardar plantilla:', error);
      setError('Error al guardar la plantilla');
    }
  }, [selectedTemplate, user, updateUserTemplate]);

  const addNoteToHistory = (noteData: Omit<HistoricNote, 'id' | 'timestamp'>) => {
    if (!user) return;
    const newHistoricNote: HistoricNote = {
      ...noteData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = addUserHistoricNoteEntry(user.id, newHistoricNote);
    setHistoricNotes(updatedHistory);
  };

  const handleGenerateTemplateNote = async () => {
    if (!patientInfo.trim()) {
      setError("Por favor, ingrese la información del paciente para la plantilla.");
      return;
    }

    if (!selectedTemplate) {
      setError('Por favor, seleccione una plantilla válida.');
      return;
    }

    setError(null);
    setIsGeneratingTemplateNote(true);
    setGeneratedTemplateNote('');
    setTemplateNoteGrounding(undefined);

    try {
      const result = await generateNoteFromTemplate(selectedTemplate.name, selectedTemplate.content, patientInfo);
      setGeneratedTemplateNote(result.text);
      setTemplateNoteGrounding(result.groundingMetadata);
      // Sync patientInfo to AI suggestion input
      setAiSuggestionInput(patientInfo);
      // Add to history
      addNoteToHistory({
        type: 'template',
        specialty_id: selectedTemplate.id,
        specialtyName: selectedTemplate.name,
        originalInput: patientInfo,
        content: result.text,
      });

      // Guardar en Supabase (best-effort, no bloquea la UI)
      if (user) {
        notesService.createNote({
          title: `Nota ${new Date().toLocaleString()}`,
          content: result.text,
          user_id: user.id,
          template_id: selectedTemplate.id,
          is_private: true,
          tags: [],
        }).catch((dbErr) => {
          console.error('Error al guardar la nota en Supabase:', dbErr);
        });
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido al generar la nota.";
      setError(errorMessage);
      setGeneratedTemplateNote(`Error: ${errorMessage}`);
    } finally {
      setIsGeneratingTemplateNote(false);
    }
  };
  
  const handleUpdateGeneratedTemplateNote = (newNote: string) => {
    setGeneratedTemplateNote(newNote);
  };

  const handleGenerateAISuggestions = async () => {
    if (!aiSuggestionInput.trim()) {
      setError("Por favor, ingrese la información clínica para generar sugerencias.");
      return;
    }
    setError(null);
    setIsGeneratingAISuggestion(true);
    setGeneratedAISuggestion('');
    setAiSuggestionGrounding(undefined);

    try {
      const result = await generateAISuggestions(aiSuggestionInput);
      setGeneratedAISuggestion(result.text);
      setAiSuggestionGrounding(result.groundingMetadata);
      // Add to history
      addNoteToHistory({
        type: 'suggestion',
        originalInput: aiSuggestionInput,
        content: result.text,
      });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido al generar sugerencias.";
      setError(errorMessage);
      setGeneratedAISuggestion(`Error: ${errorMessage}`);
    } finally {
      setIsGeneratingAISuggestion(false);
    }
  };

  // Legacy handleGenerateScale function removed - now using intelligent scale generator

  const handleLoadFromHistory = (note: HistoricNote) => {
    setActiveView('generate');
    setError(null);
    // Clear all outputs first
    setGeneratedTemplateNote('');
    setGeneratedAISuggestion('');
    setTemplateNoteGrounding(undefined);
    setAiSuggestionGrounding(undefined);
    
    if (note.type === 'template') {
      // Try to find the template by ID
      const template = userTemplates.find(t => t.id === note.specialty_id);
      if (template) {
        setSelectedTemplate(template);
      }
      setPatientInfo(note.originalInput);
      setGeneratedTemplateNote(note.content);
      setAiSuggestionInput(note.originalInput);
    } else if (note.type === 'suggestion') {
      setAiSuggestionInput(note.originalInput);
      setGeneratedAISuggestion(note.content);
      setPatientInfo(''); 
    } else if (note.type === 'scale') {
      // For scale notes, just load the content as a reference
      // User can copy or use it as input for the new intelligent scale generator
      setAiSuggestionInput(note.originalInput);
      setPatientInfo('');
    }
  };

  const handleClearHistory = () => {
    if (!user) return;
    if(window.confirm("¿Está seguro de que desea borrar todo el historial de notas? Esta acción no se puede deshacer.")) {
        localStorage.removeItem(`notasai_history_${user.id}`);
        setHistoricNotes([]);
    }
  };
  
  let currentViewTitle = 'Generador de Notas Clínicas';
  if (activeView === 'templates') currentViewTitle = 'Gestor de Plantillas Personalizadas';
  if (activeView === 'history') currentViewTitle = 'Historial de Notas';
  if (activeView === 'notes') currentViewTitle = 'Mis Notas';
  if (activeView === 'note-updater') currentViewTitle = 'Actualizador de Notas Clínicas';

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
            {currentViewTitle}
          </h1>
          <UserProfile />
        </header>

        <main className="flex-1 bg-neutral-100 dark:bg-neutral-900 p-3 md:p-4 space-y-4 md:space-y-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300 rounded-lg shadow" role="alert">
              <p className="font-bold text-sm">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {activeView === 'templates' && (
            <section aria-labelledby="template-manager-heading" className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5">
              <h2 id="template-manager-heading" className="sr-only">Gestor de Plantillas Personalizadas</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template Manager */}
                <div>
                  <CustomTemplateManager
                    onSelectTemplate={handleSelectTemplate}
                    selectedTemplateId={selectedTemplate?.id}
                  />
                </div>
                
                {/* Template Editor */}
                {selectedTemplate && (
                  <div>
                    <TemplateEditor
                      template={selectedTemplate.content}
                      onSaveTemplate={handleSaveTemplate}
                      specialtyName={selectedTemplate.name}
                      userId={user?.id}
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {activeView === 'generate' && selectedTemplate && (
            <>
              {/* Section 1: Template-based Note Generation */}
              <section aria-labelledby="template-note-heading" className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 md:mb-4">
                  <h2 id="template-note-heading" className="text-base md:text-lg font-semibold text-primary mb-2 lg:mb-0">
                    Nota con Plantilla: <span className="font-bold">{selectedTemplate.name}</span>
                  </h2>
                  <div className="lg:w-1/2 xl:w-1/3">
                    <button
                      onClick={() => setActiveView('templates')}
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
                        onClick={handleToggleRecording}
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
                  onChange={(e) => { setPatientInfo(e.target.value); setError(null);}}
                  rows={5}
                  className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100 mb-1 transition-colors text-sm md:text-base"
                  placeholder="Ingrese aquí los datos del paciente, síntomas, observaciones para completar la plantilla... o use el botón de micrófono para dictar."
                />
                {!isSpeechApiAvailable && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-2">El dictado por voz no es compatible con este navegador.</p>}
                {interimTranscript && <p className="text-sm text-neutral-600 dark:text-neutral-300 p-2 bg-neutral-100 dark:bg-neutral-700/50 rounded-md my-2"><i>{interimTranscript}</i></p>}
                {transcriptError && <p className="text-xs text-red-600 dark:text-red-400 mt-1 mb-2">{transcriptError}</p>}
                
                <button
                  onClick={handleGenerateTemplateNote}
                  disabled={isGeneratingTemplateNote || isRecording}
                  className="w-full mt-3 inline-flex items-center justify-center px-4 md:px-6 py-3 border border-transparent text-sm md:text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-60 dark:focus:ring-offset-neutral-900 transition-colors"
                >
                  {isGeneratingTemplateNote ? (
                    <> <LoadingSpinner className="text-white mr-2" /> Generando Nota...</>
                  ) : (
                    <> <SparklesIcon className="h-5 w-5 mr-2" /> Generar Nota con Plantilla </>
                  )}
                </button>
                <NoteDisplay
                  note={generatedTemplateNote}
                  onNoteChange={handleUpdateGeneratedTemplateNote}
                  title={`Nota Clínica: ${selectedTemplate.name}`}
                  isLoading={isGeneratingTemplateNote}
                  groundingMetadata={templateNoteGrounding}
                />
              </section>

              {/* Section 2: AI-Powered Assistance */}
              <section aria-labelledby="ai-assistance-heading" className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5">
                 <h2 id="ai-assistance-heading" className="sr-only">Asistente IA Avanzado</h2>
                
                {/* Part 1: General Suggestions */}
                <div>
                    <h3 id="ai-suggestions-heading" className="text-base md:text-lg font-semibold text-secondary mb-2 md:mb-3 flex items-center">
                    <LightBulbIcon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    Sugerencias Basadas en Evidencia
                    </h3>
                    <label htmlFor="ai-suggestion-input" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Información Clínica o Consulta para IA
                    </label>
                    <textarea
                    id="ai-suggestion-input"
                    value={aiSuggestionInput}
                    onChange={(e) => {setAiSuggestionInput(e.target.value); setError(null);}}
                    rows={5}
                    className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-neutral-700 dark:text-neutral-100 mb-3 transition-colors text-sm md:text-base"
                    placeholder="Describa la situación clínica, preguntas o áreas donde necesita recomendaciones basadas en evidencia científica..."
                    />
                    <button
                    onClick={handleGenerateAISuggestions}
                    disabled={isGeneratingAISuggestion}
                    className="w-full inline-flex items-center justify-center px-4 md:px-6 py-3 border border-transparent text-sm md:text-base font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-dark disabled:opacity-60 dark:focus:ring-offset-neutral-900 transition-colors"
                    >
                    {isGeneratingAISuggestion ? (
                        <> <LoadingSpinner className="text-white mr-2" /> Generando Sugerencias...</>
                    ) : (
                        <> <SparklesIcon className="h-5 w-5 mr-2" /> Obtener Sugerencias Basadas en Evidencia </>
                    )}
                    </button>
                    <NoteDisplay
                    note={generatedAISuggestion}
                    title="Sugerencias Basadas en Evidencia"
                    isLoading={isGeneratingAISuggestion}
                    groundingMetadata={aiSuggestionGrounding}
                    />
                </div>

                {/* Divider */}
                <div className="my-4 md:my-6 border-t border-dashed border-neutral-300 dark:border-neutral-600"></div>

                {/* Part 2: Intelligent Clinical Scale Generator */}
                <div>
                    <ClinicalScaleGenerator 
                        onScaleGenerated={(scaleText) => {
                            // Agregar la escala generada al historial
                            addNoteToHistory({
                                type: 'scale',
                                originalInput: aiSuggestionInput,
                                content: scaleText,
                                scaleName: 'Escala Inteligente'
                            });
                        }}
                        existingNoteContent={generatedTemplateNote || aiSuggestionInput}
                    />
                </div>

                {/* Divider */}
                <div className="my-4 md:my-6 border-t border-dashed border-neutral-300 dark:border-neutral-600"></div>

                {/* Part 3: Evidence-Based Clinical Consultation */}
                <div>
                    <EvidenceBasedConsultation 
                        onConsultationGenerated={(consultationText) => {
                            // Agregar la consulta generada al historial
                            addNoteToHistory({
                                type: 'suggestion',
                                originalInput: aiSuggestionInput,
                                content: consultationText
                            });
                        }}
                        autoAnalyzeContent={generatedTemplateNote || aiSuggestionInput}
                        enableAutoAnalysis={Boolean(generatedTemplateNote || aiSuggestionInput)}
                    />
                </div>
              </section>
            </>
          )}

          {activeView === 'generate' && !selectedTemplate && (
            <section className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5">
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                  No hay plantillas seleccionadas
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  Para generar notas, primero necesitas crear y seleccionar una plantilla personalizada.
                </p>
                <button
                  onClick={() => setActiveView('templates')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  Ir a Plantillas
                </button>
              </div>
            </section>
          )}

          {activeView === 'notes' && (
            <MyNotesView />
          )}

          {activeView === 'note-updater' && (
            <section aria-labelledby="note-updater-heading" className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5">
              <h2 id="note-updater-heading" className="sr-only">Actualizador de Notas Clínicas</h2>
              <NoteUpdater />
            </section>
          )}

          {activeView === 'history' && (
            <HistoryView 
                historicNotes={historicNotes}
                loadNoteFromHistory={handleLoadFromHistory}
                clearHistory={handleClearHistory}
            />
          )}

        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AuthenticatedApp;