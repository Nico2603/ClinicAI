import React, { useState, useEffect } from 'react';
import { SaveIcon, PlusIcon, TrashIcon, EditIcon } from '../ui/Icons';
import { LoadingFallback } from '../ui/LoadingFallback';
import { UserTemplate } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useUserTemplates } from '@/hooks/useDatabase';
import { useLoadingDetector } from '@/hooks/useLoadingDetector';

interface SimpleTemplateEditorProps {
  onSelectTemplate: (template: UserTemplate) => void;
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

  // Detector de carga excesiva
  const { startLoadingTracking, stopLoadingTracking, forceEmergencyReload } = useLoadingDetector({
    maxLoadingTime: 12000, // 12 segundos antes de mostrar advertencia
    onExcessiveLoading: () => {
      console.warn('Carga excesiva detectada en Editor de Plantillas');
    },
    onForceReload: () => {
      window.location.reload();
    }
  });

  // Controlar el detector de carga basado en el estado
  useEffect(() => {
    if (isLoading) {
      startLoadingTracking();
    } else {
      stopLoadingTracking();
    }
  }, [isLoading, startLoadingTracking, stopLoadingTracking]);

  // Función de retry inteligente
  const handleRetry = () => {
    if (hasTimeout) {
      // Si hubo timeout, ofrecer recarga de emergencia
      forceEmergencyReload();
    } else {
      // Retry normal
      refetch();
    }
  };

  if (!user) return null;

  const handleCreateNew = () => {
    const nextNumber = getNextTemplateNumber();
    setTemplateName(`Nueva Plantilla ${nextNumber}`);
    setTemplateContent('');
    setEditingTemplate(null);
    setIsEditing(true);
  };

  const handleEdit = (template: UserTemplate) => {
    setTemplateName(template.name);
    setTemplateContent(template.content);
    setEditingTemplate(template);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!templateName.trim() || !templateContent.trim()) return;

    try {
      if (editingTemplate) {
        // Actualizar plantilla existente
        const updatedTemplate = await updateUserTemplate(editingTemplate.id, {
          name: templateName,
          content: templateContent
        });
        if (updatedTemplate) {
          onSelectTemplate(updatedTemplate);
        }
      } else {
        // Crear nueva plantilla
        const newTemplate = await createUserTemplate({
          name: templateName,
          content: templateContent,
          user_id: user.id,
          is_active: true
        });
        if (newTemplate) {
          onSelectTemplate(newTemplate);
        }
      }

      setIsEditing(false);
      setTemplateContent('');
      setTemplateName('');
      setEditingTemplate(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (error) {
      console.error('Error al guardar plantilla:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTemplateContent('');
    setTemplateName('');
    setEditingTemplate(null);
  };

  const handleDelete = async (templateId: string) => {
    try {
      await deleteUserTemplate(templateId);
      setShowDeleteConfirm(null);
      
      // Si se eliminó la plantilla seleccionada, limpiar selección
      if (selectedTemplateId === templateId) {
        // Seleccionar otra plantilla si existe
        const remainingTemplates = userTemplates.filter(t => t.id !== templateId);
        if (remainingTemplates.length > 0 && remainingTemplates[0]) {
          onSelectTemplate(remainingTemplates[0]);
        }
      }
    } catch (error) {
      console.error('Error al eliminar plantilla:', error);
    }
  };

  const getNextTemplateNumber = () => {
    const numbers = userTemplates
      .map((t: UserTemplate) => {
        const match = t.name.match(/Nueva Plantilla (\d+)/);
        return match?.[1] ? parseInt(match[1]) : 0;
      })
      .filter((n: number) => n > 0);
    
    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  };

  // Mostrar LoadingFallback si hay carga, error o no hay plantillas
  if (isLoading || error || userTemplates.length === 0) {
    return (
      <LoadingFallback
        isLoading={isLoading}
        error={error}
        hasTimeout={hasTimeout}
        onRetry={handleRetry}
        loadingMessage="Cargando plantillas..."
        emptyMessage="No tienes plantillas creadas aún. Crea tu primera plantilla para comenzar."
        className="min-h-[200px]"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
          Editor de Plantillas
        </h2>
        <button
          onClick={handleCreateNew}
          disabled={isEditing}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </button>
      </div>

      {/* Lista de plantillas existentes */}
      {!isEditing && userTemplates.length > 0 && (
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            Plantillas Existentes
          </h3>
          <div className="space-y-2">
            {userTemplates.map((template) => (
              <div
                key={template.id}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedTemplateId === template.id
                    ? 'border-primary bg-primary/10 dark:bg-primary/20'
                    : 'border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-800 dark:text-neutral-100">
                      {template.name}
                    </h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      {template.content.substring(0, 80)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => onSelectTemplate(template)}
                      className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/90 transition-colors"
                    >
                      Usar
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-1 text-neutral-500 hover:text-primary transition-colors"
                      title="Editar"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(template.id)}
                      className="p-1 text-neutral-500 hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor de plantilla */}
      {isEditing && (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg p-6">
          <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-100 mb-4">
            {editingTemplate ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
          </h3>
          
          {/* Nombre de la plantilla */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Nombre de la Plantilla
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100"
              placeholder="Ej: Consulta Cardiología, Historia Clínica Pediatría..."
            />
          </div>

          {/* Contenido de la plantilla */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Contenido de la Plantilla
            </label>
            <textarea
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              rows={15}
              className="w-full p-4 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100 resize-y"
              placeholder="Crea o pega tu plantilla"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              onClick={handleCancel}
              className="w-full sm:w-auto px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!templateName.trim() || !templateContent.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              {editingTemplate ? 'Actualizar Plantilla' : 'Guardar Plantilla'}
            </button>
          </div>

          {/* Mensaje de éxito */}
          {showSuccess && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <p className="text-green-700 dark:text-green-200 text-sm">
                ¡Plantilla {editingTemplate ? 'actualizada' : 'creada'} correctamente!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-100 mb-4">
              ¿Confirmar eliminación?
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar esta plantilla?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 