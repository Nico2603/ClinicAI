'use client';

import React, { useEffect, useCallback } from 'react';
import { useSpeechRecognition } from '@/hooks';

interface SpeechButtonProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  language?: string;
}

const SpeechButton: React.FC<SpeechButtonProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  placeholder = 'Haz clic en el micrófono para hablar',
  language = 'es-ES'
}) => {
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error
  } = useSpeechRecognition({ language });

  // Efecto para actualizar el valor cuando se recibe transcripción
  useEffect(() => {
    if (transcript) {
      // Combinar el texto existente con la nueva transcripción
      const currentText = value || '';
      const newText = currentText + (currentText && transcript ? ' ' : '') + transcript;
      onChange(newText);
      resetTranscript();
    }
  }, [transcript, value, onChange, resetTranscript]);

  const handleMicrophoneClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  if (!isSupported) {
    return null; // No mostrar el botón si no es compatible
  }

  return (
    <>
      <button
        type="button"
        onClick={handleMicrophoneClick}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center p-2 rounded-lg border transition-all duration-200
          ${isListening 
            ? 'bg-red-500 hover:bg-red-600 border-red-500 text-white shadow-lg animate-pulse' 
            : 'bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:text-primary dark:hover:text-primary'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${className}
        `}
        title={isListening ? 'Detener grabación' : placeholder}
        aria-label={isListening ? 'Detener grabación de voz' : 'Iniciar grabación de voz'}
      >
        {isListening ? (
          // Icono de micrófono activo (grabando)
          <svg 
            className="h-5 w-5" 
            fill="currentColor" 
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        ) : (
          // Icono de micrófono inactivo
          <svg 
            className="h-5 w-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </button>

      {/* Indicador de transcripción en tiempo real */}
      {(isListening || interimTranscript) && (
        <div className="absolute z-10 mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-xs text-blue-700 dark:text-blue-300">
              {interimTranscript || 'Escuchando...'}
            </span>
          </div>
        </div>
      )}

      {/* Mostrar errores */}
      {error && (
        <div className="absolute z-10 mt-1 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg shadow-lg">
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
    </>
  );
};

export default SpeechButton; 