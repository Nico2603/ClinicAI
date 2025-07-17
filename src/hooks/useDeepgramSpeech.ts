import { useState, useRef, useCallback } from 'react';
import { createDeepgramService, DeepgramService, DeepgramTranscriptResult } from '../lib/services/deepgramService';

interface UseDeepgramSpeechOptions {
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

interface UseDeepgramSpeechReturn {
  isRecording: boolean;
  isSupported: boolean;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearTranscripts: () => void;
  testConnection: () => Promise<boolean>;
}

export const useDeepgramSpeech = (options: UseDeepgramSpeechOptions = {}): UseDeepgramSpeechReturn => {
  const { onTranscript, onError, onStart, onEnd } = options;

  // Estados
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Referencias
  const serviceRef = useRef<DeepgramService | null>(null);

  // Verificar soporte básico
  const isSupported = typeof WebSocket !== 'undefined' && 
                     typeof MediaRecorder !== 'undefined' && 
                     !!(navigator?.mediaDevices?.getUserMedia) &&
                     !!process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

  // Crear servicio
  const createService = useCallback(() => {
    const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error('API key de Deepgram no configurada');
    }

    return createDeepgramService(apiKey, {
      onTranscript: (result: DeepgramTranscriptResult) => {
        if (result.isFinal) {
          // Transcripción final
          const newText = result.transcript;
          setFinalTranscript(prev => prev + (prev ? ' ' : '') + newText);
          setInterimTranscript(''); // Limpiar transcripción temporal
          onTranscript?.(newText);
        } else {
          // Transcripción temporal
          setInterimTranscript(result.transcript);
        }
      },
      onError: (errorMessage: string) => {
        console.error('❌ Error de dictado:', errorMessage);
        setError(errorMessage);
        setIsRecording(false);
        onError?.(errorMessage);
      },
      onStart: () => {
        console.log('✅ Dictado iniciado');
        setError(null);
        onStart?.();
      },
      onEnd: () => {
        console.log('⏹️ Dictado terminado');
        setIsRecording(false);
        setInterimTranscript('');
        onEnd?.();
      }
    });
  }, [onTranscript, onError, onStart, onEnd]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = 'El dictado no está disponible. Verifica que tengas un navegador compatible y la API key configurada.';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (isRecording) {
      console.log('Ya está grabando, ignorando solicitud');
      return;
    }

    try {
      setError(null);
      console.log('🎤 Iniciando dictado...');
      
      // Crear nueva instancia del servicio
      serviceRef.current = createService();
      setIsRecording(true);
      
      await serviceRef.current.startRecording();
      
    } catch (err) {
      console.error('❌ Error al iniciar dictado:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar el dictado';
      setError(errorMessage);
      setIsRecording(false);
      onError?.(errorMessage);
    }
  }, [isSupported, isRecording, createService, onError]);

  const stopRecording = useCallback(() => {
    console.log('⏹️ Deteniendo dictado...');
    
    if (serviceRef.current) {
      serviceRef.current.stopRecording();
      serviceRef.current = null;
    }
    
    setIsRecording(false);
    setInterimTranscript('');
  }, []);

  const clearTranscripts = useCallback(() => {
    console.log('🗑️ Limpiando transcripciones...');
    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('El dictado no está disponible en este entorno');
      return false;
    }

    try {
      console.log('🔍 Probando conexión con Deepgram...');
      setError(null);
      
      const testService = createService();
      const isValid = await testService.testApiKey();
      
      if (isValid) {
        console.log('✅ Conexión exitosa con Deepgram');
        return true;
      } else {
        const errorMsg = 'API key inválida o sin permisos';
        setError(errorMsg);
        console.error('❌', errorMsg);
        return false;
      }
    } catch (err) {
      console.error('❌ Error al probar conexión:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al probar la conexión';
      setError(errorMessage);
      return false;
    }
  }, [isSupported, createService]);

  return {
    isRecording,
    isSupported,
    interimTranscript,
    finalTranscript,
    error,
    startRecording,
    stopRecording,
    clearTranscripts,
    testConnection
  };
}; 