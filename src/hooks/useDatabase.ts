import { useState, useEffect, useCallback } from 'react';
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

  const fetchUserTemplates = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const data = await userTemplatesService.getUserTemplates(user.id);
      setUserTemplates(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar plantillas del usuario:', err);
      setError('Error al cargar las plantillas');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserTemplates();
  }, [fetchUserTemplates]);

  const createUserTemplate = useCallback(async (templateData: Omit<UserTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTemplate = await userTemplatesService.createUserTemplate(templateData);
      setUserTemplates(prev => [newTemplate, ...prev]);
      return newTemplate;
    } catch (err) {
      console.error('Error al crear plantilla:', err);
      setError('Error al crear la plantilla');
      throw err;
    }
  }, []);

  const updateUserTemplate = useCallback(async (id: string, updates: Partial<Omit<UserTemplate, 'id' | 'created_at'>>) => {
    try {
      const updatedTemplate = await userTemplatesService.updateUserTemplate(id, updates);
      setUserTemplates(prev => prev.map(template => template.id === id ? updatedTemplate : template));
      return updatedTemplate;
    } catch (err) {
      console.error('Error al actualizar plantilla:', err);
      setError('Error al actualizar la plantilla');
      throw err;
    }
  }, []);

  const deleteUserTemplate = useCallback(async (id: string) => {
    try {
      await userTemplatesService.deleteUserTemplate(id);
      setUserTemplates(prev => prev.filter(template => template.id !== id));
    } catch (err) {
      console.error('Error al eliminar plantilla:', err);
      setError('Error al eliminar la plantilla');
      throw err;
    }
  }, []);

  const renameUserTemplate = useCallback(async (id: string, newName: string) => {
    try {
      const renamedTemplate = await userTemplatesService.renameUserTemplate(id, newName);
      setUserTemplates(prev => prev.map(template => template.id === id ? renamedTemplate : template));
      return renamedTemplate;
    } catch (err) {
      console.error('Error al renombrar plantilla:', err);
      setError('Error al renombrar la plantilla');
      throw err;
    }
  }, []);

  return {
    userTemplates,
    isLoading,
    error,
    createUserTemplate,
    updateUserTemplate,
    deleteUserTemplate,
    renameUserTemplate,
    refetch: fetchUserTemplates
  };
}; 