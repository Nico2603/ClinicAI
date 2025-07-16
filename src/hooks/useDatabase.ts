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

  // Claves para localStorage
  const getCacheKey = useCallback((userId: string) => `user_templates_${userId}`, []);
  const getCacheTimestampKey = useCallback((userId: string) => `user_templates_timestamp_${userId}`, []);

  // Cargar desde caché local
  const loadFromCache = useCallback((userId: string) => {
    try {
      const cacheKey = getCacheKey(userId);
      const timestampKey = getCacheTimestampKey(userId);
      const cached = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(timestampKey);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        // Caché válido por 5 minutos
        if (age < 5 * 60 * 1000) {
          const templates = JSON.parse(cached);
          setUserTemplates(templates);
          setIsLoading(false);
          return templates;
        }
      }
    } catch (error) {
      console.warn('Error al cargar caché de plantillas:', error);
    }
    return null;
  }, [getCacheKey, getCacheTimestampKey]);

  // Guardar en caché local
  const saveToCache = useCallback((userId: string, templates: UserTemplate[]) => {
    try {
      const cacheKey = getCacheKey(userId);
      const timestampKey = getCacheTimestampKey(userId);
      localStorage.setItem(cacheKey, JSON.stringify(templates));
      localStorage.setItem(timestampKey, Date.now().toString());
    } catch (error) {
      console.warn('Error al guardar caché de plantillas:', error);
    }
  }, [getCacheKey, getCacheTimestampKey]);

  const fetchUserTemplates = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    // Evitar re-ejecuciones si el user.id no cambió y ya se ejecutó
    if (userIdRef.current === user.id && hasFetchedRef.current) {
      return;
    }
    
    // Cargar desde caché primero para mostrar datos inmediatamente
    const cachedTemplates = loadFromCache(user.id);
    
    try {
      setError(null);
      setHasTimeout(false);
      
      // Si no hay caché, mostrar loading
      if (!cachedTemplates) {
        setIsLoading(true);
      }
      
      // Intentar cargar desde base de datos con timeout reducido
      const data = await safeDatabaseCall(
        () => userTemplatesService.getUserTemplates(user.id),
        {
          timeout: 3000, // Reducido a 3 segundos
          maxRetries: 1,  // Solo 1 reintento
          retryDelay: 500 // 0.5 segundos entre reintentos
        }
      );
      
      // Actualizar estado y caché
      setUserTemplates(data);
      saveToCache(user.id, data);
      userIdRef.current = user.id;
      hasFetchedRef.current = true;
    } catch (err) {
      console.error('Error al cargar plantillas del usuario:', err);
      
      // Si hay caché disponible, usarlo en caso de error
      if (cachedTemplates) {
        console.log('Usando plantillas del caché debido a error de red');
        // Ya están cargadas del caché, solo limpiar el error
        setError(null);
        userIdRef.current = user.id;
        hasFetchedRef.current = true;
      } else {
        // Sin caché, mostrar error
        if (err instanceof DatabaseTimeoutError) {
          setHasTimeout(true);
          setError('Carga lenta. Verificando conexión...');
        } else if (err instanceof DatabaseRetryError) {
          setError('Problema de conectividad. Usando modo offline.');
        } else {
          setError(getFriendlyErrorMessage(err as Error));
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadFromCache, saveToCache]);

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
          timeout: 45000, // 45 segundos para crear (incluye procesamiento OpenAI + operaciones BD)
          maxRetries: 1,  // Reducir reintentos para evitar demoras adicionales
          retryDelay: 1000
        }
      );
      
      // Actualizar estado local
      setUserTemplates(prev => [newTemplate, ...prev]);
      
      // Actualizar caché si hay usuario
      if (user?.id) {
        const updatedTemplates = [newTemplate, ...userTemplates];
        saveToCache(user.id, updatedTemplates);
      }
      
      return newTemplate;
    } catch (err) {
      console.error('Error al crear plantilla:', err);
      const friendlyMessage = getFriendlyErrorMessage(err as Error);
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  }, [user?.id, userTemplates, saveToCache]);

  const updateUserTemplate = useCallback(async (id: string, updates: Partial<Omit<UserTemplate, 'id' | 'created_at'>>) => {
    try {
      const updatedTemplate = await safeDatabaseCall(
        () => userTemplatesService.updateUserTemplate(id, updates),
        {
          timeout: 15000, // 15 segundos para actualizar (menos que crear pero más que lo original)
          maxRetries: 2
        }
      );
      
      // Actualizar estado local
      setUserTemplates(prev => 
        prev.map(template => 
          template.id === id ? updatedTemplate : template
        )
      );
      
      // Actualizar caché
      if (user?.id) {
        const updatedTemplates = userTemplates.map(template => 
          template.id === id ? updatedTemplate : template
        );
        saveToCache(user.id, updatedTemplates);
      }
      
      return updatedTemplate;
    } catch (err) {
      console.error('Error al actualizar plantilla:', err);
      const friendlyMessage = getFriendlyErrorMessage(err as Error);
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  }, [user?.id, userTemplates, saveToCache]);

  const deleteUserTemplate = useCallback(async (id: string) => {
    try {
      await safeDatabaseCall(
        () => userTemplatesService.deleteUserTemplate(id),
        {
          timeout: 5000,
          maxRetries: 1
        }
      );
      
      // Actualizar estado local
      setUserTemplates(prev => prev.filter(template => template.id !== id));
      
      // Actualizar caché
      if (user?.id) {
        const updatedTemplates = userTemplates.filter(template => template.id !== id);
        saveToCache(user.id, updatedTemplates);
      }
      
      return true;
    } catch (err) {
      console.error('Error al eliminar plantilla:', err);
      const friendlyMessage = getFriendlyErrorMessage(err as Error);
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  }, [user?.id, userTemplates, saveToCache]);

  const renameUserTemplate = useCallback(async (id: string, newName: string) => {
    try {
      const updatedTemplate = await safeDatabaseCall(
        () => userTemplatesService.updateUserTemplate(id, { name: newName }),
        {
          timeout: 5000,
          maxRetries: 1
        }
      );
      
      // Actualizar estado local
      setUserTemplates(prev => 
        prev.map(template => 
          template.id === id ? updatedTemplate : template
        )
      );
      
      // Actualizar caché
      if (user?.id) {
        const updatedTemplates = userTemplates.map(template => 
          template.id === id ? updatedTemplate : template
        );
        saveToCache(user.id, updatedTemplates);
      }
      
      return updatedTemplate;
    } catch (err) {
      console.error('Error al renombrar plantilla:', err);
      const friendlyMessage = getFriendlyErrorMessage(err as Error);
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  }, [user?.id, userTemplates, saveToCache]);

  return {
    userTemplates,
    isLoading,
    error,
    hasTimeout,
    createUserTemplate,
    updateUserTemplate,
    deleteUserTemplate,
    renameUserTemplate,
    refreshTemplates: fetchUserTemplates
  };
}; 