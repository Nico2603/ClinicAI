import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, supabase, type AuthUser } from '@/src/lib/supabase';
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

  useEffect(() => {
    // Verificar si hay tokens en la URL (callback de OAuth)
    const hasAuthTokens = window.location.hash.includes('access_token');
    
    // Si hay tokens en la URL, dar más tiempo para procesarlos
    if (hasAuthTokens) {
      console.log('🔄 Detectados tokens de autenticación en URL, procesando...');
      // Mantener loading=true por más tiempo para permitir el procesamiento
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 3000); // 3 segundos para procesar tokens
    }

    // Obtener la sesión inicial
    const getInitialSession = async () => {
      try {
        console.log('🔄 Obteniendo sesión inicial...');
        
        // Si hay tokens en la URL, esperar un poco más para que Supabase los procese
        if (hasAuthTokens) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const { session, error } = await auth.getSession();
        
        if (error) {
          console.error('❌ Error obteniendo sesión inicial:', error);
          setError('Error al obtener la sesión');
        } else {
          console.log('✅ Sesión inicial obtenida:', session ? 'Activa' : 'No activa');
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
          }
        }
      } catch (err) {
        console.error('❌ Error en getInitialSession:', err);
        setError('Error al inicializar la autenticación');
      } finally {
        // Solo establecer loading=false si no hay tokens pendientes
        if (!hasAuthTokens) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Escuchar cambios en el estado de autenticación
    // Este listener maneja automáticamente el callback de OAuth
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
      
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
        
        // Limpiar URL después de autenticación exitosa
        if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
          console.log('🧹 Limpiando URL después de autenticación exitosa');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        setUser(null);
      }
      
      // Asegurar que loading se establece en false después del procesamiento
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
      
      console.log('🔄 Iniciando proceso de autenticación...');
      const { error } = await auth.signInWithGoogle();
      
      if (error) {
        console.error('❌ Error durante el sign in:', error);
        setError('Error al iniciar sesión con Google');
        setIsLoading(false);
        throw error;
      }
      
      console.log('✅ Redirección a Google iniciada');
      // El estado se actualizará automáticamente cuando regrese el usuario
    } catch (err) {
      console.error('❌ Error en signIn:', err);
      setError('Error al iniciar sesión');
      setIsLoading(false);
      throw err;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      console.log('🔄 Cerrando sesión...');
      
      const { error } = await auth.signOut();
      
      if (error) {
        console.error('❌ Error durante el sign out:', error);
        setError('Error al cerrar sesión');
        throw error;
      }
      
      console.log('✅ Sesión cerrada correctamente');
      // El estado se actualizará automáticamente a través del listener
    } catch (err) {
      console.error('❌ Error en signOut:', err);
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