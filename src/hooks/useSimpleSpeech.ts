import { useState, useRef, useCallback } from 'react';
import { createDeepgramService, DeepgramService, DeepgramTranscriptResult } from '../lib/services/deepgramService';

interface UseSimpleSpeechOptions {
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseSimpleSpeechReturn {
  isRecording: boolean;
  isAvailable: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearError: () => void;
}

export const useSimpleSpeech = (options: UseSimpleSpeechOptions = {}): UseSimpleSpeechReturn => {
  const { onTranscript, onError } = options;

  // Estados simples
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Referencias
  const serviceRef = useRef<DeepgramService | null>(null);

  // Verificar si está disponible
  const isAvailable = Boolean(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof WebSocket !== 'undefined' &&
    process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY
  );

  const startRecording = useCallback(async () => {
    if (!isAvailable) {
      const errorMsg = 'El micrófono no está disponible';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (isRecording) return;

    try {
      setError(null);
      
      // Crear servicio
      serviceRef.current = createDeepgramService(
        process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY!,
        {
          onTranscript: (result: DeepgramTranscriptResult) => {
            if (result.isFinal && result.transcript.trim()) {
              onTranscript?.(result.transcript.trim());
            }
          },
          onError: (errorMessage: string) => {
            setError(errorMessage);
            setIsRecording(false);
            onError?.(errorMessage);
          },
          onStart: () => {
            setIsRecording(true);
          },
          onEnd: () => {
            setIsRecording(false);
          }
        }
      );
      
      await serviceRef.current.startRecording();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar la grabación';
      setError(errorMessage);
      setIsRecording(false);
      onError?.(errorMessage);
    }
  }, [isAvailable, isRecording, onTranscript, onError]);

  const stopRecording = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stopRecording();
      serviceRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isRecording,
    isAvailable,
    error,
    startRecording,
    stopRecording,
    clearError
  };
}; 