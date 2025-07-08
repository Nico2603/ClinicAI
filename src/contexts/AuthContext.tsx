'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, supabase, type AuthUser } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  mounted: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Todos los hooks deben estar en el nivel superior
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const isAuthenticated = user !== null && session !== null;

  // Función para asegurar que el usuario existe en la base de datos
  const ensureUserExists = async () => {
    try {
      const { error } = await supabase.rpc('ensure_current_user_exists');
      if (error) {
        console.error('Error al asegurar que el usuario existe:', error);
      }
    } catch (err) {
      console.error('Error al verificar usuario:', err);
    }
  };

  useEffect(() => {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    setMounted(true);
    
    // Obtener la sesión inicial
    const getInitialSession = async () => {
      try {
        // Limpiar cualquier parámetro de autenticación en la URL principal
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          // Si estamos en la página principal con tokens, limpiar la URL
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }

        const { session, error } = await auth.getSession();
        
        if (error) {
          console.error('Error obteniendo sesión inicial:', error);
          setError('Error al obtener la sesión');
        } else {
          setSession(session);
          
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
              image: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
              created_at: session.user.created_at,
              updated_at: session.user.updated_at,
            });
            setError(null);
            // Asegurar que el usuario existe en la base de datos
            await ensureUserExists();
          }
        }
      } catch (err) {
        console.error('Error en getInitialSession:', err);
        setError('Error al inicializar la autenticación');
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      setSession(session);
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          image: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at,
        });
        setError(null);
        // Asegurar que el usuario existe en la base de datos
        await ensureUserExists();
      } else {
        setUser(null);
        if (event === 'SIGNED_OUT') {
          setError(null);
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (): Promise<void> => {
    if (typeof window === 'undefined') {
      throw new Error('Sign in solo disponible en el cliente');
    }

    try {
      setError(null);
      setIsLoading(true);
      
      const { error } = await auth.signInWithGoogle();
      
      if (error) {
        console.error('Error durante el sign in:', error);
        setError('Error al iniciar sesión con Google');
        setIsLoading(false);
        throw error;
      }
    } catch (err) {
      console.error('Error en signIn:', err);
      setError('Error al iniciar sesión');
      setIsLoading(false);
      throw err;
    }
  };

  const signOut = async (): Promise<void> => {
    if (typeof window === 'undefined') {
      throw new Error('Sign out solo disponible en el cliente');
    }

    try {
      setError(null);
      setIsLoading(true);
      
      const { error } = await auth.signOut();
      
      if (error) {
        console.error('Error durante el sign out:', error);
        setError('Error al cerrar sesión');
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (err) {
      console.error('Error en signOut:', err);
      setError('Error al cerrar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    error,
    mounted,
  };

  // Evitar renderizado durante SSR
  if (typeof window === 'undefined') {
    const defaultValue: AuthContextType = {
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      signIn: async () => {},
      signOut: async () => {},
      error: null,
      mounted: false,
    };
    
    return (
      <AuthContext.Provider value={defaultValue}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 
