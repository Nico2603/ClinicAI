import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTemplate } from '@/types';
// Hook personalizado para manejar plantillas de usuario
const useUserTemplates = () => {
  // Esta función debe implementarse según la lógica de tu aplicación
  // Por ahora devolvemos un objeto mock
  return {
    userTemplates: [] as UserTemplate[],
    isLoading: false,
    error: null as string | null,
    hasTimeout: false,
    createUserTemplate: async (template: any) => {},
    updateUserTemplate: async (id: string, template: any) => {},
    deleteUserTemplate: async (id: string) => {},
    refetch: async () => {}
  };
};

interface SimpleTemplateEditorProps {
  onSelectTemplate: (templateId: string) => void;
  selectedTemplateId?: string;
}

export const SimpleTemplateEditor: React.FC<SimpleTemplateEditorProps> = ({
  onSelectTemplate,
  selectedTemplateId
}) => {
  const { user } = useAuth();
  const {
    userTemplates,
    isLoading,
    error,
    hasTimeout,
    createUserTemplate,
    updateUserTemplate,
    deleteUserTemplate,
    refetch
  } = useUserTemplates();

  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<UserTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Estados para manejar la carga de forma más simple
  const [isProcessing, setIsProcessing] = useState(false);

  // Función para manejar operaciones asíncronas con indicador de carga
  const handleAsyncOperation = async (operation: () => Promise<void>) => {
    setIsProcessing(true);
    try {
      await operation();
    } catch (error) {
      console.error('Error en operación:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !templateContent.trim()) {
      return;
    }

    await handleAsyncOperation(async () => {
      if (editingTemplate) {
        await updateUserTemplate(editingTemplate.id, {
          name: templateName,
          content: templateContent,
        });
      } else {
        await createUserTemplate({
          name: templateName,
          content: templateContent,
        });
      }

      setIsEditing(false);
      setEditingTemplate(null);
      setTemplateName('');
      setTemplateContent('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    });
  };

  const handleEditTemplate = (template: UserTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateContent(template.content);
    setIsEditing(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    await handleAsyncOperation(async () => {
      await deleteUserTemplate(templateId);
      setShowDeleteConfirm(null);
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateContent('');
  };

  const handleRefresh = async () => {
    await handleAsyncOperation(async () => {
      await refetch();
    });
  };

  // Mostrar indicador de carga
  if (isLoading || isProcessing) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {isProcessing ? 'Procesando...' : 'Cargando plantillas...'}
        </p>
      </div>
    );
  }

  // Resto del componente...
  return (
    <div className="space-y-4">
      {/* UI del componente */}
      <div className="text-center text-gray-500 dark:text-gray-400">
        <p>Editor de plantillas simplificado</p>
        {showSuccess && (
          <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
            ¡Plantilla guardada exitosamente!
          </div>
        )}
      </div>
    </div>
  );
}; 