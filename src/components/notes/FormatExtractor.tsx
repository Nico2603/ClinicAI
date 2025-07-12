import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SparklesIcon, LoadingSpinner } from '../ui/Icons';
import { extractTemplateFormat } from '../../lib/services/openaiService';

interface FormatExtractorProps {
  template: string;
  templateName: string;
}

const FormatExtractor: React.FC<FormatExtractorProps> = ({ template, templateName }) => {
  const [extractedFormat, setExtractedFormat] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Referencias para manejar debounce y cancelación
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTemplateRef = useRef<string>('');
  const isExtractingRef = useRef<boolean>(false);

  // Función memoizada para extraer formato
  const extractFormat = useCallback(async (templateContent: string) => {
    // Evitar llamadas duplicadas
    if (isExtractingRef.current || !templateContent.trim()) return;
    
    // Evitar procesar el mismo template múltiples veces
    if (currentTemplateRef.current === templateContent.trim()) return;
    
    currentTemplateRef.current = templateContent.trim();
    isExtractingRef.current = true;
    setIsExtracting(true);
    setError(null);

    try {
      const format = await extractTemplateFormat(templateContent);
      
      // Verificar si el template cambió durante la extracción
      if (currentTemplateRef.current === templateContent.trim()) {
        setExtractedFormat(format);
      }
    } catch (err) {
      console.error('Error extracting format:', err);
      
      // Solo mostrar error si es para el template actual
      if (currentTemplateRef.current === templateContent.trim()) {
        setError('Error al extraer el formato de la plantilla. Por favor, intenta de nuevo.');
      }
    } finally {
      isExtractingRef.current = false;
      setIsExtracting(false);
    }
  }, []);

  // Función para limpiar el estado cuando el template está vacío
  const clearFormat = useCallback(() => {
    currentTemplateRef.current = '';
    setExtractedFormat('');
    setError(null);
    setIsExtracting(false);
    isExtractingRef.current = false;
  }, []);

  // useEffect con debounce para evitar llamadas excesivas
  useEffect(() => {
    // Limpiar timer previo
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const templateTrimmed = template.trim();
    
    if (!templateTrimmed) {
      clearFormat();
      return;
    }

    // Debounce de 1 segundo para evitar llamadas excesivas
    debounceTimerRef.current = setTimeout(() => {
      extractFormat(templateTrimmed);
    }, 1000);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [template, extractFormat, clearFormat]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="mb-4 md:mb-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h3 className="text-lg md:text-xl font-semibold text-neutral-800 dark:text-neutral-100">
          Formato para: <span className="text-secondary">{templateName}</span>
        </h3>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Lado derecho: Formato extraído
        </div>
      </div>
      
      {isExtracting && (
        <div className="flex items-center justify-center p-8 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <LoadingSpinner className="h-6 w-6 mr-3" />
          <span className="text-neutral-600 dark:text-neutral-400">
            Extrayendo formato con IA...
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
          <button
            onClick={() => {
              setError(null);
              if (template.trim()) {
                extractFormat(template.trim());
              }
            }}
            className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {!isExtracting && !error && (
        <div className="relative">
          <textarea
            value={extractedFormat}
            readOnly
            rows={12}
            className="w-full p-3 md:p-4 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm md:text-base resize-y min-h-[200px] cursor-default"
            placeholder="Selecciona o crea una plantilla para ver el formato extraído aquí..."
            aria-label={`Formato extraído para ${templateName}`}
          />
          {extractedFormat && (
            <div className="absolute top-2 right-2">
              <div className="flex items-center text-xs text-secondary bg-white dark:bg-neutral-700 px-2 py-1 rounded-full shadow">
                <SparklesIcon className="h-3 w-3 mr-1" />
                Extraído con IA
              </div>
            </div>
          )}
        </div>
      )}

      {extractedFormat && !isExtracting && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
          <p className="text-blue-700 dark:text-blue-200 text-sm">
            <strong>Formato extraído:</strong> Este es el formato que se utilizará para generar nuevas notas basadas en la estructura de tu plantilla.
          </p>
        </div>
      )}
    </div>
  );
};

export default FormatExtractor; 