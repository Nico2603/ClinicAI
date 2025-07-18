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
  const [activeTab, setActiveTab] = useState<'notes' | 'evidence' | 'scales'>('notes');
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  // Filtrar notas por tipo
  const filterNotesByType = (type: HistoricNote['type'][]): HistoricNote[] => {
    return historicNotes.filter(note => type.includes(note.type));
  };

  const notesHistory = filterNotesByType(['template', 'suggestion']);
  const evidenceHistory = filterNotesByType(['evidence']);
  const scalesHistory = filterNotesByType(['scale']);

  const getCurrentNotes = (): HistoricNote[] => {
    switch (activeTab) {
      case 'notes':
        return notesHistory;
      case 'evidence':
        return evidenceHistory;
      case 'scales':
        return scalesHistory;
      default:
        return notesHistory;
    }
  };

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

  const getTypeLabel = (note: HistoricNote): string => {
    switch (note.type) {
      case 'template':
        return getTemplateName(note.specialty_id || '');
      case 'suggestion':
        return 'Nota General';
      case 'evidence':
        return 'Evidencia Científica';
      case 'scale':
        return note.scaleName || 'Escala Clínica';
      default:
        return 'Nota';
    }
  };

  const tabs = [
    { id: 'notes', label: 'Notas', shortLabel: 'Notas', icon: '📝', count: notesHistory.length },
    { id: 'evidence', label: 'Evidencias científicas', shortLabel: 'Evidencias', icon: '🔬', count: evidenceHistory.length },
    { id: 'scales', label: 'Escalas clínicas generadas por IA', shortLabel: 'Escalas', icon: '📊', count: scalesHistory.length },
  ];

  const currentNotes = getCurrentNotes();

  const renderNotesList = (notes: HistoricNote[]) => {
    if (notes.length === 0) {
      return (
        <div className="text-center py-8 sm:py-12">
          <ClockIcon className="h-12 w-12 sm:h-16 sm:w-16 text-neutral-400 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
            No hay notas en el historial de esta categoría
          </p>
        </div>
      );
    }

    return (
      <div className="mobile-spacing">
        {notes.map((note) => (
          <div key={note.id} className="mobile-card hover:shadow-md transition-shadow">
            <div className="mobile-inline mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary w-fit">
                    {getTypeLabel(note)}
                  </span>
                  <span className="mobile-text text-neutral-500 dark:text-neutral-400">
                    {formatDate(note.timestamp)}
                  </span>
                </div>
                <p className="mobile-text text-neutral-800 dark:text-neutral-200 line-clamp-3">
                  {note.content.length > 100 ? `${note.content.substring(0, 100)}...` : note.content}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => onLoadNoteInEditor(note)}
                className="mobile-button bg-primary text-white hover:bg-primary/90"
              >
                <PencilSquareIcon className="h-4 w-4 mr-2 shrink-0" />
                Editar
              </button>
              <button
                onClick={() => onLoadNoteInUpdater(note)}
                className="mobile-button bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                <EditIcon className="h-4 w-4 mr-2 shrink-0" />
                Actualizar
              </button>
              <button
                onClick={() => handleDeleteClick(note.id)}
                className="mobile-button bg-red-600 text-white hover:bg-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-2 shrink-0" />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="mobile-card">
      <div className="mobile-inline mb-4 sm:mb-6">
        <h2 className="mobile-heading text-primary">
          📚 Historial de Notas
        </h2>
        {historicNotes.length > 0 && (
          <button
            onClick={onClearHistory}
            className="mobile-button bg-red-600 text-white hover:bg-red-700"
          >
            <TrashIcon className="h-4 w-4 mr-2 shrink-0" />
            <span className="hidden sm:inline">Limpiar historial</span>
            <span className="sm:hidden">Limpiar</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 mb-4 sm:mb-6">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'notes' | 'evidence' | 'scales')}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap touch-target ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300'
              }`}
            >
              <span className="mr-1 sm:mr-2">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {tab.count > 0 && (
                <span className="ml-1 sm:ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderNotesList(currentNotes)}

      {/* Confirmation Dialog */}
      {confirmingDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="mobile-card max-w-md w-full">
            <h3 className="mobile-heading text-neutral-900 dark:text-neutral-100 mb-4">
              ¿Eliminar nota?
            </h3>
            <p className="mobile-text text-neutral-600 dark:text-neutral-400 mb-6">
              Esta acción no se puede deshacer. La nota será eliminada permanentemente.
            </p>
            <div className="mobile-grid">
              <button
                onClick={() => confirmDelete(confirmingDelete)}
                className="mobile-button bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar
              </button>
              <button
                onClick={cancelDelete}
                className="mobile-button border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}; 