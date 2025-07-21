'use client';

import { useEffect } from 'react';
import { setupProductionLogFiltering } from '@/lib/utils/logFilter';

export default function LogSetup() {
  useEffect(() => {
    // Configurar filtrado de logs al montar la aplicación
    setupProductionLogFiltering();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 [DEV] Sistema de filtrado de logs inicializado');
    }
  }, []);

  // Este componente no renderiza nada visible
  return null;
} 