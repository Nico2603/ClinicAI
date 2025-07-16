import { useState, useEffect, useCallback } from 'react';
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

  const fetchNotes = useCallback(async () => {
    if (!user?.id) return;
    
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
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchNotes();
    } else {
      setNotes([]);
      setError(null);
    }
  }, [user?.id, fetchNotes]);

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

  const fetchUserTemplates = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const templates = await simpleDbCall(() => userTemplatesService.getUserTemplates(user.id));
      setUserTemplates(templates);
    } catch (err) {
      console.error('Error al cargar plantillas:', err);
      setError(getSimpleErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchUserTemplates();
    } else {
      setUserTemplates([]);
      setError(null);
    }
  }, [user?.id, fetchUserTemplates]);

  const createUserTemplate = useCallback(async (templateData: Omit<UserTemplate, 'id' | 'created_at' | 'updated_at'>) => {
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
    fetchUserTemplates,
    createUserTemplate,
    updateUserTemplate,
    deleteUserTemplate,
  };
}; 