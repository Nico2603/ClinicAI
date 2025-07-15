'use client';

import React, { useState, useCallback } from 'react';
import { HistoricNote, UserTemplate } from '@/types';
import { SaveIcon, PlusIcon, PencilSquareIcon } from '../ui/Icons';
import { Button } from '../ui/button';

interface NoteEditorProps {
  note: HistoricNote;
  userTemplates: UserTemplate[];
  onSaveAsNew: (editedNote: Omit<HistoricNote, 'id' | 'timestamp'>) => void;
  onOverwrite: (noteId: string, editedNote: Omit<HistoricNote, 'id' | 'timestamp'>) => void;
  onCancel: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  userTemplates,
  onSaveAsNew,
  onOverwrite,
  onCancel,
}) => {
  const [originalInput, setOriginalInput] = useState(note.originalInput);
  const [content, setContent] = useState(note.content);
  const [isModified, setIsModified] = useState(false);

  const getTemplateName = (specialtyId?: string): string => {
    if (!specialtyId) return 'Plantilla desconocida';
    const template = userTemplates.find(t => t.id === specialtyId);
    return template ? template.name : 'Plantilla desconocida';
  };

  const handleOriginalInputChange = useCallback((value: string) => {
    setOriginalInput(value);
    setIsModified(value !== note.originalInput || content !== note.content);
  }, [note.originalInput, note.content, content]);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    setIsModified(originalInput !== note.originalInput || value !== note.content);
  }, [note.originalInput, note.content, originalInput]);

  const handleSaveAsNew = useCallback(() => {
    const editedNote: Omit<HistoricNote, 'id' | 'timestamp'> = {
      type: note.type,
      originalInput,
      content,
      specialty_id: note.specialty_id,
      specialtyName: note.specialtyName,
      scaleId: note.scaleId,
      scaleName: note.scaleName,
    };
    onSaveAsNew(editedNote);
  }, [note, originalInput, content, onSaveAsNew]);

  const handleOverwrite = useCallback(() => {
    const editedNote: Omit<HistoricNote, 'id' | 'timestamp'> = {
      type: note.type,
      originalInput,
      content,
      specialty_id: note.specialty_id,
      specialtyName: note.specialtyName,
      scaleId: note.scaleId,
      scaleName: note.scaleName,
    };
    onOverwrite(note.id, editedNote);
  }, [note, originalInput, content, onOverwrite]);

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

  return (
    <section className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-primary mb-4 sm:mb-0 flex items-center">
          <PencilSquareIcon className="h-6 w-6 mr-2" />
          Editor de Nota
        </h2>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Creada: {formatDate(note.timestamp)}
        </div>
      </div>

      {/* Información de la nota */}
      <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
              {note.type === 'template' ? getTemplateName(note.specialty_id) : 'Nota General'}
            </span>
          </div>
          <div className="text-right text-sm text-neutral-500 dark:text-neutral-400">
            Tipo: {note.type}
          </div>
        </div>
      </div>

      {/* Editor de información del paciente */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Información del Paciente
        </label>
        <textarea
          value={originalInput}
          onChange={(e) => handleOriginalInputChange(e.target.value)}
          rows={6}
          className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg resize-y bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:border-primary focus:ring-primary"
          placeholder="Información del paciente..."
        />
      </div>

      {/* Editor de contenido de la nota */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Contenido de la Nota
        </label>
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          rows={15}
          className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg resize-y bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:border-primary focus:ring-primary"
          placeholder="Contenido de la nota..."
        />
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <button
          onClick={handleSaveAsNew}
          disabled={!isModified}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Guardar como Nueva Nota
        </button>
        
        <button
          onClick={handleOverwrite}
          disabled={!isModified}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-green-600 text-sm font-medium rounded-md text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <SaveIcon className="h-4 w-4 mr-2" />
          Sobrescribir Nota Actual
        </button>
        
        <button
          onClick={onCancel}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-colors"
        >
          Cancelar
        </button>
      </div>

      {/* Indicador de cambios */}
      {isModified && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
          <p className="text-blue-700 dark:text-blue-200 text-sm">
            <strong>Tienes cambios sin guardar.</strong> Usa los botones de arriba para guardar tus modificaciones.
          </p>
        </div>
      )}
    </section>
  );
}; 