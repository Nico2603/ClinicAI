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
  isMobile: boolean;
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
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultIndexRef = useRef(0);
  const processedResultsRef = useRef(new Set<string>());

  // Detectar si es un dispositivo móvil
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Verificar si el navegador soporta Speech Recognition
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Función mejorada para limpiar y evitar repeticiones (optimizada para móviles)
  const cleanTranscript = useCallback((newText: string, existingText: string): string => {
    if (!newText) return existingText;
    
    // Normalizar espacios y limpiar
    const cleanNew = newText.trim().replace(/\s+/g, ' ').toLowerCase();
    const cleanExisting = existingText.trim().toLowerCase();
    
    // Para móviles, ser más agresivo con la detección de duplicaciones
    if (isMobile) {
      // Si el nuevo texto está completamente contenido en el existente, no agregarlo
      if (cleanExisting.includes(cleanNew)) {
        return existingText;
      }
      
      // Verificar si el nuevo texto es muy similar al final del existente
      const words = cleanNew.split(' ');
      const existingWords = cleanExisting.split(' ');
      
      // Si las últimas palabras son exactamente iguales, evitar duplicación
      const overlapThreshold = Math.min(words.length, 3); // Máximo 3 palabras de overlap
      
      for (let i = 1; i <= overlapThreshold; i++) {
        const lastExistingWords = existingWords.slice(-i).join(' ');
        const firstNewWords = words.slice(0, i).join(' ');
        
        if (lastExistingWords === firstNewWords) {
          const remainingWords = words.slice(i);
          const result = existingText + (existingText && remainingWords.length ? ' ' : '') + 
                        remainingWords.join(' ');
          return result;
        }
      }
    }
    
    // Lógica original para desktop
    // Si el texto ya está incluido al final, no agregarlo
    if (cleanExisting.endsWith(cleanNew)) {
      return existingText;
    }
    
    // Separar en palabras para evitar duplicaciones
    const existingWords = cleanExisting.split(' ');
    const newWords = cleanNew.split(' ');
    
    // Si las últimas palabras del texto existente coinciden con las primeras del nuevo,
    // remover la duplicación
    let overlap = 0;
    for (let i = 1; i <= Math.min(existingWords.length, newWords.length); i++) {
      const existingEnd = existingWords.slice(-i).join(' ').toLowerCase();
      const newStart = newWords.slice(0, i).join(' ').toLowerCase();
      if (existingEnd === newStart) {
        overlap = i;
      }
    }
    
    const uniqueNewWords = newWords.slice(overlap);
    const result = existingText + (existingText && uniqueNewWords.length ? ' ' : '') + 
                  uniqueNewWords.join(' ');
    
    return result;
  }, [isMobile]);

  // Función para procesar resultados con debouncing mejorado para móviles
  const processResults = useCallback((finalText: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Tiempo de debouncing diferente para móviles
    const debounceTime = isMobile ? 300 : 150;

    debounceTimeoutRef.current = setTimeout(() => {
      if (finalText && finalText !== lastProcessedTranscriptRef.current) {
        // Para móviles, verificar también si ya procesamos este resultado
        const resultKey = `${finalText}_${Date.now()}`;
        
        if (isMobile) {
          // Limpiar resultados antiguos (más de 5 segundos)
          const fiveSecondsAgo = Date.now() - 5000;
          processedResultsRef.current.forEach(key => {
            const timestamp = parseInt(key.split('_').pop() || '0');
            if (timestamp < fiveSecondsAgo) {
              processedResultsRef.current.delete(key);
            }
          });
          
          // Verificar si ya procesamos un resultado similar recientemente
          const similarResults = Array.from(processedResultsRef.current).filter(key => 
            key.startsWith(finalText.substring(0, Math.min(20, finalText.length)))
          );
          
          if (similarResults.length > 0) {
            return; // No procesar si ya hay un resultado similar reciente
          }
          
          processedResultsRef.current.add(resultKey);
        }
        
        lastProcessedTranscriptRef.current = finalText;
        finalTranscriptRef.current = cleanTranscript(finalText, finalTranscriptRef.current);
        setTranscript(finalTranscriptRef.current);
      }
    }, debounceTime);
  }, [isMobile, cleanTranscript]);

  // Inicializar el reconocimiento de voz
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = language;
    // Para móviles, usar configuración más conservadora
    recognition.continuous = isMobile ? false : continuous;
    recognition.interimResults = isMobile ? false : interimResults;
    recognition.maxAlternatives = 1;

    // Configuraciones específicas para móviles se aplicarán automáticamente

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      resultIndexRef.current = 0;
      
      // Para móviles, reiniciar automáticamente después de un tiempo
      if (isMobile) {
        setTimeout(() => {
          if (recognitionRef.current && isListening) {
            try {
              recognition.stop();
              setTimeout(() => {
                if (recognitionRef.current && !isListening) {
                  recognition.start();
                }
              }, 100);
            } catch (e) {
              console.warn('Error al reiniciar reconocimiento en móvil:', e);
            }
          }
        }, 10000); // Reiniciar cada 10 segundos en móviles
      }
    };

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      // Procesar solo resultados nuevos
      for (let i = Math.max(resultIndexRef.current, event.resultIndex); i < event.results.length; i++) {
        const result = event.results[i];
        if (result && result[0]) {
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else if (!isMobile) { // Solo mostrar interim en desktop
            interimText += result[0].transcript;
          }
        }
      }

      resultIndexRef.current = event.results.length;

      // Actualizar transcript interim solo en desktop
      if (!isMobile) {
        setInterimTranscript(interimText);
      }

      // Procesar texto final
      if (finalText) {
        processResults(finalText);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'Error en el reconocimiento de voz';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = isMobile 
            ? 'No se detectó habla. Asegúrate de hablar cerca del micrófono.'
            : 'No se detectó habla. Intenta hablar más claro.';
          break;
        case 'audio-capture':
          errorMessage = 'No se pudo acceder al micrófono. Verifica los permisos.';
          break;
        case 'not-allowed':
          errorMessage = 'Acceso al micrófono denegado. Permite el acceso para usar esta función.';
          break;
        case 'network':
          errorMessage = isMobile 
            ? 'Error de conexión. Verifica tu conexión móvil o WiFi.'
            : 'Error de red. Verifica tu conexión a internet.';
          break;
        case 'aborted':
          // En móviles, el reconocimiento se aborta frecuentemente, no mostrar error
          if (!isMobile) {
            errorMessage = 'Reconocimiento de voz interrumpido.';
          } else {
            return; // No mostrar error en móviles
          }
          break;
        default:
          errorMessage = `Error de reconocimiento de voz: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      
      // Limpiar timeouts pendientes
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [isSupported, language, continuous, interimResults, isMobile, isListening, processResults]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('El reconocimiento de voz no es compatible con este navegador.');
      return;
    }

    if (!recognitionRef.current || isListening) return;

    try {
      // Limpiar estado previo
      processedResultsRef.current.clear();
      resultIndexRef.current = 0;
      
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Error al iniciar el reconocimiento de voz.');
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    lastProcessedTranscriptRef.current = '';
    processedResultsRef.current.clear();
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
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
    isMobile,
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