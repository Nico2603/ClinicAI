import React, { useState, useCallback, memo, useMemo } from 'react';
import { useSimpleUserTemplates } from '../../hooks/useSimpleDatabase';
import { useAuth } from '../../contexts/AuthContext';
import { UserTemplate } from '../../types';
import { SaveIcon, TrashIcon, PencilIcon, PlusIcon, CheckIcon, XMarkIcon, LoadingSpinner } from '../ui/Icons';
import { TextareaWithSpeech } from '@/components';
import TemplateCacheManager from './TemplateCacheManager';
import { templateCacheService } from '@/lib/services/templateCacheService';

interface CustomTemplateManagerProps {
  onSelectTemplate: (template: UserTemplate) => void;
  selectedTemplateId?: string;
}

// Componente de loading simple
const LoadingState = memo(() => (
  <div className="flex flex-col items-center justify-center p-6 sm:p-8">
    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mb-2 sm:mb-3"></div>
    <p className="mobile-text text-neutral-600 dark:text-neutral-400">
      Cargando plantillas...
    </p>
  </div>
));

// Componente de estado vacío
const EmptyState = memo(() => (
  <div className="text-center py-6 sm:py-8">
    <p className="mobile-text text-neutral-500 dark:text-neutral-400">
      No tienes plantillas personalizadas aún.
    </p>
    <p className="mobile-text text-neutral-500 dark:text-neutral-400 mt-1">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="mobile-card max-w-md w-full">
        <h3 className="mobile-heading text-neutral-900 dark:text-neutral-100 mb-4">
          ¿Eliminar plantilla?
        </h3>
        <p className="mobile-text text-neutral-600 dark:text-neutral-400 mb-6">
          Esta acción no se puede deshacer. La plantilla será eliminada permanentemente.
        </p>
        <div className="mobile-grid">
          <button
            onClick={() => onConfirm(templateId)}
            className="mobile-button bg-red-600 text-white hover:bg-red-700"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Eliminar
          </button>
          <button
            onClick={onCancel}
            className="mobile-button border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600"
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
    isLoadingFromCache,
    error: dbError,
    retryFetch,
    refreshFromServer,
    invalidateCache,
    getMostUsedTemplates,
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
  const [localError, setLocalError] = useState<string | null>(null);
  const [showCacheManager, setShowCacheManager] = useState(false);

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

  // Crear plantilla mejorado
  const handleCreateTemplate = useCallback(async () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) {
      return;
    }

    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setLocalError(null); // Limpiar errores previos
      
      console.log('🔄 Iniciando creación de plantilla desde UI...');
      
      const newTemplate = await createUserTemplate({
        name: newTemplateName.trim(),
        content: newTemplateContent.trim(),
        is_active: true
      });

      // Limpiar formulario solo si fue exitoso
      setNewTemplateName('');
      setNewTemplateContent('');
      setIsCreating(false);
      onSelectTemplate(newTemplate);
      
      console.log('✅ Plantilla creada y seleccionada exitosamente');
      
    } catch (err) {
      console.error('❌ Error al crear plantilla desde UI:', err);
      
      // No limpiar el formulario en caso de error para que el usuario pueda reintentar
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al crear plantilla';
      setLocalError(errorMessage);
      
      // Scroll al error para que sea visible
      setTimeout(() => {
        const errorElement = document.querySelector('[data-error-display]');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      
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

  // Guardar edición mejorado
  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return;

    if (!editingName.trim()) {
      setLocalError('El nombre de la plantilla no puede estar vacío');
      return;
    }

    if (!editingContent.trim()) {
      setLocalError('El contenido de la plantilla no puede estar vacío');
      return;
    }

    try {
      setLocalError(null);
      
      await updateUserTemplate(editingId, {
        name: editingName.trim(),
        content: editingContent.trim()
      });
      
      setEditingId(null);
      setEditingName('');
      setEditingContent('');
      
      console.log('✅ Plantilla actualizada exitosamente');
      
    } catch (err) {
      console.error('❌ Error al actualizar plantilla desde UI:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar plantilla';
      setLocalError(errorMessage);
    }
  }, [editingId, editingName, editingContent, updateUserTemplate]);

  // Cancelar edición
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingName('');
    setEditingContent('');
  }, []);

  // Eliminar plantilla mejorado
  const handleDelete = useCallback(async (templateId: string) => {
    try {
      setLocalError(null);
      
      await deleteUserTemplate(templateId);
      setShowDeleteConfirm(null);
      
      console.log('✅ Plantilla eliminada exitosamente');
      
    } catch (err) {
      console.error('❌ Error al eliminar plantilla desde UI:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar plantilla';
      setLocalError(errorMessage);
      setShowDeleteConfirm(null); // Cerrar el diálogo incluso si hay error
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

  // Función para manejar selección de plantilla con registro de acceso
  const handleSelectTemplate = useCallback((template: UserTemplate) => {
    // Registrar el acceso en el cache
    templateCacheService.recordTemplateAccess(template.id);
    
    // Llamar al callback original
    onSelectTemplate(template);
    
    console.log(`📊 Plantilla seleccionada: ${template.name}`);
  }, [onSelectTemplate]);

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
      {/* Header con Cache Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
            Mis Plantillas Personalizadas
          </h2>
          {/* Indicador de Cache */}
          {isLoadingFromCache && (
            <div className="flex items-center gap-2 px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400">Cache</span>
            </div>
          )}
          {isLoading && userTemplates.length > 0 && !isProcessing && (
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
              <span className="text-xs text-blue-600 dark:text-blue-400">Sincronizando...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Botón de gestión de cache */}
          <button
            onClick={() => setShowCacheManager(true)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
            title="Gestionar Cache"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            Cache
          </button>
          
          {/* Botón de refresh desde servidor */}
          <button
            onClick={refreshFromServer}
            disabled={isLoading}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50 transition-colors"
            title="Refrescar desde servidor"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync
          </button>

          <button
            onClick={handleStartCreating}
            disabled={isProcessing || isLoading}
            data-tutorial="create-template"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nueva Plantilla
          </button>
        </div>
      </div>

      {/* Plantillas Más Usadas (solo si hay cache) */}
      {(() => {
        const mostUsed = getMostUsedTemplates(3);
        return mostUsed.length > 0 ? (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Plantillas Más Utilizadas
            </h3>
            <div className="flex flex-wrap gap-2">
              {mostUsed.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* Error display mejorado */}
      {(localError || dbError) && (
        <div 
          data-error-display
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600 dark:text-red-400">{localError || dbError}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setLocalError(null)}
                  className="text-xs text-red-500 hover:text-red-600 underline"
                >
                  Cerrar
                </button>
                {dbError && (
                  <button
                    onClick={invalidateCache}
                    className="text-xs text-red-500 hover:text-red-600 underline"
                  >
                    Limpiar Cache y Reintentar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator mejorado */}
      {isLoading && userTemplates.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Cargando tus plantillas...
            </span>
          </div>
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
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                💡 Escriba una nota que usted utiliza frecuentemente para estructurarla como plantilla base.
              </p>
              <TextareaWithSpeech
                value={newTemplateContent}
                onChange={(e) => setNewTemplateContent(e.target.value)}
                rows={12}
                placeholder="Escriba aquí un ejemplo de nota completa con datos de paciente."
                disabled={isProcessing}
                label="Contenido de la plantilla"
                showCharacterCount={true}
                speechLanguage="es-ES"
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
            Cargando tus plantillas...
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
      ) : dbError && activeTemplates.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{dbError}</p>
          <button
            onClick={retryFetch}
            className="inline-flex items-center px-4 py-2 border border-red-500 text-sm font-medium rounded-md text-red-600 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            🔄 Reintentar
          </button>
        </div>
      ) : (
        <div className="space-y-3" data-tutorial="templates-list">
          {activeTemplates.map((template) => (
            <TemplateItem
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              isEditing={editingId === template.id}
              editingName={editingName}
              editingContent={editingContent}
              onSelect={handleSelectTemplate}
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

      {/* Cache Manager Modal */}
      <TemplateCacheManager 
        isOpen={showCacheManager}
        onClose={() => setShowCacheManager(false)}
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
            <TextareaWithSpeech
              value={editingContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              rows={12}
              label="Contenido de la plantilla"
              showCharacterCount={true}
              speechLanguage="es-ES"
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