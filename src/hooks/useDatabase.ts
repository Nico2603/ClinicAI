import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

// =============================================================================
// CONFIGURACIÓN DE CACHE OPTIMIZADA
// =============================================================================

// Cache persistente y duradero
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos (aumentado de 5 minutos)
const NOTES_CACHE_DURATION = 10 * 60 * 1000; // 10 minutos para notas (más dinámicas)
const LONG_CACHE_DURATION = 60 * 60 * 1000; // 1 hora para datos menos dinámicos

// =============================================================================
// HOOK OPTIMIZADO PARA NOTAS
// =============================================================================

export const useNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Referencias para optimización
  const lastUserIdRef = useRef<string | null>(null);
  const hasFetchedRef = useRef<boolean>(false);
  const notesRef = useRef<Note[]>([]);

  // Cache keys optimizadas
  const getCacheKey = useCallback((userId: string) => `notes_${userId}`, []);
  const getCacheTimestampKey = useCallback((userId: string) => `notes_timestamp_${userId}`, []);

  // Cache inteligente para notas
  const loadNotesFromCache = useCallback((userId: string) => {
    try {
      const cacheKey = getCacheKey(userId);
      const timestampKey = getCacheTimestampKey(userId);
      const cached = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(timestampKey);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < NOTES_CACHE_DURATION) {
          const cachedNotes = JSON.parse(cached);
          setNotes(cachedNotes);
          notesRef.current = cachedNotes;
          setIsLoading(false);
          return cachedNotes;
        }
      }
    } catch (error) {
      console.warn('Error al cargar cache de notas:', error);
    }
    return null;
  }, [getCacheKey, getCacheTimestampKey]);

  const saveNotesToCache = useCallback((userId: string, notesToCache: Note[]) => {
    try {
      const cacheKey = getCacheKey(userId);
      const timestampKey = getCacheTimestampKey(userId);
      localStorage.setItem(cacheKey, JSON.stringify(notesToCache));
      localStorage.setItem(timestampKey, Date.now().toString());
    } catch (error) {
      console.warn('Error al guardar cache de notas:', error);
    }
  }, [getCacheKey, getCacheTimestampKey]);

  // Fetch optimizado con cache y deduplicación
  const fetchNotes = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    // Evitar múltiples llamadas para el mismo usuario
    if (lastUserIdRef.current === user.id && hasFetchedRef.current) {
      return;
    }
    
    // Cargar desde cache primero
    const cachedNotes = loadNotesFromCache(user.id);
    
    try {
      setError(null);
      
      // Si no hay cache, mostrar loading
      if (!cachedNotes) {
        setIsLoading(true);
      }
      
      // Llamada optimizada a la base de datos
      const userNotes = await safeDatabaseCall(
        () => notesService.getUserNotes(user.id),
        {
          timeout: 8000, // Aumentado de 3s a 8s
          maxRetries: 1,
          retryDelay: 1000
        }
      );
      
      // Actualizar estado y cache
      setNotes(userNotes);
      notesRef.current = userNotes;
      saveNotesToCache(user.id, userNotes);
      lastUserIdRef.current = user.id;
      hasFetchedRef.current = true;
    } catch (err) {
      console.error('Error al cargar notas:', err);
      
      // Si hay cache disponible, usarlo en caso de error
      if (cachedNotes) {
        console.log('Usando notas del cache debido a error de red');
        setError(null);
        lastUserIdRef.current = user.id;
        hasFetchedRef.current = true;
      } else {
        setError(getFriendlyErrorMessage(err as Error));
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadNotesFromCache, saveNotesToCache]);

  // Effect optimizado para cambios de usuario
  useEffect(() => {
    if (user?.id && lastUserIdRef.current !== user.id) {
      hasFetchedRef.current = false;
      fetchNotes();
    } else if (!user?.id) {
      setNotes([]);
      notesRef.current = [];
      setIsLoading(false);
      setError(null);
      lastUserIdRef.current = null;
      hasFetchedRef.current = false;
    }
  }, [user?.id, fetchNotes]);

  // CRUD operations optimizadas con updates optimistas
  const createNote = useCallback(async (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Optimistic update
      const tempId = `temp_${Date.now()}`;
      const tempNote = {
        ...noteData,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Note;
      
      setNotes(prev => [tempNote, ...prev]);
      notesRef.current = [tempNote, ...notesRef.current];

      const newNote = await safeDatabaseCall(
        () => notesService.createNote(noteData),
        { timeout: 10000, maxRetries: 1 }
      );
      
      // Reemplazar nota temporal con la real
      setNotes(prev => prev.map(note => note.id === tempId ? newNote : note));
      notesRef.current = notesRef.current.map(note => note.id === tempId ? newNote : note);
      
      // Actualizar cache
      if (user?.id) {
        saveNotesToCache(user.id, notesRef.current);
      }
      
      return newNote;
    } catch (err) {
      // Revertir optimistic update
      setNotes(prev => prev.filter(note => !note.id.startsWith('temp_')));
      notesRef.current = notesRef.current.filter(note => !note.id.startsWith('temp_'));
      
      console.error('Error al crear nota:', err);
      setError('Error al crear la nota');
      throw err;
    }
  }, [user?.id, saveNotesToCache]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    // Backup para revertir en caso de error
    const oldNotes = [...notesRef.current];
    
    try {
      // Optimistic update
      setNotes(prev => prev.map(note => note.id === id ? { ...note, ...updates } : note));
      notesRef.current = notesRef.current.map(note => note.id === id ? { ...note, ...updates } : note);

      const updatedNote = await safeDatabaseCall(
        () => notesService.updateNote(id, updates),
        { timeout: 8000, maxRetries: 1 }
      );
      
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note));
      notesRef.current = notesRef.current.map(note => note.id === id ? updatedNote : note);
      
      // Actualizar cache
      if (user?.id) {
        saveNotesToCache(user.id, notesRef.current);
      }
      
      return updatedNote;
    } catch (err) {
      // Revertir optimistic update
      setNotes(oldNotes);
      notesRef.current = oldNotes;
      
      console.error('Error al actualizar nota:', err);
      setError('Error al actualizar la nota');
      throw err;
    }
  }, [user?.id, saveNotesToCache]);

  const deleteNote = useCallback(async (id: string) => {
    // Backup para revertir en caso de error
    const oldNotes = [...notesRef.current];
    
    try {
      // Optimistic update
      setNotes(prev => prev.filter(note => note.id !== id));
      notesRef.current = notesRef.current.filter(note => note.id !== id);

      await safeDatabaseCall(
        () => notesService.deleteNote(id),
        { timeout: 5000, maxRetries: 1 }
      );
      
      // Actualizar cache
      if (user?.id) {
        saveNotesToCache(user.id, notesRef.current);
      }
    } catch (err) {
      // Revertir optimistic update
      setNotes(oldNotes);
      notesRef.current = oldNotes;
      
      console.error('Error al eliminar nota:', err);
      setError('Error al eliminar la nota');
      throw err;
    }
  }, [user?.id, saveNotesToCache]);

  const searchNotes = useCallback(async (searchText: string) => {
    if (!user?.id) return [];
    
    try {
      const results = await safeDatabaseCall(
        () => notesService.searchNotes(user.id, searchText),
        { timeout: 5000, maxRetries: 1 }
      );
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

// =============================================================================
// HOOK OPTIMIZADO PARA ESPECIALIDADES (CACHE LARGO)
// =============================================================================

export const useSpecialties = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache para especialidades (datos que cambian raramente)
  const loadSpecialtiesFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem('specialties_cache');
      const timestamp = localStorage.getItem('specialties_timestamp');
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < LONG_CACHE_DURATION) {
          const cachedSpecialties = JSON.parse(cached);
          setSpecialties(cachedSpecialties);
          setIsLoading(false);
          return cachedSpecialties;
        }
      }
    } catch (error) {
      console.warn('Error al cargar cache de especialidades:', error);
    }
    return null;
  }, []);

  const saveSpecialtiesToCache = useCallback((specialtiesToCache: Specialty[]) => {
    try {
      localStorage.setItem('specialties_cache', JSON.stringify(specialtiesToCache));
      localStorage.setItem('specialties_timestamp', Date.now().toString());
    } catch (error) {
      console.warn('Error al guardar cache de especialidades:', error);
    }
  }, []);

  const fetchSpecialties = useCallback(async () => {
    // Cargar desde cache primero
    const cachedSpecialties = loadSpecialtiesFromCache();
    
    try {
      setError(null);
      
      // Si no hay cache, mostrar loading
      if (!cachedSpecialties) {
        setIsLoading(true);
      }
      
      const data = await safeDatabaseCall(
        () => specialtiesService.getSpecialties(),
        { timeout: 10000, maxRetries: 1 }
      );
      
      setSpecialties(data);
      saveSpecialtiesToCache(data);
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
      
      // Si hay cache disponible, usarlo
      if (cachedSpecialties) {
        console.log('Usando especialidades del cache debido a error de red');
        setError(null);
      } else {
        setError('Error al cargar las especialidades');
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadSpecialtiesFromCache, saveSpecialtiesToCache]);

  // Solo cargar una vez al montar
  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]); // Incluir fetchSpecialties para satisfacer ESLint

  const createSpecialty = useCallback(async (specialtyData: Omit<Specialty, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newSpecialty = await safeDatabaseCall(
        () => specialtiesService.createSpecialty(specialtyData),
        { timeout: 8000, maxRetries: 1 }
      );
      
      const updatedSpecialties = [...specialties, newSpecialty].sort((a, b) => a.name.localeCompare(b.name));
      setSpecialties(updatedSpecialties);
      saveSpecialtiesToCache(updatedSpecialties);
      
      return newSpecialty;
    } catch (err) {
      console.error('Error al crear especialidad:', err);
      setError('Error al crear la especialidad');
      throw err;
    }
  }, [specialties, saveSpecialtiesToCache]);

  return {
    specialties,
    isLoading,
    error,
    createSpecialty,
    refetch: fetchSpecialties
  };
};

