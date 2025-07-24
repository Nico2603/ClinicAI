import React, { useState, useCallback } from 'react';
import { UserTemplate } from '../../types';
import { XMarkIcon, StarIcon, ClockIcon, CheckIcon } from '../ui/Icons';
import { useFavoriteTemplates } from '../../hooks/useFavoriteTemplates';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  template: UserTemplate | null;
  onClose: () => void;
  onSelectTemplate: (template: UserTemplate) => void;
  isFavorite?: boolean;
  isRecent?: boolean;
  accessCount?: number;
  lastAccessed?: string;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  template,
  onClose,
  onSelectTemplate,
  isFavorite = false,
  isRecent = false,
  accessCount = 0,
  lastAccessed
}) => {
  const { toggleFavorite } = useFavoriteTemplates();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleFavorite = useCallback(async () => {
    if (!template || isToggling) return;
    
    setIsToggling(true);
    try {
      await toggleFavorite(template);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsToggling(false);
    }
  }, [template, toggleFavorite, isToggling]);

  const handleSelectTemplate = useCallback(() => {
    if (template) {
      onSelectTemplate(template);
      onClose();
    }
  }, [template, onSelectTemplate, onClose]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {template.name}
              </h2>
              
              {/* Badges */}
              <div className="flex items-center gap-2">
                {isFavorite && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
                    <StarIcon className="h-3 w-3" />
                    Favorita
                  </span>
                )}
                
                {isRecent && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                    <ClockIcon className="h-3 w-3" />
                    Reciente
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Botón favorito */}
              <button
                onClick={handleToggleFavorite}
                disabled={isToggling}
                className={`p-2 rounded-full transition-colors ${
                  isFavorite 
                    ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50' 
                    : 'text-neutral-400 hover:text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                <StarIcon className="h-5 w-5" />
              </button>

              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Información de la plantilla */}
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">Creada:</span>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {formatDate(template.created_at)}
                </p>
              </div>
              
              {accessCount > 0 && (
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">Veces usada:</span>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {accessCount}
                  </p>
                </div>
              )}
              
              {lastAccessed && (
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">Último acceso:</span>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {formatDate(lastAccessed)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preview del contenido */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              Vista Previa del Contenido
            </h3>
            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
              <pre className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300 font-mono leading-relaxed max-h-96 overflow-y-auto">
                {template.content}
              </pre>
            </div>
          </div>

          {/* Footer con acciones */}
          <div className="flex items-center justify-between p-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {template.content.length} caracteres
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSelectTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                Seleccionar Plantilla
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 