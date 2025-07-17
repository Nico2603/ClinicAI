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