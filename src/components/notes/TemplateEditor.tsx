import React, { useState, useEffect } from 'react';
import { SaveIcon } from '../ui/Icons';

interface TemplateEditorProps {
  template: string;
  onSaveTemplate: (newTemplate: string) => void;
  specialtyName: string;
  userId?: string;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSaveTemplate, specialtyName, userId }) => {
  const [editedTemplate, setEditedTemplate] = useState(template);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setEditedTemplate(template);
  }, [template]);

  const handleSave = () => {
    onSaveTemplate(editedTemplate);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  return (
    <div className="mb-4 md:mb-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h3 className="text-lg md:text-xl font-semibold text-neutral-800 dark:text-neutral-100">
          Plantilla: <span className="text-primary">{specialtyName}</span>
        </h3>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Lado izquierdo: Plantilla con datos reales
        </div>
      </div>
      <textarea
        value={editedTemplate}
        onChange={(e) => setEditedTemplate(e.target.value)}
        rows={12}
        className="w-full p-3 md:p-4 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100 transition-colors text-sm md:text-base resize-y min-h-[200px]"
        placeholder="Coloca aquí un ejemplo de historia clínica que manejes actualmente con datos reales de un paciente (será usado como plantilla para extraer el formato)..."
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