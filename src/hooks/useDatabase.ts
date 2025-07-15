import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  notesService, 
  specialtiesService, 
  templatesService, 
  userTemplatesService,
  type Note, 
  type Specialty, 
  type Template, 
  type UserTemplate 
} from '@/lib/services/databaseService';
import { 
  safeDatabaseCall, 
  getFriendlyErrorMessage,
  DatabaseTimeoutError,
  DatabaseRetryError 
} from '@/lib/utils/databaseUtils';

// Hook para manejar notas
export const useNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const userNotes = await notesService.getUserNotes(user.id);
      setNotes(userNotes);
      setError(null);
    } catch (err) {
      console.error('Error al cargar notas:', err);
      setError('Error al cargar las notas');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = useCallback(async (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newNote = await notesService.createNote(noteData);
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      console.error('Error al crear nota:', err);
      setError('Error al crear la nota');
      throw err;
    }
  }, []);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    try {
      const updatedNote = await notesService.updateNote(id, updates);
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note));
      return updatedNote;
    } catch (err) {
      console.error('Error al actualizar nota:', err);
      setError('Error al actualizar la nota');
      throw err;
    }
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    try {
      await notesService.deleteNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (err) {
      console.error('Error al eliminar nota:', err);
      setError('Error al eliminar la nota');
      throw err;
    }
  }, []);

  const searchNotes = useCallback(async (searchText: string) => {
    if (!user?.id) return [];
    
    try {
      const results = await notesService.searchNotes(user.id, searchText);
      return results;
    } catch (err) {
      console.error('Error al buscar notas:', err);
      setError('Error al buscar notas');
      return [];
    }
  }, [user?.id]);

  return {
    notes,
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    refetch: fetchNotes
  };
};

// Hook para manejar especialidades
export const useSpecialties = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecialties = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await specialtiesService.getSpecialties();
      setSpecialties(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
      setError('Error al cargar las especialidades');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  const createSpecialty = useCallback(async (specialtyData: Omit<Specialty, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newSpecialty = await specialtiesService.createSpecialty(specialtyData);
      setSpecialties(prev => [...prev, newSpecialty].sort((a, b) => a.name.localeCompare(b.name)));
      return newSpecialty;
    } catch (err) {
      console.error('Error al crear especialidad:', err);
      setError('Error al crear la especialidad');
      throw err;
    }
  }, []);

  return {
    specialties,
    isLoading,
    error,
    createSpecialty,
    refetch: fetchSpecialties
  };
};

// Hook para manejar plantillas
export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await templatesService.getActiveTemplates();
      setTemplates(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar plantillas:', err);
      setError('Error al cargar las plantillas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const getTemplatesBySpecialty = useCallback(async (specialtyId: string) => {
    try {
      const data = await templatesService.getTemplatesBySpecialty(specialtyId);
      return data;
    } catch (err) {
      console.error('Error al cargar plantillas por especialidad:', err);
      setError('Error al cargar las plantillas');
      return [];
    }
  }, []);

  const createTemplate = useCallback(async (templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTemplate = await templatesService.createTemplate(templateData);
      setTemplates(prev => [...prev, newTemplate].sort((a, b) => a.name.localeCompare(b.name)));
      return newTemplate;
    } catch (err) {
      console.error('Error al crear plantilla:', err);
      setError('Error al crear la plantilla');
      throw err;
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, updates: Partial<Template>) => {
    try {
      const updatedTemplate = await templatesService.updateTemplate(id, updates);
      setTemplates(prev => prev.map(template => template.id === id ? updatedTemplate : template));
      return updatedTemplate;
    } catch (err) {
      console.error('Error al actualizar plantilla:', err);
      setError('Error al actualizar la plantilla');
      throw err;
    }
  }, []);

  return {
    templates,
    isLoading,
    error,
    getTemplatesBySpecialty,
    createTemplate,
    updateTemplate,
    refetch: fetchTemplates
  };
};

// Eliminado hook de perfil de usuario

