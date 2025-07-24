/**
 * ClínicAI - Asistente de IA para Notas Clínicas
 * 
 * Autor: Nicolas Ceballos Brito
 * Portfolio: https://nico2603.github.io/PersonalPage/
 * GitHub: https://github.com/Nico2603
 * LinkedIn: https://www.linkedin.com/in/nicolas-ceballos-brito/
 * 
 * Desarrollado para Teilur.ai
 */

import React, { useState } from 'react';
import { HistoricNote, UserTemplate } from '@/types';
import { ClockIcon, PencilSquareIcon, EditIcon, TrashIcon, DocumentTextIcon, EvidenceIcon, ScalesIcon } from '../ui/Icons';
import { HistorySearchFilter, HistoryFilterOptions, FilteredHistoryData } from '../notes/HistorySearchFilter';
import { Button } from '../ui/button';
import { useToast } from '@/hooks';

interface HistoryViewProps {
  historicNotes: HistoricNote[];
  userTemplates: UserTemplate[];
  onLoadNoteInEditor: (note: HistoricNote) => void;
  onLoadNoteInUpdater: (note: HistoricNote) => void;
  onDeleteNote: (noteId: string) => void;
  onClearHistory: () => void;
  onSyncData?: () => Promise<void>;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historicNotes,
  userTemplates,
  onLoadNoteInEditor,
  onLoadNoteInUpdater,
  onDeleteNote,
  onClearHistory,
  onSyncData,
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'evidence' | 'scales'>('notes');
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { showDeleteSuccess, showDeleteConfirmation, showClearConfirmation, showInfo, showError } = useToast();
  
  // Estados para el filtrado
  const [filteredData, setFilteredData] = useState<FilteredHistoryData | null>(null);
  const [currentFilters, setCurrentFilters] = useState<HistoryFilterOptions | null>(null);

  // Función para manejar cambios de filtros
  const handleFilterChange = (newFilteredData: FilteredHistoryData, filters: HistoryFilterOptions) => {
    setFilteredData(newFilteredData);
    setCurrentFilters(filters);
  };

  // Función para sincronizar datos
  const handleSyncData = async () => {
    if (!onSyncData || isSyncing) return;
    
    try {
      setIsSyncing(true);
      await onSyncData();
      showInfo('Datos sincronizados correctamente');
    } catch (error) {
      console.error('Error al sincronizar datos:', error);
      showError('Error al sincronizar datos con la base de datos');
    } finally {
      setIsSyncing(false);
    }
  };

  // Usar datos filtrados si existen, sino usar datos originales
  const getDataSource = () => {
    if (filteredData) {
      return filteredData;
    }
    
    // Datos originales sin filtrar
    const notesHistory = historicNotes.filter(note => ['template', 'suggestion'].includes(note.type));
    const evidenceHistory = historicNotes.filter(note => note.type === 'evidence');
    const scalesHistory = historicNotes.filter(note => note.type === 'scale');
    
    return {
      notes: notesHistory,
      evidence: evidenceHistory,
      scales: scalesHistory,
      all: historicNotes
    };
  };

  const dataSource = getDataSource();
  const notesHistory = dataSource.notes;
  const evidenceHistory = dataSource.evidence;
  const scalesHistory = dataSource.scales;

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
    showDeleteConfirmation(() => {
      onDeleteNote(noteId);
      showDeleteSuccess();
    });
  };

  const confirmDelete = (noteId: string) => {
    onDeleteNote(noteId);
    setConfirmingDelete(null);
    showDeleteSuccess();
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
    { id: 'notes', label: 'Notas', shortLabel: 'Notas', icon: <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5" />, count: notesHistory.length },
    { id: 'evidence', label: 'Evidencias científicas', shortLabel: 'Evidencias', icon: <EvidenceIcon className="h-4 w-4 sm:h-5 sm:w-5" />, count: evidenceHistory.length },
    { id: 'scales', label: 'Escalas clínicas generadas por IA', shortLabel: 'Escalas', icon: <ScalesIcon className="h-4 w-4 sm:h-5 sm:w-5" />, count: scalesHistory.length },
  ];

  // Mostrar indicador si hay filtros activos
  const hasActiveFilters = currentFilters && (
    currentFilters.searchTerm || 
    currentFilters.patientFilter || 
    currentFilters.dateRange.start || 
    currentFilters.dateRange.end || 
    currentFilters.typeFilter !== 'all'
  );

  const currentNotes = getCurrentNotes();

  const renderNotesList = (notes: HistoricNote[]) => {
    if (notes.length === 0) {
      const isFiltered = currentFilters && (
        currentFilters.searchTerm || 
        currentFilters.patientFilter || 
        currentFilters.dateRange.start || 
        currentFilters.dateRange.end || 
        currentFilters.typeFilter !== 'all'
      );
      
      return (
        <div className="text-center py-8 sm:py-12">
          <ClockIcon className="h-12 w-12 sm:h-16 sm:w-16 text-neutral-400 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
            {isFiltered 
              ? 'No se encontraron resultados con los filtros aplicados' 
              : 'No hay notas en el historial de esta categoría'
            }
          </p>
          {isFiltered && (
            <p className="text-xs text-neutral-400 mt-2">
              Intenta ajustar los filtros de búsqueda
            </p>
          )}
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
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-700" data-tutorial="history-actions">
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
        <div className="flex gap-2">
          {onSyncData && (
            <button
              onClick={handleSyncData}
              disabled={isSyncing}
              className="mobile-button bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Sincronizar datos con la base de datos"
            >
              {isSyncing ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border border-current border-t-transparent rounded-full shrink-0"></div>
                  <span className="hidden sm:inline">Sincronizando...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Sincronizar</span>
                </>
              )}
            </button>
          )}
          {historicNotes.length > 0 && (
            <Button
              onClick={() => showClearConfirmation(() => {
                onClearHistory();
                showDeleteSuccess();
              })}
              variant="tertiary"
              size="sm"
              className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200"
            >
              <TrashIcon className="h-4 w-4 mr-2 shrink-0" />
              <span className="hidden sm:inline">Limpiar historial</span>
              <span className="sm:hidden">Limpiar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filtros de búsqueda */}
      {historicNotes.length > 0 && (
        <HistorySearchFilter
          historicNotes={historicNotes}
          userTemplates={userTemplates}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 mb-4 sm:mb-6" data-tutorial="history-tabs">
        {hasActiveFilters && (
          <div className="mb-3 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
              🔍 Filtros activos - Los contadores reflejan solo los resultados filtrados
            </p>
          </div>
        )}
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'notes' | 'evidence' | 'scales')}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap touch-target flex items-center gap-1 sm:gap-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {tab.count > 0 && (
                <span className={`ml-1 sm:ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs ${
                  hasActiveFilters 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                    : 'bg-primary/10 text-primary'
                }`}>
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