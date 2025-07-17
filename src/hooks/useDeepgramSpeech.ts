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
  testConnection: () => Promise<boolean>;
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

    if (apiKey.trim().length < 10) {
      throw new Error('API key de Deepgram parece ser inválida (muy corta)');
    }

    console.log('Creando servicio Deepgram con API key:', apiKey.substring(0, 8) + '...');

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

  // Función para probar la conexión con Deepgram
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('El dictado no está disponible en este navegador.');
      return false;
    }

    try {
      setError(null);
      console.log('Probando conexión con Deepgram...');
      
      const testService = createService();
      const connectionTest = await testService.testConnection();
      
      if (connectionTest) {
        console.log('✅ Conexión con Deepgram exitosa');
        return true;
      } else {
        const errorMsg = 'No se puede conectar con el servicio de transcripción. Verifica tu conexión a internet y la configuración de API.';
        setError(errorMsg);
        console.error('❌ Prueba de conexión falló');
        return false;
      }
    } catch (err) {
      console.error('Error al probar conexión:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al probar la conexión';
      setError(errorMessage);
      return false;
    }
  }, [isSupported, createService]);

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
    resetTranscript,
    testConnection
  };
}; 