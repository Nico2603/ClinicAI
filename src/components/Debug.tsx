'use client';

// Extender Window para debugging
declare global {
  interface Window {
    debugDB?: {
      info: () => void;
      help: () => void;
    };
  }
}

import { useDeepgramSpeech } from '../hooks/useDeepgramSpeech';

// Componente de debugging simplificado - Solo para desarrollo
export const Debug = () => {
  const {
    isRecording,
    isSupported,
    interimTranscript,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
    testConnection
  } = useDeepgramSpeech({
    onTranscript: (transcript) => {
      console.log('Transcripción recibida:', transcript);
    },
    onError: (error) => {
      console.error('Error de transcripción:', error);
    },
    onStart: () => {
      console.log('Transcripción iniciada');
    },
    onEnd: () => {
      console.log('Transcripción terminada');
    }
  });

  const handleTestConnection = async () => {
    console.log('🔍 Iniciando prueba de conexión con Deepgram...');
    const success = await testConnection();
    console.log(success ? '✅ Prueba exitosa' : '❌ Prueba falló');
  };

  // No hacer nada en producción para evitar errores
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  // Solo agregar funciones básicas en desarrollo sin operaciones pesadas
  if (typeof window !== 'undefined' && !window.debugDB) {
    window.debugDB = {
      info: () => console.log('🛠️ Debug mode enabled. Basic functions available.'),
      help: () => console.log('Use debugDB.info() for debug information')
    };

    // Configurar test de plantillas básico
    import('@/lib/test-templates').then(({ setupTemplateTest }) => {
      setupTemplateTest();
    }).catch(console.error);
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Debug - Deepgram Speech</h2>
      
      {/* Estado actual */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-white rounded border">
          <h3 className="font-semibold text-sm text-gray-600">Estado</h3>
          <p className={isRecording ? 'text-red-600' : 'text-gray-800'}>
            {isRecording ? '🔴 Grabando' : '⚪ Detenido'}
          </p>
        </div>
        
        <div className="p-3 bg-white rounded border">
          <h3 className="font-semibold text-sm text-gray-600">Soporte</h3>
          <p className={isSupported ? 'text-green-600' : 'text-red-600'}>
            {isSupported ? '✅ Soportado' : '❌ No soportado'}
          </p>
        </div>
      </div>

      {/* Información de la API */}
      <div className="p-3 bg-white rounded border">
        <h3 className="font-semibold text-sm text-gray-600 mb-2">Configuración de API</h3>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">API Key configurada:</span> 
            <span className={process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY ? 'text-green-600' : 'text-red-600'}>
              {process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY 
                ? `✅ Sí (${process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY.substring(0, 8)}...)` 
                : '❌ No configurada'
              }
            </span>
          </p>
          <p>
            <span className="font-medium">Navegador:</span> {navigator.userAgent.split(' ')[0]}
          </p>
          <p>
            <span className="font-medium">WebSocket:</span> 
            <span className={typeof WebSocket !== 'undefined' ? 'text-green-600' : 'text-red-600'}>
              {typeof WebSocket !== 'undefined' ? ' ✅ Disponible' : ' ❌ No disponible'}
            </span>
          </p>
          <p>
            <span className="font-medium">MediaRecorder:</span> 
            <span className={typeof MediaRecorder !== 'undefined' ? 'text-green-600' : 'text-red-600'}>
              {typeof MediaRecorder !== 'undefined' ? ' ✅ Disponible' : ' ❌ No disponible'}
            </span>
          </p>
        </div>
      </div>

      {/* Controles de prueba */}
      <div className="space-y-2">
        <button 
          onClick={handleTestConnection}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          disabled={!isSupported}
        >
          🔍 Probar Conexión con Deepgram
        </button>
        
        <button 
          onClick={startRecording}
          className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-400"
          disabled={!isSupported || isRecording}
        >
          🎤 {isRecording ? 'Grabando...' : 'Iniciar Grabación'}
        </button>
        
        {isRecording && (
          <button 
            onClick={stopRecording}
            className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            ⏹️ Detener Grabación
          </button>
        )}
        
        <button 
          onClick={resetTranscript}
          className="w-full p-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          🗑️ Limpiar Transcripción
        </button>
      </div>

      {/* Transcripción en tiempo real */}
      {interimTranscript && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-sm text-gray-600 mb-2">Transcripción en tiempo real:</h3>
          <p className="text-sm italic text-gray-600">{interimTranscript}</p>
        </div>
      )}

      {/* Errores */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-sm text-red-600 mb-2">Error:</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Información adicional */}
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Tip:</strong> Abre la consola del navegador (F12) para ver logs detallados.</p>
        <p><strong>Nota:</strong> Asegúrate de permitir el acceso al micrófono cuando se solicite.</p>
        <p><strong>Verifica:</strong> Que tu API key de Deepgram sea válida y tenga créditos disponibles.</p>
      </div>
    </div>
  );
};

export default Debug; 