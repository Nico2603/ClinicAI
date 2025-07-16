import { useState, useCallback } from 'react';
import { GroundingMetadata, UserTemplate } from '../types';
import { generateNoteFromTemplate } from '../lib/services/openaiService';
import { notesService } from '../lib/services/databaseService';
import { ERROR_MESSAGES } from '../lib/constants';

export const useTemplateNotes = () => {
  const [patientInfo, setPatientInfo] = useState<string>('');
  const [generatedNote, setGeneratedNote] = useState<string>('');
  const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateNote = useCallback(async (template: UserTemplate, userId: string) => {
    if (!patientInfo.trim()) {
      setError(ERROR_MESSAGES.REQUIRED_FIELD);
      return null;
    }

    setError(null);
    setIsGenerating(true);
    setGeneratedNote('');
    setGroundingMetadata(undefined);

    try {
      const result = await generateNoteFromTemplate(template.name, template.content, patientInfo);
      setGeneratedNote(result.text);
      setGroundingMetadata(result.groundingMetadata);

      // Guardar en Supabase (best-effort, no bloquea la UI)
      if (userId) {
        notesService.createNote({
          title: `Nota ${new Date().toLocaleString()}`,
          content: result.text,
          user_id: userId,
          user_template_id: template.id,
          is_private: true,
          tags: [],
        }).catch((dbErr) => {
          console.error('Error al guardar la nota en Supabase:', dbErr);
        });
      }

      return result.text;
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido al generar la nota.";
      setError(errorMessage);
      setGeneratedNote(`Error: ${errorMessage}`);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [patientInfo]);

  const updateNote = useCallback((newNote: string) => {
    setGeneratedNote(newNote);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetState = useCallback(() => {
    setPatientInfo('');
    setGeneratedNote('');
    setGroundingMetadata(undefined);
    setError(null);
  }, []);

  return {
    patientInfo,
    setPatientInfo,
    generatedNote,
    groundingMetadata,
    isGenerating,
    error,
    generateNote,
    updateNote,
    clearError,
    resetState,
  };
}; 