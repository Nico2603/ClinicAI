'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { SearchIcon, SparklesIcon, LoadingSpinner, PlusIcon, CopyIcon, CheckIcon } from '../ui/Icons';
import { 
  searchClinicalScales, 
  generateIntelligentClinicalScale, 
  formatScaleForNote,
  analyzeClinicalDataForScales
} from '../../lib/services/openaiService';
import { 
  ScaleSearchResult, 
  GeneratedScaleResult, 
  ScaleGenerationRequest,
  ClinicalScale,
  ClinicalAnalysisForScalesResult
} from '../../types';
import NoteDisplay from './NoteDisplay';

interface ClinicalScaleGeneratorProps {
  className?: string;
  onScaleGenerated?: (scaleText: string) => void;
  existingNoteContent?: string;
}

const ClinicalScaleGenerator: React.FC<ClinicalScaleGeneratorProps> = ({ 
  className = '',
  onScaleGenerated,
  existingNoteContent 
}) => {
  // Estados principales
  const [clinicalData, setClinicalData] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ClinicalAnalysisForScalesResult | null>(null);
  const [selectedScale, setSelectedScale] = useState<ScaleSearchResult | null>(null);
  
  // Estados para búsqueda manual (fallback)
  const [showManualSearch, setShowManualSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ScaleSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Estados para generación de escala
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedScale, setGeneratedScale] = useState<GeneratedScaleResult | null>(null);
  const [formattedScaleText, setFormattedScaleText] = useState<string>('');
  
  // Estados de error y UI
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Referencias
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Análisis automático con debounce
  useEffect(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    if (clinicalData.trim().length >= 50) {
      analysisTimeoutRef.current = setTimeout(async () => {
        await handleAnalyzeClinicalData();
      }, 1000);
    } else {
      setAnalysisResult(null);
      setSelectedScale(null);
    }
    
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [clinicalData]);
  
  // Búsqueda manual con debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (searchQuery.trim().length >= 3 && showManualSearch) {
      searchTimeoutRef.current = setTimeout(async () => {
        await handleManualSearch();
      }, 500);
    } else {
      setSearchResults([]);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, showManualSearch]);
  
  const handleAnalyzeClinicalData = async () => {
    if (!clinicalData.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await analyzeClinicalDataForScales(clinicalData.trim());
      setAnalysisResult({
        scales: result,
        clinicalSummary: '',
        recommendations: []
      });
    } catch (error) {
      console.error('Error analyzing clinical data:', error);
      setError(`Error al analizar la información clínica: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleManualSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const results = await searchClinicalScales(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching scales:', error);
      setError(`Error al buscar escalas: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSelectScale = (scale: ScaleSearchResult) => {
    setSelectedScale(scale);
    setGeneratedScale(null);
    setFormattedScaleText('');
    
    // Generar automáticamente la escala si hay información clínica
    if (clinicalData.trim()) {
      handleGenerateScale(scale);
    }
  };
  
  const handleGenerateScale = async (scale?: ScaleSearchResult) => {
    const scaleToUse = scale || selectedScale;
    
    if (!scaleToUse) {
      setError("Por favor, selecciona una escala.");
      return;
    }
    
    if (!clinicalData.trim()) {
      setError("Por favor, ingresa información clínica para generar la escala.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const request: ScaleGenerationRequest = {
        scaleName: scaleToUse.name,
        clinicalData: clinicalData.trim(),
        existingNoteContent
      };
      
      const result = await generateIntelligentClinicalScale(request);
      setGeneratedScale(result);
      
      // Formatear la escala para mostrar
      const formatted = await formatScaleForNote(result, true);
      setFormattedScaleText(formatted);
      
    } catch (error) {
      console.error('Error generating scale:', error);
      setError(`Error al generar la escala: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopyScale = () => {
    if (!formattedScaleText) return;
    
    navigator.clipboard.writeText(formattedScaleText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Error al copiar:', err));
  };
  
  const handleInsertIntoNote = () => {
    if (!formattedScaleText || !onScaleGenerated) return;
    
    onScaleGenerated(formattedScaleText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleClearAll = () => {
    setClinicalData('');
    setAnalysisResult(null);
    setSelectedScale(null);
    setSearchQuery('');
    setSearchResults([]);
    setGeneratedScale(null);
    setFormattedScaleText('');
    setError(null);
    setShowManualSearch(false);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <SparklesIcon className="h-6 w-6 text-emerald-600" />
          Generador Inteligente de Escalas Clínicas
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Ingresa información clínica del paciente y obtén automáticamente las escalas más apropiadas con autocompletado inteligente.
        </p>
      </div>

      {/* Información Clínica - Ahora es lo primero */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Información Clínica del Paciente
        </label>
        <textarea
          value={clinicalData}
          onChange={(e) => setClinicalData(e.target.value)}
          placeholder="Describe la condición del paciente: síntomas, signos vitales, historia clínica, examen físico, laboratorios, etc. La IA analizará automáticamente esta información y sugerirá las escalas más apropiadas.

Ejemplo: 'Paciente de 45 años con dolor abdominal, hematemesis, melena, hemoglobina 8.5 g/dL, presión arterial 100/60 mmHg, frecuencia cardiaca 110 lpm, sin antecedentes de hepatopatía.'"
          className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
        />
        {isAnalyzing && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <LoadingSpinner className="h-4 w-4" />
            Analizando información clínica...
          </div>
        )}
      </div>

      {/* Escalas Sugeridas */}
      {analysisResult && analysisResult.scales.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Escalas Sugeridas para este Caso
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {analysisResult.scales.length} escalas identificadas
            </span>
          </div>
          
          <div className="grid gap-3">
            {analysisResult.scales.map((scale, index) => (
              <button
                key={index}
                onClick={() => handleSelectScale(scale)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedScale?.name === scale.name
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {scale.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {scale.description}
                    </p>
                    {scale.rationale && (
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2 font-medium">
                        💡 {scale.rationale}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                        {scale.category}
                      </span>
                      {scale.isStandardized && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                          Validada
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round(scale.confidence * 100)}% relevancia
                    </span>
                    {selectedScale?.name === scale.name && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        Seleccionada
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Búsqueda Manual (Fallback) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Búsqueda Manual de Escalas
          </label>
          <Button
            onClick={() => setShowManualSearch(!showManualSearch)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {showManualSearch ? 'Ocultar' : 'Buscar manualmente'}
          </Button>
        </div>
        
        {showManualSearch && (
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar escala específica (ej: Glasgow, PHQ-9, APACHE II)..."
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <LoadingSpinner className="h-5 w-5 text-emerald-500" />
                </div>
              )}
            </div>
            
            {searchResults.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectScale(result)}
                    className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {result.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {result.description}
                        </p>
                      </div>
                      <div className="ml-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(result.confidence * 100)}% match
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Escala Seleccionada */}
      {selectedScale && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
            Escala Seleccionada: {selectedScale.name}
          </h3>
          <p className="text-emerald-700 dark:text-emerald-200 text-sm">
            {selectedScale.description}
          </p>
          {isGenerating && (
            <div className="flex items-center gap-2 mt-3 text-sm text-emerald-600 dark:text-emerald-400">
              <LoadingSpinner className="h-4 w-4" />
              Generando escala automáticamente...
            </div>
          )}
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex flex-wrap gap-3">
        {selectedScale && !isGenerating && !formattedScaleText && (
          <Button
            onClick={() => handleGenerateScale()}
            disabled={!clinicalData.trim()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400"
          >
            <SparklesIcon className="h-4 w-4" />
            Generar Escala
          </Button>
        )}
        
        {formattedScaleText && (
          <>
            <Button
              onClick={handleCopyScale}
              variant="outline"
              className="flex items-center gap-2"
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
            
            {onScaleGenerated && (
              <Button
                onClick={handleInsertIntoNote}
                variant="outline"
                className="flex items-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <PlusIcon className="h-4 w-4" />
                Insertar en Nota
              </Button>
            )}
          </>
        )}
        
        <Button
          onClick={handleClearAll}
          variant="outline"
          className="text-gray-600 hover:text-gray-800"
        >
          Limpiar Todo
        </Button>
      </div>

      {/* Mensajes de Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Resultado de la Escala Generada */}
      {generatedScale && formattedScaleText && (
        <div className="space-y-4">
          <NoteDisplay
            note={formattedScaleText}
            title={`Escala ${generatedScale.scale.name} - Generada Automáticamente`}
            isLoading={false}
          />
          
          {/* Información Adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedScale.autocompletedItems.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Campos Autocompletados ({generatedScale.autocompletedItems.length})
                </h4>
                <ul className="text-blue-700 dark:text-blue-200 text-sm space-y-1">
                  {generatedScale.autocompletedItems.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {generatedScale.missingFields.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Campos Pendientes ({generatedScale.missingFields.length})
                </h4>
                <ul className="text-amber-700 dark:text-amber-200 text-sm space-y-1">
                  {generatedScale.missingFields.map((field, index) => (
                    <li key={index}>• {field}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Confianza del Resultado */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Confianza en el resultado:
              </span>
              <span className={`text-sm font-bold ${
                generatedScale.confidence >= 0.8 
                  ? 'text-green-600 dark:text-green-400' 
                  : generatedScale.confidence >= 0.6 
                    ? 'text-yellow-600 dark:text-yellow-400' 
                    : 'text-red-600 dark:text-red-400'
              }`}>
                {Math.round(generatedScale.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalScaleGenerator; 