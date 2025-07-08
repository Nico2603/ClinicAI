'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { MicrophoneIcon, SparklesIcon, LoadingSpinner } from '../ui/Icons';
import { updateClinicalNote } from '../../lib/services/openaiService';
import { GroundingMetadata } from '../../types';
import { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../../types';

interface NoteUpdaterProps {
  className?: string;
}

const NoteUpdater: React.FC<NoteUpdaterProps> = ({ className = '' }) => {
  // Estados principales
  const [originalNote, setOriginalNote] = useState<string>('');
  const [newInformation, setNewInformation] = useState<string>('');
  const [updatedNote, setUpdatedNote] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | undefined>(undefined);

  // Estados para grabación de voz
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isSpeechApiAvailable, setIsSpeechApiAvailable] = useState<boolean>(false);
  const speechRecognitionInstance = useRef<SpeechRecognition | null>(null);

  // Inicialización del reconocimiento de voz
  useEffect(() => {
    const SpeechRecognitionAPI = typeof window !== 'undefined' ? 
      (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    
    if (SpeechRecognitionAPI) {
      setIsSpeechApiAvailable(true);
      speechRecognitionInstance.current = new SpeechRecognitionAPI();
      speechRecognitionInstance.current.continuous = true;
      speechRecognitionInstance.current.interimResults = true;
      speechRecognitionInstance.current.lang = 'es-CO';

      speechRecognitionInstance.current.onstart = () => {
        setIsRecording(true);
        setTranscriptError(null);
        setInterimTranscript('');
      };

      speechRecognitionInstance.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let currentInterim = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result && result[0]) {
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              currentInterim += result[0].transcript;
            }
          }
        }
        
        setInterimTranscript(currentInterim);
        
        if (finalTranscript) {
          setNewInformation((prevInfo) => 
            prevInfo + (prevInfo.endsWith(' ') || prevInfo === '' ? '' : ' ') + finalTranscript + ' '
          );
          setInterimTranscript('');
        }
      };

      speechRecognitionInstance.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        setTranscriptError(`Error de reconocimiento: ${event.error}`);
        console.error('Speech recognition error', event);
        setIsRecording(false);
      };

      speechRecognitionInstance.current.onend = () => {
        setIsRecording(false);
        setInterimTranscript('');
      };
    } else {
      setIsSpeechApiAvailable(false);
      setTranscriptError("La API de reconocimiento de voz no está disponible en este navegador.");
    }

    return () => {
      if (speechRecognitionInstance.current) {
        speechRecognitionInstance.current.stop();
      }
    };
  }, []);

  const handleToggleRecording = () => {
    if (!speechRecognitionInstance.current) return;
    
    if (isRecording) {
      speechRecognitionInstance.current.stop();
    } else {
      try {
        setNewInformation(prev => prev.trim() + (prev.trim() ? " " : ""));
        speechRecognitionInstance.current.start();
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        setTranscriptError("No se pudo iniciar el dictado. Verifique los permisos del micrófono.");
        setIsRecording(false);
      }
    }
  };

  const handleUpdateNote = async () => {
    if (!originalNote.trim()) {
      setError("Por favor, ingrese la nota clínica original.");
      return;
    }

    if (!newInformation.trim()) {
      setError("Por favor, ingrese la nueva información para actualizar.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setUpdatedNote('');

    try {
      const result = await updateClinicalNote(originalNote.trim(), newInformation.trim());
      setUpdatedNote(result.text);
      setGroundingMetadata(result.groundingMetadata);
    } catch (error) {
      console.error('Error updating note:', error);
      setError(`Error al actualizar la nota: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveUpdatedNote = async () => {
    if (!updatedNote.trim()) {
      setError("No hay nota actualizada para guardar.");
      return;
    }

    try {
      // Crear blob y descargar
      const blob = new Blob([updatedNote], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nota_clinica_actualizada_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving note:', error);
      setError("Error al guardar la nota actualizada.");
    }
  };

  const handleClearAll = () => {
    setOriginalNote('');
    setNewInformation('');
    setUpdatedNote('');
    setError(null);
    setGroundingMetadata(undefined);
    if (speechRecognitionInstance.current && isRecording) {
      speechRecognitionInstance.current.stop();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <SparklesIcon className="h-6 w-6 text-purple-600" />
          Actualizador de Notas Clínicas
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Actualiza notas clínicas existentes con nueva información de forma inteligente, manteniendo la estructura y coherencia original.
        </p>
      </div>

      {/* Nota Original */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Nota Clínica Original
        </label>
        <textarea
          value={originalNote}
          onChange={(e) => setOriginalNote(e.target.value)}
          placeholder="Pegue aquí la nota clínica completa que desea actualizar..."
          className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
        />
      </div>

      {/* Nueva Información */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Nueva Información para Actualizar
        </label>
        <div className="relative">
          <textarea
            value={newInformation + interimTranscript}
            onChange={(e) => setNewInformation(e.target.value)}
            placeholder="Escriba o dicte la nueva información que desea agregar a la nota (ej. 'El paciente salió para cirugía')..."
            className="w-full h-32 p-4 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
          />
          
          {/* Botón de micrófono */}
          {isSpeechApiAvailable && (
            <button
              onClick={handleToggleRecording}
              className={`absolute top-3 right-3 p-2 rounded-lg transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={isRecording ? "Detener grabación" : "Iniciar grabación de voz"}
            >
              <MicrophoneIcon className={`h-5 w-5 ${isRecording ? 'animate-pulse' : ''}`} />
            </button>
          )}
        </div>

        {/* Errores de transcripción */}
        {transcriptError && (
          <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
            {transcriptError}
          </div>
        )}

        {/* Indicador de grabación */}
        {isRecording && (
          <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Grabando... Hable ahora
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleUpdateNote}
          disabled={isProcessing || !originalNote.trim() || !newInformation.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <LoadingSpinner className="h-4 w-4" />
              Procesando...
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4" />
              Actualizar Nota
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
          <div className="flex">
            <div className="text-red-400">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nota Actualizada */}
      {updatedNote && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Nota Clínica Actualizada
            </h3>
            <Button
              onClick={handleSaveUpdatedNote}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
            >
              📄 Grabar Nota Actualizada
            </Button>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
              {updatedNote}
            </pre>
          </div>

          {/* Grounding metadata si está disponible */}
          {groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p className="font-medium">Fuentes consultadas:</p>
              {groundingMetadata.groundingChunks.map((chunk, index) => (
                chunk.web?.uri && (
                  <div key={index} className="flex items-center gap-2">
                    <span>•</span>
                    <a 
                      href={chunk.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      {chunk.web.title || chunk.web.uri}
                    </a>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NoteUpdater; 