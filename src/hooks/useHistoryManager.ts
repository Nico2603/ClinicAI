import { useState, useEffect, useCallback } from 'react';
import { HistoricNote, UserTemplate, ActiveView } from '../types';
import { getUserStoredHistoricNotes, addUserHistoricNoteEntry } from '../lib/services/storageService';
import { CONFIRMATION_MESSAGES, STORAGE_KEYS } from '../lib/constants';

export const useHistoryManager = (userId: string | null) => {
  const [historicNotes, setHistoricNotes] = useState<HistoricNote[]>([]);

  // Cargar historial al montar el componente
  useEffect(() => {
    if (!userId) return;
    setHistoricNotes(getUserStoredHistoricNotes(userId));
  }, [userId]);

  const addNoteToHistory = useCallback((noteData: Omit<HistoricNote, 'id' | 'timestamp'>) => {
    if (!userId) return;
    
    const newHistoricNote: HistoricNote = {
      ...noteData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    const updatedHistory = addUserHistoricNoteEntry(userId, newHistoricNote);
    setHistoricNotes(updatedHistory);
  }, [userId]);

  const clearHistory = useCallback(() => {
    if (!userId) return;
    
    if (window.confirm(CONFIRMATION_MESSAGES.CLEAR_HISTORY)) {
      localStorage.removeItem(`${STORAGE_KEYS.HISTORY_PREFIX}${userId}`);
      setHistoricNotes([]);
    }
  }, [userId]);

  const loadNoteFromHistory = useCallback((
    note: HistoricNote,
    userTemplates: UserTemplate[],
    callbacks: {
      setActiveView: (view: ActiveView) => void;
      setSelectedTemplate: (template: UserTemplate | null) => void;
      setPatientInfo: (info: string) => void;
      setGeneratedNote: (note: string) => void;
      setSuggestionInput: (input: string) => void;
      setGeneratedSuggestion: (suggestion: string) => void;
      clearMetadata: () => void;
    }
  ) => {
    callbacks.setActiveView('nota-plantilla');
    callbacks.clearMetadata();
    callbacks.setGeneratedNote('');
    callbacks.setGeneratedSuggestion('');
    
    if (note.type === 'template') {
      // Buscar la plantilla por ID
      const template = userTemplates.find(t => t.id === note.specialty_id);
      if (template) {
        callbacks.setSelectedTemplate(template);
      }
      callbacks.setPatientInfo(note.originalInput);
      callbacks.setGeneratedNote(note.content);
      callbacks.setSuggestionInput(note.originalInput);
    } else if (note.type === 'suggestion') {
      callbacks.setSuggestionInput(note.originalInput);
      callbacks.setGeneratedSuggestion(note.content);
      callbacks.setPatientInfo('');
    } else if (note.type === 'scale') {
      // Para escalas, usar el contenido como referencia
      callbacks.setSuggestionInput(note.originalInput);
      callbacks.setPatientInfo('');
    }
  }, []);

  return {
    historicNotes,
    addNoteToHistory,
    clearHistory,
    loadNoteFromHistory,
  };
}; 