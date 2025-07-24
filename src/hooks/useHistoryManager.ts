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

import { useState, useEffect, useCallback, useRef } from 'react';
import { HistoricNote, UserTemplate, ActiveView } from '../types';
import { getUserStoredHistoricNotes, addUserHistoricNoteEntry } from '../lib/services/storageService';
import { historyService, HistoryEntry } from '../lib/services/databaseService';
import { historyCacheService } from '../lib/services/historyCacheService';
import { CONFIRMATION_MESSAGES, STORAGE_KEYS } from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  const [historicNotes, setHistoricNotes] = useState<HistoricNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Flag para evitar múltiples llamadas concurrentes
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasLoadedFromCache = useRef(false);

  // Configurar cache para el usuario
  useEffect(() => {
    if (user?.id) {
      historyCacheService.setUser(user.id);
    }
  }, [user?.id]);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isLoadingRef.current = false;
  }, []);

  // Cargar desde cache primero, luego desde servidor si es necesario
  const loadFromCache = useCallback(() => {
    if (!user?.id || hasLoadedFromCache.current) return false;
    
    setIsLoadingFromCache(true);
    const cachedEntries = historyCacheService.getHistoryEntries();
    
    if (cachedEntries && cachedEntries.length > 0) {
      const convertedNotes = cachedEntries.map(convertHistoryEntryToHistoricNote);
      setHistoricNotes(convertedNotes);
      setError(null);
      hasLoadedFromCache.current = true;
      setIsLoadingFromCache(false);
      console.log('⚡ Historial cargado desde cache local');
      return true;
    }
    
    setIsLoadingFromCache(false);
    return false;
  }, [user?.id]);

  const fetchHistoryEntries = useCallback(async (options: { 
    isRetry?: boolean; 
    forceRefresh?: boolean;
    useCache?: boolean;
  } = {}) => {
    const { isRetry = false, forceRefresh = false, useCache = true } = options;
    
    if (!user?.id || (isLoadingRef.current && !isRetry)) return;
    
    // Intentar cargar desde cache primero (si no es un force refresh)
    if (useCache && !forceRefresh && !isRetry) {
      const cacheLoaded = loadFromCache();
      if (cacheLoaded) {
        // Cargar en background desde servidor para mantener cache actualizado
        setTimeout(() => {
          fetchHistoryEntries({ forceRefresh: true, useCache: false });
        }, 100);
        return;
      }
    }
    
    // Cleanup anterior si es retry
    if (isRetry) {
      cleanup();
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    // Solo mostrar loading si no tenemos datos del cache
    if (historicNotes.length === 0) {
      setIsLoading(true);
    }
    
    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();
    
    try {
      // Intentar cargar desde la base de datos primero
      const historyEntries = await historyService.getAllHistoryGrouped();
      const convertedNotes = historyEntries.map(convertHistoryEntryToHistoricNote);
      
      // Actualizar estado y cache
      setHistoricNotes(convertedNotes);
      setError(null);
      
      // Guardar en cache
      historyCacheService.setHistoryEntries(historyEntries);
      hasLoadedFromCache.current = true;
      
      console.log(`📚 ${historyEntries.length} entradas de historial cargadas desde servidor`);
      
    } catch (dbError) {
      console.warn('Error al cargar historial desde base de datos, usando fallback:', dbError);
      
      // Fallback a localStorage si no hay cache y falla la DB
      if (historicNotes.length === 0) {
        const localNotes = getUserStoredHistoricNotes(user.id);
        setHistoricNotes(localNotes);
        console.warn('⚠️ Usando datos de localStorage como fallback');
      } else {
        console.warn('⚠️ Error del servidor, manteniendo datos del cache');
      }
      
      setError('Error de conexión - usando datos locales');
    } finally {
      cleanup();
      setIsLoading(false);
    }
  }, [user?.id, cleanup, loadFromCache, historicNotes.length]);

  useEffect(() => {
    if (user?.id) {
      hasLoadedFromCache.current = false;
      fetchHistoryEntries();
    } else {
      setHistoricNotes([]);
      setError(null);
      hasLoadedFromCache.current = false;
    }
    
    // Cleanup al desmontar o cambiar de usuario
    return cleanup;
  }, [user?.id, fetchHistoryEntries, cleanup]);

  const addNoteToHistory = useCallback(async (noteData: Omit<HistoricNote, 'id' | 'timestamp'>) => {
    if (!user?.id) return;
    
    setError(null);
    
    try {
      // Actualización optimista - agregar al estado local inmediatamente
      const tempHistoricNote: HistoricNote = {
        ...noteData,
        id: `temp_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      
      setHistoricNotes(prev => [tempHistoricNote, ...prev]);
      
      // Intentar guardar en la base de datos
      const historyData = convertHistoricNoteToHistoryData(noteData);
      const newEntry = await historyService.createHistoryEntry(historyData);
      const newHistoricNote = convertHistoryEntryToHistoricNote(newEntry);
      
      // Reemplazar entrada temporal con la real
      setHistoricNotes(prev => prev.map(note => 
        note.id === tempHistoricNote.id ? newHistoricNote : note
      ));
      
      // Agregar al cache
      historyCacheService.addHistoryEntry(newEntry);
      
      console.log('✅ Entrada de historial guardada exitosamente');
      
    } catch (dbError) {
      console.warn('Error al guardar en la base de datos, usando fallback:', dbError);
      setError('Error al guardar en la base de datos, usando almacenamiento local');
      
      // Revertir actualización optimista y usar localStorage como fallback
      const newHistoricNote: HistoricNote = {
        ...noteData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      
      const updatedHistory = addUserHistoricNoteEntry(user.id, newHistoricNote);
      setHistoricNotes(updatedHistory);
    }
  }, [user?.id]);

  const deleteNote = useCallback(async (noteId: string) => {
    if (!user?.id) return;
    
    setError(null);
    
    try {
      // Actualización optimista
      setHistoricNotes(prev => prev.filter(note => note.id !== noteId));
      
      // Intentar eliminar de la base de datos
      await historyService.deleteHistoryEntry(noteId);
      
      // Remover del cache
      historyCacheService.removeHistoryEntry(noteId);
      
      console.log('✅ Entrada de historial eliminada exitosamente');
      
    } catch (dbError) {
      console.error('❌ Error al eliminar entrada de historial:', dbError);
      
      // Revertir eliminación optimista y refrescar desde servidor
      await fetchHistoryEntries({ forceRefresh: true });
      
      setError('Error al eliminar de la base de datos');
      throw new Error('Error al eliminar entrada de historial');
    }
  }, [user?.id, fetchHistoryEntries]);

  const clearHistory = useCallback(async () => {
    if (!user?.id) return;
    
    if (!window.confirm(CONFIRMATION_MESSAGES.CLEAR_ALL)) return;
    
    setError(null);
    
    try {
      // Intentar limpiar la base de datos primero
      await historyService.clearHistoryByType();
      
      // Limpiar cache
      historyCacheService.clear();
      
      // Actualizar estado local
      setHistoricNotes([]);
      
      console.log('✅ Historial limpiado exitosamente');
      
    } catch (dbError) {
      console.warn('Error al limpiar la base de datos, usando fallback:', dbError);
      setError('Error al limpiar la base de datos, usando almacenamiento local');
      
      // Fallback a localStorage
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(`${STORAGE_KEYS.HISTORY_PREFIX}${user.id}`);
      }
      
      // Limpiar cache de todas formas
      historyCacheService.clear();
      setHistoricNotes([]);
    }
  }, [user?.id]);

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

  // Funciones adicionales para cache
  const refreshFromServer = useCallback(() => {
    return fetchHistoryEntries({ forceRefresh: true, useCache: false });
  }, [fetchHistoryEntries]);

  const invalidateCache = useCallback(() => {
    historyCacheService.invalidate();
    hasLoadedFromCache.current = false;
    return fetchHistoryEntries({ forceRefresh: true, useCache: false });
  }, [fetchHistoryEntries]);

  const getMostUsedEntries = useCallback((limit?: number) => {
    return historyCacheService.getMostUsedEntries(limit);
  }, []);

  return {
    historicNotes,
    isLoading,
    isLoadingFromCache,
    error,
    addNoteToHistory,
    deleteNote,
    clearHistory,
    loadNoteFromHistory,
    fetchHistoryEntries,
    retryFetch: () => fetchHistoryEntries({ isRetry: true }),
    refreshFromServer,
    invalidateCache,
    getMostUsedEntries,
  };
}; 