
/**
 * ClínicAI - Asistente de IA para Notas Clínicas
 * 
 * Autor: Nicolas Ceballos Brito
 * Portfolio: https://nico2603.github.io/PersonalPage/
 * GitHub: https://github.com/Nico2603
 * LinkedIn: https://www.linkedin.com/in/nicolas-ceballos-brito/
 * 
 * Desarrollado para Teilur.ai
 */

import { useState, useEffect, useCallback } from 'react';
import { Theme } from '../types';
import { getThemePreference, setThemePreference } from '../lib/services/storageService';

export function useDarkMode(): [Theme, () => void] {
  const [theme, setThemeState] = useState<Theme>(getThemePreference());

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => (prevTheme === Theme.Light ? Theme.Dark : Theme.Light));
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === Theme.Dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setThemePreference(theme);
  }, [theme]);

  return [theme, toggleTheme];
}
