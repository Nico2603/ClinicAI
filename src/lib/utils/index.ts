// =============================================================================
// BARREL EXPORTS - UTILIDADES
// =============================================================================

// Utilidades de formato
export * from './formatUtils';

// Utilidades simples - reemplazan las complejas
export * from './simpleValidation';
export * from './simpleDatabaseUtils';

// Re-exportar utilidades existentes del archivo utils.ts principal
export * from '../utils'; 

// Función de diagnóstico para problemas de Deepgram
export interface DeepgramDiagnostic {
  hasApiKey: boolean;
  apiKeyLength: number;
  hasWebSocket: boolean;
  hasMediaRecorder: boolean;
  hasGetUserMedia: boolean;
  isSecureContext: boolean;
  browserInfo: string;
  recommendations: string[];
  apiKeyValid?: boolean; // Nuevo: resultado de verificación REST API
  connectivityTest?: {
    restApi: boolean;
    websocket: boolean;
  };
}

export const diagnosDeepgramIssues = (): DeepgramDiagnostic => {
  const hasApiKey = !!process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
  const apiKeyLength = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY?.length || 0;
  const hasWebSocket = typeof WebSocket !== 'undefined';
  const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
  const hasGetUserMedia = !!(navigator?.mediaDevices?.getUserMedia);
  const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
  
  // Detectar navegador
  const userAgent = navigator.userAgent;
  let browserInfo = 'Navegador no identificado';
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
    browserInfo = 'Google Chrome';
  } else if (userAgent.includes('Firefox')) {
    browserInfo = 'Mozilla Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserInfo = 'Safari';
  } else if (userAgent.includes('Edge')) {
    browserInfo = 'Microsoft Edge';
  }

  // Generar recomendaciones
  const recommendations: string[] = [];
  
  if (!hasApiKey) {
    recommendations.push('🔑 Configura la API key de Deepgram en las variables de entorno');
  } else if (apiKeyLength < 10) {
    recommendations.push('🔑 Verifica que la API key de Deepgram sea válida (parece muy corta)');
  }
  
  if (!hasWebSocket) {
    recommendations.push('🌐 Tu navegador no soporta WebSockets - actualiza a una versión más reciente');
  }
  
  if (!hasMediaRecorder) {
    recommendations.push('🎤 Tu navegador no soporta MediaRecorder - usa Chrome, Firefox o Edge');
  }
  
  if (!hasGetUserMedia) {
    recommendations.push('📷 Tu navegador no soporta acceso al micrófono - usa un navegador moderno');
  }
  
  if (!isSecureContext) {
    recommendations.push('🔒 El sitio debe usar HTTPS para acceder al micrófono');
  }
  
  if (browserInfo.includes('Safari')) {
    recommendations.push('🍎 Safari puede tener limitaciones con WebRTC - considera usar Chrome o Firefox');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Tu configuración parece correcta - el problema puede ser de conectividad de red');
    recommendations.push('🌐 Verifica tu conexión a internet y que no haya firewalls bloqueando websockets');
  }

  return {
    hasApiKey,
    apiKeyLength,
    hasWebSocket,
    hasMediaRecorder,
    hasGetUserMedia,
    isSecureContext,
    browserInfo,
    recommendations
  };
};

// Nueva función para diagnóstico avanzado con verificación de API
export const diagnosDeepgramAdvanced = async (): Promise<DeepgramDiagnostic> => {
  const basicDiagnostic = diagnosDeepgramIssues();
  
  // Si no hay API key, retornar diagnóstico básico
  if (!basicDiagnostic.hasApiKey) {
    return basicDiagnostic;
  }

  const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY!;
  
  try {
    console.log('🔍 Ejecutando diagnóstico avanzado con verificación de API...');
    
    // Test 1: Verificar API key con REST API
    const restApiResult = await testDeepgramRestApi(apiKey);
    
    // Test 2: Probar conectividad WebSocket básica
    const websocketResult = await testWebSocketConnectivity();
    
    // Actualizar recomendaciones basadas en los resultados
    const newRecommendations = [...basicDiagnostic.recommendations];
    
    if (!restApiResult) {
      newRecommendations.unshift('❌ API key inválida o sin permisos. Verifica tu cuenta de Deepgram');
      newRecommendations.unshift('💰 Verifica que tu cuenta de Deepgram tenga créditos disponibles');
    }
    
    if (!websocketResult && restApiResult) {
      newRecommendations.unshift('🔥 API key válida pero WebSocket bloqueado. Revisa firewall/proxy');
      newRecommendations.unshift('🌐 Intenta desde otra red para descartar bloqueo corporativo');
    }
    
    return {
      ...basicDiagnostic,
      apiKeyValid: restApiResult,
      connectivityTest: {
        restApi: restApiResult,
        websocket: websocketResult
      },
      recommendations: newRecommendations
    };
    
  } catch (error) {
    console.error('❌ Error en diagnóstico avanzado:', error);
    return {
      ...basicDiagnostic,
      recommendations: [
        ...basicDiagnostic.recommendations,
        '⚠️ No se pudo completar el diagnóstico avanzado - problema de conectividad'
      ]
    };
  }
};

// Función auxiliar para probar REST API
const testDeepgramRestApi = async (apiKey: string): Promise<boolean> => {
  try {
    console.log('🔑 Probando API key con REST API...');
    
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API key válida, proyectos:', data.projects?.length || 0);
      return true;
    } else {
      console.error('❌ REST API falló:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error de red en REST API:', error);
    return false;
  }
};

// Función auxiliar para probar conectividad WebSocket
const testWebSocketConnectivity = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Test básico de conectividad a un WebSocket público
      const testWs = new WebSocket('wss://echo.websocket.org');
      
      const timeout = setTimeout(() => {
        testWs.close();
        resolve(false);
      }, 5000);
      
      testWs.onopen = () => {
        console.log('✅ Conectividad WebSocket básica OK');
        clearTimeout(timeout);
        testWs.close();
        resolve(true);
      };
      
      testWs.onerror = () => {
        console.error('❌ Conectividad WebSocket básica falló');
        clearTimeout(timeout);
        resolve(false);
      };
      
    } catch (error) {
      console.error('❌ Error en test WebSocket:', error);
      resolve(false);
    }
  });
}; 