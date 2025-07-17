import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  notesService, 
  specialtiesService, 
  userTemplatesService,
  type Note, 
  type Specialty, 
  type UserTemplate 
} from '@/lib/services/databaseService';
import { simpleDbCall, getSimpleErrorMessage } from '@/lib/utils/simpleDatabaseUtils';

// Hook simple para notas
export const useSimpleNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Flag para evitar múltiples llamadas concurrentes
  const isLoadingRef = useRef(false);

  const fetchNotes = useCallback(async () => {
    if (!user?.id || isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      const userNotes = await simpleDbCall(() => notesService.getUserNotes(user.id));
      setNotes(userNotes);
    } catch (err) {
      console.error('Error al cargar notas:', err);
      setError(getSimpleErrorMessage(err));
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchNotes();
    } else {
      setNotes([]);
      setError(null);
    }
  }, [user?.id]); // Removed fetchNotes dependency to prevent infinite loops

  const createNote = useCallback(async (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    try {
      const newNote = await simpleDbCall(() => notesService.createNote(noteData));
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      const errorMessage = getSimpleErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.id]);

  const deleteNote = useCallback(async (noteId: string) => {
    try {
      await simpleDbCall(() => notesService.deleteNote(noteId));
      setNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (err) {
      const errorMessage = getSimpleErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    notes,
    isLoading,
    error,
    fetchNotes,
    createNote,
    deleteNote,
  };
};

// Hook simple para especialidades
export const useSimpleSpecialties = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecialties = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await simpleDbCall(() => specialtiesService.getSpecialties());
      setSpecialties(data);
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
      setError(getSimpleErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  const createSpecialty = useCallback(async (specialtyData: Omit<Specialty, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newSpecialty = await simpleDbCall(() => specialtiesService.createSpecialty(specialtyData));
      setSpecialties(prev => [...prev, newSpecialty].sort((a, b) => a.name.localeCompare(b.name)));
      return newSpecialty;
    } catch (err) {
      const errorMessage = getSimpleErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    specialties,
    isLoading,
    error,
    fetchSpecialties,
    createSpecialty,
  };
};

// Hook simple para plantillas de usuario
export const useSimpleUserTemplates = () => {
  const { user } = useAuth();
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);
  
  // Flag para evitar múltiples llamadas concurrentes
  const isLoadingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetLoadingState = useCallback(() => {
    setIsLoading(false);
    setIsTimedOut(false);
    isLoadingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const fetchUserTemplates = useCallback(async (isRetry = false) => {
    if (!user?.id || (isLoadingRef.current && !isRetry)) return;
    
    // Si es un retry, forzar reset del estado
    if (isRetry) {
      resetLoadingState();
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    setIsTimedOut(false);
    
    // Crear nuevo AbortController para esta petición
    abortControllerRef.current = new AbortController();
    
    // Timeout de 1.5 segundos
    timeoutRef.current = setTimeout(() => {
      setIsTimedOut(true);
      console.warn('⚠️ Timeout al cargar plantillas después de 1.5 segundos - recargando página');
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      resetLoadingState();
      // Recargar página completa automáticamente
      window.location.reload();
    }, 1500);
    
    try {
      const templates = await Promise.race([
        simpleDbCall(() => userTemplatesService.getUserTemplates(user.id)),
        new Promise((_, reject) => {
          if (abortControllerRef.current) {
            abortControllerRef.current.signal.addEventListener('abort', () => {
              reject(new Error('Operación cancelada por timeout'));
            });
          }
        })
      ]) as UserTemplate[];
      
      // Si llegamos aquí, la petición fue exitosa
      clearTimeout(timeoutRef.current!);
      timeoutRef.current = null;
      
      setUserTemplates(templates);
      setError(null);
      setIsTimedOut(false);
    } catch (err: any) {
      // Solo mostrar error si no fue cancelado por timeout
      if (err.message !== 'Operación cancelada por timeout') {
        console.error('Error al cargar plantillas:', err);
        setError(getSimpleErrorMessage(err));
      }
    } finally {
      resetLoadingState();
    }
  }, [user?.id, resetLoadingState]);

  useEffect(() => {
    if (user?.id) {
      fetchUserTemplates();
    } else {
      setUserTemplates([]);
      setError(null);
      setIsTimedOut(false);
    }
    
    // Cleanup al desmontar o cambiar de usuario
    return () => {
      resetLoadingState();
    };
  }, [user?.id, fetchUserTemplates, resetLoadingState]);

  const createUserTemplate = useCallback(async (templateData: Omit<UserTemplate, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    try {
      console.log('🔄 Iniciando creación de plantilla con RPC optimizada...');
      const startTime = Date.now();
      
      // Usar timeout por defecto (60s) que es más apropiado
      const newTemplate = await simpleDbCall(() => userTemplatesService.createUserTemplate({
        ...templateData,
        user_id: user.id
      })); 
      
      const duration = Date.now() - startTime;
      console.log(`✅ Plantilla creada exitosamente en ${duration}ms`);
      
      setUserTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (err) {
      console.error('❌ Error al crear plantilla:', err);
      const errorMessage = getSimpleErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.id]);

  const updateUserTemplate = useCallback(async (templateId: string, templateData: Partial<UserTemplate>) => {
    try {
      const updatedTemplate = await simpleDbCall(() => userTemplatesService.updateUserTemplate(templateId, templateData));
      setUserTemplates(prev => prev.map(template => 
        template.id === templateId ? updatedTemplate : template
      ));
      return updatedTemplate;
    } catch (err) {
      const errorMessage = getSimpleErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteUserTemplate = useCallback(async (templateId: string) => {
    try {
      await simpleDbCall(() => userTemplatesService.deleteUserTemplate(templateId));
      setUserTemplates(prev => prev.filter(template => template.id !== templateId));
    } catch (err) {
      const errorMessage = getSimpleErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    userTemplates,
    isLoading,
    error,
    isTimedOut,
    fetchUserTemplates,
    retryFetch: () => fetchUserTemplates(true),
    resetLoadingState,
    createUserTemplate,
    updateUserTemplate,
    deleteUserTemplate,
  };
}; 