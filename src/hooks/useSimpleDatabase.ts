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
import { templateCacheService } from '@/lib/services/templateCacheService';

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
      const userNotes = await simpleDbCall(() => notesService.getUserNotes(user.id), {
        operation: 'cargar notas'
      });
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
      const newNote = await simpleDbCall(() => notesService.createNote(noteData), {
        operation: 'crear nota'
      });
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
      await simpleDbCall(() => notesService.deleteNote(noteId), {
        operation: 'eliminar nota'
      });
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
      const data = await simpleDbCall(() => specialtiesService.getSpecialties(), {
        operation: 'cargar especialidades'
      });
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
      const newSpecialty = await simpleDbCall(() => specialtiesService.createSpecialty(specialtyData), {
        operation: 'crear especialidad'
      });
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

// Hook optimizado para plantillas de usuario con cache inteligente
export const useSimpleUserTemplates = () => {
  const { user } = useAuth();
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(false);
  
  // Flag para evitar múltiples llamadas concurrentes
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasLoadedFromCache = useRef(false);

  // Configurar cache para el usuario
  useEffect(() => {
    if (user?.id) {
      templateCacheService.setUser(user.id);
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
    const cachedTemplates = templateCacheService.getTemplates();
    
    if (cachedTemplates && cachedTemplates.length > 0) {
      setUserTemplates(cachedTemplates);
      setError(null);
      hasLoadedFromCache.current = true;
      setIsLoadingFromCache(false);
      console.log('⚡ Plantillas cargadas desde cache local');
      return true;
    }
    
    setIsLoadingFromCache(false);
    return false;
  }, [user?.id]);

  const fetchUserTemplates = useCallback(async (options: { 
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
          fetchUserTemplates({ forceRefresh: true, useCache: false });
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
    if (userTemplates.length === 0) {
      setIsLoading(true);
    }
    
    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();
    
    try {
      const templates = await simpleDbCall(
        () => userTemplatesService.getUserTemplates(user.id),
        { 
          timeout: 15000, // 15 segundos timeout más razonable
          operation: 'cargar plantillas del usuario'
        }
      );
      
      // Actualizar estado y cache
      setUserTemplates(templates);
      setError(null);
      
      // Guardar en cache
      templateCacheService.setTemplates(templates);
      hasLoadedFromCache.current = true;
      
      console.log(`📚 ${templates.length} plantillas cargadas desde servidor`);
      
    } catch (err: any) {
      console.error('Error al cargar plantillas:', err);
      const errorMessage = getSimpleErrorMessage(err);
      setError(errorMessage);
      
      // Si falló la carga del servidor pero tenemos cache, mantener cache
      if (userTemplates.length > 0) {
        console.warn('⚠️ Error del servidor, manteniendo datos del cache');
      }
    } finally {
      cleanup();
      setIsLoading(false);
    }
  }, [user?.id, cleanup, loadFromCache, userTemplates.length]);

  useEffect(() => {
    if (user?.id) {
      hasLoadedFromCache.current = false;
      fetchUserTemplates();
    } else {
      setUserTemplates([]);
      setError(null);
      hasLoadedFromCache.current = false;
    }
    
    // Cleanup al desmontar o cambiar de usuario
    return cleanup;
  }, [user?.id, fetchUserTemplates, cleanup]);

  const createUserTemplate = useCallback(async (templateData: Omit<UserTemplate, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    // Validaciones básicas
    if (!templateData.name?.trim()) {
      throw new Error('El nombre de la plantilla es requerido');
    }
    if (!templateData.content?.trim()) {
      throw new Error('El contenido de la plantilla es requerido');
    }

    try {
      console.log('🔄 Iniciando creación de plantilla optimizada...');
      const startTime = Date.now();
      
      // Crear plantilla con timeout apropiado para operaciones de escritura
      const newTemplate = await simpleDbCall(
        () => userTemplatesService.createUserTemplate({
          ...templateData,
          user_id: user.id,
          name: templateData.name.trim(),
          content: templateData.content.trim()
        }),
        { 
          timeout: 20000, // 20 segundos para creación
          retries: 1, // Solo 1 reintento para operaciones de escritura
          operation: 'crear plantilla'
        }
      );
      
      const duration = Date.now() - startTime;
      console.log(`✅ Plantilla creada exitosamente en ${duration}ms`);
      
      // Actualización optimista del estado
      setUserTemplates(prev => [newTemplate, ...prev]);
      setError(null); // Limpiar errores previos
      
      // Actualizar cache
      templateCacheService.addTemplate(newTemplate);
      
      return newTemplate;
    } catch (err) {
      console.error('❌ Error al crear plantilla:', err);
      const errorMessage = getSimpleErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.id]);

  const updateUserTemplate = useCallback(async (templateId: string, templateData: Partial<UserTemplate>) => {
    if (!templateId) throw new Error('ID de plantilla requerido');
    
    try {
      // Actualización optimista
      setUserTemplates(prev => prev.map(template => 
        template.id === templateId 
          ? { ...template, ...templateData, updated_at: new Date().toISOString() }
          : template
      ));
      
      const updatedTemplate = await simpleDbCall(
        () => userTemplatesService.updateUserTemplate(templateId, templateData),
        { 
          timeout: 15000,
          operation: 'actualizar plantilla'
        }
      );
      
      // Actualizar con datos reales del servidor
      setUserTemplates(prev => prev.map(template => 
        template.id === templateId ? updatedTemplate : template
      ));
      
      // Actualizar cache
      templateCacheService.updateTemplate(updatedTemplate);
      
      return updatedTemplate;
    } catch (err) {
      console.error('❌ Error al actualizar plantilla:', err);
      
      // Revertir actualización optimista
      await fetchUserTemplates({ forceRefresh: true });
      
      const errorMessage = getSimpleErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchUserTemplates]);

  const deleteUserTemplate = useCallback(async (templateId: string) => {
    if (!templateId) throw new Error('ID de plantilla requerido');
    
    try {
      // Actualización optimista
      setUserTemplates(prev => prev.filter(template => template.id !== templateId));
      
      await simpleDbCall(
        () => userTemplatesService.deleteUserTemplate(templateId),
        { 
          timeout: 10000,
          operation: 'eliminar plantilla'
        }
      );
      
      // Remover del cache
      templateCacheService.removeTemplate(templateId);
      
      console.log('✅ Plantilla eliminada exitosamente');
    } catch (err) {
      console.error('❌ Error al eliminar plantilla:', err);
      
      // Revertir eliminación optimista
      await fetchUserTemplates({ forceRefresh: true });
      
      const errorMessage = getSimpleErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchUserTemplates]);

  // Funciones adicionales para cache
  const refreshFromServer = useCallback(() => {
    return fetchUserTemplates({ forceRefresh: true, useCache: false });
  }, [fetchUserTemplates]);

  const invalidateCache = useCallback(() => {
    templateCacheService.invalidate();
    hasLoadedFromCache.current = false;
    return fetchUserTemplates({ forceRefresh: true, useCache: false });
  }, [fetchUserTemplates]);

  const getMostUsedTemplates = useCallback((limit?: number) => {
    return templateCacheService.getMostUsedTemplates(limit);
  }, []);

  return {
    userTemplates,
    isLoading,
    isLoadingFromCache,
    error,
    fetchUserTemplates,
    retryFetch: () => fetchUserTemplates({ isRetry: true }),
    refreshFromServer,
    invalidateCache,
    getMostUsedTemplates,
    createUserTemplate,
    updateUserTemplate,
    deleteUserTemplate,
  };
}; 