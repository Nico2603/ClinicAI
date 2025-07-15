import React from 'react';
import { UserTemplate } from '@/types';
import CustomTemplateManager from '../notes/CustomTemplateManager';

interface TemplatesViewProps {
  selectedTemplate: UserTemplate | null;
  onSelectTemplate: (template: UserTemplate) => void;
  onSaveTemplate: (newContent: string) => Promise<void>;
  userTemplates: UserTemplate[];
  userId?: string;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  selectedTemplate,
  onSelectTemplate,
  onSaveTemplate,
  userTemplates,
  userId,
}) => {
  return (
    <section 
      aria-labelledby="template-manager-heading" 
      className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5"
    >
      <h2 id="template-manager-heading" className="sr-only">
        Editor de Plantillas
      </h2>
      
      <CustomTemplateManager
        onSelectTemplate={onSelectTemplate}
        selectedTemplateId={selectedTemplate?.id}
      />
    </section>
  );
}; 