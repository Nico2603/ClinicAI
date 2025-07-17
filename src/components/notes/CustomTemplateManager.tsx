import React, { useState, useCallback, memo, useMemo } from 'react';
import { useSimpleUserTemplates } from '../../hooks/useSimpleDatabase';
import { useAuth } from '../../contexts/AuthContext';
import { UserTemplate } from '../../types';
import { SaveIcon, TrashIcon, PencilIcon, PlusIcon, CheckIcon, XMarkIcon, LoadingSpinner } from '../ui/Icons';

interface CustomTemplateManagerProps {
  onSelectTemplate: (template: UserTemplate) => void;
  selectedTemplateId?: string;
}

// Componente de loading simple
const LoadingState = memo(() => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
    <p className="text-sm text-neutral-600 dark:text-neutral-400">
      Cargando plantillas...
    </p>
  </div>
));

// Componente de estado vacío
const EmptyState = memo(() => (
  <div className="text-center py-8">
    <p className="text-neutral-500 dark:text-neutral-400 text-sm">
      No tienes plantillas personalizadas aún.
    </p>
    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
      Crea tu primera plantilla para comenzar.
    </p>
  </div>
));

// Diálogo de confirmación de eliminación
const DeleteConfirmDialog = memo(({ 
  templateId, 
  onConfirm, 
  onCancel 
}: { 
  templateId: string | null;
  onConfirm: (id: string) => void;
  onCancel: () => void;
}) => {
  if (!templateId) return null;
  
  return (
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
            onClick={() => onConfirm(templateId)}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Eliminar
          </button>
          <button
            onClick={onCancel}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
});

const CustomTemplateManager: React.FC<CustomTemplateManagerProps> = memo(({
  onSelectTemplate,
  selectedTemplateId
}) => {
  const { user } = useAuth();
  const { 
    userTemplates, 
    isLoading, 
    error,
    isTimedOut,
    retryFetch,
    createUserTemplate, 
    updateUserTemplate, 
    deleteUserTemplate
  } = useSimpleUserTemplates();

  // Estados simplificados
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Generar nombre de plantilla automático
  const getNextTemplateName = useCallback(() => {
    const templateNumbers = userTemplates
      .map(t => {
        const match = t.name.match(/^Plantilla (\d+)$/);
        return match && match[1] ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);

    const nextNumber = templateNumbers.length > 0 ? Math.max(...templateNumbers) + 1 : 1;
    return `Plantilla ${nextNumber}`;
  }, [userTemplates]);

  // Crear plantilla
  const handleCreateTemplate = useCallback(async () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) {
      return;
    }

    if (isProcessing) return;

    try {
      setIsProcessing(true);
      
      const newTemplate = await createUserTemplate({
        name: newTemplateName.trim(),
        content: newTemplateContent.trim(),
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
  }, [newTemplateName, newTemplateContent, isProcessing, createUserTemplate, onSelectTemplate]);

  // Iniciar edición
  const handleStartEdit = useCallback((template: UserTemplate) => {
    setEditingId(template.id);
    setEditingName(template.name);
    setEditingContent(template.content);
  }, []);

  // Guardar edición
  const handleSaveEdit = useCallback(async () => {
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
  }, [editingId, editingName, editingContent, updateUserTemplate]);

  // Cancelar edición
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingName('');
    setEditingContent('');
  }, []);

  // Eliminar plantilla
  const handleDelete = useCallback(async (templateId: string) => {
    try {
      await deleteUserTemplate(templateId);
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error al eliminar plantilla:', err);
    }
  }, [deleteUserTemplate]);

  // Cancelar creación
  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
    setNewTemplateName('');
    setNewTemplateContent('');
  }, []);

  // Iniciar creación
  const handleStartCreating = useCallback(() => {
    setNewTemplateName(getNextTemplateName());
    setIsCreating(true);
  }, [getNextTemplateName]);

  // Memoizar las plantillas filtradas para evitar re-renderizados
  const activeTemplates = useMemo(() => {
    return userTemplates.filter(template => template.is_active);
  }, [userTemplates]);

  // Memoizar el estado vacío para evitar re-renderizados
  const isEmpty = useMemo(() => {
    return activeTemplates.length === 0 && !isCreating;
  }, [activeTemplates.length, isCreating]);

  if (!user) return null;

  // Mostrar estado de carga solo si realmente no tenemos datos
  if (isLoading && userTemplates.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
            Mis Plantillas Personalizadas
          </h2>
          {isLoading && userTemplates.length > 0 && !isProcessing && (
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
              <span className="text-xs text-blue-600 dark:text-blue-400">Cargando plantillas...</span>
            </div>
          )}
        </div>
        <button
          onClick={handleStartCreating}
          disabled={isProcessing || isLoading}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </button>
      </div>

      {/* Error display */}
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
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Contenido de la plantilla
                </label>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {newTemplateContent.length} caracteres
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                💡 Escriba una nota que usted utiliza frecuentemente para estructurarla como plantilla base.
              </p>
              <textarea
                value={newTemplateContent}
                onChange={(e) => setNewTemplateContent(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100 resize-y"
                placeholder="Escriba aquí un ejemplo de nota completa con datos de paciente."
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
                    Guardando...
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
          </div>
        </div>
      )}

      {/* Lista de plantillas */}
      {isEmpty ? (
        <EmptyState />
      ) : isLoading && activeTemplates.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400 mb-2">
            {isTimedOut ? 'La carga está tomando más tiempo del esperado...' : 'Cargando tus plantillas...'}
          </p>
          <div className="space-y-3">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              💡 Si este apartado se está demorando demasiado, intenta recargar la página o usa el botón de abajo.
            </p>
            <button
              onClick={retryFetch}
              className="inline-flex items-center px-4 py-2 border border-primary text-sm font-medium rounded-md text-primary bg-white dark:bg-neutral-800 hover:bg-primary/5 dark:hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              🔄 Reintentar
            </button>
          </div>
        </div>
      ) : error && activeTemplates.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={retryFetch}
            className="inline-flex items-center px-4 py-2 border border-red-500 text-sm font-medium rounded-md text-red-600 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            🔄 Reintentar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTemplates.map((template) => (
            <TemplateItem
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              isEditing={editingId === template.id}
              editingName={editingName}
              editingContent={editingContent}
              onSelect={onSelectTemplate}
              onStartEdit={handleStartEdit}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onDelete={() => setShowDeleteConfirm(template.id)}
              onEditNameChange={setEditingName}
              onEditContentChange={setEditingContent}
            />
          ))}
        </div>
      )}

      {/* Diálogo de confirmación de eliminación */}
      <DeleteConfirmDialog
        templateId={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(null)}
      />
    </div>
  );
});

