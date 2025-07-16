import { useState, useCallback } from 'react';

// Hook simple para manejo de loading - reemplaza el complejo useLoadingDetector
export const useSimpleLoading = () => {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    startLoading,
    stopLoading,
  };
}; 