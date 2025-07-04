import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debugging: Log para verificar las variables de entorno
console.log('🔍 Variables de entorno Supabase:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'CONFIGURADA' : 'NO ENCONTRADA');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'CONFIGURADA' : 'NO ENCONTRADA');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno de Supabase:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[PRESENTE]' : '[FALTANTE]');
  throw new Error('Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
}

console.log('✅ Inicializando cliente Supabase...');

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

// Funciones de autenticación
export const auth = {
  // Iniciar sesión con Google
  signInWithGoogle: async () => {
    try {
      console.log('🔄 Iniciando autenticación con Google...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // ✅ Cambiar a la URL de la aplicación principal sin callback específico
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error('❌ Error en signInWithGoogle:', error);
      } else {
        console.log('✅ Redirección iniciada correctamente');
      }
      
      return { data, error };
    } catch (err) {
      console.error('❌ Excepción en signInWithGoogle:', err);
      throw err;
    }
  },

  // Cerrar sesión
  signOut: async () => {
    try {
      console.log('🔄 Cerrando sesión...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Error en signOut:', error);
      } else {
        console.log('✅ Sesión cerrada correctamente');
      }
      
      return { error };
    } catch (err) {
      console.error('❌ Excepción en signOut:', err);
      throw err;
    }
  },

  // Obtener el usuario actual
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Error obteniendo usuario actual:', error);
      }
      
      return { user, error };
    } catch (err) {
      console.error('❌ Excepción en getCurrentUser:', err);
      throw err;
    }
  },

  // Obtener la sesión actual
  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error obteniendo sesión:', error);
      }
      
      return { session, error };
    } catch (err) {
      console.error('❌ Excepción en getSession:', err);
      throw err;
    }
  },

  // Escuchar cambios en el estado de autenticación
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
}; 