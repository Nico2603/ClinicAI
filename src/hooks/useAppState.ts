import { useState, useCallback } from 'react';
import { ActiveView, UserTemplate } from '../types';
import { VIEW_TITLES } from '../lib/constants';

export const useAppState = () => {
  const [activeView, setActiveView] = useState<ActiveView>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<UserTemplate | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Callback memoizado para cambiar vista y evitar re-renders innecesarios
  const handleSetActiveView = useCallback((view: ActiveView) => {
    if (view !== activeView) {
      setActiveView(view);
    }
  }, [activeView]);

  const handleSelectTemplate = useCallback((template: UserTemplate) => {
    setSelectedTemplate(template);
    setGlobalError(null);
  }, []);

  const clearGlobalError = useCallback(() => {
    setGlobalError(null);
  }, []);

  const showError = useCallback((error: string) => {
    setGlobalError(error);
  }, []);

  const getViewTitle = useCallback((view: ActiveView): string => {
    return VIEW_TITLES[view] || 'ClinicAI';
  }, []);

  return {
    activeView,
    setActiveView: handleSetActiveView,
    selectedTemplate,
    setSelectedTemplate,
    globalError,
    handleSelectTemplate,
    clearGlobalError,
    showError,
    getViewTitle,
  };
}; 