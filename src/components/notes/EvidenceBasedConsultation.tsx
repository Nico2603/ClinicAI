'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateSimplifiedEvidenceConsultation } from '../../lib/services/openaiService';
import { LoadingSpinner, SparklesIcon } from '../ui/Icons';
import { Button } from '../ui/button';
import { TextareaWithSpeech } from '@/components';

interface EvidenceBasedConsultationProps {
  className?: string;
  onConsultationGenerated?: (consultation: string) => void;
  autoAnalyzeContent?: string;
  enableAutoAnalysis?: boolean;
}

const EvidenceBasedConsultation: React.FC<EvidenceBasedConsultationProps> = ({ 
  className = '',
  onConsultationGenerated,
  autoAnalyzeContent,
  enableAutoAnalysis = true
}) => {
  // Estados principales
  const [clinicalContent, setClinicalContent] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  
  // Estados de UI
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Usar useRef para trackear el último contenido analizado
  const lastAnalyzedContentRef = useRef<string>('');
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función para limpiar estados cuando cambia el contenido
  const clearPreviousResults = useCallback(() => {
    setAnalysisResult('');
    setError(null);
    setCopied(false);
    
    // Cancelar análisis en progreso si existe
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
  }, []);

  // Función con useCallback mejorada con mejor manejo de errores
  const handleAnalyzeContent = useCallback(async (contentToAnalyze?: string) => {
    const content = contentToAnalyze || clinicalContent;
    
    if (!content.trim()) {
      setError("Por favor, ingresa información clínica para analizar.");
      return;
    }

    // Evitar análisis duplicados
    if (content === lastAnalyzedContentRef.current && analysisResult && !error) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult('');
    
    // Actualizar el último contenido analizado
    lastAnalyzedContentRef.current = content;

    try {
      const result = await generateSimplifiedEvidenceConsultation(content.trim());
      
      // Verificar que el resultado sigue siendo relevante (no ha cambiado el contenido mientras analizaba)
      if (lastAnalyzedContentRef.current === content) {
        setAnalysisResult(result.text);
        
        // Notificar al componente padre si se proporciona el callback
        if (onConsultationGenerated) {
          onConsultationGenerated(result.text);
        }
      }
    } catch (error) {
      console.error('Error analyzing clinical content:', error);
      
      // Solo mostrar error si sigue siendo relevante
      if (lastAnalyzedContentRef.current === content) {
        setError(`Error al analizar contenido clínico: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [clinicalContent, onConsultationGenerated, analysisResult, error]);

  // Auto-análisis mejorado que detecta cambios en el contenido
  useEffect(() => {
    if (!autoAnalyzeContent || !autoAnalyzeContent.trim() || !enableAutoAnalysis) {
      // Si no hay contenido para auto-analizar, limpiar resultados anteriores
      if (!autoAnalyzeContent && (analysisResult || error)) {
        clearPreviousResults();
        lastAnalyzedContentRef.current = '';
      }
      return;
    }

    // Si el contenido para auto-análisis cambió, limpiar resultados anteriores
    if (autoAnalyzeContent !== lastAnalyzedContentRef.current) {
      clearPreviousResults();
      setClinicalContent(autoAnalyzeContent);
      
      // Usar timeout para evitar análisis múltiples rápidos
      analysisTimeoutRef.current = setTimeout(() => {
        handleAnalyzeContent(autoAnalyzeContent);
      }, 300);
    }

    // Cleanup del timeout
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
    };
  }, [autoAnalyzeContent, enableAutoAnalysis, handleAnalyzeContent, clearPreviousResults, analysisResult, error]);

  const handleCopyReport = () => {
    if (!analysisResult) return;
    
    navigator.clipboard.writeText(analysisResult)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Error al copiar:', err));
  };

  const handleClearAll = () => {
    setClinicalContent('');
    clearPreviousResults();
    lastAnalyzedContentRef.current = '';
  };

  // Determinar si se está ejecutando auto-análisis
  const isAutoAnalyzing = autoAnalyzeContent && autoAnalyzeContent.trim() && 
                          autoAnalyzeContent === lastAnalyzedContentRef.current && 
                          (isAnalyzing || analysisResult);

  return (
    <div className={className}>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex-shrink-0">
            <SparklesIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Consulta Clínica Basada en Evidencia
          </h3>
        </div>
        
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
          Análisis automático del contenido clínico con recomendaciones basadas en evidencia científica actual de revistas médicas indexadas.
        </p>

        {/* Análisis automático realizado */}
        {isAutoAnalyzing && (
          <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center">
              <SparklesIcon className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analizando contenido clínico automáticamente...' : 'Análisis automático realizado basado en el contenido clínico proporcionado'}
            </p>
          </div>
        )}

        {/* Área de entrada de contenido clínico */}
        <div className="space-y-4">
          <div>
            <TextareaWithSpeech
              value={clinicalContent}
              onChange={(e) => {
                setClinicalContent(e.target.value);
                // Limpiar resultados anteriores cuando el usuario modifica manualmente
                if (e.target.value !== lastAnalyzedContentRef.current) {
                  clearPreviousResults();
                }
              }}
              rows={4}
              placeholder="Ingrese aquí la información clínica que desea analizar (síntomas, diagnósticos, tratamientos, etc.)"
              label="Información Clínica para Análisis"
              showCharacterCount={false}
              speechLanguage="es-ES"
              className="focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleAnalyzeContent()}
              disabled={isAnalyzing || !clinicalContent.trim()}
              data-tutorial="evidence-generate"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <LoadingSpinner className="h-4 w-4" />
                  Analizando...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  Analizar con IA
                </>
              )}
            </Button>

            <Button
              onClick={handleClearAll}
              variant="outline"
              className="px-6 py-2"
              disabled={isAnalyzing}
            >
              Limpiar Todo
            </Button>
          </div>

          {/* Errores */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              <Button
                onClick={() => setError(null)}
                variant="outline"
                size="sm"
                className="mt-2 text-xs"
              >
                Cerrar
              </Button>
            </div>
          )}

          {/* Resultado del análisis */}
          {analysisResult && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                  Análisis Basado en Evidencia
                </h4>
                <Button
                  onClick={handleCopyReport}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  {copied ? 'Copiado ✓' : 'Copiar'}
                </Button>
              </div>
              
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                  {analysisResult}
                </div>
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay contenido */}
          {!analysisResult && !isAnalyzing && !error && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {autoAnalyzeContent && autoAnalyzeContent.trim() ? 
                'Preparando análisis automático...' : 
                'No hay contenido para mostrar aún.'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvidenceBasedConsultation; 