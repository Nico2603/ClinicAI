/**
 * ClínicAI - Asistente de IA para Notas Clínicas
 * 
 * Autor: Nicolas Ceballos Brito
 * Portfolio: https://nico2603.github.io/PersonalPage/
 * GitHub: https://github.com/Nico2603
 * LinkedIn: https://www.linkedin.com/in/nicolas-ceballos-brito/
 * 
 * Desarrollado para Teilur.ai
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
// Importar el servicio migrado que ahora usa Assistants automáticamente
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

  // Nuevos estados para mostrar información de la nueva arquitectura
  const [generationMethod, setGenerationMethod] = useState<string>('');
  const [isUsingNewArchitecture, setIsUsingNewArchitecture] = useState<boolean>(false);

  // Escalas clínicas más comunes (predefinidas)
  const commonScales = [
    'Escala de Glasgow',
    'NIHSS (National Institutes of Health Stroke Scale)',
    'Escala de RASS (Richmond Agitation-Sedation Scale)',
    'Escala de Braden',
    'Escala de dolor EVA',
    'Mini Mental State Examination (MMSE)',
    'PHQ-9 (Cuestionario de Salud del Paciente)',
    'GAD-7 (Escala de Ansiedad Generalizada)',
    'Escala de Hamilton para la Depresión',
    'APACHE II',
    'SOFA (Sequential Organ Failure Assessment)',
    'Escala de Norton',
    'Escala de Morse (riesgo de caídas)',
    'CURB-65',
    'Wells Score (TEP)',
    'Escala de Aldrete'
  ];

  // Auto-cargar contenido si está disponible
  useEffect(() => {
    if (autoAnalyzeContent && enableAutoAnalysis && !autoLoaded) {
      setScaleRequest(autoAnalyzeContent);
      setAutoLoaded(true);
    }
  }, [autoAnalyzeContent, enableAutoAnalysis, autoLoaded]);

  // Función para calcular escala usando la nueva arquitectura
  const calculateScale = useCallback(async () => {
    if (!scaleRequest.trim()) {
      setError('Por favor ingresa información clínica y especifica qué escala evaluar');
      return;
    }

    setError(null);
    setIsCalculating(true);
    setScaleResult('');
    setGenerationMethod('');
    setIsUsingNewArchitecture(false);

    try {
      console.log('🔄 Calculando escala con nueva arquitectura...');
      setIsUsingNewArchitecture(true);

      // La función generateMedicalScale ahora usa automáticamente Assistants
      const result = await generateMedicalScale(autoAnalyzeContent || scaleRequest, scaleRequest.trim());
      
      // Detectar qué método se usó basado en los metadatos
      const methodUsed = result.groundingMetadata?.groundingChunks?.[0]?.web?.title || 'Método moderno';
      setGenerationMethod(methodUsed);
      
      console.log(`✅ Escala calculada usando: ${methodUsed}`);
      
      setScaleResult(result.text);
      
      // Notificar al componente padre si existe el callback
      if (onScaleGenerated) {
        onScaleGenerated(result.text);
      }
      
    } catch (err) {
      console.error('Error calculando escala:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error desconocido al calcular la escala';
      setError(`Error: ${errorMessage}`);
      setScaleResult('');
      setIsUsingNewArchitecture(false);
    } finally {
      setIsCalculating(false);
    }
  }, [scaleRequest, autoAnalyzeContent, onScaleGenerated]);

  // Función para copiar resultado
  const copyToClipboard = useCallback(async () => {
    if (!scaleResult) return;

    try {
      await navigator.clipboard.writeText(scaleResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copiando al portapapeles:', err);
    }
  }, [scaleResult]);

  // Función para limpiar todo
  const clearAll = useCallback(() => {
    setScaleRequest('');
    setScaleResult('');
    setError(null);
    setCopied(false);
    setAutoLoaded(false);
    setGenerationMethod('');
    setIsUsingNewArchitecture(false);
  }, []);

  // Función para usar escala predefinida
  const handlePresetScale = useCallback((scaleName: string) => {
    const template = `Evalúa la escala ${scaleName} basándote en la siguiente información clínica:\n\n${autoAnalyzeContent || '[Información clínica a completar]'}`;
    setScaleRequest(template);
  }, [autoAnalyzeContent]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header mejorado con información de arquitectura */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Escalas Clínicas IA
          </h3>
          {isUsingNewArchitecture && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
              🤖 Nueva Arquitectura
            </span>
          )}
        </div>
        
        {scaleResult && (
          <div className="flex gap-2">
            <Button
              onClick={copyToClipboard}
              className="text-sm"
              variant={copied ? "default" : "outline"}
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </Button>
            <Button
              onClick={clearAll}
              variant="tertiary"
              size="sm"
            >
              Limpiar
            </Button>
          </div>
        )}
      </div>

      {/* Escalas comunes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Escalas frecuentes (click para usar):
        </label>
        <div className="flex flex-wrap gap-2">
          {commonScales.slice(0, 8).map((scale) => (
            <button
              key={scale}
              onClick={() => handlePresetScale(scale)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
            >
              {scale}
            </button>
          ))}
        </div>
      </div>

      {/* Área de input mejorada */}
      <div>
        <label htmlFor="scale-request" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Información clínica y escala a evaluar:
        </label>
                 <TextareaWithSpeech
           id="scale-request"
           value={scaleRequest}
           onChange={(e) => setScaleRequest(e.target.value)}
           placeholder="Ejemplo: Evalúa la Escala de Glasgow en un paciente que presenta apertura ocular al estímulo verbal, respuesta verbal confusa y obedece órdenes motoras..."
           className="min-h-32"
           disabled={isCalculating}
         />
      </div>

      {/* Botón de cálculo mejorado */}
      <Button
        onClick={calculateScale}
        disabled={isCalculating || !scaleRequest.trim()}
        className="w-full flex items-center justify-center gap-2"
      >
                 {isCalculating ? (
           <>
             <LoadingSpinner className="h-4 w-4" />
             <span>Calculando con IA...</span>
           </>
         ) : (
          <>
            <SparklesIcon className="h-4 w-4" />
            <span>Calcular Escala</span>
          </>
        )}
      </Button>

      {/* Información del método usado (nuevo) */}
      {generationMethod && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Generado usando: {generationMethod}
            </span>
          </div>
        </div>
      )}

      {/* Manejo de errores */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Resultado de la escala */}
      {scaleResult && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              Resultado de la Escala:
            </h4>
            {isUsingNewArchitecture && (
              <span className="text-xs text-green-600 dark:text-green-400">
                ✨ Generado con nueva arquitectura
              </span>
            )}
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
              {scaleResult}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIClinicalScales; 