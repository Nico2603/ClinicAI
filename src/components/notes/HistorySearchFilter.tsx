import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { SearchIcon, FilterIcon, XMarkIcon, ClockIcon } from '../ui/Icons';
import { HistoricNote, UserTemplate } from '../../types';
import { Button } from '../ui/button';

// Simple debounce implementation
function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback as T;
}

export interface HistoryFilterOptions {
  searchTerm: string;
  patientFilter: string;
  dateRange: {
    start: string;
    end: string;
  };
  typeFilter: 'all' | 'template' | 'suggestion' | 'evidence' | 'scale';
  sortBy: 'date' | 'type' | 'content';
}

export interface FilteredHistoryData {
  notes: HistoricNote[];
  evidence: HistoricNote[];
  scales: HistoricNote[];
  all: HistoricNote[];
}

interface HistorySearchFilterProps {
  historicNotes: HistoricNote[];
  userTemplates: UserTemplate[];
  onFilterChange: (filteredData: FilteredHistoryData, filters: HistoryFilterOptions) => void;
}

export const HistorySearchFilter: React.FC<HistorySearchFilterProps> = ({
  historicNotes,
  userTemplates,
  onFilterChange
}) => {
  const [filters, setFilters] = useState<HistoryFilterOptions>({
    searchTerm: '',
    patientFilter: '',
    dateRange: { start: '', end: '' },
    typeFilter: 'all',
    sortBy: 'date'
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Función para obtener el nombre de la plantilla
  const getTemplateName = useCallback((specialtyId: string): string => {
    const template = userTemplates.find(t => t.id === specialtyId);
    return template ? template.name : 'Plantilla desconocida';
  }, [userTemplates]);

  // Función principal de filtrado
  const applyFilters = useCallback((currentFilters: HistoryFilterOptions) => {
    let filteredNotes = [...historicNotes];

    // Filtro por término de búsqueda (busca en contenido, título, etc.)
    if (currentFilters.searchTerm.trim()) {
      const searchLower = currentFilters.searchTerm.toLowerCase();
      filteredNotes = filteredNotes.filter(note =>
        note.content.toLowerCase().includes(searchLower) ||
        note.title?.toLowerCase().includes(searchLower) ||
        note.specialtyName?.toLowerCase().includes(searchLower) ||
        note.scaleName?.toLowerCase().includes(searchLower) ||
        getTemplateName(note.specialty_id || '').toLowerCase().includes(searchLower)
      );
    }

    // Filtro por paciente (busca en información original del paciente)
    if (currentFilters.patientFilter.trim()) {
      const patientLower = currentFilters.patientFilter.toLowerCase();
      filteredNotes = filteredNotes.filter(note => {
        const hasPatientMention = 
          note.originalInput?.toLowerCase().includes(patientLower) ||
          note.original_input?.toLowerCase().includes(patientLower) ||
          note.content?.toLowerCase().includes(patientLower) ||
          note.metadata?.patient_name?.toLowerCase().includes(patientLower);
        return hasPatientMention;
      });
    }

    // Filtro por rango de fechas
    if (currentFilters.dateRange.start || currentFilters.dateRange.end) {
      filteredNotes = filteredNotes.filter(note => {
        const noteTimeStamp = note.timestamp || note.created_at;
        if (!noteTimeStamp) return true; // Si no hay fecha, incluir la nota
        
        const noteDate = new Date(noteTimeStamp);
        const startDate = currentFilters.dateRange.start && currentFilters.dateRange.start.trim() 
          ? new Date(currentFilters.dateRange.start) : null;
        const endDate = currentFilters.dateRange.end && currentFilters.dateRange.end.trim() 
          ? new Date(currentFilters.dateRange.end) : null;
        
        if (startDate && noteDate < startDate) return false;
        if (endDate && noteDate > endDate) return false;
        return true;
      });
    }

    // Filtro por tipo
    if (currentFilters.typeFilter !== 'all') {
      filteredNotes = filteredNotes.filter(note => note.type === currentFilters.typeFilter);
    }

    // Ordenamiento
    filteredNotes.sort((a, b) => {
      switch (currentFilters.sortBy) {
        case 'date':
          const timestampA = a.timestamp || a.created_at;
          const timestampB = b.timestamp || b.created_at;
          if (!timestampA && !timestampB) return 0;
          if (!timestampA) return 1;
          if (!timestampB) return -1;
          const dateA = new Date(timestampA).getTime();
          const dateB = new Date(timestampB).getTime();
          return dateB - dateA; // Más reciente primero
        case 'type':
          return a.type.localeCompare(b.type);
        case 'content':
          return a.content.localeCompare(b.content);
        default:
          return 0;
      }
    });

    // Separar por categorías para los tabs
    const notesCategory = filteredNotes.filter(note => ['template', 'suggestion'].includes(note.type));
    const evidenceCategory = filteredNotes.filter(note => note.type === 'evidence');
    const scalesCategory = filteredNotes.filter(note => note.type === 'scale');

    const filteredData: FilteredHistoryData = {
      notes: notesCategory,
      evidence: evidenceCategory,
      scales: scalesCategory,
      all: filteredNotes
    };

    onFilterChange(filteredData, currentFilters);
  }, [historicNotes, userTemplates, getTemplateName, onFilterChange]);

  // Debounced search function
  const debouncedSearch = useDebounce((searchTerm: string, currentFilters: HistoryFilterOptions) => {
    const newFilters = { ...currentFilters, searchTerm };
    applyFilters(newFilters);
  }, 300);

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, searchTerm: value };
    setFilters(newFilters);
    debouncedSearch(value, newFilters);
  };

  const handlePatientFilterChange = (value: string) => {
    const newFilters = { ...filters, patientFilter: value };
    setFilters(newFilters);
    debouncedSearch(value, newFilters);
  };

  const handleFilterChange = (key: keyof HistoryFilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearFilters = () => {
    const newFilters: HistoryFilterOptions = {
      searchTerm: '',
      patientFilter: '',
      dateRange: { start: '', end: '' },
      typeFilter: 'all',
      sortBy: 'date'
    };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const hasActiveFilters = filters.searchTerm || filters.patientFilter || filters.dateRange.start || filters.dateRange.end || filters.typeFilter !== 'all';

  // Estadísticas por categoría
  const categoryStats = useMemo(() => {
    const stats = {
      total: historicNotes.length,
      notes: historicNotes.filter(note => ['template', 'suggestion'].includes(note.type)).length,
      evidence: historicNotes.filter(note => note.type === 'evidence').length,
      scales: historicNotes.filter(note => note.type === 'scale').length
    };
    return stats;
  }, [historicNotes]);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 mb-4">
      {/* Barra de búsqueda principal */}
      <div className="flex gap-3 items-center mb-3">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar en historial por contenido, plantilla, escala..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100"
          />
          {filters.searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-md transition-colors ${
            showAdvanced 
              ? 'bg-primary text-white border-primary' 
              : 'border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
          }`}
        >
          <FilterIcon className="h-4 w-4" />
          Filtros
        </button>
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="border-t border-neutral-200 dark:border-neutral-600 pt-3 space-y-4">
          {/* Filtro por paciente */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Filtrar por paciente
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar notas/evidencias relacionadas con este paciente..."
                value={filters.patientFilter}
                onChange={(e) => handlePatientFilterChange(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100"
              />
              {filters.patientFilter && (
                <button
                  onClick={() => handlePatientFilterChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            {filters.patientFilter && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                👤 Busca en todas las categorías por información de pacientes
              </p>
            )}
          </div>

          {/* Primera fila: Tipo, Ordenar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Tipo de contenido
              </label>
              <select
                value={filters.typeFilter}
                onChange={(e) => handleFilterChange('typeFilter', e.target.value as HistoryFilterOptions['typeFilter'])}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100"
              >
                <option value="all">Todos los tipos</option>
                <option value="template">📝 Notas de plantilla</option>
                <option value="suggestion">💡 Notas generales</option>
                <option value="evidence">🔬 Evidencias científicas</option>
                <option value="scale">📊 Escalas clínicas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Ordenar por
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value as HistoryFilterOptions['sortBy'])}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100"
              >
                <option value="date">Fecha (más reciente)</option>
                <option value="type">Tipo de contenido</option>
                <option value="content">Contenido (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Segunda fila: Rango de fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100"
              />
            </div>
          </div>

          {/* Botón limpiar filtros */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                onClick={clearFilters}
                variant="tertiary"
                size="sm"
                className="h-auto py-1"
              >
                <XMarkIcon className="h-4 w-4" />
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Estadísticas de resultados */}
      <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-700">
        <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {categoryStats.total} item{categoryStats.total !== 1 ? 's' : ''} total{categoryStats.total !== 1 ? 'es' : ''}
            </span>
            {filters.patientFilter && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                👤 Filtrado por: "{filters.patientFilter}"
              </span>
            )}
            {filters.typeFilter !== 'all' && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                🏷️ Tipo: {filters.typeFilter}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span>📝 {categoryStats.notes}</span>
            <span>🔬 {categoryStats.evidence}</span>
            <span>📊 {categoryStats.scales}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 