'use client';

import React, { useEffect, useCallback, useState, useMemo } from 'react';

// Hooks
import { useAuth } from '@/contexts/AuthContext';
import { 
  useDarkMode, 
  useAppState, 
  useTemplateNotes, 
  useHistoryManager, 
  useTemplateManager 
} from '../hooks';

// Constants
import { ERROR_MESSAGES } from '../lib/constants';

// Components
import { 
  Sidebar,
  NoteUpdater,
  EvidenceBasedConsultation,
  UserProfile,
  Footer,
  TemplatesView,
  TemplateNoteView,
  HistoryView
} from './';
import { NoteEditor } from './notes/NoteEditor';
import { HistoricNote, UserTemplate } from '../types';

const AuthenticatedApp: React.FC = React.memo(() => {
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
    refreshTemplates,
    handleSaveTemplate,
    handleCreateTemplate,
    handleDeleteTemplate,
    handleRenameTemplate,
  } = useTemplateManager(selectedTemplate as UserTemplate | null, handleSelectTemplate);

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
    progressSteps,
    currentStepIndex,
  } = useTemplateNotes();

  // Gestión del historial con userId memoizado
  const memoizedUserId = useMemo(() => user?.id || null, [user?.id]);
  const {
    historicNotes,
    addNoteToHistory,
    deleteNote,
    clearHistory,
    loadNoteFromHistory,
  } = useHistoryManager(memoizedUserId);

  // Estado para el actualizador de notas
  const [noteForUpdater, setNoteForUpdater] = useState<string>('');
  
  // Estado para el editor de notas
  const [noteForEditor, setNoteForEditor] = useState<HistoricNote | null>(null);

  // Callbacks memoizados para evitar re-renders

  const handleGenerateTemplateNote = useCallback(async () => {
    if (!selectedTemplate || !patientInfo.trim()) {
      showError('Por favor selecciona una plantilla e ingresa información del paciente');
      return;
    }

    try {
      clearGlobalError();
      clearTemplateError();
      const generatedNote = await generateNote(selectedTemplate, user?.id || '');
      
      // Guardar en historial cuando se genera exitosamente
      if (generatedNote) {
        addNoteToHistory({
          type: 'template',
          originalInput: patientInfo,
          content: generatedNote,
          specialty_id: selectedTemplate.id,
          specialtyName: selectedTemplate.name,
        });
      }
    } catch (error) {
      console.error('Error generating template note:', error);
      showError(error instanceof Error ? error.message : ERROR_MESSAGES.NOTE_ERROR);
    }
  }, [selectedTemplate, patientInfo, generateNote, showError, clearGlobalError, clearTemplateError, user?.id, addNoteToHistory]);

  // Callback memoizado para cargar nota en editor
  const handleLoadNoteInEditor = useCallback((note: HistoricNote) => {
    resetTemplateState();
    setNoteForEditor(note);
    setActiveView('note-editor');
  }, [resetTemplateState, setActiveView]);

  // Limpiar estados cuando cambia la vista activa para evitar cargas innecesarias
  useEffect(() => {
    // Limpiar errores cuando cambia de vista
    clearGlobalError();
    clearTemplateError();
    
    // Limpiar estados específicos según la vista
    if (activeView !== 'note-editor') {
      setNoteForEditor(null);
    }
    if (activeView !== 'note-updater') {
      setNoteForUpdater('');
    }
  }, [activeView, clearGlobalError, clearTemplateError]);

  // Callbacks memoizados para el editor de notas
  const handleSaveAsNewNote = useCallback((updatedContent: string) => {
    if (!noteForEditor) return;
    
    const newNote: HistoricNote = {
      ...noteForEditor,
      id: Date.now().toString(),
      content: updatedContent,
      timestamp: new Date().toISOString(),
    };
    
    addNoteToHistory(newNote);
    setNoteForEditor(null);
    setActiveView('historial-notas');
  }, [noteForEditor, addNoteToHistory, setActiveView]);

  const handleOverwriteNote = useCallback((updatedContent: string) => {
    if (!noteForEditor) return;
    
    const updatedNote: HistoricNote = {
      ...noteForEditor,
      content: updatedContent,
    };
    
    // Aquí necesitarías implementar una función updateNote en useHistoryManager
    // Por ahora, agregamos como nueva nota
    addNoteToHistory(updatedNote);
    setNoteForEditor(null);
    setActiveView('historial-notas');
  }, [noteForEditor, addNoteToHistory, setActiveView]);

  const handleCancelNoteEditor = useCallback(() => {
    setNoteForEditor(null);
    setActiveView('historial-notas');
  }, [setActiveView]);



  // Memoizar el título de la vista
  const viewTitle = useMemo(() => getViewTitle(activeView), [getViewTitle, activeView]);

  // Memoizar las props para los componentes hijos
  const sidebarProps = useMemo(() => ({
    activeView,
    setActiveView,
    theme,
    toggleTheme,
    historicNotes,
    userTemplates,
    refreshTemplates,
    onLoadNoteInEditor: handleLoadNoteInEditor,
    onLoadNoteInUpdater: (note: HistoricNote) => {
      setNoteForUpdater(note.content);
      setActiveView('note-updater');
    }
  }), [activeView, setActiveView, theme, toggleTheme, historicNotes, userTemplates, refreshTemplates, handleLoadNoteInEditor]);

  return (
    <div className="w-full min-h-screen bg-neutral-100 dark:bg-neutral-900 font-sans">
      <Sidebar {...sidebarProps} />
      <div className="md:ml-64 flex flex-col">
        <header className="bg-white dark:bg-neutral-800 shadow-sm p-3 md:p-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center sticky top-0 z-10">
          {/* Espacio para el botón hamburguesa en móvil */}
          <div className="flex items-center w-full">
            <div className="w-12 md:w-0 shrink-0"></div>
            <h1 className="text-sm md:text-lg font-semibold text-neutral-800 dark:text-neutral-100 truncate mr-4 flex-1 text-center md:text-left">
              {viewTitle}
            </h1>
          </div>
          <UserProfile />
        </header>

        <main className="flex-1 p-3 md:p-4 space-y-4 md:space-y-6">
          {globalError && (
            <section aria-labelledby="error-heading" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
              <h2 id="error-heading" className="sr-only">Error</h2>
              <p>{globalError}</p>
              <button 
                onClick={clearGlobalError}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Cerrar
              </button>
            </section>
          )}

          {templateError && (
            <section aria-labelledby="template-error-heading" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
              <h2 id="template-error-heading" className="sr-only">Error de Plantilla</h2>
              <p>{templateError}</p>
              <button 
                onClick={clearTemplateError}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Cerrar
              </button>
            </section>
          )}

          {activeView === 'templates' && (
            <TemplatesView
              selectedTemplate={selectedTemplate}
              userTemplates={userTemplates}
              onSelectTemplate={(template) => {
                handleSelectTemplate(template);
                setActiveView('nota-plantilla');
              }}
              onSaveTemplate={(newContent: string) => selectedTemplate ? handleSaveTemplate(selectedTemplate.id, newContent) : Promise.resolve()}
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
              onClearError={() => {
                clearGlobalError();
                clearTemplateError();
              }}
              onEvidenceGenerated={(evidence) => {
                addNoteToHistory({
                  type: 'evidence',
                  originalInput: patientInfo,
                  content: evidence,
                });
              }}
              onScaleGenerated={(scale) => {
                addNoteToHistory({
                  type: 'scale',
                  originalInput: patientInfo,
                  content: scale,
                });
              }}
              progressSteps={progressSteps}
              currentStepIndex={currentStepIndex}
            />
          )}

          {activeView === 'historial-notas' && (
            <HistoryView
              historicNotes={historicNotes}
              userTemplates={userTemplates}
              onLoadNoteInEditor={handleLoadNoteInEditor}
              onLoadNoteInUpdater={(note) => {
                setNoteForUpdater(note.content);
                setActiveView('note-updater');
              }}
              onDeleteNote={deleteNote}
              onClearHistory={clearHistory}
            />
          )}

          {activeView === 'note-updater' && (
            <section aria-labelledby="note-updater-heading" className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5">
              <h2 id="note-updater-heading" className="sr-only">Actualizador de Notas</h2>
              <NoteUpdater 
                initialNote={noteForUpdater}
              />
            </section>
          )}

          {activeView === 'note-editor' && noteForEditor && (
            <NoteEditor
              note={noteForEditor}
              userTemplates={userTemplates}
              onSaveAsNew={(editedNote) => handleSaveAsNewNote(editedNote.content)}
              onOverwrite={(noteId, editedNote) => handleOverwriteNote(editedNote.content)}
              onCancel={handleCancelNoteEditor}
            />
          )}

        </main>
        <Footer />
      </div>
    </div>
  );
});

AuthenticatedApp.displayName = 'AuthenticatedApp';

export default AuthenticatedApp;