import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  error: string | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  useEffect(() => {
    // Check for stored authentication data
    const storedUser = localStorage.getItem('notas-ai-user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('notas-ai-user');
      }
    }

    // Load Google Identity Services
    const loadGoogleScript = async () => {
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogleAuth;
        script.onerror = () => {
          setError('Error al cargar Google Auth');
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } else {
        initializeGoogleAuth();
      }
    };

    const initializeGoogleAuth = () => {
      if (window.google && GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        setIsLoading(false);
      } else {
        setError('Google Client ID no configurado');
        setIsLoading(false);
      }
    };

    loadGoogleScript();
  }, []);

  const handleCredentialResponse = (response: any) => {
    try {
      if (response.credential) {
        // Decode the JWT token to get user info
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        const userData = JSON.parse(jsonPayload);
        const user: User = {
          id: userData.sub,
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
        };

        setUser(user);
        localStorage.setItem('notas-ai-user', JSON.stringify(user));
        setError(null);
      }
    } catch (err) {
      console.error('Error processing credential response:', err);
      setError('Error al procesar la respuesta de autenticación');
    }
  };

  const signIn = async (): Promise<void> => {
    try {
      setError(null);
      if (window.google) {
        window.google.accounts.id.prompt();
      } else {
        throw new Error('Google Auth no está disponible');
      }
    } catch (err) {
      console.error('Error during sign in:', err);
      setError('Error al iniciar sesión');
      throw err;
    }
  };

  const signOut = () => {
    // Note: We don't clear user-specific data (templates, history) on logout
    // to preserve user data between sessions
    setUser(null);
    localStorage.removeItem('notas-ai-user');
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  const value: AuthContextType = {
    user,
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