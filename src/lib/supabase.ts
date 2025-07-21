import { createClient } from '@supabase/supabase-js';
import { 
  handleAuthError, 
  validateOAuthConfig,
  type AuthErrorResponse 
} from './utils/authErrorHandler';
import { devLog, prodLog } from './utils/logFilter';

// Variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validación de variables de entorno
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Variables de entorno Supabase faltantes. Verifica NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Cliente Supabase optimizado con seguridad mejorada
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // 🔒 PKCE flow para mayor seguridad
    debug: process.env.NODE_ENV === 'development'
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'notas-ai@1.0.0',
      'x-client-version': '1.0.0'
    },
  },
  realtime: {
    timeout: 20000,
    heartbeatIntervalMs: 30000,
  }
});

// Tipos mejorados
export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
};

export type GoogleAuthScopes = 
  | 'email'
  | 'profile' 
  | 'openid'
  | 'https://www.googleapis.com/auth/calendar'
  | 'https://www.googleapis.com/auth/drive.readonly';

export type AuthOptions = {
  scopes?: GoogleAuthScopes[];
  redirectTo?: string;
  queryParams?: Record<string, string>;
};

// API de autenticación mejorada con manejo de errores centralizado
export const auth = {
  // Iniciar sesión con Google (con scopes personalizables)
  signInWithGoogle: async (options?: AuthOptions) => {
    try {
      // Configuración por defecto
      const defaultScopes: GoogleAuthScopes[] = ['email', 'profile', 'openid'];
      const defaultRedirectTo = `${window.location.origin}/auth/callback`;
      
      // Validar configuración
      const scopes = options?.scopes || defaultScopes;
      const redirectTo = options?.redirectTo || defaultRedirectTo;
      
      const validation = validateOAuthConfig(scopes, redirectTo);
      if (!validation.isValid) {
        throw new Error(`Configuración OAuth inválida: ${validation.errors.join(', ')}`);
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: scopes.join(' '),
          queryParams: options?.queryParams || {}
        }
      });
      
      if (error) {
        const authError = handleAuthError(error);
        return { data: null, error: authError };
      }
      
      // Redirigir explícitamente si Supabase devuelve una URL
      if (data?.url) {
        window.location.assign(data.url);
      }
      
      return { data, error: null };
    } catch (error) {
      const authError = handleAuthError(error);
      return { data: null, error: authError };
    }
  },

  // Cerrar sesión con manejo mejorado
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        const authError = handleAuthError(error);
        return { error: authError };
      }
      
      // Limpiar almacenamiento local si es necesario
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      }
      
      return { error: null };
    } catch (error) {
      const authError = handleAuthError(error);
      return { error: authError };
    }
  },

  // Obtener usuario actual con retry automático
  getCurrentUser: async (retryCount = 3): Promise<{ user: any; error: AuthErrorResponse | null }> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        const authError = handleAuthError(error);
        
        // Retry para errores de red
        if (authError.type === 'NETWORK_ERROR' && retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return auth.getCurrentUser(retryCount - 1);
        }
        
        return { user: null, error: authError };
      }
      return { user, error: null };
    } catch (error) {
      const authError = handleAuthError(error);
      return { user: null, error: authError };
    }
  },

  // Obtener sesión actual con validación
  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        const authError = handleAuthError(error);
        return { session: null, error: authError };
      }
      
      // Validar que la sesión no haya expirado
      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        
        if (expiresAt <= now) {
          const authError = handleAuthError(new Error('Session expired'));
          return { session: null, error: authError };
        }
      }
      
      return { session, error: null };
    } catch (error) {
      const authError = handleAuthError(error);
      return { session: null, error: authError };
    }
  },

  // Escuchar cambios de autenticación con manejo mejorado de eventos
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      // Log de cambios de estado (inteligente por entorno)
      devLog(`🔐 Auth State Change: ${event}`, session ? 'Session active' : 'No session');

      // Manejar eventos específicos
      switch (event) {
        case 'SIGNED_IN':
          prodLog('✅ Usuario autenticado exitosamente');
          devLog('✅ Usuario autenticado exitosamente - Sesión:', session?.user?.email);
          break;
        case 'SIGNED_OUT':
          prodLog('👋 Usuario desconectado');
          devLog('👋 Usuario desconectado - Limpiando datos locales');
          // Limpiar datos locales si es necesario
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user-preferences');
          }
          break;
        case 'USER_UPDATED':
          devLog('🔄 Datos de usuario actualizados');
          break;
      }
      
      // Ejecutar callback del usuario
      callback(event, session);
    });
  },

  // Nuevo: Refrescar token manualmente
  refreshToken: async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        const authError = handleAuthError(error);
        return { session: null, error: authError };
      }
      return { session: data.session, error: null };
    } catch (error) {
      const authError = handleAuthError(error);
      return { session: null, error: authError };
    }
  },

  // Nuevo: Verificar si el usuario está autenticado
  isAuthenticated: async () => {
    const { session, error } = await auth.getSession();
    return !error && session !== null;
  }
};
