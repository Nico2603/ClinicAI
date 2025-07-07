import React from 'react';
import { UserTemplate } from '../../types';

interface TemplateSelectorProps {
  templates: UserTemplate[];
  selectedTemplateId: string;
  onTemplateChange: (templateId: string) => void;
  className?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onTemplateChange,
  className = '',
}) => {
  return (
    <div className={`mb-4 md:mb-6 ${className}`}>
      <label htmlFor="template-select" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
        Seleccionar Plantilla
      </label>
      <select
        id="template-select"
        value={selectedTemplateId}
        onChange={(e) => onTemplateChange(e.target.value)}
        className="block w-full pl-3 pr-10 py-2.5 text-sm md:text-base border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary rounded-md shadow-sm transition-colors"
      >
        {templates.length === 0 ? (
          <option value="">No hay plantillas disponibles</option>
        ) : (
          templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
};

export default TemplateSelector;