// =============================================================================
// HOOK OPTIMIZADO PARA PLANTILLAS
// =============================================================================

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache para plantillas
  const loadTemplatesFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem('templates_cache');
      const timestamp = localStorage.getItem('templates_timestamp');
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < CACHE_DURATION) {
          const cachedTemplates = JSON.parse(cached);
          setTemplates(cachedTemplates);
          setIsLoading(false);
          return cachedTemplates;
        }
      }
    } catch (error) {
      console.warn('Error al cargar cache de plantillas:', error);
    }
    return null;
  }, []);

  const saveTemplatesToCache = useCallback((templatesToCache: Template[]) => {
    try {
      localStorage.setItem('templates_cache', JSON.stringify(templatesToCache));
      localStorage.setItem('templates_timestamp', Date.now().toString());
    } catch (error) {
      console.warn('Error al guardar cache de plantillas:', error);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    // Cargar desde cache primero
    const cachedTemplates = loadTemplatesFromCache();
    
    try {
      setError(null);
      
      // Si no hay cache, mostrar loading
      if (!cachedTemplates) {
        setIsLoading(true);
      }
      
      const data = await safeDatabaseCall(
        () => templatesService.getActiveTemplates(),
        { timeout: 8000, maxRetries: 1 }
      );
      
      setTemplates(data);
      saveTemplatesToCache(data);
    } catch (err) {
      console.error('Error al cargar plantillas:', err);
      
      // Si hay cache disponible, usarlo
      if (cachedTemplates) {
        console.log('Usando plantillas del cache debido a error de red');
        setError(null);
      } else {
        setError('Error al cargar las plantillas');
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadTemplatesFromCache, saveTemplatesToCache]);

  // Solo cargar una vez al montar
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]); // Incluir fetchTemplates para satisfacer ESLint

  const getTemplatesBySpecialty = useCallback(async (specialtyId: string) => {
    try {
      const data = await safeDatabaseCall(
        () => templatesService.getTemplatesBySpecialty(specialtyId),
        { timeout: 5000, maxRetries: 1 }
      );
      return data;
    } catch (err) {
      console.error('Error al cargar plantillas por especialidad:', err);
      setError('Error al cargar las plantillas');
      return [];
    }
  }, []);

  const createTemplate = useCallback(async (templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTemplate = await safeDatabaseCall(
        () => templatesService.createTemplate(templateData),
        { timeout: 10000, maxRetries: 1 }
      );
      
      const updatedTemplates = [...templates, newTemplate].sort((a, b) => a.name.localeCompare(b.name));
      setTemplates(updatedTemplates);
      saveTemplatesToCache(updatedTemplates);
      
      return newTemplate;
    } catch (err) {
      console.error('Error al crear plantilla:', err);
      setError('Error al crear la plantilla');
      throw err;
    }
  }, [templates, saveTemplatesToCache]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<Template>) => {
    try {
      const updatedTemplate = await safeDatabaseCall(
        () => templatesService.updateTemplate(id, updates),
        { timeout: 8000, maxRetries: 1 }
      );
      
      const updatedTemplates = templates.map(template => template.id === id ? updatedTemplate : template);
      setTemplates(updatedTemplates);
      saveTemplatesToCache(updatedTemplates);
      
      return updatedTemplate;
    } catch (err) {
      console.error('Error al actualizar plantilla:', err);
      setError('Error al actualizar la plantilla');
      throw err;
    }
  }, [templates, saveTemplatesToCache]);

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

