import { useState, useEffect, useCallback } from 'react';
import { HistoricNote, UserTemplate, ActiveView } from '../types';
import { getUserStoredHistoricNotes, addUserHistoricNoteEntry } from '../lib/services/storageService';
import { historyService, HistoryEntry } from '../lib/services/databaseService';
import { CONFIRMATION_MESSAGES, STORAGE_KEYS } from '../lib/constants';

// Función auxiliar para convertir HistoryEntry a HistoricNote para compatibilidad
const convertHistoryEntryToHistoricNote = (entry: HistoryEntry): HistoricNote => {
  return {
    id: entry.id,
    type: entry.type,
    timestamp: entry.created_at,
    originalInput: entry.original_input || '',
    content: entry.content,
    specialty_id: entry.specialty_id,
    specialtyName: entry.specialty_name,
    scaleId: entry.scale_id,
    scaleName: entry.scale_name,
    // Campos adicionales de la base de datos
    title: entry.title,
    original_input: entry.original_input,
    specialty_name: entry.specialty_name,
    scale_id: entry.scale_id,
    scale_name: entry.scale_name,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
    metadata: entry.metadata
  };
};

// Función auxiliar para convertir HistoricNote a datos para la base de datos
const convertHistoricNoteToHistoryData = (note: Omit<HistoricNote, 'id' | 'timestamp'>) => {
  return {
    type: note.type,
    title: note.title || `${note.type === 'template' ? 'Nota de plantilla' : 
                             note.type === 'evidence' ? 'Evidencia científica' : 
                             note.type === 'scale' ? 'Escala clínica' : 'Nota'} - ${new Date().toLocaleString()}`,
    content: note.content,
    original_input: note.originalInput || note.original_input,
    specialty_id: note.specialty_id,
    specialty_name: note.specialtyName || note.specialty_name,
    scale_id: note.scaleId || note.scale_id,
    scale_name: note.scaleName || note.scale_name,
    metadata: note.metadata || {}
  };
};

export const useHistoryManager = (userId: string | null) => {
  const [historicNotes, setHistoricNotes] = useState<HistoricNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar historial al montar el componente
  useEffect(() => {
    const loadHistory = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Intentar cargar desde la base de datos primero
        const historyEntries = await historyService.getAllHistoryGrouped();
        const convertedNotes = historyEntries.map(convertHistoryEntryToHistoricNote);
        setHistoricNotes(convertedNotes);
      } catch (dbError) {
        console.warn('Error loading from database, falling back to localStorage:', dbError);
        // Fallback a localStorage
        setHistoricNotes(getUserStoredHistoricNotes(userId));
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [userId]);

  const addNoteToHistory = useCallback(async (noteData: Omit<HistoricNote, 'id' | 'timestamp'>) => {
    if (!userId) return;
    
    setError(null);
    
    try {
      // Intentar guardar en la base de datos primero
      const historyData = convertHistoricNoteToHistoryData(noteData);
      const newEntry = await historyService.createHistoryEntry(historyData);
      const newHistoricNote = convertHistoryEntryToHistoricNote(newEntry);
      
      // Actualizar estado local
      setHistoricNotes(prev => [newHistoricNote, ...prev]);
    } catch (dbError) {
      console.warn('Error saving to database, falling back to localStorage:', dbError);
      setError('Error al guardar en la base de datos, usando almacenamiento local');
      
      // Fallback a localStorage
      const newHistoricNote: HistoricNote = {
        ...noteData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      
      const updatedHistory = addUserHistoricNoteEntry(userId, newHistoricNote);
      setHistoricNotes(updatedHistory);
    }
  }, [userId]);

  const deleteNote = useCallback(async (noteId: string) => {
    if (!userId) return;
    
    setError(null);
    
    try {
      // Intentar eliminar de la base de datos primero
      await historyService.deleteHistoryEntry(noteId);
      
      // Actualizar estado local
      setHistoricNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (dbError) {
      console.warn('Error deleting from database, falling back to localStorage:', dbError);
      setError('Error al eliminar de la base de datos, usando almacenamiento local');
      
      // Fallback a localStorage
      const currentHistory = getUserStoredHistoricNotes(userId);
      const updatedHistory = currentHistory.filter(note => note.id !== noteId);
      
      localStorage.setItem(`${STORAGE_KEYS.HISTORY_PREFIX}${userId}`, JSON.stringify(updatedHistory));
      setHistoricNotes(updatedHistory);
    }
  }, [userId]);

  const clearHistory = useCallback(async () => {
    if (!userId) return;
    
    if (!window.confirm(CONFIRMATION_MESSAGES.CLEAR_HISTORY)) return;
    
    setError(null);
    
    try {
      // Intentar limpiar la base de datos primero
      await historyService.clearHistoryByType();
      
      // Actualizar estado local
      setHistoricNotes([]);
    } catch (dbError) {
      console.warn('Error clearing database, falling back to localStorage:', dbError);
      setError('Error al limpiar la base de datos, usando almacenamiento local');
      
      // Fallback a localStorage
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
    deleteNote,
    clearHistory,
    loadNoteFromHistory,
    isLoading,
    error,
  };
}; 