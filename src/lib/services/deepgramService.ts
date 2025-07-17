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
      // Obtener acceso al micrófono
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      // Crear conexión WebSocket con Deepgram
      await this.createWebSocketConnection();

      // Configurar MediaRecorder para enviar audio al WebSocket
      this.setupMediaRecorder();

      this.isRecording = true;
      this.mediaRecorder?.start(100); // Enviar datos cada 100ms

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al iniciar grabación';
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
    
    this.cleanup();
  }

  private async createWebSocketConnection(): Promise<void> {
    const wsUrl = this.buildWebSocketUrl();
    
    return new Promise((resolve, reject) => {
      // En el navegador, no se pueden enviar headers personalizados con WebSocket
      // Deepgram permite autenticación mediante query parameter también
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
        }
      };

      this.websocket.onerror = (error) => {
        console.error('Error en WebSocket:', error);
        this.callbacks.onError?.('Error de conexión con el servicio de transcripción');
        reject(error);
      };

      this.websocket.onclose = (event) => {
        console.log('Conexión WebSocket cerrada:', event.code, event.reason);
        this.callbacks.onClose?.();
      };
    });
  }

  private buildWebSocketUrl(): string {
    const baseUrl = 'wss://api.deepgram.com/v1/listen';
    const params = new URLSearchParams({
      model: 'nova-2', // Especificar modelo explícitamente
      language: this.config.language,
      sample_rate: this.config.sampleRate.toString(),
      channels: this.config.channels.toString(),
      interim_results: this.config.interimResults.toString(),
      punctuate: this.config.punctuate.toString(),
      smart_format: this.config.smartFormat.toString(),
      token: this.config.apiKey,
    });

    return `${baseUrl}?${params.toString()}`;
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
    } else {
      // Fallback sin especificar mimeType
      console.warn('No se encontró un formato de audio compatible, usando configuración por defecto');
    }

    this.mediaRecorder = new MediaRecorder(this.audioStream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(event.data);
      }
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

    // Manejar errores en la respuesta
    if (response.error) {
      console.error('Error de Deepgram:', response.error);
      this.callbacks.onError?.(response.error);
    }
  }

  private cleanup(): void {
    // Cerrar WebSocket
    if (this.websocket) {
      if (this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.close();
      }
      this.websocket = null;
    }

    // Detener MediaRecorder
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
    }

    // Cerrar stream de audio
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  updateCallbacks(callbacks: DeepgramCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}

// Función helper para crear instancia de servicio con configuración por defecto
export const createDeepgramService = (apiKey: string, callbacks: DeepgramCallbacks = {}): DeepgramService => {
  const defaultConfig: DeepgramConfig = {
    apiKey,
    language: 'es', // Español - formato simplificado que es más compatible
    encoding: 'webm', // Cambiar a webm que es más compatible con MediaRecorder
    sampleRate: 16000,
    channels: 1,
    interimResults: true,
    punctuate: true,
    smartFormat: true,
  };

  return new DeepgramService(defaultConfig, callbacks);
}; 