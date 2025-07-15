import React, { useState } from 'react';
import { HistoricNote, UserTemplate } from '@/types';
import { ClockIcon, PencilSquareIcon, EditIcon, TrashIcon } from '../ui/Icons';

interface HistoryViewProps {
  historicNotes: HistoricNote[];
  userTemplates: UserTemplate[];
  onLoadNoteInEditor: (note: HistoricNote) => void;
  onLoadNoteInUpdater: (note: HistoricNote) => void;
  onDeleteNote: (noteId: string) => void;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historicNotes,
  userTemplates,
  onLoadNoteInEditor,
  onLoadNoteInUpdater,
  onDeleteNote,
  onClearHistory,
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const getTemplateName = (specialtyId: string): string => {
    const template = userTemplates.find(t => t.id === specialtyId);
    return template ? template.name : 'Plantilla desconocida';
  };

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

  const handleDeleteClick = (noteId: string) => {
    setConfirmingDelete(noteId);
  };

  const confirmDelete = (noteId: string) => {
    onDeleteNote(noteId);
    setConfirmingDelete(null);
  };

  const cancelDelete = () => {
    setConfirmingDelete(null);
  };

  return (
    <section 
      aria-labelledby="history-heading" 
      className="bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-4 md:p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 id="history-heading" className="text-lg md:text-xl font-semibold text-primary mb-4 sm:mb-0 flex items-center">
          <ClockIcon className="h-6 w-6 mr-2" />
          Historial de Notas
        </h2>
        
        {historicNotes.length > 0 && (
          <button
            onClick={onClearHistory}
            className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Limpiar Historial
          </button>
        )}
      </div>

      {historicNotes.length === 0 ? (
        <div className="text-center py-12">
          <ClockIcon className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            No hay notas en el historial
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400">
            Las notas que generes se guardarán automáticamente aquí para acceso rápido.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {historicNotes.map((note) => (
            <div
              key={note.id}
              className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                      {note.type === 'template' ? getTemplateName(note.specialty_id || '') : 'Nota General'}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatDate(note.timestamp)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3">
                    {note.content.length > 200 
                      ? `${note.content.substring(0, 200)}...` 
                      : note.content
                    }
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:ml-4">
                  <button
                    onClick={() => onLoadNoteInEditor(note)}
                    className="inline-flex items-center px-3 py-2 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-white dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    title="Cargar en editor de plantillas"
                  >
                    <PencilSquareIcon className="h-4 w-4 mr-1" />
                    Editor
                  </button>
                  
                  <button
                    onClick={() => onLoadNoteInUpdater(note)}
                    className="inline-flex items-center px-3 py-2 border border-green-300 dark:border-green-600 text-sm font-medium rounded-md text-green-700 dark:text-green-300 bg-white dark:bg-neutral-800 hover:bg-green-50 dark:hover:bg-green-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    title="Cargar en actualizador"
                  >
                    <EditIcon className="h-4 w-4 mr-1" />
                    Actualizar
                  </button>
                  
                  {confirmingDelete === note.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => confirmDelete(note.id)}
                        className="inline-flex items-center px-2 py-2 border border-red-300 dark:border-red-600 text-xs font-medium rounded-md text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        title="Confirmar eliminación"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="inline-flex items-center px-2 py-2 border border-neutral-300 dark:border-neutral-600 text-xs font-medium rounded-md text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-colors"
                        title="Cancelar"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDeleteClick(note.id)}
                      className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      title="Eliminar nota"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}; 