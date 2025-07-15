import React, { useState } from 'react';
import { useUserTemplates } from '../../hooks/useDatabase';
import { useAuth } from '../../contexts/AuthContext';
import { UserTemplate } from '../../types';
import { SaveIcon, TrashIcon, PencilIcon, PlusIcon, CheckIcon, XMarkIcon, LoadingSpinner } from '../ui/Icons';
import { extractTemplateFormat } from '../../lib/services/openaiService';

interface CustomTemplateManagerProps {
  onSelectTemplate: (template: UserTemplate) => void;
  selectedTemplateId?: string;
}

const CustomTemplateManager: React.FC<CustomTemplateManagerProps> = ({
  onSelectTemplate,
  selectedTemplateId
}) => {
  const { user } = useAuth();
  const { 
    userTemplates, 
    isLoading, 
    error, 
    createUserTemplate, 
    updateUserTemplate, 
    deleteUserTemplate, 
    renameUserTemplate 
  } = useUserTemplates();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  if (!user) return null;

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) return;

    try {
      setIsProcessing(true);

      // Procesar el contenido para extraer solo la estructura/formato
      const cleanFormat = await extractTemplateFormat(newTemplateContent);

      // Crear la plantilla con el formato limpio
      const newTemplate = await createUserTemplate({
        name: newTemplateName,
        content: cleanFormat,
        user_id: user.id,
        is_active: true
      });

      setNewTemplateName('');
      setNewTemplateContent('');
      setIsCreating(false);
      onSelectTemplate(newTemplate);
    } catch (err) {
      console.error('Error al crear plantilla:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartEdit = (template: UserTemplate) => {
    setEditingId(template.id);
    setEditingName(template.name);
    setEditingContent(template.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      await updateUserTemplate(editingId, {
        name: editingName,
        content: editingContent
      });
      setEditingId(null);
      setEditingName('');
      setEditingContent('');
    } catch (err) {
      console.error('Error al actualizar plantilla:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingContent('');
  };

  const handleDelete = async (templateId: string) => {
    try {
      await deleteUserTemplate(templateId);
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error al eliminar plantilla:', err);
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewTemplateName('');
    setNewTemplateContent('');
  };

  const getNextTemplateName = () => {
    const templateNumbers = userTemplates
      .map(t => {
        const match = t.name.match(/^Plantilla (\d+)$/);
        return match && match[1] ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);

    const nextNumber = templateNumbers.length > 0 ? Math.max(...templateNumbers) + 1 : 1;
    return `Plantilla ${nextNumber}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
          Mis Plantillas Personalizadas
        </h2>
        <button
          onClick={() => {
            setNewTemplateName(getNextTemplateName());
            setIsCreating(true);
          }}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Crear nueva plantilla */}
      {isCreating && (
        <div className="p-4 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-800">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Nombre de la plantilla
              </label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100"
                placeholder="Ingrese el nombre de la plantilla"
                autoFocus
                disabled={isProcessing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Ejemplo de contenido (con datos de paciente)
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                💡 Ingrese un ejemplo completo con datos de un paciente. El sistema extraerá automáticamente solo la estructura para crear una plantilla reutilizable.
              </p>
              <textarea
                value={newTemplateContent}
                onChange={(e) => setNewTemplateContent(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100 resize-y"
                placeholder="Escriba aquí un ejemplo de nota completa con datos de paciente. Por ejemplo:

CONSULTA MEDICINA INTERNA

Paciente: Juan Pérez
Edad: 45 años
Documento: 12345678

MOTIVO DE CONSULTA:
Dolor abdominal desde hace 3 días...

El sistema extraerá automáticamente la estructura y creará marcadores genéricos."
                disabled={isProcessing}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateTemplate}
                disabled={!newTemplateName.trim() || !newTemplateContent.trim() || isProcessing}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-neutral-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2 text-white" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Guardar Plantilla
                  </>
                )}
              </button>
              <button
                onClick={handleCancelCreate}
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-2 border border-neutral-300 dark:border-neutral-600 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Cancelar
              </button>
            </div>
            {isProcessing && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  ⚡ Procesando contenido para extraer la estructura de plantilla...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de plantillas */}
      {userTemplates.length === 0 && !isCreating ? (
        <div className="text-center py-8">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            No tienes plantillas personalizadas aún.
          </p>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Crea tu primera plantilla para comenzar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {userTemplates.map((template) => (
            <div key={template.id} className={`border rounded-lg p-4 transition-colors ${
              selectedTemplateId === template.id 
                ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
            }`}>
              {editingId === template.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Contenido de la plantilla
                    </label>
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100 resize-y"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                      <SaveIcon className="h-4 w-4 mr-1" />
                      Guardar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="inline-flex items-center px-3 py-2 border border-neutral-300 dark:border-neutral-600 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => onSelectTemplate(template)}
                        className="text-left flex-1"
                      >
                        <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-100 hover:text-primary transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Creada el {new Date(template.created_at).toLocaleDateString()}
                        </p>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStartEdit(template)}
                        className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                        title="Editar plantilla"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(template.id)}
                        className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                        title="Eliminar plantilla"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {selectedTemplateId === template.id && (
                    <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded border">
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 font-medium mb-2">
                        Vista previa:
                      </p>
                      <pre className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                        {template.content.substring(0, 200)}
                        {template.content.length > 200 ? '...' : ''}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              ¿Eliminar plantilla?
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Esta acción no se puede deshacer. La plantilla será eliminada permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Eliminar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTemplateManager; 