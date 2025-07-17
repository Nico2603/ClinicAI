'use client';

// Extender Window para debugging
declare global {
  interface Window {
    debugDB?: {
      info: () => void;
      help: () => void;
      deepgram: () => void;
    };
  }
}

import { useState } from 'react';
import { useDeepgramSpeech } from '../hooks/useDeepgramSpeech';
import { diagnosDeepgramIssues, diagnosDeepgramAdvanced, type DeepgramDiagnostic } from '../lib/utils/index';

// Componente de debugging simplificado - Solo para desarrollo
export const Debug = () => {
  const [diagnostic, setDiagnostic] = useState<DeepgramDiagnostic | null>(null);
  const [connectionTestResult, setConnectionTestResult] = useState<boolean | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const {
    isRecording,
    isSupported,
    interimTranscript,
    error,
    startRecording,
    stopRecording,
    clearTranscripts,
    testConnection
  } = useDeepgramSpeech({
    onTranscript: (transcript: string) => {
      console.log('📝 Transcripción recibida:', transcript);
    },
    onError: (error: string) => {
      console.error('❌ Error de transcripción:', error);
    },
    onStart: () => {
      console.log('🎤 Transcripción iniciada');
    },
    onEnd: () => {
      console.log('⏹️ Transcripción terminada');
    }
  });

  const handleTestConnection = async () => {
    console.log('🔍 Iniciando prueba de conexión con Deepgram...');
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    
    try {
      const success = await testConnection();
      setConnectionTestResult(success);
      console.log(success ? '✅ Prueba exitosa' : '❌ Prueba falló');
    } catch (error) {
      console.error('❌ Error en prueba de conexión:', error);
      setConnectionTestResult(false);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleRunDiagnostic = () => {
    console.log('🔍 Ejecutando diagnóstico básico de Deepgram...');
    const result = diagnosDeepgramIssues();
    setDiagnostic(result);
    console.log('📊 Resultado del diagnóstico básico:', result);
  };

  const handleRunAdvancedDiagnostic = async () => {
    console.log('🔍 Ejecutando diagnóstico avanzado de Deepgram...');
    setDiagnostic(null); // Limpiar resultado anterior
    
    try {
      const result = await diagnosDeepgramAdvanced();
      setDiagnostic(result);
      console.log('📊 Resultado del diagnóstico avanzado:', result);
      
      // Mostrar resumen en consola
      if (result.apiKeyValid === false) {
        console.error('🚨 PROBLEMA IDENTIFICADO: API key inválida o sin créditos');
      } else if (result.connectivityTest?.websocket === false) {
        console.error('🚨 PROBLEMA IDENTIFICADO: WebSockets bloqueados');
      } else {
        console.log('✅ API key y conectividad OK - puede ser un problema temporal');
      }
    } catch (error) {
      console.error('❌ Error en diagnóstico avanzado:', error);
    }
  };

  // No hacer nada en producción para evitar errores
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  // Solo agregar funciones básicas en desarrollo sin operaciones pesadas
  if (typeof window !== 'undefined' && !window.debugDB) {
    window.debugDB = {
      info: () => console.log('🛠️ Debug mode enabled. Basic functions available.'),
      help: () => console.log('Use debugDB.info() for debug information'),
      deepgram: async () => {
        console.log('🔍 Ejecutando diagnóstico avanzado...');
        const result = await diagnosDeepgramAdvanced();
        console.log('📊 Diagnóstico avanzado de Deepgram:', result);
        
        if (result.apiKeyValid === false) {
          console.error('🚨 PROBLEMA: API key inválida o sin créditos');
        } else if (result.connectivityTest?.websocket === false) {
          console.error('🚨 PROBLEMA: WebSockets bloqueados por firewall/proxy');
        } else {
          console.log('✅ Configuración OK - puede ser problema temporal');
        }
      }
    };

    // Configurar test de plantillas básico
    import('@/lib/test-templates').then(({ setupTemplateTest }) => {
      setupTemplateTest();
    }).catch(console.error);
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-4">
      <h2 className="text-xl font-bold text-gray-800">🛠️ Debug - Deepgram Speech</h2>
      
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

      {/* Controles de diagnóstico */}
      <div className="space-y-2">
        <button 
          onClick={handleRunDiagnostic}
          className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          🔍 Diagnóstico Básico
        </button>
        
        <button 
          onClick={handleRunAdvancedDiagnostic}
          className="w-full p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          🚀 Diagnóstico Avanzado (Verifica API Key)
        </button>
        
        <button 
          onClick={handleTestConnection}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          disabled={!isSupported || isTestingConnection}
        >
          {isTestingConnection ? '🔄 Probando...' : '🌐 Probar Conexión con Deepgram'}
        </button>
      </div>

      {/* Resultado de prueba de conexión */}
      {connectionTestResult !== null && (
        <div className={`p-3 rounded border ${
          connectionTestResult 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <h3 className="font-semibold text-sm mb-2">Resultado de Prueba de Conexión:</h3>
          <p className={connectionTestResult ? 'text-green-600' : 'text-red-600'}>
            {connectionTestResult 
              ? '✅ Conexión exitosa con Deepgram' 
              : '❌ Falló la conexión con Deepgram'
            }
          </p>
        </div>
      )}

      {/* Diagnóstico completo */}
      {diagnostic && (
        <div className="p-3 bg-white rounded border">
          <h3 className="font-semibold text-sm text-gray-600 mb-3">📊 Diagnóstico Completo:</h3>
          
          <div className="space-y-3">
            {/* Información del sistema */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Navegador:</span> {diagnostic.browserInfo}
              </div>
              <div>
                <span className="font-medium">Contexto seguro:</span> 
                <span className={diagnostic.isSecureContext ? 'text-green-600' : 'text-red-600'}>
                  {diagnostic.isSecureContext ? ' ✅' : ' ❌'}
                </span>
              </div>
              <div>
                <span className="font-medium">API Key:</span> 
                <span className={diagnostic.hasApiKey ? 'text-green-600' : 'text-red-600'}>
                  {diagnostic.hasApiKey 
                    ? ` ✅ Configurada (${diagnostic.apiKeyLength} chars)` 
                    : ' ❌ No configurada'
                  }
                </span>
              </div>
              {diagnostic.apiKeyValid !== undefined && (
                <div>
                  <span className="font-medium">API Key válida:</span> 
                  <span className={diagnostic.apiKeyValid ? 'text-green-600' : 'text-red-600'}>
                    {diagnostic.apiKeyValid ? ' ✅ Válida' : ' ❌ Inválida'}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium">WebSocket:</span> 
                <span className={diagnostic.hasWebSocket ? 'text-green-600' : 'text-red-600'}>
                  {diagnostic.hasWebSocket ? ' ✅' : ' ❌'}
                </span>
              </div>
              <div>
                <span className="font-medium">MediaRecorder:</span> 
                <span className={diagnostic.hasMediaRecorder ? 'text-green-600' : 'text-red-600'}>
                  {diagnostic.hasMediaRecorder ? ' ✅' : ' ❌'}
                </span>
              </div>
              <div>
                <span className="font-medium">getUserMedia:</span> 
                <span className={diagnostic.hasGetUserMedia ? 'text-green-600' : 'text-red-600'}>
                  {diagnostic.hasGetUserMedia ? ' ✅' : ' ❌'}
                </span>
              </div>
            </div>

            {/* Test de conectividad avanzado */}
            {diagnostic.connectivityTest && (
              <div className="mt-3 p-3 bg-gray-50 rounded border">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">🧪 Tests de Conectividad:</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">REST API:</span>
                    <span className={diagnostic.connectivityTest.restApi ? 'text-green-600' : 'text-red-600'}>
                      {diagnostic.connectivityTest.restApi ? ' ✅ OK' : ' ❌ Falla'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">WebSocket:</span>
                    <span className={diagnostic.connectivityTest.websocket ? 'text-green-600' : 'text-red-600'}>
                      {diagnostic.connectivityTest.websocket ? ' ✅ OK' : ' ❌ Bloqueado'}
                    </span>
                  </div>
                </div>
                
                {/* Análisis de resultados */}
                <div className="mt-2 text-xs">
                  {!diagnostic.connectivityTest.restApi && (
                    <p className="text-red-600 font-medium">
                      🚨 API key inválida o cuenta sin créditos
                    </p>
                  )}
                  {diagnostic.connectivityTest.restApi && !diagnostic.connectivityTest.websocket && (
                    <p className="text-orange-600 font-medium">
                      🔥 API key OK pero WebSockets bloqueados (firewall/proxy)
                    </p>
                  )}
                  {diagnostic.connectivityTest.restApi && diagnostic.connectivityTest.websocket && (
                    <p className="text-green-600 font-medium">
                      ✅ Conectividad OK - problema puede ser temporal
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Recomendaciones */}
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">💡 Recomendaciones:</h4>
              <div className="space-y-1">
                {diagnostic.recommendations.map((rec: string, index: number) => (
                  <p key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {rec}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controles de grabación */}
      <div className="space-y-2">
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
          onClick={clearTranscripts}
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
          <h3 className="font-semibold text-sm text-red-600 mb-2">❌ Error:</h3>
          <p className="text-sm text-red-600 font-mono">{error}</p>
          
          {/* Soluciones rápidas para errores comunes */}
          <div className="mt-3 text-sm">
            <h4 className="font-semibold text-red-700 mb-1">💡 Posibles soluciones:</h4>
            <ul className="space-y-1 text-red-600">
              {error.includes('API key') && (
                <li>• Verifica que la API key de Deepgram sea válida y tenga créditos</li>
              )}
              {error.includes('conexión') && (
                <>
                  <li>• Verifica tu conexión a internet</li>
                  <li>• Revisa si hay firewalls bloqueando websockets</li>
                  <li>• Intenta refrescar la página</li>
                </>
              )}
              {error.includes('micrófono') && (
                <li>• Permite el acceso al micrófono en tu navegador</li>
              )}
              {error.includes('navegador') && (
                <li>• Usa Chrome, Firefox o Edge para mejor compatibilidad</li>
              )}
              <li>• Ejecuta el diagnóstico completo para más información</li>
            </ul>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="text-xs text-gray-500 space-y-1 bg-gray-100 p-3 rounded">
        <h4 className="font-semibold text-gray-700">ℹ️ Información de Debug:</h4>
        <p><strong>Consola:</strong> Abre las herramientas de desarrollador (F12) para logs detallados</p>
        <p><strong>Comandos:</strong> Usa <code>debugDB.deepgram()</code> en la consola para diagnóstico rápido</p>
        <p><strong>Ambiente:</strong> {process.env.NODE_ENV}</p>
        <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'Server'}</p>
      </div>
    </div>
  );
};

export default Debug; 