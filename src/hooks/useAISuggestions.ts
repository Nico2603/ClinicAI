import { useState, useCallback } from 'react';
import { GroundingMetadata } from '../types';
import { generateAISuggestions } from '../lib/services/openaiService';
import { ERROR_MESSAGES } from '../lib/constants';

export const useAISuggestions = () => {
  const [suggestionInput, setSuggestionInput] = useState<string>('');
  const [generatedSuggestion, setGeneratedSuggestion] = useState<string>('');
  const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = useCallback(async () => {
    if (!suggestionInput.trim()) {
      setError(ERROR_MESSAGES.CLINICAL_INFO_REQUIRED);
      return null;
    }

    setError(null);
    setIsGenerating(true);
    setGeneratedSuggestion('');
    setGroundingMetadata(undefined);

    try {
      const result = await generateAISuggestions(suggestionInput);
      setGeneratedSuggestion(result.text);
      setGroundingMetadata(result.groundingMetadata);

      return result.text;
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido al generar sugerencias.";
      setError(errorMessage);
      setGeneratedSuggestion(`Error: ${errorMessage}`);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [suggestionInput]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetState = useCallback(() => {
    setSuggestionInput('');
    setGeneratedSuggestion('');
    setGroundingMetadata(undefined);
    setError(null);
  }, []);

  const syncInputFromPatientInfo = useCallback((patientInfo: string) => {
    setSuggestionInput(patientInfo);
  }, []);

  return {
    suggestionInput,
    setSuggestionInput,
    generatedSuggestion,
    groundingMetadata,
    isGenerating,
    error,
    generateSuggestions,
    clearError,
    resetState,
    syncInputFromPatientInfo,
  };
}; 