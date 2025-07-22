// Helper para debugging del flujo de autenticación

export const debugAuthFlow = {
  // Analizar la URL del callback
  analyzeCallbackUrl: (url?: string) => {
    // Verificar si estamos en el cliente
    if (typeof window === 'undefined') {
      console.log('🚫 window no disponible (SSR)');
      return {
        fullUrl: '',
        pathname: '',
        queryParams: {},
        hashParams: {},
        hasCode: false,
        hasAccessToken: false,
        hasError: false,
        flowType: 'Unknown'
      };
    }

    const targetUrl = url || window.location.href;
    const urlObj = new URL(targetUrl);
    const queryParams = Object.fromEntries(urlObj.searchParams.entries());
    const hashParams = Object.fromEntries(new URLSearchParams(urlObj.hash.substring(1)).entries());
    
    const analysis = {
      fullUrl: targetUrl,
      pathname: urlObj.pathname,
      queryParams,
      hashParams,
      hasCode: !!queryParams.code,
      hasAccessToken: !!hashParams.access_token,
      hasError: !!queryParams.error || !!hashParams.error,
      flowType: queryParams.code ? 'PKCE' : hashParams.access_token ? 'Implicit' : 'Unknown'
    };

    console.group('🔍 Análisis de URL de Callback');
    console.log('URL completa:', analysis.fullUrl);
    console.log('Tipo de flujo detectado:', analysis.flowType);
    console.log('Query params:', analysis.queryParams);
    console.log('Hash params:', analysis.hashParams);
    console.log('Tiene código (PKCE):', analysis.hasCode);
    console.log('Tiene access_token (Implicit):', analysis.hasAccessToken);
    console.log('Tiene errores:', analysis.hasError);
    console.groupEnd();

    return analysis;
  },

  // Verificar configuración de Supabase
  checkSupabaseConfig: () => {
    const config = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlValid: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://'),
      keyValid: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0) >= 100
    };

    console.group('⚙️ Configuración de Supabase');
    console.log('URL configurada:', config.hasUrl ? '✅' : '❌');
    console.log('URL válida:', config.urlValid ? '✅' : '❌');
    console.log('Anon Key configurada:', config.hasAnonKey ? '✅' : '❌'); 
    console.log('Anon Key válida:', config.keyValid ? '✅' : '❌');
    if (config.hasUrl) {
      console.log('URL:', config.url);
    }
    console.groupEnd();

    return config;
  },

  // Verificar almacenamiento local
  checkLocalStorage: () => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.log('🚫 localStorage no disponible (SSR)');
      return null;
    }

    const storageData = {
      supabaseSession: localStorage.getItem('sb-ouinponhxvgjikreuunp-auth-token'),
      hasSupabaseData: !!localStorage.getItem('sb-ouinponhxvgjikreuunp-auth-token'),
      allSupabaseKeys: Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('sb-'))
    };

    console.group('💾 Almacenamiento Local');
    console.log('Tiene datos de sesión:', storageData.hasSupabaseData ? '✅' : '❌');
    console.log('Claves de Supabase encontradas:', storageData.allSupabaseKeys);
    if (storageData.supabaseSession) {
      try {
        const parsed = JSON.parse(storageData.supabaseSession);
        console.log('Datos de sesión:', {
          hasAccessToken: !!parsed.access_token,
          hasRefreshToken: !!parsed.refresh_token,
          expiresAt: parsed.expires_at ? new Date(parsed.expires_at * 1000).toLocaleString() : 'No definido'
        });
      } catch (e) {
        console.log('Error parseando datos de sesión:', e);
      }
    }
    console.groupEnd();

    return storageData;
  },

  // Ejecutar diagnóstico completo
  runFullDiagnostic: () => {
    console.log('🔬 Ejecutando diagnóstico completo de autenticación...');
    
    const urlAnalysis = debugAuthFlow.analyzeCallbackUrl();
    const config = debugAuthFlow.checkSupabaseConfig();
    const storage = debugAuthFlow.checkLocalStorage();

    const recommendations = [];

    // Generar recomendaciones
    if (!config.hasUrl || !config.hasAnonKey) {
      recommendations.push('❌ Configurar variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    if (urlAnalysis.hasError) {
      recommendations.push('❌ Hay errores en la URL de callback, verificar configuración OAuth');
    }

    if (urlAnalysis.flowType === 'Unknown') {
      recommendations.push('⚠️ No se detectó código ni tokens en la URL, posible error de configuración');
    }

    if (!storage?.hasSupabaseData && urlAnalysis.flowType !== 'Unknown') {
      recommendations.push('⚠️ No hay datos de sesión en localStorage a pesar de recibir credenciales');
    }

    console.group('📋 Recomendaciones');
    if (recommendations.length === 0) {
      console.log('✅ Todo parece estar configurado correctamente');
    } else {
      recommendations.forEach(rec => console.log(rec));
    }
    console.groupEnd();

    return {
      urlAnalysis,
      config,
      storage,
      recommendations
    };
  }
};

// Función de conveniencia para debugging rápido
export const quickAuthDebug = () => {
  if (process.env.NODE_ENV === 'development') {
    return debugAuthFlow.runFullDiagnostic();
  }
  return null;
}; 