import { createClient } from '@supabase/supabase-js';

// Obtener variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación básica
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables de entorno Supabase faltantes');
}

console.log('✅ Configuración Supabase simplificada');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Anon Key presente:', !!supabaseAnonKey);

// ✅ Configuración SIMPLIFICADA que evita error 401
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

// Funciones de autenticación SIMPLIFICADAS
export const auth = {
  // Iniciar sesión con Google
  signInWithGoogle: async () => {
    console.log('🔄 Iniciando autenticación con Google...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error('❌ Error en signInWithGoogle:', error);
    } else {
      console.log('✅ Redirección iniciada correctamente');
    }
    
    return { data, error };
  },

  // Cerrar sesión
  signOut: async () => {
    console.log('🔄 Cerrando sesión...');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Error en signOut:', error);
    } else {
      console.log('✅ Sesión cerrada correctamente');
    }
    
    return { error };
  },

  // Obtener el usuario actual
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Obtener la sesión actual
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Escuchar cambios en el estado de autenticación
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
}; 