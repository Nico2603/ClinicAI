import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, type AuthUser } from '@/src/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null && session !== null;

  // Función para limpiar tokens de la URL
  const cleanUrlTokens = () => {
    if (window.location.hash.includes('access_token')) {
      // Remover los tokens de la URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Función para procesar tokens de la URL
  const handleUrlTokens = async () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      try {
        console.log('🔄 Procesando tokens de la URL...');
        
        // Establecer la sesión con los tokens de la URL
        const { user, error } = await auth.getCurrentUser();
        
        if (error) {
          console.error('❌ Error procesando tokens:', error);
          setError('Error al procesar la autenticación');
        } else {
          console.log('✅ Tokens procesados correctamente');
          // Los tokens ya están procesados por Supabase automáticamente
          // Solo necesitamos limpiar la URL
          cleanUrlTokens();
        }
      } catch (err) {
        console.error('❌ Error en handleUrlTokens:', err);
        setError('Error al procesar la autenticación');
        cleanUrlTokens();
      }
    }
  };

  useEffect(() => {
    // Procesar tokens de la URL si existen
    handleUrlTokens();

    // Obtener la sesión inicial
    const getInitialSession = async () => {
      try {
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
      console.log('Auth state changed:', event, session);
      
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
        
        // Limpiar URL si hay tokens después de autenticación exitosa
        if (event === 'SIGNED_IN') {
          cleanUrlTokens();
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      
      const { error } = await auth.signInWithGoogle();
      
      if (error) {
        console.error('Error durante el sign in:', error);
        setError('Error al iniciar sesión con Google');
        throw error;
      }
      
      // El estado se actualizará automáticamente a través del listener
    } catch (err) {
      console.error('Error en signIn:', err);
      setError('Error al iniciar sesión');
      setIsLoading(false);
      throw err;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      const { error } = await auth.signOut();
      
      if (error) {
        console.error('Error durante el sign out:', error);
        setError('Error al cerrar sesión');
        throw error;
      }
      
      // El estado se actualizará automáticamente a través del listener
    } catch (err) {
      console.error('Error en signOut:', err);
      setError('Error al cerrar sesión');
      throw err;
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext; 