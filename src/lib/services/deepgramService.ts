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
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.close();
    }

    this.cleanup();
  }

  private async createWebSocketConnection(): Promise<void> {
    const wsUrl = this.buildWebSocketUrl();
    
    return new Promise((resolve, reject) => {
      try {
        // Crear WebSocket (la autenticación va en la URL como query parameter)
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          console.log('Conexión WebSocket con Deepgram establecida');
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
          console.error('Error en WebSocket:', error);
          let errorMessage = 'Error de conexión con el servicio de transcripción';
          
          // Intentar dar más información específica del error
          if (this.websocket?.readyState === WebSocket.CLOSED) {
            errorMessage = 'Conexión cerrada inesperadamente. Verifica tu conexión a internet y la configuración de API.';
          }
          
          this.callbacks.onError?.(errorMessage);
          reject(new Error(errorMessage));
        };

        this.websocket.onclose = (event) => {
          console.log('Conexión WebSocket cerrada:', event.code, event.reason);
          
          // Dar información específica según el código de cierre
          if (event.code === 1006) {
            this.callbacks.onError?.('Conexión perdida inesperadamente. Verifica tu conexión a internet.');
          } else if (event.code === 1000) {
            // Cierre normal
            this.callbacks.onClose?.();
          } else if (event.code === 4008) {
            this.callbacks.onError?.('API key inválida o expirada. Verifica tu configuración de Deepgram.');
          } else if (event.code === 4001) {
            this.callbacks.onError?.('API key no autorizada para esta funcionalidad.');
          } else {
            this.callbacks.onError?.(event.reason || 'Conexión cerrada por el servidor');
          }
        };

        // Timeout para la conexión
        setTimeout(() => {
          if (this.websocket?.readyState === WebSocket.CONNECTING) {
            this.websocket.close();
            reject(new Error('Timeout de conexión. El servicio de transcripción no responde.'));
          }
        }, 10000); // 10 segundos timeout

      } catch (error) {
        console.error('Error al crear WebSocket:', error);
        reject(new Error('Error al establecer conexión WebSocket'));
      }
    });
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
      encoding: 'linear16', // Especificar encoding compatible
    });

    // Agregar la API key como parámetro de autorización
    // Deepgram acepta la API key como query parameter 'token'
    params.append('token', this.config.apiKey);
    
    const urlWithParams = `${baseUrl}?${params.toString()}`;
    
    // Log sin mostrar la API key completa por seguridad
    const safeUrl = urlWithParams.replace(this.config.apiKey, '[API_KEY_HIDDEN]');
    console.log('Conectando a Deepgram:', safeUrl);
    
    return urlWithParams;
  }

  private setupMediaRecorder(): void {
    if (!this.audioStream) {
      throw new Error('No hay stream de audio disponible');
    }

    // Configuración más compatible con diferentes navegadores
    let options: MediaRecorderOptions = {};

    // Intentar diferentes tipos MIME según la compatibilidad del navegador
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      options.mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      options.mimeType = 'audio/webm';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      options.mimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
      options.mimeType = 'audio/ogg;codecs=opus';
    } else {
      console.warn('Ningún tipo de audio compatible encontrado, usando configuración por defecto');
    }

    this.mediaRecorder = new MediaRecorder(this.audioStream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(event.data);
      }
    };

    this.mediaRecorder.onstart = () => {
      console.log('MediaRecorder iniciado');
    };

    this.mediaRecorder.onstop = () => {
      console.log('MediaRecorder detenido');
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('Error en MediaRecorder:', event);
      this.callbacks.onError?.('Error en la grabación de audio');
    };
  }

  private handleDeepgramResponse(response: any): void {
    // Manejar errores en la respuesta primero
    if (response.error) {
      console.error('Error de Deepgram:', response.error);
      this.callbacks.onError?.(`Error del servicio de transcripción: ${response.error}`);
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

        this.callbacks.onTranscript?.(result);
      }
    }

    // Manejar metadatos adicionales
    if (response.metadata) {
      console.log('Metadata de Deepgram:', response.metadata);
    }
  }

  private cleanup(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }

    if (this.websocket) {
      this.websocket = null;
    }

    this.isRecording = false;
  }

  // Métodos públicos para control y configuración
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  updateCallbacks(callbacks: DeepgramCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Método para verificar si la API key es válida
  async testConnection(): Promise<boolean> {
    try {
      // Test simple de conexión sin audio
      const wsUrl = this.buildWebSocketUrl();
      const testSocket = new WebSocket(wsUrl);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          testSocket.close();
          resolve(false);
        }, 5000);

        testSocket.onopen = () => {
          clearTimeout(timeout);
          testSocket.close();
          resolve(true);
        };

        testSocket.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      });
    } catch {
      return false;
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