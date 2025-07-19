'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { generateMedicalScale } from '../../lib/services/openaiService';
import { LoadingSpinner, SparklesIcon } from '../ui/Icons';
import { Button } from '../ui/button';
import { TextareaWithSpeech } from '@/components';

interface AIClinicalScalesProps {
  className?: string;
  onScaleGenerated?: (scaleResult: string) => void;
  autoAnalyzeContent?: string;
  enableAutoAnalysis?: boolean;
}

const AIClinicalScales: React.FC<AIClinicalScalesProps> = ({
  className = '',
  onScaleGenerated,
  autoAnalyzeContent,
  enableAutoAnalysis = true
}) => {
  // Estados principales
  const [scaleRequest, setScaleRequest] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [scaleResult, setScaleResult] = useState<string>('');
  
  // Estados de UI
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [autoLoaded, setAutoLoaded] = useState<boolean>(false);

  // Auto-cargar contenido clínico cuando esté disponible
  useEffect(() => {
    if (autoAnalyzeContent && autoAnalyzeContent.trim() && enableAutoAnalysis && !autoLoaded) {
      setAutoLoaded(true);
    }
  }, [autoAnalyzeContent, enableAutoAnalysis, autoLoaded]);

  // Función para calcular la escala usando IA
  const handleCalculateScale = useCallback(async () => {
    if (!scaleRequest.trim()) {
      setError("Por favor, especifica qué escala clínica deseas calcular.");
      return;
    }

    if (!autoAnalyzeContent?.trim()) {
      setError("No hay información clínica disponible para calcular la escala.");
      return;
    }

    setIsCalculating(true);
    setError(null);
    setScaleResult('');

    try {
      const result = await generateMedicalScale(autoAnalyzeContent, scaleRequest.trim());
      setScaleResult(result.text);
      
      // Notificar al componente padre si se proporciona el callback
      if (onScaleGenerated) {
        onScaleGenerated(result.text);
      }
    } catch (error) {
      console.error('Error calculating clinical scale:', error);
      setError(`Error al calcular la escala clínica: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCalculating(false);
    }
  }, [scaleRequest, autoAnalyzeContent, onScaleGenerated]);

  const handleCopyResult = () => {
    if (!scaleResult) return;
    
    navigator.clipboard.writeText(scaleResult)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Error al copiar:', err));
  };

  const handleClearAll = () => {
    setScaleRequest('');
    setScaleResult('');
    setError(null);
  };

  return (
    <div className={className}>
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex-shrink-0">
            <SparklesIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
            Escalas Clínicas Calculadas por Inteligencia Artificial
          </h3>
        </div>
        
        <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-4">
          Solicita cualquier escala clínica y la IA la calculará automáticamente usando la información clínica disponible.
        </p>

        {/* Análisis automático realizado */}
        {autoLoaded && (
          <div className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded-lg p-3 mb-4">
            <p className="text-sm text-emerald-800 dark:text-emerald-200 flex items-center">
              <SparklesIcon className="h-4 w-4 mr-2" />
              Información clínica cargada automáticamente para cálculo de escalas
            </p>
          </div>
        )}

        {/* Área de entrada para solicitud de escala */}
        <div className="space-y-4">
          <div>
            <TextareaWithSpeech
              value={scaleRequest}
              onChange={(e) => setScaleRequest(e.target.value)}
              rows={3}
              placeholder="Ej: 'Escala de Glasgow', 'APACHE II', 'Wells para TEP', 'Escala de Braden', etc."
              label="¿Qué escala clínica deseas calcular?"
              showCharacterCount={false}
              speechLanguage="es-ES"
              className="focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleCalculateScale}
              disabled={isCalculating || !scaleRequest.trim() || !autoAnalyzeContent?.trim()}
              data-tutorial="scales-generate"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 flex items-center gap-2"
            >
              {isCalculating ? (
                <>
                  <LoadingSpinner className="h-4 w-4" />
                  Calculando...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  Calcular Escala
                </>
              )}
            </Button>

            <Button
              onClick={handleClearAll}
              variant="outline"
              className="px-6 py-2"
            >
              Limpiar Todo
            </Button>
          </div>

          {/* Errores */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          )}

          {/* Resultado de la escala */}
          {scaleResult && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                  Resultado de la Escala Clínica
                </h4>
                <Button
                  onClick={handleCopyResult}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  {copied ? 'Copiado ✓' : 'Copiar'}
                </Button>
              </div>
              
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                  {scaleResult}
                </div>
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay contenido */}
          {!scaleResult && !isCalculating && !error && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <SparklesIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Especifica qué escala clínica deseas calcular</p>
              <p className="text-xs mt-1">La IA calculará automáticamente usando la información clínica disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIClinicalScales; 