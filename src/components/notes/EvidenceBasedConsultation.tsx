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
// El servicio generateSimplifiedEvidenceConsultation sigue siendo válido en la nueva arquitectura
import { generateSimplifiedEvidenceConsultation } from '../../lib/services/openaiService';
import { LoadingSpinner, SparklesIcon } from '../ui/Icons';
import { Button } from '../ui/button';
import { TextareaWithSpeech } from '@/components';

interface EvidenceBasedConsultationProps {
  className?: string;
  onEvidenceGenerated?: (evidence: string) => void;
  autoAnalyzeContent?: string;
  enableAutoAnalysis?: boolean;
}

const EvidenceBasedConsultation: React.FC<EvidenceBasedConsultationProps> = ({
  className = '',
  onEvidenceGenerated,
  autoAnalyzeContent,
  enableAutoAnalysis = true
}) => {
  // Estados principales
  const [clinicalContent, setClinicalContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [evidenceResult, setEvidenceResult] = useState<string>('');
  
  // Estados de UI
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [autoLoaded, setAutoLoaded] = useState<boolean>(false);

  // Nuevos estados para información de la arquitectura
  const [generationMethod, setGenerationMethod] = useState<string>('');
  const [isUsingNewArchitecture, setIsUsingNewArchitecture] = useState<boolean>(false);

  // Temas de consulta frecuentes (predefinidos)
  const consultationTopics = [
    'Manejo de hipertensión arterial resistente',
    'Diagnóstico diferencial de dolor torácico',
    'Tratamiento de diabetes mellitus tipo 2',
    'Enfoque de fiebre sin foco aparente',
    'Evaluación de síncope en adulto mayor',
    'Manejo de insuficiencia cardiaca aguda',
    'Diagnóstico de tromboembolismo pulmonar',
    'Tratamiento de neumonía adquirida en comunidad'
  ];

  // Auto-cargar contenido si está disponible
  useEffect(() => {
    if (autoAnalyzeContent && enableAutoAnalysis && !autoLoaded) {
      setClinicalContent(autoAnalyzeContent);
      setAutoLoaded(true);
    }
  }, [autoAnalyzeContent, enableAutoAnalysis, autoLoaded]);

  // Función para generar evidencia usando la arquitectura mejorada
  const generateEvidence = useCallback(async () => {
    if (!clinicalContent.trim()) {
      setError('Por favor ingresa contenido clínico para consultar');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setEvidenceResult('');
    setGenerationMethod('');
    setIsUsingNewArchitecture(false);

    try {
      console.log('🔄 Generando evidencia con arquitectura mejorada...');
      setIsUsingNewArchitecture(true);

      // Esta función ya utiliza internamente la nueva arquitectura híbrida
      const result = await generateSimplifiedEvidenceConsultation(clinicalContent.trim());
      
      // Detectar información del método usado
      const methodInfo = result.groundingMetadata?.groundingChunks?.[0]?.web?.title || 'Sistema de evidencia mejorado';
      setGenerationMethod(methodInfo);
      
      console.log(`✅ Evidencia generada usando: ${methodInfo}`);
      
      setEvidenceResult(result.text);
      
      // Notificar al componente padre si existe el callback
      if (onEvidenceGenerated) {
        onEvidenceGenerated(result.text);
      }
      
    } catch (err) {
      console.error('Error generando evidencia:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error desconocido al generar evidencia';
      setError(`Error: ${errorMessage}`);
      setEvidenceResult('');
      setIsUsingNewArchitecture(false);
    } finally {
      setIsGenerating(false);
    }
  }, [clinicalContent, onEvidenceGenerated]);

  // Función para copiar resultado
  const copyToClipboard = useCallback(async () => {
    if (!evidenceResult) return;

    try {
      await navigator.clipboard.writeText(evidenceResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copiando al portapapeles:', err);
    }
  }, [evidenceResult]);

  // Función para limpiar todo
  const clearAll = useCallback(() => {
    setClinicalContent('');
    setEvidenceResult('');
    setError(null);
    setCopied(false);
    setAutoLoaded(false);
    setGenerationMethod('');
    setIsUsingNewArchitecture(false);
  }, []);

  // Función para usar tema predefinido
  const handlePresetTopic = useCallback((topic: string) => {
    const template = `${topic}\n\n${autoAnalyzeContent || '[Información clínica específica]'}`;
    setClinicalContent(template);
  }, [autoAnalyzeContent]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header mejorado con información de arquitectura */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Consulta Basada en Evidencia
          </h3>
          {isUsingNewArchitecture && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
              🧠 Arquitectura Mejorada
            </span>
          )}
        </div>
        
        {evidenceResult && (
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

      {/* Temas de consulta frecuentes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Temas frecuentes (click para usar):
        </label>
        <div className="flex flex-wrap gap-2">
          {consultationTopics.slice(0, 6).map((topic) => (
            <button
              key={topic}
              onClick={() => handlePresetTopic(topic)}
              className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-full transition-colors"
              title={topic}
            >
              {topic.length > 30 ? `${topic.substring(0, 30)}...` : topic}
            </button>
          ))}
        </div>
      </div>

      {/* Área de input mejorada */}
      <div>
        <label htmlFor="clinical-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Contenido clínico para consultar:
        </label>
        <TextareaWithSpeech
          id="clinical-content"
          value={clinicalContent}
          onChange={(e) => setClinicalContent(e.target.value)}
          placeholder="Describe el caso clínico, síntomas, hallazgos, o pregunta específica sobre la cual necesitas recomendaciones basadas en evidencia científica..."
          className="min-h-32"
          disabled={isGenerating}
        />
      </div>

      {/* Botón de generación mejorado */}
      <Button
        onClick={generateEvidence}
        disabled={isGenerating || !clinicalContent.trim()}
        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
      >
        {isGenerating ? (
          <>
            <LoadingSpinner className="h-4 w-4" />
            <span>Consultando evidencia científica...</span>
          </>
        ) : (
          <>
            <SparklesIcon className="h-4 w-4" />
            <span>Generar Recomendaciones</span>
          </>
        )}
      </Button>

      {/* Información del método usado (nuevo) */}
      {generationMethod && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-purple-700 dark:text-purple-300">
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

      {/* Resultado de la evidencia */}
      {evidenceResult && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              Recomendaciones Basadas en Evidencia:
            </h4>
            {isUsingNewArchitecture && (
              <span className="text-xs text-purple-600 dark:text-purple-400">
                ✨ Generado con arquitectura mejorada
              </span>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="prose dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                {evidenceResult}
              </div>
            </div>
          </div>
          
          {/* Disclaimer mejorado */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <strong>Disclaimer:</strong> Esta información es para apoyo educativo y no sustituye el juicio clínico profesional. 
              Siempre consulte las guías clínicas más recientes y tome decisiones basadas en el contexto específico del paciente.
            </p>
          </div>
        </div>
      )}

      {/* Indicadores de progreso cuando esté cargando */}
      {isGenerating && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <LoadingSpinner className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Consultando bases de datos científicas...
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Analizando PubMed, Cochrane, UpToDate y otras fuentes de evidencia
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceBasedConsultation; 