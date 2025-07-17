// Servicio de LiveKit simplificado con integración Deepgram para transcripción de voz
import { 
  Room, 
  RoomEvent, 
  LocalParticipant, 
  LocalAudioTrack,
  Track,
  RoomOptions
} from 'livekit-client';

export interface LiveKitTranscriptResult {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
  speaker?: string;
}

export interface LiveKitCallbacks {
  onTranscript?: (result: LiveKitTranscriptResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onConnectionState?: (state: string) => void;
}

export class LiveKitService {
  private room: Room | null = null;
  private localParticipant: LocalParticipant | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;
  private callbacks: LiveKitCallbacks;
  private isRecording = false;
  private websocketUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private deepgramApiKey: string;
  private deepgramSocket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;

  constructor(callbacks: LiveKitCallbacks = {}) {
    this.callbacks = callbacks;
    
    // Obtener configuración desde variables de entorno
    this.websocketUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';
    this.apiKey = process.env.NEXT_PUBLIC_LIVEKIT_API_KEY || '';
    this.apiSecret = process.env.NEXT_PUBLIC_LIVEKIT_API_SECRET || '';
    this.deepgramApiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '';

    if (!this.websocketUrl || !this.apiKey || !this.apiSecret) {
      throw new Error('Configuración de LiveKit incompleta. Verifica las variables de entorno.');
    }

    if (!this.deepgramApiKey) {
      throw new Error('API key de Deepgram no configurada. Verifica NEXT_PUBLIC_DEEPGRAM_API_KEY.');
    }
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.log('Ya está grabando con LiveKit, ignorando solicitud');
      return;
    }

    try {
      console.log('🎤 Iniciando grabación con LiveKit...');

      // Crear room con opciones básicas
      const roomOptions: RoomOptions = {
        adaptiveStream: true,
        dynacast: true,
      };

      this.room = new Room(roomOptions);
      
      // Configurar eventos del room
      this.setupRoomEvents();

      // Generar token de acceso básico
      const token = this.generateBasicToken();

      // Conectar al room
      await this.room.connect(this.websocketUrl, token);
      console.log('✅ Conectado a LiveKit room');

      // Configurar audio local de forma simplificada
      await this.setupLocalAudio();

      // Conectar a Deepgram para transcripción
      await this.connectToDeepgram();

      this.isRecording = true;
      this.callbacks.onStart?.();

    } catch (error) {
      console.error('❌ Error al iniciar grabación con LiveKit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar LiveKit';
      this.cleanup();
      this.callbacks.onError?.(errorMessage);
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording) {
      console.log('No hay grabación activa con LiveKit');
      return;
    }

    console.log('⏹️ Deteniendo grabación con LiveKit...');
    this.cleanup();
    this.callbacks.onEnd?.();
  }

  private setupRoomEvents(): void {
    if (!this.room) return;

    this.room.on(RoomEvent.Connected, () => {
      console.log('✅ LiveKit room conectado');
      this.callbacks.onConnectionState?.('connected');
    });

    this.room.on(RoomEvent.Disconnected, () => {
      console.log('🔌 LiveKit room desconectado');
      this.callbacks.onConnectionState?.('disconnected');
      if (this.isRecording) {
        this.callbacks.onError?.('Conexión perdida con LiveKit');
      }
    });

    this.room.on(RoomEvent.Reconnecting, () => {
      console.log('🔄 Reconectando a LiveKit...');
      this.callbacks.onConnectionState?.('reconnecting');
    });
  }

  private async setupLocalAudio(): Promise<void> {
    if (!this.room) {
      throw new Error('Room no está disponible');
    }

    try {
      // Obtener acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
        video: false
      });

      // Obtener participante local
      this.localParticipant = this.room.localParticipant;

      // Habilitar micrófono usando la API simplificada de LiveKit
      await this.localParticipant.setMicrophoneEnabled(true);

      console.log('🎤 Audio local configurado');

