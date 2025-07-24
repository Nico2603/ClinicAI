import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notesService } from '@/lib/services/databaseService';
import { UserTemplate } from '@/types';

interface AutoSaveOptions {
  content: string;
  template?: UserTemplate | null;
  patientInfo?: string;
  interval?: number; // en milisegundos, default 30000 (30s)
  onSave?: (noteId: string) => void;
  onError?: (error: string) => void;
}

export const useAutoSave = ({
  content,
  template,
  patientInfo = '',
  interval = 30000, // 30 segundos
  onSave,
  onError
}: AutoSaveOptions) => {
  const { user } = useAuth();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveId, setAutoSaveId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastContentRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Función para guardar
  const saveNote = useCallback(async (isAutoSave = true) => {
    if (!user?.id || !content.trim() || content === lastContentRef.current) {
      return null;
    }

    if (isSaving) return null;

    try {
      setIsSaving(true);
      
      const noteData = {
        title: `${isAutoSave ? '[Auto-guardado] ' : ''}${template?.name || 'Nota'} - ${new Date().toLocaleString()}`,
        content: content.trim(),
        user_id: user.id,
        user_template_id: template?.id || undefined,
        patient_id: undefined,
        patient_name: patientInfo ? 'Información del paciente' : undefined,
        diagnosis: template?.name || 'Nota médica',
        treatment: 'Ver contenido de la nota',
        is_private: true,
        tags: isAutoSave ? ['auto-guardado'] : []
      };

      let savedNote;
      
      if (autoSaveId && isAutoSave) {
        // Actualizar nota existente
        savedNote = await notesService.updateNote(autoSaveId, {
          content: noteData.content,
          title: noteData.title,
          updated_at: new Date().toISOString()
        });
      } else {
        // Crear nueva nota
        savedNote = await notesService.createNote(noteData);
        if (isAutoSave) {
          setAutoSaveId(savedNote.id);
        }
      }

      lastContentRef.current = content;
      setLastSaved(new Date());
      
      if (onSave) {
        onSave(savedNote.id);
      }

      console.log(`💾 ${isAutoSave ? 'Auto-guardado' : 'Guardado'} exitoso:`, savedNote.id);
      return savedNote;

    } catch (error) {
      console.error('Error saving note:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      if (onError) {
        onError(`Error al guardar: ${errorMessage}`);
      }
      
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, content, template, patientInfo, autoSaveId, isSaving, onSave, onError]);

  // Guardado manual
  const saveManually = useCallback(() => {
    return saveNote(false);
  }, [saveNote]);

  // Función debounced para auto-save
  const debouncedAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(true);
    }, 2000); // Esperar 2 segundos después del último cambio
  }, [saveNote]);

  // Auto-save por intervalo
  useEffect(() => {
    if (!content.trim() || !user?.id) return;

    // Limpiar intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Configurar nuevo intervalo
    intervalRef.current = setInterval(() => {
      if (content !== lastContentRef.current) {
        saveNote(true);
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [content, user?.id, interval, saveNote]);

  // Auto-save al cambiar contenido (debounced)
  useEffect(() => {
    if (content && content !== lastContentRef.current && content.trim().length > 10) {
      debouncedAutoSave();
    }
  }, [content, debouncedAutoSave]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Hook para detectar onBlur en textarea
  const createBlurHandler = useCallback(() => {
    return () => {
      if (content && content !== lastContentRef.current) {
        // Guardar inmediatamente al perder el foco
        saveNote(true);
      }
    };
  }, [content, saveNote]);

  // Resetear cuando cambie la plantilla
  useEffect(() => {
    setAutoSaveId(null);
    lastContentRef.current = '';
    setLastSaved(null);
  }, [template?.id]);

  // Información de estado
  const formatLastSaved = lastSaved 
    ? `Guardado automáticamente a las ${lastSaved.toLocaleTimeString()}`
    : null;

  const hasUnsavedChanges = content !== lastContentRef.current && content.trim().length > 0;

  return {
    lastSaved,
    formatLastSaved,
    isSaving,
    hasUnsavedChanges,
    autoSaveId,
    saveManually,
    createBlurHandler,
    // Status helpers
    isAutoSaveEnabled: !!user?.id && !!content.trim(),
    saveStatus: isSaving ? 'saving' : hasUnsavedChanges ? 'unsaved' : 'saved'
  };
}; 