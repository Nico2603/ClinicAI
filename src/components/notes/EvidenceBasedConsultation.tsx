'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { 
  SparklesIcon, 
  LoadingSpinner, 
  LightBulbIcon, 
  CopyIcon, 
  CheckIcon,
  DocumentTextIcon,
  PlusIcon
} from '../ui/Icons';
import { 
  generateEvidenceBasedConsultation,
  formatEvidenceBasedReport
} from '../../lib/services/openaiService';
import { 
  ClinicalAnalysisResult,
  EvidenceSearchResult,
  ClinicalFinding,
  ClinicalRecommendation
} from '../../types';
import NoteDisplay from './NoteDisplay';

interface EvidenceBasedConsultationProps {
  className?: string;
  onConsultationGenerated?: (consultationText: string) => void;
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
  const [specificQuestions, setSpecificQuestions] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ClinicalAnalysisResult | null>(null);
  const [evidenceSearch, setEvidenceSearch] = useState<EvidenceSearchResult | null>(null);
  const [formattedReport, setFormattedReport] = useState<string>('');
  
  // Estados de UI
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'findings' | 'recommendations' | 'report'>('findings');
  const [autoAnalyzed, setAutoAnalyzed] = useState<boolean>(false);

  // Auto-análisis cuando se proporciona contenido
  useEffect(() => {
    if (autoAnalyzeContent && autoAnalyzeContent.trim() && enableAutoAnalysis && !autoAnalyzed) {
      setClinicalContent(autoAnalyzeContent);
      handleAnalyzeContent(autoAnalyzeContent);
      setAutoAnalyzed(true);
    }
  }, [autoAnalyzeContent, enableAutoAnalysis, autoAnalyzed]);

