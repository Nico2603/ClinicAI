
import React, { useState, useEffect } from 'react';
import { SaveIcon } from '../ui/Icons';

interface TemplateEditorProps {
  template: string;
  onSaveTemplate: (newTemplate: string) => void;
  specialtyName: string;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSaveTemplate, specialtyName }) => {
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
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
        Plantilla para <span className="text-primary dark:text-dark-primary">{specialtyName}</span>
      </h3>
      <textarea
        value={editedTemplate}
        onChange={(e) => setEditedTemplate(e.target.value)}
        rows={12}
        className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100 transition-colors"
        placeholder="Define la estructura de tu nota aquí..."
        aria-label={`Editor de plantilla para ${specialtyName}`}
      />
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={handleSave}
          className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-neutral-800 transition-colors"
          aria-live="polite"
        >
          <SaveIcon className="h-5 w-5 mr-2" />
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