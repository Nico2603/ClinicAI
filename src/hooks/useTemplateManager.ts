import { useEffect, useCallback, useRef } from 'react';
import { UserTemplate } from '../types';
import { useSimpleUserTemplates } from './useSimpleDatabase';
import { ERROR_MESSAGES } from '../lib/constants';

export const useTemplateManager = (
  selectedTemplate: UserTemplate | null,
  onTemplateSelect: (template: UserTemplate) => void
) => {
  const { 
    userTemplates, 
    createUserTemplate, 
    updateUserTemplate, 
    deleteUserTemplate
  } = useSimpleUserTemplates();

  // Refs para controlar la selección automática
  const hasAutoSelectedRef = useRef<boolean>(false);
  const lastTemplatesLengthRef = useRef<number>(0);
  const onTemplateSelectRef = useRef(onTemplateSelect);
  
  // Mantener la referencia actualizada
  useEffect(() => {
    onTemplateSelectRef.current = onTemplateSelect;
  }, [onTemplateSelect]);

  // Seleccionar la primera plantilla cuando se cargan las plantillas
  useEffect(() => {
    // Solo auto-seleccionar si:
    // 1. Hay plantillas disponibles
    // 2. No hay plantilla seleccionada actualmente
    // 3. No se ha auto-seleccionado antes O el número de plantillas cambió
    const shouldAutoSelect = 
      userTemplates.length > 0 && 
      !selectedTemplate && 
      (!hasAutoSelectedRef.current || lastTemplatesLengthRef.current !== userTemplates.length);

    if (shouldAutoSelect) {
      const firstTemplate = userTemplates[0];
      if (firstTemplate) {
        onTemplateSelectRef.current(firstTemplate);
        hasAutoSelectedRef.current = true;
        lastTemplatesLengthRef.current = userTemplates.length;
      }
    }

    // Si no hay plantillas, resetear el flag
    if (userTemplates.length === 0) {
      hasAutoSelectedRef.current = false;
      lastTemplatesLengthRef.current = 0;
    }
  }, [userTemplates, selectedTemplate]);

  const handleSaveTemplate = useCallback(async (templateId: string, newContent: string) => {
    try {
      await updateUserTemplate(templateId, { content: newContent });
    } catch (error) {
      console.error('Error al guardar plantilla:', error);
      throw new Error(ERROR_MESSAGES.TEMPLATE_ERROR);
    }
  }, [updateUserTemplate]);

  const handleCreateTemplate = useCallback(async (templateData: Omit<UserTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTemplate = await createUserTemplate(templateData);
      onTemplateSelectRef.current(newTemplate);
      // Actualizar refs después de crear
      hasAutoSelectedRef.current = true;
      lastTemplatesLengthRef.current = lastTemplatesLengthRef.current + 1;
      return newTemplate;
    } catch (error) {
      console.error('Error al crear plantilla:', error);
      throw new Error(ERROR_MESSAGES.TEMPLATE_ERROR);
    }
  }, [createUserTemplate]);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    try {
      await deleteUserTemplate(templateId);
      // Actualizar refs después de eliminar
      lastTemplatesLengthRef.current = Math.max(0, lastTemplatesLengthRef.current - 1);
      
      // Si se eliminó la última plantilla, resetear flags
      if (lastTemplatesLengthRef.current === 0) {
        hasAutoSelectedRef.current = false;
      }
    } catch (error) {
      console.error('Error al eliminar plantilla:', error);
      throw new Error(ERROR_MESSAGES.TEMPLATE_ERROR);
    }
  }, [deleteUserTemplate]);

  const handleRenameTemplate = useCallback(async (templateId: string, newName: string) => {
    try {
      await updateUserTemplate(templateId, { name: newName });
    } catch (error) {
      console.error('Error al renombrar plantilla:', error);
      throw new Error(ERROR_MESSAGES.TEMPLATE_ERROR);
    }
  }, [updateUserTemplate]);

  return {
    userTemplates,
    handleSaveTemplate,
    handleCreateTemplate,
    handleDeleteTemplate,
    handleRenameTemplate,
  };
}; 