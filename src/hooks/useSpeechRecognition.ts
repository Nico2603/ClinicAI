import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

export const useSpeechRecognition = (
  options: SpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn => {
  const {
    language = 'es-ES',
    continuous = true,
    interimResults = true,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const lastProcessedTranscriptRef = useRef('');
  const processedChunksRef = useRef<Set<string>>(new Set()); // Para evitar chunks duplicados
  const shouldKeepListeningRef = useRef(false); // Para control de reconocimiento continuo en móviles
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar si estamos en un dispositivo móvil
  const isMobile = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Detectar si estamos en Safari iOS
  const isIOSSafari = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua);
  }, []);

  // Verificar si el navegador soporta Speech Recognition
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    !isIOSSafari(); // Safari iOS no soporta Web Speech API

  // Función avanzada para eliminar duplicaciones internas y externas
  const removeInternalDuplicates = useCallback((text: string): string => {
    if (!text) return '';
    
    // Normalizar espacios
    let cleanedText = text.trim().replace(/\s+/g, ' ');
    
    // 1. Eliminar duplicaciones consecutivas de una palabra
    cleanedText = cleanedText.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');
    
    // 2. Eliminar duplicaciones consecutivas de 2-3 palabras
    cleanedText = cleanedText.replace(/\b((\w+\s+){1,2}\w+)(?:\s+\1\b)+/gi, '$1');
    
    // 3. Eliminar duplicaciones al final del texto
    const words = cleanedText.split(' ');
    const result = [];
    const seen = new Set<string>();
    
    for (let i = 0; i < words.length; i++) {
      const currentWord = words[i];
      if (!currentWord) continue;
      
      const word = currentWord.toLowerCase();
      const phrase2 = i > 0 && words[i-1] ? `${words[i-1]} ${currentWord}`.toLowerCase() : '';
      const phrase3 = i > 1 && words[i-2] && words[i-1] ? `${words[i-2]} ${words[i-1]} ${currentWord}`.toLowerCase() : '';
      
      // Verificar si esta palabra o frase ya apareció recientemente
      const isRecent = seen.has(word) || (phrase2 && seen.has(phrase2)) || (phrase3 && seen.has(phrase3));
      
      if (!isRecent || i < 3) {
        result.push(currentWord);
        seen.add(word);
        if (phrase2) seen.add(phrase2);
        if (phrase3) seen.add(phrase3);
      }
      
      // Limpiar el conjunto para evitar que crezca demasiado
      if (seen.size > 50) {
        seen.clear();
      }
    }
    
    return result.join(' ');
  }, []);

  // Función mejorada para limpiar y evitar repeticiones
  const cleanTranscript = useCallback((newText: string, existingText: string): string => {
    if (!newText) return existingText;
    
    // Normalizar espacios y limpiar
    const cleanNew = newText.trim().replace(/\s+/g, ' ');
    const cleanExisting = existingText.trim();
    
    // Si el texto nuevo ya está completamente incluido al final, no agregarlo
    if (cleanExisting.toLowerCase().endsWith(cleanNew.toLowerCase())) {
      return cleanExisting;
    }
    
    // Separar en palabras para evitar duplicaciones
    const existingWords = cleanExisting.split(' ').filter(w => w.length > 0);
    const newWords = cleanNew.split(' ').filter(w => w.length > 0);
    
    // Encontrar solapamiento más largo entre el final del texto existente y el inicio del nuevo
    let overlap = 0;
    const maxOverlap = Math.min(existingWords.length, newWords.length, 10); // Limitar búsqueda de solapamiento
    
    for (let i = 1; i <= maxOverlap; i++) {
      const existingEnd = existingWords.slice(-i).map(w => w.toLowerCase()).join(' ');
      const newStart = newWords.slice(0, i).map(w => w.toLowerCase()).join(' ');
      if (existingEnd === newStart) {
        overlap = i;
      }
    }
    
    // Obtener las palabras únicas del nuevo texto
    const uniqueNewWords = newWords.slice(overlap);
    
    // Combinar textos
    let result = cleanExisting;
    if (uniqueNewWords.length > 0) {
      result += (cleanExisting ? ' ' : '') + uniqueNewWords.join(' ');
    }
    
    // Aplicar limpieza de duplicaciones internas
    result = removeInternalDuplicates(result);
    
    return result;
  }, [removeInternalDuplicates]);

  // Función para reiniciar el reconocimiento en móviles
  const restartRecognition = useCallback(() => {
    if (!recognitionRef.current || !shouldKeepListeningRef.current || !isMobile()) return;
    
    // Limpiar timeout anterior
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    
    // Reiniciar después de un pequeño delay
    restartTimeoutRef.current = setTimeout(() => {
      if (recognitionRef.current && shouldKeepListeningRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.warn('Error al reiniciar reconocimiento:', error);
          // Intentar una vez más después de otro delay
          setTimeout(() => {
            if (recognitionRef.current && shouldKeepListeningRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('Error persistente al reiniciar reconocimiento:', e);
                setError('Error al mantener el reconocimiento activo');
                setIsListening(false);
                shouldKeepListeningRef.current = false;
              }
            }
          }, 500);
        }
      }
    }, 100);
  }, [isMobile]);

  // Inicializar el reconocimiento de voz
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = language;
    // Configuración optimizada por plataforma
    recognition.continuous = isMobile() ? false : continuous; // En móviles usar false
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    // Configuraciones adicionales para mejor rendimiento en móviles
    if (isMobile()) {
      // En Android Chrome, estos valores pueden ayudar
      try {
        (recognition as any).serviceURI = undefined; // Usar servicio local si está disponible
      } catch (e) {
        // Ignorar si no es compatible
      }
    }

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log('Reconocimiento de voz iniciado');
    };

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      // Procesar todos los resultados desde el último índice
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result && result[0]) {
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }
      }

      // Actualizar transcript interim (limpiarlo también)
      const cleanInterim = removeInternalDuplicates(interimText);
      setInterimTranscript(cleanInterim);

      // Procesar texto final solo si es nuevo y no está duplicado
      if (finalText) {
        const cleanFinalText = removeInternalDuplicates(finalText);
        const chunkHash = `${cleanFinalText.toLowerCase()}_${Date.now()}`;
        
                 // Verificar si este chunk ya fue procesado (con una ventana de tiempo)
         const recentChunks = Array.from(processedChunksRef.current).filter(chunk => {
           const parts = chunk.split('_');
           const timestampStr = parts[parts.length - 1];
           const timestamp = parseInt(timestampStr || '0');
           return Date.now() - timestamp < 2000; // Ventana de 2 segundos
         });
        
        const isDuplicate = recentChunks.some(chunk => {
          const chunkText = chunk.split('_').slice(0, -1).join('_');
          return chunkText === cleanFinalText.toLowerCase();
        });
        
        if (!isDuplicate && cleanFinalText !== lastProcessedTranscriptRef.current) {
          // Agregar a chunks procesados
          processedChunksRef.current.add(chunkHash);
          
          // Limpiar chunks antiguos
          if (processedChunksRef.current.size > 20) {
            const oldChunks = Array.from(processedChunksRef.current).slice(0, 10);
            oldChunks.forEach(chunk => processedChunksRef.current.delete(chunk));
          }
          
          lastProcessedTranscriptRef.current = cleanFinalText;
          finalTranscriptRef.current = cleanTranscript(cleanFinalText, finalTranscriptRef.current);
          setTranscript(finalTranscriptRef.current);
          
          console.log('Texto final procesado:', cleanFinalText);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'Error en el reconocimiento de voz';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No se detectó habla. Intenta hablar más claro.';
          break;
        case 'audio-capture':
          errorMessage = 'No se pudo acceder al micrófono.';
          break;
        case 'not-allowed':
          errorMessage = 'Acceso al micrófono denegado. Permite el acceso para usar esta función.';
          break;
        case 'network':
          errorMessage = 'Error de red. Verifica tu conexión a internet.';
          break;
        case 'aborted':
          // Error común en móviles, generalmente se puede ignorar
          console.log('Reconocimiento abortado, reintentando...');
          if (shouldKeepListeningRef.current) {
            restartRecognition();
          }
          return;
        default:
          errorMessage = `Error de reconocimiento de voz: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsListening(false);
      shouldKeepListeningRef.current = false;
    };

    recognition.onend = () => {
      console.log('Reconocimiento de voz finalizado');
      setIsListening(false);
      setInterimTranscript('');
      
      // En móviles, reiniciar automáticamente si se debe continuar
      if (isMobile() && shouldKeepListeningRef.current) {
        restartRecognition();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [isSupported, language, continuous, interimResults, cleanTranscript, removeInternalDuplicates, isMobile, restartRecognition]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('El reconocimiento de voz no es compatible con este navegador.');
      return;
    }

    if (isIOSSafari()) {
      setError('Safari en iOS no soporta reconocimiento de voz. Usa Chrome o Firefox.');
      return;
    }

    if (!recognitionRef.current || isListening) return;

    try {
      shouldKeepListeningRef.current = true;
      processedChunksRef.current.clear(); // Limpiar chunks al iniciar
      recognitionRef.current.start();
      console.log('Iniciando reconocimiento de voz...');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Error al iniciar el reconocimiento de voz.');
      shouldKeepListeningRef.current = false;
    }
  }, [isSupported, isListening, isIOSSafari]);

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      console.log('Deteniendo reconocimiento de voz...');
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    lastProcessedTranscriptRef.current = '';
    processedChunksRef.current.clear();
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
};

// Declaraciones de tipos para TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
}; 