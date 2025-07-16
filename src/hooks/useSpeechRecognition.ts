import { useState, useEffect, useRef, useCallback } from 'react';
import { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../types';

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

interface UseSpeechRecognitionReturn {
  isRecording: boolean;
  isSupported: boolean;
  interimTranscript: string;
  error: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
}

export const useSpeechRecognition = (
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn => {
  const {
    continuous = true,
    interimResults = true,
    lang = 'es-CO',
    onTranscript,
    onError,
    onStart,
    onEnd
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isInitializedRef = useRef(false);
  const sessionTranscriptRef = useRef(''); // Acumular texto de toda la sesión

  // Inicializar el reconocimiento de voz
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    const SpeechRecognitionAPI = typeof window !== 'undefined' ? 
      (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      setError("El reconocimiento de voz no está disponible en este navegador. Intenta usar Chrome o Edge.");
      return;
    }

    setIsSupported(true);
    
    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
        setInterimTranscript('');
        sessionTranscriptRef.current = ''; // Resetear el acumulador de sesión
        onStart?.();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let sessionFinalTranscript = '';
        let currentInterim = '';
        
        // Procesar TODOS los resultados desde el inicio
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result && result[0]) {
            const transcript = result[0].transcript;
            if (result.isFinal) {
              sessionFinalTranscript += transcript;
            } else {
              currentInterim += transcript;
            }
          }
        }
        
        setInterimTranscript(currentInterim);
        
        // Solo enviar texto nuevo si hay diferencia con lo acumulado anteriormente
        if (sessionFinalTranscript.trim() && sessionFinalTranscript !== sessionTranscriptRef.current) {
          const newText = sessionFinalTranscript.substring(sessionTranscriptRef.current.length);
          if (newText.trim()) {
            onTranscript?.(newText.trim());
            sessionTranscriptRef.current = sessionFinalTranscript;
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMessage = 'Error de reconocimiento de voz.';
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Permisos de micrófono denegados. Por favor, permite el acceso al micrófono en la configuración del navegador.';
            break;
          case 'no-speech':
            errorMessage = 'No se detectó voz. Inténtalo de nuevo.';
            break;
          case 'audio-capture':
            errorMessage = 'No se pudo acceder al micrófono. Verifica que esté conectado y funcionando.';
            break;
          case 'network':
            errorMessage = 'Error de red. Verifica tu conexión a internet.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Servicio de reconocimiento de voz no disponible. Intenta recargar la página.';
            break;
          case 'bad-grammar':
            errorMessage = 'Error en la configuración del reconocimiento.';
            break;
          case 'language-not-supported':
            errorMessage = 'Idioma no soportado.';
            break;
          default:
            errorMessage = `Error de reconocimiento: ${event.error}`;
        }
        
        setError(errorMessage);
        onError?.(errorMessage);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimTranscript('');
        sessionTranscriptRef.current = ''; // Limpiar el acumulador cuando termina
        onEnd?.();
      };

      recognitionRef.current = recognition;
      isInitializedRef.current = true;
    } catch (err) {
      console.error('Error initializing speech recognition:', err);
      setError('Error al inicializar el reconocimiento de voz.');
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Error stopping recognition:', err);
        }
      }
    };
  }, [continuous, interimResults, lang, onTranscript, onError, onStart, onEnd]);

  const startRecording = useCallback(async () => {
    if (!recognitionRef.current || !isSupported) return;
    
    try {
      // Verificar permisos de micrófono
      if (!hasRequestedPermission) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setHasRequestedPermission(true);
        } catch (permissionError) {
          setError('Permisos de micrófono denegados. Por favor, permite el acceso al micrófono.');
          return;
        }
      }

      if (isRecording) {
        recognitionRef.current.stop();
        return;
      }

      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('No se pudo iniciar el reconocimiento de voz. Inténtalo de nuevo.');
    }
  }, [isRecording, isSupported, hasRequestedPermission]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
  }, [isRecording]);

  const resetTranscript = useCallback(() => {
    setInterimTranscript('');
    setError(null);
    sessionTranscriptRef.current = '';
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