'use client';

import { useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';

// Componente de debugging simplificado - Solo para desarrollo
export const Debug = () => {
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);

  const {
    isRecording,
    isAvailable,
    error,
    startRecording,
    stopRecording
  } = useSpeech({
    onTranscript: (transcript: string) => {
      console.log('📝 Transcripción recibida:', transcript);
      setTranscriptHistory(prev => [...prev, transcript]);
    },
    onError: (error: string) => {
      console.error('❌ Error de transcripción:', error);
    }
  });

  const clearHistory = () => {
    setTranscriptHistory([]);
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold text-gray-800">🛠️ Debug - Speech Recognition</h2>
      
      {/* Estado actual */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-white rounded border">
          <h3 className="font-semibold text-sm text-gray-600">Estado</h3>
          <p className={isRecording ? 'text-red-600' : 'text-gray-800'}>
            {isRecording ? '🔴 Grabando' : '⚪ Detenido'}
          </p>
        </div>
        
        <div className="p-3 bg-white rounded border">
          <h3 className="font-semibold text-sm text-gray-600">Disponibilidad</h3>
          <p className={isAvailable ? 'text-green-600' : 'text-red-600'}>
            {isAvailable ? '✅ Disponible' : '❌ No disponible'}
          </p>
        </div>
      </div>

      {/* Controles */}
      <div className="space-y-2">
        <button 
          onClick={startRecording}
          className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-400"
          disabled={!isAvailable || isRecording}
        >
          🎤 {isRecording ? 'Grabando...' : 'Iniciar Grabación'}
        </button>
        
        {isRecording && (
          <button 
            onClick={stopRecording}
            className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            ⏹️ Detener Grabación
          </button>
        )}
        
        <button 
          onClick={clearHistory}
          className="w-full p-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          🗑️ Limpiar Historial
        </button>
      </div>

      {/* Errores */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-sm text-red-700 mb-1">Error:</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Historial de transcripciones */}
      {transcriptHistory.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded max-h-40 overflow-y-auto">
          <h3 className="font-semibold text-sm text-blue-700 mb-2">Historial de transcripciones:</h3>
          <div className="space-y-1">
            {transcriptHistory.map((transcript, index) => (
              <p key={index} className="text-sm text-blue-600 p-2 bg-white rounded border border-blue-100">
                {transcript}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Información básica */}
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-sm text-yellow-700 mb-1">Información:</h3>
        <ul className="text-sm text-yellow-600 space-y-1">
          <li>• Usa Deepgram para reconocimiento de voz</li>
          <li>• Requiere permisos de micrófono</li>
          <li>• Las transcripciones aparecen cuando finalizan</li>
        </ul>
      </div>
    </div>
  );
}; 