  const handleAnalyzeContent = async (contentToAnalyze?: string) => {
    const content = contentToAnalyze || clinicalContent;
    
    if (!content.trim()) {
      setError("Por favor, ingresa información clínica para analizar.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setEvidenceSearch(null);
    setFormattedReport('');

    try {
      const questions = specificQuestions.trim() 
        ? specificQuestions.split('\n').map(q => q.trim()).filter(q => q)
        : undefined;

      const result = await generateEvidenceBasedConsultation(content.trim(), questions);
      
      setAnalysisResult(result.analysis);
      setEvidenceSearch(result.evidenceSearch || null);
      
      // Formatear el reporte
      const report = await formatEvidenceBasedReport(
        result.analysis, 
        result.evidenceSearch, 
        true
      );
      setFormattedReport(report);
      
    } catch (error) {
      console.error('Error analyzing clinical content:', error);
      setError(`Error al analizar contenido clínico: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyReport = () => {
    if (!formattedReport) return;
    
    navigator.clipboard.writeText(formattedReport)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Error al copiar:', err));
  };

  const handleInsertIntoNote = () => {
    if (!formattedReport || !onConsultationGenerated) return;
    
    onConsultationGenerated(formattedReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearAll = () => {
    setClinicalContent('');
    setSpecificQuestions('');
    setAnalysisResult(null);
    setEvidenceSearch(null);
    setFormattedReport('');
    setError(null);
    setAutoAnalyzed(false);
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'severe': return 'text-orange-600 dark:text-orange-400';
      case 'moderate': return 'text-yellow-600 dark:text-yellow-400';
      case 'mild': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
      case 'routine': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'elective': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
  };

  const getEvidenceQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'low': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
      case 'very_low': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <LightBulbIcon className="h-6 w-6 text-blue-600" />
          Consulta Clínica Basada en Evidencia
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Análisis automático del contenido clínico con recomendaciones basadas en evidencia científica actual de revistas médicas indexadas.
        </p>
      </div>

      {/* Entrada de Contenido Clínico */}
      {!autoAnalyzed && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Contenido Clínico para Análisis
            </label>
            <textarea
              value={clinicalContent}
              onChange={(e) => setClinicalContent(e.target.value)}
              placeholder="Ingresa aquí el contenido clínico completo (síntomas, signos, historia clínica, exámenes, etc.). La IA analizará automáticamente este contenido y proporcionará recomendaciones basadas en evidencia científica..."
              className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Preguntas Específicas (Opcional)
            </label>
            <textarea
              value={specificQuestions}
              onChange={(e) => setSpecificQuestions(e.target.value)}
              placeholder="Ingresa preguntas específicas que quieras que la IA investigue (una por línea):&#10;- ¿Cuál es el mejor tratamiento para este caso?&#10;- ¿Qué estudios diagnósticos adicionales se recomiendan?&#10;- ¿Hay contraindicaciones específicas a considerar?"
              className="w-full h-24 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Auto-Analysis Indicator */}
      {autoAnalyzed && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900 dark:text-blue-100">
              Análisis automático realizado basado en el contenido clínico proporcionado
            </span>
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => handleAnalyzeContent()}
          disabled={(!clinicalContent.trim() && !autoAnalyzed) || isAnalyzing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isAnalyzing ? (
            <LoadingSpinner className="h-4 w-4" />
          ) : (
            <SparklesIcon className="h-4 w-4" />
          )}
          {isAnalyzing ? 'Analizando...' : 'Analizar con IA'}
        </Button>
        
        {formattedReport && (
          <>
            <Button
              onClick={handleCopyReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              {copied ? 'Copiado' : 'Copiar Reporte'}
            </Button>
            
            {onConsultationGenerated && (
              <Button
                onClick={handleInsertIntoNote}
                variant="outline"
                className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
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

      {/* Resultados del Análisis */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-600">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('findings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'findings'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                }`}
              >
                Hallazgos Clínicos ({analysisResult.findings.length})
              </button>
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recommendations'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                }`}
              >
                Recomendaciones ({analysisResult.recommendations.length})
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'report'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                }`}
              >
                Reporte Completo
              </button>
            </nav>
          </div>

          {/* Banderas Rojas (Siempre Visible) */}
          {analysisResult.redFlags.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <h3 className="font-bold text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
                🚩 Banderas Rojas - Atención Inmediata
              </h3>
              <ul className="space-y-2">
                {analysisResult.redFlags.map((flag, index) => (
                  <li key={index} className="text-red-700 dark:text-red-200 flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'findings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {analysisResult.findings.map((finding, index) => (
                <div key={finding.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {finding.category.toUpperCase()}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round(finding.confidence * 100)}% confianza
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{finding.description}</p>
                  {finding.severity && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(finding.severity)}`}>
                      Severidad: {finding.severity}
                    </span>
                  )}
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                    <strong>Texto extraído:</strong> "{finding.extractedText}"
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {analysisResult.recommendations.map((rec, index) => (
                <div key={rec.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">{rec.title}</h4>
                    <div className="flex gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(rec.urgency)}`}>
                        {rec.urgency}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEvidenceQualityColor(rec.evidenceQuality)}`}>
                        {rec.evidenceQuality}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{rec.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fuerza de recomendación:</span>
                      <p className="text-gray-900 dark:text-white">{rec.strength}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Aplicabilidad:</span>
                      <p className="text-gray-900 dark:text-white">{Math.round(rec.applicability * 100)}%</p>
                    </div>
                  </div>

                  {rec.contraindications && rec.contraindications.length > 0 && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Contraindicaciones:</span>
                      <ul className="mt-1 text-red-700 dark:text-red-300">
                        {rec.contraindications.map((contra, idx) => (
                          <li key={idx}>• {contra}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rec.sources.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fuentes de evidencia:</span>
                      <ul className="mt-2 space-y-1">
                        {rec.sources.map((source, idx) => (
                          <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                            • {source.title} ({source.type}, Nivel {source.evidenceLevel})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'report' && formattedReport && (
            <NoteDisplay
              note={formattedReport}
              title="Reporte de Consulta Basada en Evidencia"
              isLoading={false}
            />
          )}

          {/* Información Adicional */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysisResult.differentialDiagnoses.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  Diagnósticos Diferenciales
                </h4>
                <ul className="text-yellow-700 dark:text-yellow-200 text-sm space-y-1">
                  {analysisResult.differentialDiagnoses.map((dx, index) => (
                    <li key={index}>• {dx}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.suggestedWorkup.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Plan Diagnóstico Sugerido
                </h4>
                <ul className="text-green-700 dark:text-green-200 text-sm space-y-1">
                  {analysisResult.suggestedWorkup.map((study, index) => (
                    <li key={index}>• {study}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Confianza del Análisis
              </h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${analysisResult.confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(analysisResult.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Importante:</strong> {analysisResult.disclaimerText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceBasedConsultation; 