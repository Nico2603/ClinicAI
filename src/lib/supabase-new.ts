import { createClient } from '@supabase/supabase-js';

// Variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables de entorno Supabase faltantes');
}

console.log('✅ Variables de entorno Supabase validadas correctamente');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

// Cliente Supabase simplificado
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
};

export const auth = {
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

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  },

  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (err) {
      return { user: null, error: err };
    }
  },

  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (err) {
      return { session: null, error: err };
    }
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
}; 