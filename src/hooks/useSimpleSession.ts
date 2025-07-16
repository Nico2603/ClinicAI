import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Hook simple de sesión - reemplaza el complejo useSessionExpiry
export const useSimpleSession = () => {
  
  // Función simple para extender sesión manualmente si es necesario
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.log('No se pudo renovar la sesión');
        return false;
      }
      
      console.log('Sesión renovada correctamente');
      return true;
    } catch (error) {
      console.error('Error al renovar sesión:', error);
      return false;
    }
  }, []);

  return {
    refreshSession,
  };
}; 