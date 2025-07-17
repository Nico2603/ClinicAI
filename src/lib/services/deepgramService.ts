export interface DeepgramConfig {
  apiKey: string;
  language: string;
  encoding: string;
  sampleRate: number;
  channels: number;
  interimResults: boolean;
  punctuate: boolean;
  smartFormat: boolean;
}

export interface DeepgramTranscriptResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface DeepgramCallbacks {
  onTranscript?: (result: DeepgramTranscriptResult) => void;
  onError?: (error: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export class DeepgramService {
  private websocket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private config: DeepgramConfig;
  private callbacks: DeepgramCallbacks;
  private isRecording = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: DeepgramConfig, callbacks: DeepgramCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.warn('Ya hay una grabación en curso');
      return;
    }

    try {
      // Validar API key antes de intentar conectar
      if (!this.config.apiKey || this.config.apiKey.trim() === '') {
        throw new Error('API key de Deepgram no configurada o vacía');
      }

      if (this.config.apiKey.trim().length < 10) {
        throw new Error('API key de Deepgram parece ser inválida (muy corta)');
      }

      // Obtener acceso al micrófono
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Crear conexión WebSocket con Deepgram
      await this.createWebSocketConnection();

      // Configurar MediaRecorder para enviar audio al WebSocket
      this.setupMediaRecorder();

      this.isRecording = true;
      this.mediaRecorder?.start(100); // Enviar datos cada 100ms

    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      let errorMessage = 'Error desconocido al iniciar grabación';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Acceso al micrófono denegado. Por favor, permite el acceso al micrófono.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No se encontró un micrófono. Verifica que tengas un micrófono conectado.';
        } else if (error.message.includes('API key')) {
          errorMessage = 'Error de configuración: ' + error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      this.callbacks.onError?.(errorMessage);
      this.cleanup();
    }
  }

  stopRecording(): void {
    if (!this.isRecording) {
      return;
    }

    this.isRecording = false;
    this.reconnectAttempts = 0;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      // Enviar mensaje de finalización antes de cerrar
      try {
        this.websocket.send(JSON.stringify({ type: "CloseStream" }));
      } catch (e) {
        console.warn('Error al enviar mensaje de cierre:', e);
      }
      this.websocket.close(1000, 'Recording stopped by user');
    }

