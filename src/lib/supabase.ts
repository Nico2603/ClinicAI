import { createClient } from '@supabase/supabase-js';

// Variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validación de variables de entorno
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Variables de entorno Supabase faltantes. Verifica NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Cliente Supabase optimizado
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Tipos de usuario
export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
};

// API de autenticación simplificada
export const auth = {
  // Iniciar sesión con Google
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    
    if (error) {
      console.error('Error en autenticación:', error.message);
      throw error;
    }
    
    return { data, error: null };
  },

  // Cerrar sesión
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error cerrando sesión:', error.message);
      throw error;
    }
    return { error: null };
  },

  // Obtener usuario actual
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error obteniendo usuario:', error.message);
      return { user: null, error };
    }
    return { user, error: null };
  },

  // Obtener sesión actual
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error obteniendo sesión:', error.message);
      return { session: null, error };
    }
    return { session, error: null };
  },

  // Escuchar cambios de autenticación
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};
