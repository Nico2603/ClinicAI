import React, { useState, useEffect } from 'react';
import { SaveIcon, StarIcon } from '../ui/Icons';
import { addUserFavoriteTemplate, removeUserFavoriteTemplate, getUserFavoriteTemplates } from '../../lib/services/storageService';

interface TemplateEditorProps {
  template: string;
  onSaveTemplate: (newTemplate: string) => void;
  specialtyName: string;
  userId?: string;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSaveTemplate, specialtyName, userId }) => {
  const [editedTemplate, setEditedTemplate] = useState(template);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setEditedTemplate(template);
  }, [template]);

  useEffect(() => {
    if (!userId) return;
    const favs = getUserFavoriteTemplates(userId);
    setIsFavorite(favs.some(f => f.content === template));
  }, [userId, template]);

  const handleSave = () => {
    onSaveTemplate(editedTemplate);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const handleToggleFavorite = () => {
    if (!userId) return;
    if (isFavorite) {
      // Remove favorite
      const favs = getUserFavoriteTemplates(userId);
      const favToRemove = favs.find(f => f.content === template);
      if (favToRemove) {
        removeUserFavoriteTemplate(userId, favToRemove.id);
      }
      setIsFavorite(false);
    } else {
      addUserFavoriteTemplate(userId, {
        name: `${specialtyName} ${new Date().toLocaleDateString()}`,
        content: template,
        specialty_id: undefined,
      });
      setIsFavorite(true);
    }
  };

  return (
    <div className="mb-4 md:mb-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h3 className="text-lg md:text-xl font-semibold text-neutral-800 dark:text-neutral-100">
          Plantilla para <span className="text-primary">{specialtyName}</span>
        </h3>
        {userId && (
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-lg ${isFavorite ? 'text-yellow-400' : 'text-neutral-500 dark:text-neutral-400 hover:text-yellow-500'} hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors`}
            title={isFavorite ? 'Quitar de favoritos' : 'Guardar como favorita'}
          >
            <StarIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      <textarea
        value={editedTemplate}
        onChange={(e) => setEditedTemplate(e.target.value)}
        rows={12}
        className="w-full p-3 md:p-4 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100 transition-colors text-sm md:text-base resize-y min-h-[200px]"
        placeholder="Define la estructura de tu nota aquí..."
        aria-label={`Editor de plantilla para ${specialtyName}`}
      />
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={handleSave}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 md:px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-neutral-800 transition-colors"
          aria-live="polite"
        >
          <SaveIcon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          Guardar Plantilla
        </button>
        {showSuccess && (
          <p className="text-green-600 dark:text-green-400 text-sm font-medium">¡Plantilla guardada!</p>
        )}
      </div>
    </div>
  );
};

export default TemplateEditor;