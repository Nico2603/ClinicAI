import { useState, useRef, useCallback } from 'react';
import { createLiveKitService, LiveKitService, LiveKitTranscriptResult } from '../lib/services/livekitService';

interface UseLiveKitSpeechOptions {
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onConnectionState?: (state: string) => void;
}

interface UseLiveKitSpeechReturn {
  isRecording: boolean;
  isSupported: boolean;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  connectionState: string;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearTranscripts: () => void;
  testConnection: () => Promise<boolean>;
}

export const useLiveKitSpeech = (options: UseLiveKitSpeechOptions = {}): UseLiveKitSpeechReturn => {
  const { onTranscript, onError, onStart, onEnd, onConnectionState } = options;

  // Estados
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>('disconnected');

  // Referencias
  const serviceRef = useRef<LiveKitService | null>(null);

  // Verificar soporte básico
  const isSupported = typeof WebSocket !== 'undefined' && 
                     typeof MediaRecorder !== 'undefined' && 
                     !!(navigator?.mediaDevices?.getUserMedia) &&
                     !!process.env.NEXT_PUBLIC_LIVEKIT_URL &&
                     !!process.env.NEXT_PUBLIC_LIVEKIT_API_KEY &&
                     !!process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

  // Crear servicio
  const createService = useCallback(() => {
    if (!isSupported) {
      throw new Error('LiveKit o Deepgram no están configurados correctamente');
    }

    return createLiveKitService({
      onTranscript: (result: LiveKitTranscriptResult) => {
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
        console.error('❌ Error de LiveKit:', errorMessage);
        setError(errorMessage);
        setIsRecording(false);
        onError?.(errorMessage);
      },
      onStart: () => {
        console.log('✅ LiveKit iniciado');
        setError(null);
        setIsRecording(true);
        onStart?.();
      },
      onEnd: () => {
        console.log('⏹️ LiveKit terminado');
        setIsRecording(false);
        setInterimTranscript('');
        onEnd?.();
      },
      onConnectionState: (state: string) => {
        console.log(`🔗 Estado de conexión LiveKit: ${state}`);
        setConnectionState(state);
        onConnectionState?.(state);
      }
    });
  }, [isSupported, onTranscript, onError, onStart, onEnd, onConnectionState]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = 'LiveKit no está disponible. Verifica la configuración y compatibilidad del navegador.';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (isRecording) {
      console.log('Ya está grabando con LiveKit, ignorando solicitud');
      return;
    }

    try {
      setError(null);
      console.log('🎤 Iniciando grabación con LiveKit...');
      
      // Crear nueva instancia del servicio
      serviceRef.current = createService();
      
      await serviceRef.current.startRecording();
      
    } catch (err) {
      console.error('❌ Error al iniciar LiveKit:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar la grabación';
      setError(errorMessage);
      setIsRecording(false);
      onError?.(errorMessage);
    }
  }, [isSupported, isRecording, createService, onError]);

  const stopRecording = useCallback(() => {
    console.log('⏹️ Deteniendo LiveKit...');
    
    if (serviceRef.current) {
      serviceRef.current.stopRecording();
      serviceRef.current = null;
    }
    
    setIsRecording(false);
    setInterimTranscript('');
  }, []);

  const clearTranscripts = useCallback(() => {
    console.log('🗑️ Limpiando transcripciones de LiveKit...');
    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('LiveKit no está disponible en este entorno');
      return false;
    }

    try {
      console.log('🔍 Probando conexión con LiveKit...');
      setError(null);
      
      const testService = createService();
      const isValid = await testService.testConnection();
      
      if (isValid) {
        console.log('✅ Conexión exitosa con LiveKit');
        return true;
      } else {
        const errorMsg = 'Fallo en la conexión con LiveKit';
        setError(errorMsg);
        console.error('❌', errorMsg);
        return false;
      }
    } catch (err) {
      console.error('❌ Error al probar conexión LiveKit:', err);
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
    connectionState,
    startRecording,
    stopRecording,
    clearTranscripts,
    testConnection
  };
}; 