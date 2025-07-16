import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { extractTemplateFormat } from '../../lib/services/openaiService';

interface FormatExtractorProps {
  template: string;
  onFormatExtracted: (format: string) => void;
  onError: (error: string) => void;
  autoExtract?: boolean;
  debounceMs?: number;
}

// =============================================================================
// COMPONENTE OPTIMIZADO CON MEMOIZACIÓN Y DEBOUNCING MEJORADO
// =============================================================================

const FormatExtractor: React.FC<FormatExtractorProps> = memo(({
  template,
  onFormatExtracted,
  onError,
  autoExtract = true,
  debounceMs = 2000  // Aumentado de 1 segundo a 2 segundos para mejor rendimiento
}) => {
  // Estados optimizados
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastProcessedTemplate, setLastProcessedTemplate] = useState<string>('');
  
  // Referencias para optimización
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const extractionAbortRef = useRef<boolean>(false);
  const lastTemplateRef = useRef<string>('');

  // Función memoizada para limpiar el formato
  const clearFormat = useCallback(() => {
    onFormatExtracted('');
    setLastProcessedTemplate('');
    lastTemplateRef.current = '';
  }, [onFormatExtracted]);

  // Función optimizada para extraer formato con cancelación
  const extractFormat = useCallback(async (templateContent: string) => {
    // Verificar si ya se procesó esta plantilla exacta
    if (templateContent === lastProcessedTemplate) {
      return;
    }

    // Verificar longitud mínima
    if (templateContent.length < 50) {
      clearFormat();
      return;
    }

    // Verificar si hay una extracción en progreso
    if (isExtracting) {
      extractionAbortRef.current = true;
      return;
    }

    try {
      setIsExtracting(true);
      extractionAbortRef.current = false;

      console.log('🔄 Extrayendo formato de plantilla...');
      
      // Verificar cancelación antes de hacer la llamada costosa
      if (extractionAbortRef.current) {
        return;
      }

      const extractedFormat = await extractTemplateFormat(templateContent);
      
      // Verificar cancelación después de la operación
      if (extractionAbortRef.current) {
        return;
      }

      console.log('✅ Formato extraído exitosamente');
      onFormatExtracted(extractedFormat);
      setLastProcessedTemplate(templateContent);
      lastTemplateRef.current = templateContent;
    } catch (error) {
      // Solo manejar error si no fue cancelado
      if (!extractionAbortRef.current) {
        console.error('❌ Error al extraer formato:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        onError(`Error al extraer formato: ${errorMessage}`);
        clearFormat();
      }
    } finally {
      if (!extractionAbortRef.current) {
        setIsExtracting(false);
      }
    }
  }, [isExtracting, lastProcessedTemplate, onFormatExtracted, onError, clearFormat]);

  // Effect optimizado con debounce mejorado
  useEffect(() => {
    // Limpiar timer previo
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const templateTrimmed = template.trim();
    
    // Si no hay plantilla, limpiar formato inmediatamente
    if (!templateTrimmed) {
      clearFormat();
      return;
    }

    // Si no está habilitado el auto-extract, no hacer nada
    if (!autoExtract) {
      return;
    }

    // Si es la misma plantilla que la última procesada, no hacer nada
    if (templateTrimmed === lastTemplateRef.current) {
      return;
    }

    // Debounce optimizado con verificación de cambios reales
    debounceTimerRef.current = setTimeout(() => {
      // Verificación final antes de extraer
      if (templateTrimmed !== template.trim()) {
        return; // El template cambió durante el debounce
      }
      
      extractFormat(templateTrimmed);
    }, debounceMs);

    // Cleanup function optimizada
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [template, autoExtract, debounceMs, extractFormat, clearFormat]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      // Cancelar cualquier extracción en progreso
      extractionAbortRef.current = true;
      
      // Limpiar timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Función pública para extraer manualmente (opcional)
  const extractManually = useCallback(() => {
    if (template.trim()) {
      extractFormat(template.trim());
    }
  }, [template, extractFormat]);

  // El componente no renderiza nada visualmente, solo maneja la lógica
  return null;
});

FormatExtractor.displayName = 'FormatExtractor';

export default FormatExtractor; 