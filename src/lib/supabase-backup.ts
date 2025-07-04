import { createClient } from '@supabase/supabase-js';

// Obtener variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación más robusta de variables de entorno
if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL no está definida');
  throw new Error('Variable de entorno VITE_SUPABASE_URL es requerida');
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY no está definida');
  throw new Error('Variable de entorno VITE_SUPABASE_ANON_KEY es requerida');
}

// Validar formato de URL
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('❌ VITE_SUPABASE_URL no es una URL válida:', supabaseUrl);
  throw new Error('VITE_SUPABASE_URL debe ser una URL válida');
}

// Validar que la anon key tenga el formato correcto de JWT
if (!supabaseAnonKey.startsWith('eyJ')) {
  console.error('❌ VITE_SUPABASE_ANON_KEY no parece ser un token JWT válido');
  throw new Error('VITE_SUPABASE_ANON_KEY debe ser un token JWT válido');
}

console.log('✅ Variables de entorno Supabase validadas correctamente');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

// Crear cliente Supabase con configuración simplificada
// ✅ Eliminamos headers duplicados que pueden causar error 401
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit'
  }
});

// Tipos para la autenticación
export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
};

// Funciones de autenticación simplificadas
export const auth = {
  // Iniciar sesión con Google
  signInWithGoogle: async () => {
    try {
      console.log('🔄 Iniciando autenticación con Google...');
      
      // Configurar redirectTo basado en el entorno
      const getRedirectTo = () => {
        // En desarrollo local, usar puerto específico
        if (window.location.hostname === 'localhost') {
          return `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
        }
        // En producción, usar el origen completo
        return window.location.origin;
      };
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectTo(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('❌ Error en signInWithGoogle:', error);
        throw error;
      }
      
      console.log('✅ Redirección iniciada correctamente');
      return { data, error: null };
    } catch (err) {
      console.error('❌ Excepción en signInWithGoogle:', err);
      return { data: null, error: err };
    }
  },

  // Cerrar sesión
  signOut: async () => {
    try {
      console.log('🔄 Cerrando sesión...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Error en signOut:', error);
        throw error;
      }
      
      console.log('✅ Sesión cerrada correctamente');
      return { error: null };
    } catch (err) {
      console.error('❌ Excepción en signOut:', err);
      return { error: err };
    }
  },

  // Obtener el usuario actual
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Error obteniendo usuario actual:', error);
        throw error;
      }
      
      return { user, error: null };
    } catch (err) {
      console.error('❌ Excepción en getCurrentUser:', err);
      return { user: null, error: err };
    }
  },

  // Obtener la sesión actual
  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error obteniendo sesión:', error);
        throw error;
      }
      
      return { session, error: null };
    } catch (err) {
      console.error('❌ Excepción en getSession:', err);
      return { session: null, error: err };
    }
  },

  // Escuchar cambios en el estado de autenticación
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
}; 