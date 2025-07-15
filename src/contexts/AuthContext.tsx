'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { auth, supabase, type AuthUser } from '@/lib/supabase';
import { cleanAuthUrl, handleAuthError, delay, isClient } from '@/lib/utils';
import { useSessionExpiry } from '@/hooks/useSessionExpiry';
import { performCompleteCleanup } from '@/lib/services/storageService';
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
  extendSession: () => Promise<boolean>;
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
  const [mounted, setMounted] = useState(false);

  const isAuthenticated = user !== null && session !== null;

  // Función para asegurar que el usuario existe en la base de datos
  const ensureUserExists = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('ensure_current_user_exists');
      if (error) {
        console.error('Error al asegurar que el usuario existe:', error);
      }
    } catch (err) {
      console.error('Error al verificar usuario:', err);
    }
  }, []);

  // Función para actualizar el estado del usuario
  const updateUserState = useCallback(async (newSession: Session | null) => {
    try {
      setSession(newSession);
      
      if (newSession?.user) {
        const userData: AuthUser = {
          id: newSession.user.id,
          email: newSession.user.email,
          name: newSession.user.user_metadata?.full_name || newSession.user.user_metadata?.name,
          image: newSession.user.user_metadata?.avatar_url || newSession.user.user_metadata?.picture,
          created_at: newSession.user.created_at,
          updated_at: newSession.user.updated_at,
        };
        setUser(userData);
        setError(null);
        
        // Asegurar que el usuario existe en la base de datos
        await ensureUserExists();
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error al actualizar estado del usuario:', err);
      setError(handleAuthError(err));
    }
  }, [ensureUserExists]);

  // Función para obtener sesión con retry
  const getSessionWithRetry = useCallback(async (maxRetries = 2, delayMs = 1000): Promise<Session | null> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const { session, error } = await auth.getSession();
        
        if (error) {
          console.error(`Error obteniendo sesión (intento ${i + 1}/${maxRetries}):`, error);
          if (i === maxRetries - 1) throw error;
        } else {
          return session;
        }
      } catch (err) {
        console.error(`Error en intento ${i + 1}/${maxRetries}:`, err);
        if (i === maxRetries - 1) throw err;
      }
      
      // Esperar antes del siguiente intento
      await delay(delayMs);
    }
    
    return null;
  }, []);

  // Configurar control de sesiones simplificado
  const sessionExpiry = useSessionExpiry({
    sessionTimeoutMs: 55 * 60 * 1000, // 55 minutos
    enabled: isAuthenticated && !isLoading,
    onSessionExpiry: () => {
      console.log('🔄 Sesión expirada, procesando automáticamente');
      // La sesión ya fue manejada por el hook, no necesitamos hacer nada más
    },
    onCleanupLocalData: () => {
      if (user?.id) {
        performCompleteCleanup(user.id);
      }
    }
  });

  // Función de inicio de sesión
  const signIn = useCallback(async () => {
    try {
      setError(null);
      await auth.signInWithGoogle();
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError(handleAuthError(err));
    }
  }, []);

  // Función de cierre de sesión
  const signOut = useCallback(async () => {
    try {
      setError(null);
      
      // Limpiar datos locales antes de cerrar sesión
      if (user?.id) {
        performCompleteCleanup(user.id);
      }
      
      await auth.signOut();
      
      // Limpiar estado local
      setUser(null);
      setSession(null);
      
      // Limpiar URL
      cleanAuthUrl();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setError(handleAuthError(err));
    }
  }, [user?.id]);

  // Extender sesión manualmente
  const extendSession = useCallback(async (): Promise<boolean> => {
    try {
      return await sessionExpiry.extendSession();
    } catch (error) {
      console.error('Error al extender sesión:', error);
      return false;
    }
  }, [sessionExpiry]);

  useEffect(() => {
    // Verificar que estamos en el cliente
    if (!isClient()) {
      return;
    }

    setMounted(true);
    
    // Inicializar autenticación
    const initAuth = async () => {
      try {
        // Obtener la sesión inicial con retry
        const session = await getSessionWithRetry();
        await updateUserState(session);
        
        if (session) {
          console.log('Sesión inicial establecida:', session.user.email);
        }
        
        // Limpiar URL después de procesar la sesión
        cleanAuthUrl();
      } catch (err) {
        console.error('Error al inicializar autenticación:', err);
        setError(handleAuthError(err));
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      try {
        await updateUserState(session);
        
        if (event === 'SIGNED_OUT') {
          setError(null);
          // Limpiar la URL después de cerrar sesión
          cleanAuthUrl();
        }
      } catch (err) {
        console.error('Error en onAuthStateChange:', err);
        setError(handleAuthError(err));
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [updateUserState, getSessionWithRetry]);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    error,
    mounted,
    extendSession,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
