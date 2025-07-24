import React, { useCallback } from 'react';
import { UserTemplate } from '../../types';
import { XMarkIcon, StarIcon, ClockIcon, CheckIcon, DocumentTextIcon } from '../ui/Icons';

interface TemplateConfirmationModalProps {
  isOpen: boolean;
  template: UserTemplate | null;
  onClose: () => void;
  onConfirm: (template: UserTemplate) => void;
  isFavorite?: boolean;
  isRecent?: boolean;
  accessCount?: number;
}

export const TemplateConfirmationModal: React.FC<TemplateConfirmationModalProps> = ({
  isOpen,
  template,
  onClose,
  onConfirm,
  isFavorite = false,
  isRecent = false,
  accessCount = 0
}) => {
  const handleConfirm = useCallback(() => {
    if (template) {
      onConfirm(template);
      onClose();
    }
  }, [template, onConfirm, onClose]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPreviewText = (content: string, maxLength: number = 200): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
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
        <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  ¿Trabajar con esta plantilla?
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Confirma la selección para continuar
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-6">
            {/* Información de la plantilla */}
            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 text-lg">
                    {template.name}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Creada el {formatDate(template.created_at)}
                  </p>
                </div>
                
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

              {/* Estadísticas */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">Caracteres:</span>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {template.content.length.toLocaleString()}
                  </p>
                </div>
                
                {accessCount > 0 && (
                  <div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Veces usada:</span>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {accessCount}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview del contenido */}
            <div>
              <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                Vista previa del contenido:
              </h4>
              <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {getPreviewText(template.content)}
                </p>
                {template.content.length > 200 && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 italic">
                    Mostrando los primeros 200 caracteres...
                  </p>
                )}
              </div>
            </div>

            {/* Mensaje de acción */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full mt-0.5">
                  <svg className="h-3 w-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Al confirmar, podrás generar notas médicas con esta plantilla
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Esta plantilla se marcará como reciente y estará disponible para uso inmediato.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer con acciones */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              <CheckIcon className="h-4 w-4" />
              Sí, trabajar con esta plantilla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 