// =============================================================================
// HOOK OPTIMIZADO PARA PLANTILLAS DE USUARIO
// =============================================================================

export const useUserTemplates = () => {
  const { user } = useAuth();
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTimeout, setHasTimeout] = useState(false);

  // Referencias optimizadas
  const userIdRef = useRef<string | null>(null);
  const hasFetchedRef = useRef<boolean>(false);
  const templatesRef = useRef<UserTemplate[]>([]);

  // Claves de cache memoizadas
  const cacheKeys = useMemo(() => {
    if (!user?.id) return { cacheKey: '', timestampKey: '' };
    return {
      cacheKey: `user_templates_${user.id}`,
      timestampKey: `user_templates_timestamp_${user.id}`
    };
  }, [user?.id]);

  // Cache inteligente para plantillas de usuario
  const loadFromCache = useCallback(() => {
    if (!user?.id) return null;
    
    try {
      const { cacheKey, timestampKey } = cacheKeys;
      const cached = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(timestampKey);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < CACHE_DURATION) {
          const templates = JSON.parse(cached);
          setUserTemplates(templates);
          templatesRef.current = templates;
          setIsLoading(false);
          return templates;
        }
      }
    } catch (error) {
      console.warn('Error al cargar cache de plantillas:', error);
    }
    return null;
  }, [user?.id, cacheKeys]);

  const saveToCache = useCallback((templates: UserTemplate[]) => {
    if (!user?.id) return;
    
    try {
      const { cacheKey, timestampKey } = cacheKeys;
      localStorage.setItem(cacheKey, JSON.stringify(templates));
      localStorage.setItem(timestampKey, Date.now().toString());
    } catch (error) {
      console.warn('Error al guardar cache de plantillas:', error);
    }
  }, [user?.id, cacheKeys]);

  const fetchUserTemplates = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    // Evitar re-ejecuciones si el usuario no cambió y ya se ejecutó
    if (userIdRef.current === user.id && hasFetchedRef.current) {
      return;
    }
    
    // Cargar desde cache primero
    const cachedTemplates = loadFromCache();
    
    try {
      setError(null);
      setHasTimeout(false);
      
      // Si no hay cache, mostrar loading
      if (!cachedTemplates) {
        setIsLoading(true);
      }
      
      // Llamada optimizada con timeout aumentado
      const data = await safeDatabaseCall(
        () => userTemplatesService.getUserTemplates(user.id),
        {
          timeout: 8000, // Aumentado de 3s a 8s
          maxRetries: 1,
          retryDelay: 1000
        }
      );
      
      // Actualizar estado y cache
      setUserTemplates(data);
      templatesRef.current = data;
      saveToCache(data);
      userIdRef.current = user.id;
      hasFetchedRef.current = true;
    } catch (err) {
      console.error('Error al cargar plantillas del usuario:', err);
      
      // Si hay cache disponible, usarlo en caso de error
      if (cachedTemplates) {
        console.log('Usando plantillas del cache debido a error de red');
        setError(null);
        userIdRef.current = user.id;
        hasFetchedRef.current = true;
      } else {
        // Sin cache, mostrar error
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

  // Effect optimizado para cambios de usuario
  useEffect(() => {
    if (user?.id && userIdRef.current !== user.id) {
      hasFetchedRef.current = false;
      fetchUserTemplates();
    } else if (!user?.id) {
      setUserTemplates([]);
      templatesRef.current = [];
      setIsLoading(false);
      setError(null);
      userIdRef.current = null;
      hasFetchedRef.current = false;
    }
  }, [user?.id, fetchUserTemplates]);

  // CRUD operations optimizadas
  const createUserTemplate = useCallback(async (templateData: Omit<UserTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Optimistic update
      const tempId = `temp_${Date.now()}`;
      const tempTemplate = {
        ...templateData,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as UserTemplate;
      
      setUserTemplates(prev => [tempTemplate, ...prev]);
      templatesRef.current = [tempTemplate, ...templatesRef.current];

      const newTemplate = await safeDatabaseCall(
        () => userTemplatesService.createUserTemplate(templateData),
        {
          timeout: 45000, // Timeout largo para creación (incluye procesamiento OpenAI)
          maxRetries: 1,
          retryDelay: 2000
        }
      );
      
      // Reemplazar template temporal con el real
      setUserTemplates(prev => prev.map(t => t.id === tempId ? newTemplate : t));
      templatesRef.current = templatesRef.current.map(t => t.id === tempId ? newTemplate : t);
      
      // Actualizar cache
      if (user?.id) {
        saveToCache(templatesRef.current);
      }
      
      return newTemplate;
    } catch (err) {
      // Revertir optimistic update
      setUserTemplates(prev => prev.filter(t => !t.id.startsWith('temp_')));
      templatesRef.current = templatesRef.current.filter(t => !t.id.startsWith('temp_'));
      
      console.error('Error al crear plantilla:', err);
      const friendlyMessage = getFriendlyErrorMessage(err as Error);
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  }, [user?.id, saveToCache]);

  const updateUserTemplate = useCallback(async (id: string, updates: Partial<Omit<UserTemplate, 'id' | 'created_at'>>) => {
    // Backup para revertir en caso de error
    const oldTemplates = [...templatesRef.current];
    
    try {
      // Optimistic update
      setUserTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      templatesRef.current = templatesRef.current.map(t => t.id === id ? { ...t, ...updates } : t);

      const updatedTemplate = await safeDatabaseCall(
        () => userTemplatesService.updateUserTemplate(id, updates),
        { timeout: 15000, maxRetries: 1 }
      );
      
      setUserTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));
      templatesRef.current = templatesRef.current.map(t => t.id === id ? updatedTemplate : t);
      
      // Actualizar cache
      if (user?.id) {
        saveToCache(templatesRef.current);
      }
      
      return updatedTemplate;
    } catch (err) {
      // Revertir optimistic update
      setUserTemplates(oldTemplates);
      templatesRef.current = oldTemplates;
      
      console.error('Error al actualizar plantilla:', err);
      const friendlyMessage = getFriendlyErrorMessage(err as Error);
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  }, [user?.id, saveToCache]);

  const deleteUserTemplate = useCallback(async (id: string) => {
    // Backup para revertir en caso de error
    const oldTemplates = [...templatesRef.current];
    
    try {
      // Optimistic update
      setUserTemplates(prev => prev.filter(t => t.id !== id));
      templatesRef.current = templatesRef.current.filter(t => t.id !== id);

      await safeDatabaseCall(
        () => userTemplatesService.deleteUserTemplate(id),
        { timeout: 5000, maxRetries: 1 }
      );
      
      // Actualizar cache
      if (user?.id) {
        saveToCache(templatesRef.current);
      }
      
      return true;
    } catch (err) {
      // Revertir optimistic update
      setUserTemplates(oldTemplates);
      templatesRef.current = oldTemplates;
      
      console.error('Error al eliminar plantilla:', err);
      const friendlyMessage = getFriendlyErrorMessage(err as Error);
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  }, [user?.id, saveToCache]);

  const renameUserTemplate = useCallback(async (id: string, newName: string) => {
    return updateUserTemplate(id, { name: newName });
  }, [updateUserTemplate]);

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