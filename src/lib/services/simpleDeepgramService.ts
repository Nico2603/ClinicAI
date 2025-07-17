// Servicio simplificado de Deepgram para dictado de voz
export interface SimpleDeepgramResult {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export interface SimpleDeepgramCallbacks {
  onTranscript?: (result: SimpleDeepgramResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export class SimpleDeepgramService {
  private websocket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private apiKey: string;
  private callbacks: SimpleDeepgramCallbacks;
  private isRecording = false;

  constructor(apiKey: string, callbacks: SimpleDeepgramCallbacks = {}) {
    this.apiKey = apiKey.trim();
    this.callbacks = callbacks;
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.log('Ya está grabando, ignorando solicitud');
      return;
    }

    try {
      console.log('🎤 Iniciando grabación...');
      
      // Validar API key básica
      if (!this.apiKey || this.apiKey.length < 10) {
        throw new Error('API key de Deepgram inválida o no configurada');
      }

      // Obtener acceso al micrófono
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      // Crear conexión WebSocket
      await this.createWebSocket();

      // Configurar MediaRecorder
      this.setupMediaRecorder();

      // Iniciar grabación
      this.isRecording = true;
      this.mediaRecorder?.start(250); // Enviar datos cada 250ms
      
      console.log('✅ Grabación iniciada exitosamente');
      this.callbacks.onStart?.();

    } catch (error) {
      console.error('❌ Error al iniciar grabación:', error);
      let errorMessage = 'Error al iniciar el dictado';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permisos de micrófono denegados. Por favor permite el acceso al micrófono.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No se encontró micrófono. Verifica que tengas un micrófono conectado.';
        } else {
          errorMessage = error.message;
        }
      }
      
      this.cleanup();
      this.callbacks.onError?.(errorMessage);
    }
  }

  stopRecording(): void {
    console.log('⏹️ Deteniendo grabación...');
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.close(1000, 'Grabación terminada por usuario');
    }
    
    this.cleanup();
    this.callbacks.onEnd?.();
  }

  private async createWebSocket(): Promise<void> {
    const wsUrl = this.buildWebSocketUrl();
    
    return new Promise((resolve, reject) => {
      console.log('🔌 Conectando a Deepgram...');
      
      this.websocket = new WebSocket(wsUrl);
      
      // Timeout para la conexión
      const connectionTimeout = setTimeout(() => {
        if (this.websocket?.readyState !== WebSocket.OPEN) {
          reject(new Error('Timeout de conexión con Deepgram'));
        }
      }, 10000); // 10 segundos timeout

      this.websocket.onopen = () => {
        console.log('✅ Conectado a Deepgram');
        clearTimeout(connectionTimeout);
        resolve();
      };

      this.websocket.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          this.handleResponse(response);
        } catch (error) {
          console.error('Error procesando respuesta:', error);
        }
      };

      this.websocket.onerror = (event) => {
        console.error('❌ Error de WebSocket:', event);
        clearTimeout(connectionTimeout);
        reject(new Error('Error de conexión con Deepgram'));
      };

      this.websocket.onclose = (event) => {
        console.log('🔌 Conexión cerrada:', event.code, event.reason);
        clearTimeout(connectionTimeout);
        
        if (event.code !== 1000 && this.isRecording) {
          // Solo reportar error si no fue un cierre normal
          let errorMessage = 'Conexión perdida con el servicio de transcripción';
          
          if (event.code === 4008 || event.code === 4001) {
            errorMessage = 'API key inválida o sin permisos';
          } else if (event.code === 4013) {
            errorMessage = 'Créditos insuficientes en tu cuenta de Deepgram';
          }
          
          this.callbacks.onError?.(errorMessage);
        }
        
        this.cleanup();
      };
    });
  }

  private buildWebSocketUrl(): string {
    const params = new URLSearchParams({
      model: 'nova-2-general',
      language: 'es',
      sample_rate: '16000',
      channels: '1',
      interim_results: 'true',
      punctuate: 'true',
      smart_format: 'true',
      encoding: 'linear16',
      endpointing: '500', // 500ms de silencio para finalizar
      token: this.apiKey
    });

    return `wss://api.deepgram.com/v1/listen?${params.toString()}`;
  }

  private setupMediaRecorder(): void {
    if (!this.audioStream) {
      throw new Error('No hay stream de audio disponible');
    }

    // Usar configuración simple
    this.mediaRecorder = new MediaRecorder(this.audioStream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm'
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(event.data);
      }
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('❌ Error en MediaRecorder:', event);
      this.callbacks.onError?.('Error en la grabación de audio');
    };
  }

  private handleResponse(response: any): void {
    // Manejar errores
    if (response.error) {
      console.error('❌ Error de Deepgram:', response.error);
      this.callbacks.onError?.(`Error de transcripción: ${response.error}`);
      return;
    }

    // Procesar transcripción
    if (response.channel?.alternatives?.length > 0) {
      const alternative = response.channel.alternatives[0];
      const transcript = alternative.transcript?.trim();
      
      if (transcript) {
        const result: SimpleDeepgramResult = {
          transcript,
          isFinal: response.is_final || false,
          confidence: alternative.confidence
        };

        console.log(`📝 ${result.isFinal ? 'Final' : 'Interim'}:`, result.transcript);
        this.callbacks.onTranscript?.(result);
      }
    }
  }

  private cleanup(): void {
    this.isRecording = false;
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    
    this.mediaRecorder = null;
    this.websocket = null;
  }

  // Método simple para verificar si la API key es válida
  async testApiKey(): Promise<boolean> {
    try {
      const response = await fetch('https://api.deepgram.com/v1/projects', {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error verificando API key:', error);
      return false;
    }
  }
}

// Función helper para crear instancia del servicio
export const createSimpleDeepgramService = (
  apiKey: string, 
  callbacks: SimpleDeepgramCallbacks = {}
): SimpleDeepgramService => {
  return new SimpleDeepgramService(apiKey, callbacks);
}; 