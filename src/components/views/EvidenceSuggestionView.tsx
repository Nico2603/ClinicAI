import React from 'react';
import { GroundingMetadata } from '@/types';
import { NoteDisplay, SparklesIcon, LoadingSpinner, LightBulbIcon } from '../';

interface EvidenceSuggestionViewProps {
  suggestionInput: string;
  onSuggestionInputChange: (input: string) => void;
  generatedSuggestion: string;
  onGenerateSuggestions: () => void;
  isGenerating: boolean;
  groundingMetadata?: GroundingMetadata;
  onClearError: () => void;
}

export const EvidenceSuggestionView: React.FC<EvidenceSuggestionViewProps> = ({
  suggestionInput,
  onSuggestionInputChange,
  generatedSuggestion,
  onGenerateSuggestions,
  isGenerating,
  groundingMetadata,
  onClearError,
}) => {
  return (
    <section 
      aria-labelledby="sugerencia-evidencia-heading" 
      className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5"
    >
      <h2 id="sugerencia-evidencia-heading" className="sr-only">
        Sugerencia basada en Evidencia
      </h2>
      
      <div>
        <h3 className="text-base md:text-lg font-semibold text-secondary mb-2 md:mb-3 flex items-center">
          <LightBulbIcon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          Sugerencias Basadas en Evidencia
        </h3>
        
        <label htmlFor="ai-suggestion-input" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Información Clínica o Consulta para IA
        </label>
        
        <textarea
          id="ai-suggestion-input"
          value={suggestionInput}
          onChange={(e) => { onSuggestionInputChange(e.target.value); onClearError(); }}
          rows={5}
          className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-neutral-700 dark:text-neutral-100 mb-3 transition-colors text-sm md:text-base"
          placeholder="Describa la situación clínica, preguntas o áreas donde necesita recomendaciones basadas en evidencia científica..."
        />
        
        <button
          onClick={onGenerateSuggestions}
          disabled={isGenerating}
          className="w-full inline-flex items-center justify-center px-4 md:px-6 py-3 border border-transparent text-sm md:text-base font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-dark disabled:opacity-60 dark:focus:ring-offset-neutral-900 transition-colors"
        >
          {isGenerating ? (
            <> <LoadingSpinner className="text-white mr-2" /> Generando Sugerencias...</>
          ) : (
            <> <SparklesIcon className="h-5 w-5 mr-2" /> Obtener Sugerencias Basadas en Evidencia </>
          )}
        </button>
        
        <NoteDisplay
          note={generatedSuggestion}
          title="Sugerencias Basadas en Evidencia"
          isLoading={isGenerating}
          groundingMetadata={groundingMetadata}
        />
      </div>
    </section>
  );
}; 