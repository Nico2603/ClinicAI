'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { auth, supabase, type AuthUser } from '@/lib/supabase';
import { cleanAuthUrl, handleAuthError, isClient } from '@/lib/utils';
import { useSimpleSession } from '@/hooks/useSimpleSession';
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

  // Función simple para obtener sesión
  const getSession = useCallback(async (): Promise<Session | null> => {
    try {
      const { session, error } = await auth.getSession();
      if (error) {
        console.error('Error obteniendo sesión:', error);
        return null;
      }
      return session;
    } catch (err) {
      console.error('Error obteniendo sesión:', err);
      return null;
    }
  }, []);

  // Manejo simple de sesiones
  const simpleSession = useSimpleSession();

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
      return await simpleSession.refreshSession();
    } catch (error) {
      console.error('Error al extender sesión:', error);
      return false;
    }
  }, [simpleSession]);

  useEffect(() => {
    // Verificar que estamos en el cliente
    if (!isClient()) {
      return;
    }

    setMounted(true);
    
    // Inicializar autenticación
    const initAuth = async () => {
      try {
        // Obtener la sesión inicial
        const session = await getSession();
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
  }, [updateUserState, getSession]);

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
