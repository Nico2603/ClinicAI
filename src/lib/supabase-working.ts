import { createClient } from '@supabase/supabase-js';

// TypeScript declaration for Node.js process
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

// Obtener variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Validación de variables de entorno
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables de entorno Supabase faltantes');
}

console.log('✅ Variables de entorno Supabase validadas correctamente');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

// Crear cliente Supabase con configuración mínima y estable
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
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

// Funciones de autenticación optimizadas
export const auth = {
  // Iniciar sesión con Google
  signInWithGoogle: async () => {
    try {
      console.log('🔄 Iniciando autenticación con Google...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
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