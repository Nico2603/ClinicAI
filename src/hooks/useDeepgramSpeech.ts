import { useState, useEffect, useRef, useCallback } from 'react';
import { createDeepgramService, DeepgramService, DeepgramTranscriptResult } from '../lib/services/deepgramService';

interface UseDeepgramSpeechOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

interface UseDeepgramSpeechReturn {
  isRecording: boolean;
  isSupported: boolean;
  interimTranscript: string;
  error: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
}

export const useDeepgramSpeech = (
  options: UseDeepgramSpeechOptions = {}
): UseDeepgramSpeechReturn => {
  const {
    onTranscript,
    onError,
    onStart,
    onEnd
  } = options;

  // Estados
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Referencias
  const deepgramServiceRef = useRef<DeepgramService | null>(null);
  const sessionTranscriptRef = useRef(''); // Acumular texto final de toda la sesión
  const hasInitializedRef = useRef(false);

  // Verificar soporte y configurar el servicio
  useEffect(() => {
    if (hasInitializedRef.current) return;

    const checkSupport = () => {
      // Verificar soporte de WebSocket, MediaRecorder y getUserMedia
      const hasWebSocket = typeof WebSocket !== 'undefined';
      const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
      const hasGetUserMedia = !!(navigator?.mediaDevices?.getUserMedia);
      const hasApiKey = !!process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

      if (!hasWebSocket || !hasMediaRecorder || !hasGetUserMedia) {
        setIsSupported(false);
        setError('Tu navegador no soporta las funciones necesarias para el dictado. Intenta usar Chrome, Firefox o Edge.');
        return false;
      }

      if (!hasApiKey) {
        setIsSupported(false);
        setError('Configuración de API de transcripción no disponible.');
        return false;
      }

      return true;
    };

    if (checkSupport()) {
      setIsSupported(true);
      hasInitializedRef.current = true;
    }
  }, []);

  // Función para crear el servicio de Deepgram
  const createService = useCallback(() => {
    const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error('API key de Deepgram no configurada');
    }

    return createDeepgramService(apiKey, {
      onTranscript: (result: DeepgramTranscriptResult) => {
        if (result.isFinal) {
          // Transcripción final - agregar al texto acumulado
          if (result.transcript.trim()) {
            const newText = result.transcript.trim();
            sessionTranscriptRef.current += (sessionTranscriptRef.current ? ' ' : '') + newText;
            onTranscript?.(newText);
          }
          // Limpiar transcripción temporal
          setInterimTranscript('');
        } else {
          // Transcripción temporal - mostrar en tiempo real
          setInterimTranscript(result.transcript);
        }
      },
      onError: (errorMessage: string) => {
        console.error('Error de Deepgram:', errorMessage);
        setError(errorMessage);
        onError?.(errorMessage);
        setIsRecording(false);
      },
      onOpen: () => {
        console.log('Conexión con Deepgram establecida');
        setError(null);
        onStart?.();
      },
      onClose: () => {
        console.log('Conexión con Deepgram cerrada');
        setIsRecording(false);
        setInterimTranscript('');
        onEnd?.();
      }
    });
  }, [onTranscript, onError, onStart, onEnd]);

  const stopRecording = useCallback(() => {
    if (deepgramServiceRef.current) {
      deepgramServiceRef.current.stopRecording();
      deepgramServiceRef.current = null;
    }
    setIsRecording(false);
    setInterimTranscript('');
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('El dictado no está disponible en este navegador.');
      return;
    }

    if (isRecording) {
      // Si ya está grabando, detener
      stopRecording();
      return;
    }

    try {
      setError(null);
      
      // Crear nueva instancia del servicio
      deepgramServiceRef.current = createService();
      
      // Iniciar grabación
      setIsRecording(true);
      await deepgramServiceRef.current.startRecording();
      
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar el dictado';
      setError(errorMessage);
      setIsRecording(false);
      onError?.(errorMessage);
    }
  }, [isSupported, isRecording, createService, onError, stopRecording]);

  const resetTranscript = useCallback(() => {
    setInterimTranscript('');
    setError(null);
    sessionTranscriptRef.current = '';
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (deepgramServiceRef.current) {
        deepgramServiceRef.current.stopRecording();
      }
    };
  }, []);

  return {
    isRecording,
    isSupported,
    interimTranscript,
    error,
    startRecording,
    stopRecording,
    resetTranscript
  };
}; 