// Hook para manejar plantillas personalizadas del usuario
export const useUserTemplates = () => {
  const { user } = useAuth();
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTimeout, setHasTimeout] = useState(false);

  // Ref para evitar re-ejecuciones innecesarias
  const userIdRef = useRef<string | null>(null);
  const hasFetchedRef = useRef<boolean>(false);

  const fetchUserTemplates = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    // Evitar re-ejecuciones si el user.id no cambió y ya se ejecutó
    if (userIdRef.current === user.id && hasFetchedRef.current) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setHasTimeout(false);
      
      const data = await safeDatabaseCall(
        () => userTemplatesService.getUserTemplates(user.id),
        {
          timeout: 15000, // 15 segundos de timeout
          maxRetries: 2,  // Máximo 2 reintentos
          retryDelay: 1500 // 1.5 segundos entre reintentos
        }
      );
      
      setUserTemplates(data);
      userIdRef.current = user.id;
      hasFetchedRef.current = true;
    } catch (err) {
      console.error('Error al cargar plantillas del usuario:', err);
      
      if (err instanceof DatabaseTimeoutError) {
        setHasTimeout(true);
        setError('La carga está tardando demasiado. Haz clic en "Reintentar" para intentar nuevamente.');
      } else if (err instanceof DatabaseRetryError) {
        setError('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      } else {
        setError(getFriendlyErrorMessage(err as Error));
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]); // Usar optional chaining para manejar user null

  // Efecto separado para manejar cambios de usuario
  useEffect(() => {
    // Solo ejecutar si el usuario cambió o es la primera vez
    if (user?.id && userIdRef.current !== user.id) {
      hasFetchedRef.current = false; // Reset flag cuando cambia el usuario
      fetchUserTemplates();
    } else if (!user?.id) {
      // Si no hay usuario, limpiar estado
      setUserTemplates([]);
      setIsLoading(false);
      setError(null);
      userIdRef.current = null;
      hasFetchedRef.current = false;
    }
  }, [user?.id, fetchUserTemplates]);

  const createUserTemplate = useCallback(async (templateData: Omit<UserTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTemplate = await safeDatabaseCall(
        () => userTemplatesService.createUserTemplate(templateData),
        {
          timeout: 10000,
          maxRetries: 1
        }
      );
      setUserTemplates(prev => [newTemplate, ...prev]);
      return newTemplate;
    } catch (err) {
      console.error('Error al crear plantilla:', err);
      const friendlyMessage = getFriendlyErrorMessage(err as Error);
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  }, []);

  const updateUserTemplate = useCallback(async (id: string, updates: Partial<Omit<UserTemplate, 'id' | 'created_at'>>) => {
    try {
      const updatedTemplate = await safeDatabaseCall(
        () => userTemplatesService.updateUserTemplate(id, updates),
        {
          timeout: 10000,
          maxRetries: 1
        }
      );
      setUserTemplates(prev => prev.map(template => template.id === id ? updatedTemplate : template));
      return updatedTemplate;
    } catch (err) {
      console.error('Error al actualizar plantilla:', err);
      const friendlyMessage = getFriendlyErrorMessage(err as Error);
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  }, []);

  const deleteUserTemplate = useCallback(async (id: string) => {
    try {
      await safeDatabaseCall(
        () => userTemplatesService.deleteUserTemplate(id),
        {
          timeout: 10000,
          maxRetries: 1
        }
      );
      setUserTemplates(prev => prev.filter(template => template.id !== id));
    } catch (err) {
      console.error('Error al eliminar plantilla:', err);
      const friendlyMessage = getFriendlyErrorMessage(err as Error);
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  }, []);

  const renameUserTemplate = useCallback(async (id: string, newName: string) => {
    try {
      const renamedTemplate = await safeDatabaseCall(
        () => userTemplatesService.renameUserTemplate(id, newName),
        {
          timeout: 10000,
          maxRetries: 1
        }
      );
      setUserTemplates(prev => prev.map(template => template.id === id ? renamedTemplate : template));
      return renamedTemplate;
    } catch (err) {
      console.error('Error al renombrar plantilla:', err);
      const friendlyMessage = getFriendlyErrorMessage(err as Error);
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  }, []);

  // Función de refetch manual que fuerza una nueva carga
  const refetch = useCallback(() => {
    hasFetchedRef.current = false;
    fetchUserTemplates();
  }, [fetchUserTemplates]);

  return {
    userTemplates,
    isLoading,
    error,
    hasTimeout,
    createUserTemplate,
    updateUserTemplate,
    deleteUserTemplate,
    renameUserTemplate,
    refetch
  };
}; 