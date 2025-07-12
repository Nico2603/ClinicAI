import { useEffect, useCallback } from 'react';
import { UserTemplate } from '../types';
import { useUserTemplates } from './useDatabase';
import { ERROR_MESSAGES } from '../lib/constants';

export const useTemplateManager = (
  selectedTemplate: UserTemplate | null,
  onTemplateSelect: (template: UserTemplate) => void
) => {
  const { 
    userTemplates, 
    createUserTemplate, 
    updateUserTemplate, 
    deleteUserTemplate, 
    renameUserTemplate 
  } = useUserTemplates();

  // Seleccionar la primera plantilla cuando se cargan las plantillas
  useEffect(() => {
    if (userTemplates.length > 0 && !selectedTemplate) {
      const firstTemplate = userTemplates[0];
      if (firstTemplate) {
        onTemplateSelect(firstTemplate);
      }
    }
  }, [userTemplates, selectedTemplate, onTemplateSelect]);

  const handleSaveTemplate = useCallback(async (templateId: string, newContent: string) => {
    try {
      await updateUserTemplate(templateId, { content: newContent });
    } catch (error) {
      console.error('Error al guardar plantilla:', error);
      throw new Error(ERROR_MESSAGES.TEMPLATE_SAVE_ERROR);
    }
  }, [updateUserTemplate]);

  const handleCreateTemplate = useCallback(async (templateData: Omit<UserTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTemplate = await createUserTemplate(templateData);
      onTemplateSelect(newTemplate);
      return newTemplate;
    } catch (error) {
      console.error('Error al crear plantilla:', error);
      throw new Error(ERROR_MESSAGES.TEMPLATE_CREATE_ERROR);
    }
  }, [createUserTemplate, onTemplateSelect]);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    try {
      await deleteUserTemplate(templateId);
      // Si la plantilla eliminada era la seleccionada, seleccionar la primera disponible
      if (selectedTemplate?.id === templateId && userTemplates.length > 1) {
        const remainingTemplates = userTemplates.filter(t => t.id !== templateId);
        if (remainingTemplates.length > 0 && remainingTemplates[0]) {
          onTemplateSelect(remainingTemplates[0]);
        }
      }
    } catch (error) {
      console.error('Error al eliminar plantilla:', error);
      throw new Error(ERROR_MESSAGES.TEMPLATE_DELETE_ERROR);
    }
  }, [deleteUserTemplate, selectedTemplate, userTemplates, onTemplateSelect]);

  const handleRenameTemplate = useCallback(async (templateId: string, newName: string) => {
    try {
      const updatedTemplate = await renameUserTemplate(templateId, newName);
      // Actualizar la plantilla seleccionada si es la misma
      if (selectedTemplate?.id === templateId) {
        onTemplateSelect(updatedTemplate);
      }
      return updatedTemplate;
    } catch (error) {
      console.error('Error al renombrar plantilla:', error);
      throw new Error(ERROR_MESSAGES.TEMPLATE_RENAME_ERROR);
    }
  }, [renameUserTemplate, selectedTemplate, onTemplateSelect]);

  return {
    userTemplates,
    handleSaveTemplate,
    handleCreateTemplate,
    handleDeleteTemplate,
    handleRenameTemplate,
  };
}; 