// Componente item de plantilla simplificado
interface TemplateItemProps {
  template: UserTemplate;
  isSelected: boolean;
  isEditing: boolean;
  editingName: string;
  editingContent: string;
  onSelect: (template: UserTemplate) => void;
  onStartEdit: (template: UserTemplate) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onEditNameChange: (name: string) => void;
  onEditContentChange: (content: string) => void;
}

const TemplateItem = memo<TemplateItemProps>(({
  template,
  isSelected,
  isEditing,
  editingName,
  editingContent,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onEditNameChange,
  onEditContentChange
}) => {
  const handleSelect = useCallback(() => {
    onSelect(template);
  }, [onSelect, template]);

  const handleStartEdit = useCallback(() => {
    onStartEdit(template);
  }, [onStartEdit, template]);

  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={editingName}
              onChange={(e) => onEditNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Contenido de la plantilla
              </label>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {editingContent.length} caracteres
              </span>
            </div>
            <textarea
              value={editingContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100 resize-y"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onSaveEdit}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <SaveIcon className="h-4 w-4 mr-1" />
              Guardar
            </button>
            <button
              onClick={onCancelEdit}
              className="inline-flex items-center px-3 py-2 border border-neutral-300 dark:border-neutral-600 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 transition-colors ${
      isSelected 
        ? 'border-primary bg-primary/5 dark:bg-primary/10' 
        : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSelect}
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
            onClick={handleStartEdit}
            className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
            title="Editar plantilla"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
            title="Eliminar plantilla"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {isSelected && (
        <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded border">
          <p className="text-sm text-neutral-600 dark:text-neutral-300 font-medium mb-2">
            Vista previa:
          </p>
          <pre className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
            {template.content.substring(0, 200) + (template.content.length > 200 ? '...' : '')}
          </pre>
        </div>
      )}
    </div>
  );
});

CustomTemplateManager.displayName = 'CustomTemplateManager';
LoadingState.displayName = 'LoadingState';
EmptyState.displayName = 'EmptyState';
DeleteConfirmDialog.displayName = 'DeleteConfirmDialog';
TemplateItem.displayName = 'TemplateItem';

export default CustomTemplateManager; 