      // Configurar captura de datos de audio para Deepgram
      this.setupAudioCapture(stream);

    } catch (error) {
      console.error('❌ Error configurando audio local:', error);
      throw new Error('No se pudo acceder al micrófono');
    }
  }

  private setupAudioCapture(stream: MediaStream): void {
    try {
      // Crear MediaRecorder para capturar datos
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.deepgramSocket?.readyState === WebSocket.OPEN) {
          this.deepgramSocket.send(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('❌ Error en MediaRecorder:', event);
        this.callbacks.onError?.('Error en la grabación de audio');
      };

      // Iniciar grabación con chunks cada 250ms
      this.mediaRecorder.start(250);

      console.log('🎤 Captura de audio configurada para Deepgram');

    } catch (error) {
      console.error('❌ Error configurando captura de audio:', error);
      this.callbacks.onError?.('Error al configurar captura de audio');
    }
  }

  private async connectToDeepgram(): Promise<void> {
    try {
      const params = new URLSearchParams({
        model: 'nova-2-general',
        language: 'es',
        sample_rate: '16000',
        channels: '1',
        interim_results: 'true',
        punctuate: 'true',
        smart_format: 'true',
        encoding: 'linear16',
        endpointing: '500',
        token: this.deepgramApiKey
      });

      const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
      
      this.deepgramSocket = new WebSocket(wsUrl);

      this.deepgramSocket.onopen = () => {
        console.log('✅ Conectado a Deepgram vía LiveKit');
      };

      this.deepgramSocket.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          this.handleDeepgramResponse(response);
        } catch (error) {
          console.error('Error procesando respuesta de Deepgram:', error);
        }
      };

      this.deepgramSocket.onerror = (event) => {
        console.error('❌ Error de WebSocket con Deepgram:', event);
        this.callbacks.onError?.('Error de conexión con Deepgram');
      };

      this.deepgramSocket.onclose = (event) => {
        console.log('🔌 Conexión Deepgram cerrada:', event.code, event.reason);
        if (event.code !== 1000 && this.isRecording) {
          this.callbacks.onError?.('Conexión perdida con Deepgram');
        }
      };

    } catch (error) {
      console.error('❌ Error conectando a Deepgram:', error);
      throw new Error('Error de conexión con Deepgram');
    }
  }

  private handleDeepgramResponse(response: any): void {
    if (response.error) {
      console.error('❌ Error de Deepgram:', response.error);
      this.callbacks.onError?.(`Error de transcripción: ${response.error}`);
      return;
    }

    if (response.channel?.alternatives?.length > 0) {
      const alternative = response.channel.alternatives[0];
      const transcript = alternative.transcript?.trim();
      
      if (transcript) {
        const result: LiveKitTranscriptResult = {
          transcript,
          isFinal: response.is_final || false,
          confidence: alternative.confidence,
          speaker: 'local'
        };

        console.log(`📝 ${result.isFinal ? 'Final' : 'Interim'} (LiveKit):`, result.transcript);
        this.callbacks.onTranscript?.(result);
      }
    }
  }

  private generateBasicToken(): string {
    // Para desarrollo, generar un token básico
    // En producción, esto debe generarse en tu backend
    const payload = {
      iss: this.apiKey,
      sub: `user-${Date.now()}`,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora
      nbf: Math.floor(Date.now() / 1000),
      room: `speech-room-${Date.now()}`,
      video: {
        room: `speech-room-${Date.now()}`,
        roomJoin: true,
        roomList: true,
        roomRecord: true,
        roomAdmin: true,
        roomCreate: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      }
    };

    // Implementación básica para desarrollo
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    
    // Token básico para desarrollo (en producción debe usar firma HMAC real)
    const token = `${header}.${body}.development-signature`;
    
    return token;
  }

  private cleanup(): void {
    this.isRecording = false;

    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    if (this.deepgramSocket) {
      this.deepgramSocket.close();
      this.deepgramSocket = null;
    }

    if (this.localAudioTrack) {
      this.localAudioTrack.stop();
      this.localAudioTrack = null;
    }

    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }

    this.localParticipant = null;
  }

  // Método de prueba de conectividad
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Probando conexión con LiveKit...');
      
      // Verificar configuración
      if (!this.websocketUrl || !this.apiKey || !this.apiSecret || !this.deepgramApiKey) {
        console.error('❌ Configuración incompleta');
        return false;
      }

      // Crear room de prueba
      const testRoom = new Room();
      const token = this.generateBasicToken();
      
      try {
        await testRoom.connect(this.websocketUrl, token);
        await testRoom.disconnect();
        
        console.log('✅ Conexión con LiveKit exitosa');
        return true;
      } catch (error) {
        console.error('❌ Error en conexión de prueba:', error);
        return false;
      }

    } catch (error) {
      console.error('❌ Error en prueba de conexión:', error);
      return false;
    }
  }
}

// Función helper para crear instancia del servicio
export const createLiveKitService = (callbacks: LiveKitCallbacks = {}): LiveKitService => {
  return new LiveKitService(callbacks);
}; 