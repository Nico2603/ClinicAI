import React from 'react';
import { UserTemplate } from '@/types';
import { CustomTemplateManager, TemplateEditor, FormatExtractor } from '../';

interface TemplatesViewProps {
  selectedTemplate: UserTemplate | null;
  onSelectTemplate: (template: UserTemplate) => void;
  onSaveTemplate: (newContent: string) => Promise<void>;
  userId?: string;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  selectedTemplate,
  onSelectTemplate,
  onSaveTemplate,
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
      
      <div className="mb-6">
        <CustomTemplateManager
          onSelectTemplate={onSelectTemplate}
          selectedTemplateId={selectedTemplate?.id}
        />
      </div>
      
      {selectedTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <TemplateEditor
              template={selectedTemplate.content}
              onSaveTemplate={onSaveTemplate}
              specialtyName={selectedTemplate.name}
              userId={userId}
            />
          </div>
          
          <div>
            <FormatExtractor
              template={selectedTemplate.content}
              templateName={selectedTemplate.name}
            />
          </div>
        </div>
      )}
    </section>
  );
}; 