import React, { useState, useCallback, memo, useMemo } from 'react';
import { useSimpleUserTemplates, useSimpleNotes } from '../../hooks/useSimpleDatabase';
import { useFavoriteTemplates } from '../../hooks/useFavoriteTemplates';
import { useRecentTemplates } from '../../hooks/useRecentTemplates';
import { useHistoryManager } from '../../hooks/useHistoryManager';
import { useAuth } from '../../contexts/AuthContext';
import { UserTemplate } from '../../types';
import { SaveIcon, TrashIcon, PencilIcon, PlusIcon, CheckIcon, XMarkIcon, LoadingSpinner, StarIcon, ClockIcon, DocumentTextIcon } from '../ui/Icons';
import { TextareaWithSpeech } from '@/components';
import { TemplateSearchFilter, FilterOptions } from './TemplateSearchFilter';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { TemplateConfirmationModal } from './TemplateConfirmationModal';
import { templateCacheService } from '@/lib/services/templateCacheService';

interface CustomTemplateManagerProps {
  onSelectTemplate: (template: UserTemplate) => void;
  selectedTemplateId?: string;
}

// Componente de plantilla individual con todas las nuevas funcionalidades
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
  isFavorite: boolean;
  onToggleFavorite: (template: UserTemplate) => void;
  onShowPreview: (template: UserTemplate) => void;
  accessCount?: number;
  isRecent?: boolean;
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
  onEditContentChange,
  isFavorite,
  onToggleFavorite,
  onShowPreview,
  accessCount = 0,
  isRecent = false
}) => {
  const handleSelect = useCallback(() => {
    onSelect(template);
  }, [onSelect, template]);

  const handleStartEdit = useCallback(() => {
    onStartEdit(template);
  }, [onStartEdit, template]);

  const handleShowPreview = useCallback(() => {
    onShowPreview(template);
  }, [onShowPreview, template]);

  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite(template);
  }, [onToggleFavorite, template]);

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
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Guardar
            </button>
            <button
              onClick={onCancelEdit}
              className="inline-flex items-center px-3 py-2 border border-neutral-300 dark:border-neutral-600 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600"
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
    <div className={`border rounded-lg p-4 transition-all ${
      isSelected 
        ? 'border-primary bg-primary/5 dark:bg-primary/10' 
        : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-500'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {template.name}
            </h3>
            
            {/* Badges */}
            <div className="flex items-center gap-1">
              {isFavorite && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                  <StarIcon className="h-2.5 w-2.5" />
                </span>
              )}
              
              {isRecent && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                  <ClockIcon className="h-2.5 w-2.5" />
                </span>
              )}
              
              {accessCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded">
                  {accessCount}x
                </span>
              )}
            </div>
          </div>
          
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            Creada el {new Date(template.created_at).toLocaleDateString('es-CO')} • {template.content.length} caracteres
          </p>
          
          <div className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 font-mono bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded">
            {template.content.substring(0, 100)}...
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-1">
          {/* Botón de favorito - NUEVO */}
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded transition-colors ${
              isFavorite 
                ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50' 
                : 'text-neutral-400 hover:text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
            }`}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <StarIcon className="h-4 w-4" />
          </button>
          
          {/* Botón de preview - NUEVO */}
          <button
            onClick={handleShowPreview}
            className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Ver preview completo"
          >
            <DocumentTextIcon className="h-4 w-4" />
          </button>
          
          {/* Botón de editar */}
          <button
            onClick={handleStartEdit}
            className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Editar plantilla"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          
          {/* Botón de eliminar */}
          <button
            onClick={onDelete}
            className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            title="Eliminar plantilla"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
          
          {/* Botón de seleccionar - MEJORADO */}
          <button
            onClick={handleSelect}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isSelected
                ? 'bg-primary text-white'
                : 'text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20'
            }`}
          >
            {isSelected ? 'Seleccionada' : 'Seleccionar'}
          </button>
        </div>
      </div>
    </div>
  );
});

// Formulario de creación de plantilla
const CreateTemplateForm: React.FC<{
  newTemplateName: string;
  setNewTemplateName: (name: string) => void;
  newTemplateContent: string;
  setNewTemplateContent: (content: string) => void;
  onCreateTemplate: () => void;
  isProcessing: boolean;
  setIsCreating: (creating: boolean) => void;
}> = ({
  newTemplateName,
  setNewTemplateName,
  newTemplateContent,
  setNewTemplateContent,
  onCreateTemplate,
  isProcessing,
  setIsCreating
}) => (
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
          onClick={onCreateTemplate}
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
          onClick={() => {
            setNewTemplateName('');
            setNewTemplateContent('');
            setIsCreating(false);
          }}
          disabled={isProcessing}
          className="inline-flex items-center px-3 py-2 border border-neutral-300 dark:border-neutral-600 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
        >
          <XMarkIcon className="h-4 w-4 mr-1" />
          Cancelar
        </button>
      </div>
    </div>
  </div>
);

// Componentes auxiliares
const LoadingState = () => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner className="h-8 w-8" />
    <span className="ml-2 text-neutral-600 dark:text-neutral-400">Cargando plantillas...</span>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-8">
    <DocumentTextIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
      No hay plantillas creadas
    </h3>
    <p className="text-neutral-500 dark:text-neutral-400">
      Crea tu primera plantilla para comenzar a generar notas médicas personalizadas.
    </p>
  </div>
);

const DeleteConfirmDialog: React.FC<{
  templateId: string;
  onConfirm: (templateId: string) => void;
  onCancel: () => void;
}> = ({ templateId, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex min-h-screen items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      />
      
      <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                ¿Eliminar plantilla?
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>
          
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            La plantilla será eliminada permanentemente y no podrás recuperarla.
          </p>
          
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-600"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(templateId)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

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

  // Hook de favoritos
  const {
    favoriteIds,
    favoriteCount,
    isLoading: favoritesLoading,
    toggleFavorite,
    isFavorite,
    getFavoriteTemplatesWithInfo
  } = useFavoriteTemplates();

  // Hook de recientes
  const {
    recentTemplates,
    recentCount,
    recordTemplateAccess,
    isRecent,
    getAccessCount,
    getLastAccessed
  } = useRecentTemplates(userTemplates);

  // Hook de historial
  const { historicNotes } = useHistoryManager(user?.id || null);

  // Hook de notas creadas (para obtener más datos de pacientes)
  const { notes: userNotes } = useSimpleNotes();

  // Combinar datos de historial y notas para filtro más completo
  const combinedNotesData = useMemo(() => {
    const allNotes = [...historicNotes];
    
    // Agregar notas creadas como datos adicionales de búsqueda
    userNotes.forEach(note => {
      if (note.patient_name || note.content) {
        allNotes.push({
          id: note.id,
          type: 'template' as const,
          timestamp: note.created_at,
          originalInput: note.patient_name || '',
          original_input: note.patient_name || '',
          content: note.content,
          specialty_id: note.user_template_id || '',
          specialtyName: '',
          specialty_name: '',
          title: note.title,
          created_at: note.created_at,
          updated_at: note.updated_at,
          metadata: {
            patient_name: note.patient_name,
            diagnosis: note.diagnosis,
            treatment: note.treatment
          }
        });
      }
    });
    
    return allNotes;
  }, [historicNotes, userNotes]);

  // Estados del componente
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

  // Estados de filtros
  const [filteredTemplates, setFilteredTemplates] = useState<UserTemplate[]>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions | null>(null);

  // Estados de modales
  const [previewTemplate, setPreviewTemplate] = useState<UserTemplate | null>(null);
  const [confirmationTemplate, setConfirmationTemplate] = useState<UserTemplate | null>(null);

  // Actualizar plantillas filtradas cuando cambian las plantillas
  React.useEffect(() => {
    if (!currentFilters) {
      setFilteredTemplates(userTemplates);
    }
  }, [userTemplates, currentFilters]);

  // Los datos del historial ya vienen del hook useHistoryManager

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

  // Manejar cambio de filtros
  const handleFilterChange = useCallback((filtered: UserTemplate[], filters: FilterOptions) => {
    setFilteredTemplates(filtered);
    setCurrentFilters(filters);
  }, []);

  // Crear plantilla
  const handleCreateTemplate = useCallback(async () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) return;
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setLocalError(null);
      
      const newTemplate = await createUserTemplate({
        name: newTemplateName.trim(),
        content: newTemplateContent.trim(),
        is_active: true
      });

      setNewTemplateName('');
      setNewTemplateContent('');
      setIsCreating(false);
      
      // Mostrar confirmación para la nueva plantilla
      setConfirmationTemplate(newTemplate);
      
    } catch (err) {
      console.error('Error al crear plantilla:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setLocalError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [newTemplateName, newTemplateContent, isProcessing, createUserTemplate]);

  // Manejar selección de plantilla con confirmación
  const handleSelectTemplate = useCallback((template: UserTemplate) => {
    setConfirmationTemplate(template);
  }, []);

  // Confirmar selección de plantilla
  const handleConfirmSelection = useCallback((template: UserTemplate) => {
    recordTemplateAccess(template.id);
    templateCacheService.recordTemplateAccess(template.id);
    onSelectTemplate(template);
    console.log(`📊 Plantilla seleccionada: ${template.name}`);
  }, [recordTemplateAccess, onSelectTemplate]);

  // Mostrar preview
  const handleShowPreview = useCallback((template: UserTemplate) => {
    setPreviewTemplate(template);
  }, []);

  // Toggle favorito
  const handleToggleFavorite = useCallback(async (template: UserTemplate) => {
    try {
      await toggleFavorite(template);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [toggleFavorite]);

  // Otras funciones (editar, eliminar, etc.)
  const handleStartEdit = useCallback((template: UserTemplate) => {
    setEditingId(template.id);
    setEditingName(template.name);
    setEditingContent(template.content);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editingName.trim() || !editingContent.trim()) return;

    setIsProcessing(true);
    try {
      await updateUserTemplate(editingId, {
        name: editingName.trim(),
        content: editingContent.trim()
      });
      setEditingId(null);
      setEditingName('');
      setEditingContent('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar';
      setLocalError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [editingId, editingName, editingContent, updateUserTemplate]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingName('');
    setEditingContent('');
  }, []);

  const handleConfirmDelete = useCallback(async (templateId: string) => {
    setIsProcessing(true);
    try {
      await deleteUserTemplate(templateId);
      setShowDeleteConfirm(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar';
      setLocalError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [deleteUserTemplate]);

  // Memoizar plantillas organizadas
  const organizedTemplates = useMemo(() => {
    const favoriteTemplates = getFavoriteTemplatesWithInfo(filteredTemplates);
    const allTemplatesFiltered = filteredTemplates.filter(template => template.is_active);
    const otherTemplates = allTemplatesFiltered.filter(template => !isFavorite(template.id));

    return {
      favorites: favoriteTemplates,
      recents: recentTemplates.filter(item => 
        filteredTemplates.some(t => t.id === item.template.id)
      ),
      others: otherTemplates
    };
  }, [filteredTemplates, getFavoriteTemplatesWithInfo, isFavorite, recentTemplates]);

  if (!user) return null;

  if (isLoading && userTemplates.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
            Mis Plantillas Personalizadas
          </h2>
          
          {/* Indicadores */}
          <div className="flex items-center gap-2">
            {isLoadingFromCache && (
              <div className="flex items-center gap-2 px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 dark:text-green-400">Cache</span>
              </div>
            )}
            
            {favoriteCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <StarIcon className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  {favoriteCount} favorita{favoriteCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            {recentCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <ClockIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {recentCount} reciente{recentCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCacheManager(!showCacheManager)}
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-600"
          >
            {showCacheManager ? 'Ocultar' : 'Cache'}
          </button>
        </div>
      </div>

      {/* Filtros de búsqueda */}
      {userTemplates.length > 0 && (
        <TemplateSearchFilter
          templates={userTemplates}
          historicNotes={combinedNotesData}
          onFilterChange={handleFilterChange}
          favorites={favoriteIds}
          onToggleFavorite={(templateId: string) => {
            const template = userTemplates.find(t => t.id === templateId);
            if (template) handleToggleFavorite(template);
          }}
        />
      )}

      {/* Cache Manager - Temporalmente deshabilitado */}
      {showCacheManager && (
        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Sistema de cache - Funciones disponibles: invalidar cache, refrescar desde servidor.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={refreshFromServer}
              className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
            >
              Refrescar
            </button>
            <button
              onClick={invalidateCache}
              className="px-3 py-1 text-xs bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded"
            >
              Invalidar Cache
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {(localError || dbError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{localError || dbError}</span>
          </div>
          <button
            onClick={() => setLocalError(null)}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Sección de Favoritas */}
      {organizedTemplates.favorites.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <StarIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Plantillas Favoritas
            </h3>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              ({organizedTemplates.favorites.length})
            </span>
          </div>
          
          <div className="grid gap-3">
            {organizedTemplates.favorites.map((template) => (
              <TemplateItem
                key={`favorite-${template.id}`}
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
                isFavorite={true}
                onToggleFavorite={handleToggleFavorite}
                onShowPreview={handleShowPreview}
                accessCount={getAccessCount(template.id)}
                isRecent={isRecent(template.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sección de Recientes */}
      {organizedTemplates.recents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Plantillas Recientes
            </h3>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              ({organizedTemplates.recents.length})
            </span>
          </div>
          
          <div className="grid gap-3">
            {organizedTemplates.recents.map((item) => (
              <TemplateItem
                key={`recent-${item.template.id}`}
                template={item.template}
                isSelected={selectedTemplateId === item.template.id}
                isEditing={editingId === item.template.id}
                editingName={editingName}
                editingContent={editingContent}
                onSelect={handleSelectTemplate}
                onStartEdit={handleStartEdit}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onDelete={() => setShowDeleteConfirm(item.template.id)}
                onEditNameChange={setEditingName}
                onEditContentChange={setEditingContent}
                isFavorite={isFavorite(item.template.id)}
                onToggleFavorite={handleToggleFavorite}
                onShowPreview={handleShowPreview}
                accessCount={item.accessCount}
                isRecent={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Botón Crear Nueva Plantilla */}
      {!isCreating && (
        <div data-tutorial="create-template">
          <button
            onClick={() => {
              setNewTemplateName(getNextTemplateName());
              setIsCreating(true);
            }}
            disabled={isProcessing}
            className="w-full p-4 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-neutral-600 dark:text-neutral-400 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2">
              <PlusIcon className="h-5 w-5" />
              <span>Crear Nueva Plantilla</span>
            </div>
          </button>
        </div>
      )}

      {/* Formulario de Nueva Plantilla */}
      {isCreating && (
        <CreateTemplateForm
          newTemplateName={newTemplateName}
          setNewTemplateName={setNewTemplateName}
          newTemplateContent={newTemplateContent}
          setNewTemplateContent={setNewTemplateContent}
          onCreateTemplate={handleCreateTemplate}
          isProcessing={isProcessing}
          setIsCreating={setIsCreating}
        />
      )}

      {/* Sección de Todas las Plantillas */}
      {organizedTemplates.others.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Todas las Plantillas
            </h3>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              ({organizedTemplates.others.length})
            </span>
          </div>
          
          <div className="grid gap-3" data-tutorial="templates-list">
            {organizedTemplates.others.map((template) => (
              <TemplateItem
                key={`other-${template.id}`}
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
                isFavorite={isFavorite(template.id)}
                onToggleFavorite={handleToggleFavorite}
                onShowPreview={handleShowPreview}
                accessCount={getAccessCount(template.id)}
                isRecent={isRecent(template.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {userTemplates.length === 0 && !isCreating && !dbError && (
        <EmptyState />
      )}

      {/* Modales */}
      <TemplatePreviewModal
        isOpen={!!previewTemplate}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onSelectTemplate={handleConfirmSelection}
        isFavorite={previewTemplate ? isFavorite(previewTemplate.id) : false}
        isRecent={previewTemplate ? isRecent(previewTemplate.id) : false}
        accessCount={previewTemplate ? getAccessCount(previewTemplate.id) : 0}
        lastAccessed={previewTemplate ? getLastAccessed(previewTemplate.id) : undefined}
      />

      <TemplateConfirmationModal
        isOpen={!!confirmationTemplate}
        template={confirmationTemplate}
        onClose={() => setConfirmationTemplate(null)}
        onConfirm={handleConfirmSelection}
        isFavorite={confirmationTemplate ? isFavorite(confirmationTemplate.id) : false}
        isRecent={confirmationTemplate ? isRecent(confirmationTemplate.id) : false}
        accessCount={confirmationTemplate ? getAccessCount(confirmationTemplate.id) : 0}
      />

      {/* Diálogo de confirmación de eliminación */}
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          templateId={showDeleteConfirm}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
});

CustomTemplateManager.displayName = 'CustomTemplateManager';
TemplateItem.displayName = 'TemplateItem';

export default CustomTemplateManager; 