    this.cleanup();
  }

  private async createWebSocketConnection(): Promise<void> {
    const wsUrl = this.buildWebSocketUrl();
    
    return new Promise((resolve, reject) => {
      try {
        console.log('Creando nueva conexión WebSocket con Deepgram...');
        
        // Crear WebSocket con configuración mejorada
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          console.log('✅ Conexión WebSocket con Deepgram establecida exitosamente');
          this.reconnectAttempts = 0; // Reset intentos de reconexión
          this.callbacks.onOpen?.();
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            this.handleDeepgramResponse(response);
          } catch (error) {
            console.error('Error al parsear respuesta de Deepgram:', error);
            this.callbacks.onError?.('Error al procesar respuesta del servicio de transcripción');
          }
        };

        this.websocket.onerror = (error) => {
          console.error('❌ Error en WebSocket:', error);
          let errorMessage = 'Error de conexión con el servicio de transcripción';
          
          // Verificar el estado de la conexión para dar más información
          if (this.websocket) {
            switch (this.websocket.readyState) {
              case WebSocket.CONNECTING:
                errorMessage = 'Error al conectar con el servicio de transcripción. Verifica tu conexión a internet.';
                break;
              case WebSocket.CLOSED:
                errorMessage = 'Conexión cerrada inesperadamente. Verifica tu conexión a internet y la configuración de API.';
                break;
              default:
                errorMessage = 'Error de conexión WebSocket';
            }
          }
          
          this.callbacks.onError?.(errorMessage);
          reject(new Error(errorMessage));
        };

        this.websocket.onclose = (event) => {
          console.log('🔌 Conexión WebSocket cerrada:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          
          // Manejar códigos de error específicos de Deepgram
          let shouldReconnect = false;
          let errorMessage = '';

          switch (event.code) {
            case 1000: // Cierre normal
              console.log('Conexión cerrada normalmente');
              this.callbacks.onClose?.();
              return;
            
            case 1001: // Going away
              errorMessage = 'Servicio de transcripción temporalmente no disponible';
              shouldReconnect = true;
              break;
            
            case 1006: // Abnormal closure
              errorMessage = 'Conexión perdida inesperadamente. Verifica tu conexión a internet.';
              shouldReconnect = true;
              break;
            
            case 4008: // Authentication failed
              errorMessage = 'API key inválida o expirada. Verifica tu configuración de Deepgram.';
              break;
            
            case 4001: // Unauthorized
              errorMessage = 'API key no autorizada para esta funcionalidad.';
              break;
            
            case 4013: // Insufficient funds
              errorMessage = 'Créditos insuficientes en tu cuenta de Deepgram.';
              break;
            
            default:
              errorMessage = event.reason || `Error de conexión (código: ${event.code})`;
              shouldReconnect = event.code >= 1001 && event.code <= 1015;
          }

          // Intentar reconectar si es apropiado y estamos grabando
          if (shouldReconnect && this.isRecording && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          } else {
            this.callbacks.onError?.(errorMessage);
          }
        };

        // Timeout mejorado para la conexión
        setTimeout(() => {
          if (this.websocket?.readyState === WebSocket.CONNECTING) {
            console.error('⏰ Timeout de conexión WebSocket');
            this.websocket.close();
            reject(new Error('Timeout de conexión. El servicio de transcripción no responde. Verifica tu conexión a internet.'));
          }
        }, 15000); // 15 segundos timeout

      } catch (error) {
        console.error('Error al crear WebSocket:', error);
        reject(new Error('Error al establecer conexión WebSocket: ' + (error instanceof Error ? error.message : 'Error desconocido')));
      }
    });
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000); // Backoff exponencial, máximo 10s
    
    console.log(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts} en ${delay}ms...`);
    
    this.reconnectTimeout = setTimeout(async () => {
      try {
        if (this.isRecording) {
          await this.createWebSocketConnection();
          console.log('✅ Reconexión exitosa');
        }
      } catch (error) {
        console.error('❌ Error en reconexión:', error);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.callbacks.onError?.('No se pudo restablecer la conexión después de varios intentos. Intenta nuevamente.');
          this.stopRecording();
        } else {
          this.attemptReconnect();
        }
      }
    }, delay);
  }

  private buildWebSocketUrl(): string {
    const baseUrl = 'wss://api.deepgram.com/v1/listen';
    
    // Usar URLSearchParams para construir correctamente los parámetros
    const params = new URLSearchParams({
      model: 'nova-2-general',
      language: this.config.language,
      sample_rate: this.config.sampleRate.toString(),
      channels: this.config.channels.toString(),
      interim_results: this.config.interimResults.toString(),
      punctuate: this.config.punctuate.toString(),
      smart_format: this.config.smartFormat.toString(),
      encoding: 'linear16',
      // Parámetros adicionales para mejorar la estabilidad
      endpointing: '300', // 300ms de silencio para finalizar utterance
      vad_events: 'true', // Detección de actividad de voz
    });

    // Agregar la API key como parámetro de autorización
    params.append('token', this.config.apiKey);
    
    const urlWithParams = `${baseUrl}?${params.toString()}`;
    
    // Log sin mostrar la API key completa por seguridad
    const safeUrl = urlWithParams.replace(this.config.apiKey, '[API_KEY_HIDDEN]');
    console.log('🔗 URL de conexión:', safeUrl);
    
    return urlWithParams;
  }

  private setupMediaRecorder(): void {
    if (!this.audioStream) {
      throw new Error('No hay stream de audio disponible');
    }

    // Configuración más robusta con fallbacks
    let options: MediaRecorderOptions = {};

    // Probar diferentes codecs en orden de preferencia
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4'
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options.mimeType = mimeType;
        console.log('📼 Usando formato de audio:', mimeType);
        break;
      }
    }

    if (!options.mimeType) {
      console.warn('⚠️ Ningún formato de audio específico soportado, usando configuración por defecto');
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.audioStream, options);
    } catch (error) {
      console.warn('⚠️ Error con configuración específica, intentando con configuración básica:', error);
      this.mediaRecorder = new MediaRecorder(this.audioStream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.websocket?.readyState === WebSocket.OPEN) {
        try {
          this.websocket.send(event.data);
        } catch (error) {
          console.error('Error al enviar datos de audio:', error);
        }
      } else if (event.data.size > 0) {
        console.warn('⚠️ Datos de audio disponibles pero WebSocket no está abierto');
      }
    };

    this.mediaRecorder.onstart = () => {
      console.log('🎤 MediaRecorder iniciado');
    };

    this.mediaRecorder.onstop = () => {
      console.log('⏹️ MediaRecorder detenido');
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('❌ Error en MediaRecorder:', event);
      this.callbacks.onError?.('Error en la grabación de audio');
    };
  }

  private handleDeepgramResponse(response: any): void {
    // Manejar errores en la respuesta primero
    if (response.error) {
      console.error('❌ Error de Deepgram:', response.error);
      this.callbacks.onError?.(`Error del servicio de transcripción: ${response.error}`);
      return;
    }

    // Manejar eventos VAD (Voice Activity Detection)
    if (response.type === 'SpeechStarted') {
      console.log('🎯 Detección de voz iniciada');
      return;
    }

    if (response.type === 'UtteranceEnd') {
      console.log('🎯 Final de utterance detectado');
      return;
    }

    // Procesar transcripción
    if (response.channel?.alternatives?.length > 0) {
      const alternative = response.channel.alternatives[0];
      const transcript = alternative.transcript;
      
      if (transcript && transcript.trim()) {
        const result: DeepgramTranscriptResult = {
          transcript: transcript.trim(),
          confidence: alternative.confidence || 0,
          isFinal: response.is_final || false,
        };

        console.log(`📝 Transcripción ${result.isFinal ? 'final' : 'temporal'}:`, result.transcript);
        this.callbacks.onTranscript?.(result);
      }
    }

    // Manejar metadatos adicionales
    if (response.metadata) {
      console.log('📊 Metadata de Deepgram:', response.metadata);
    }
  }

  private cleanup(): void {
    console.log('🧹 Limpiando recursos...');
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Track de audio detenido');
      });
      this.audioStream = null;
    }

    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }

    if (this.websocket) {
      this.websocket = null;
    }

    this.isRecording = false;
    this.reconnectAttempts = 0;
  }

  // Métodos públicos para control y configuración
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  updateCallbacks(callbacks: DeepgramCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Método mejorado para verificar conexión
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Probando conexión con Deepgram...');
      
      // Validar API key primero
      if (!this.config.apiKey || this.config.apiKey.trim().length < 10) {
        console.error('❌ API key inválida o muy corta');
        return false;
      }

      // PASO 1: Verificar API key con la API REST de Deepgram
      console.log('🔑 Verificando API key con REST API...');
      const restApiValid = await this.testRestApi();
      
      if (!restApiValid) {
        console.error('❌ API key inválida en REST API');
        return false;
      }
      
      console.log('✅ API key válida en REST API');

      // PASO 2: Probar conexión WebSocket
      console.log('🔌 Probando conexión WebSocket...');
      const wsUrl = this.buildWebSocketUrl();
      const testSocket = new WebSocket(wsUrl);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('⏰ Timeout en prueba de conexión WebSocket');
          testSocket.close();
          resolve(false);
        }, 8000); // 8 segundos para la prueba

        testSocket.onopen = () => {
          console.log('✅ Prueba de conexión WebSocket exitosa');
          clearTimeout(timeout);
          testSocket.close(1000, 'Test completed');
          resolve(true);
        };

        testSocket.onerror = (error) => {
          console.error('❌ Error en prueba de conexión WebSocket:', error);
          clearTimeout(timeout);
          resolve(false);
        };

        testSocket.onclose = (event) => {
          console.log('🔌 Conexión de prueba cerrada:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          
          if (event.code === 4008) {
            console.error('❌ API key inválida detectada en WebSocket (4008)');
          } else if (event.code === 4001) {
            console.error('❌ API key no autorizada para streaming (4001)');
          } else if (event.code === 4013) {
            console.error('❌ Créditos insuficientes (4013)');
          }
        };
      });
    } catch (error) {
      console.error('❌ Excepción en prueba de conexión:', error);
      return false;
    }
  }

  // Nuevo método para verificar API key con REST API
  private async testRestApi(): Promise<boolean> {
    try {
      const response = await fetch('https://api.deepgram.com/v1/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API key válida, proyectos encontrados:', data.projects?.length || 0);
        return true;
      } else {
        console.error('❌ Error en REST API:', {
          status: response.status,
          statusText: response.statusText
        });
        
        if (response.status === 401) {
          console.error('❌ API key no válida (401 Unauthorized)');
        } else if (response.status === 403) {
          console.error('❌ API key sin permisos necesarios (403 Forbidden)');
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Error de red al verificar API key:', error);
      // Si hay error de red, asumir que el API key está bien pero hay problemas de conectividad
      return true;
    }
  }
}

// Función helper para crear instancia de servicio con configuración por defecto
export const createDeepgramService = (apiKey: string, callbacks: DeepgramCallbacks = {}): DeepgramService => {
  const defaultConfig: DeepgramConfig = {
    apiKey: apiKey.trim(),
    language: 'es',
    encoding: 'linear16',
    sampleRate: 16000,
    channels: 1,
    interimResults: true,
    punctuate: true,
    smartFormat: true,
  };

  return new DeepgramService(defaultConfig, callbacks);
}; 