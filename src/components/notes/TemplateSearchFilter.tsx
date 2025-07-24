import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { SearchIcon, FilterIcon, XMarkIcon, StarIcon } from '../ui/Icons';
import { UserTemplate, HistoricNote } from '../../types';
import { Button } from '../ui/button';

// Simple debounce implementation without lodash
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

export interface FilterOptions {
  searchTerm: string;
  patientFilter: string;
  dateRange: {
    start: string;
    end: string;
  };
  sortBy: 'name' | 'date' | 'usage' | 'favorites';
  showFavoritesOnly: boolean;
}

interface TemplateSearchFilterProps {
  templates: UserTemplate[];
  historicNotes: HistoricNote[];
  onFilterChange: (filteredTemplates: UserTemplate[], filters: FilterOptions) => void;
  favorites: string[];
  onToggleFavorite: (templateId: string) => void;
}

export const TemplateSearchFilter: React.FC<TemplateSearchFilterProps> = ({
  templates,
  historicNotes,
  onFilterChange,
  favorites,
  onToggleFavorite
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    patientFilter: '',
    dateRange: { start: '', end: '' },
    sortBy: 'date',
    showFavoritesOnly: false
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calcular estadísticas de uso de plantillas
  const templateUsageStats = useMemo(() => {
    const stats: Record<string, { count: number; lastUsed: string }> = {};
    
    templates.forEach(template => {
      const relatedNotes = historicNotes.filter(note => note.specialty_id === template.id);
      stats[template.id] = {
        count: relatedNotes.length,
        lastUsed: relatedNotes.length > 0 
          ? relatedNotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp || template.created_at
          : template.created_at
      };
    });
    
    return stats;
  }, [templates, historicNotes]);

  const applyFilters = useCallback((currentFilters: FilterOptions) => {
    let filteredTemplates = [...templates];

    // Filtro por término de búsqueda
    if (currentFilters.searchTerm.trim()) {
      const searchLower = currentFilters.searchTerm.toLowerCase();
      filteredTemplates = filteredTemplates.filter(template =>
        template.name.toLowerCase().includes(searchLower) ||
        template.content.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por paciente
    if (currentFilters.patientFilter.trim()) {
      const patientLower = currentFilters.patientFilter.toLowerCase();
      // Filtrar plantillas que han sido usadas con este paciente
      const templatesUsedWithPatient = new Set(
        historicNotes
          .filter(note => {
            // Buscar en el contenido original si menciona al paciente
            const hasPatientMention = note.originalInput?.toLowerCase().includes(patientLower) ||
                                     note.original_input?.toLowerCase().includes(patientLower) ||
                                     note.content?.toLowerCase().includes(patientLower);
            return hasPatientMention;
          })
          .map(note => note.specialty_id)
          .filter(Boolean)
      );
      
      filteredTemplates = filteredTemplates.filter(template => 
        templatesUsedWithPatient.has(template.id) ||
        template.name.toLowerCase().includes(patientLower) ||
        template.content.toLowerCase().includes(patientLower)
      );
    }

    // Filtro por rango de fechas
    if (currentFilters.dateRange.start || currentFilters.dateRange.end) {
      filteredTemplates = filteredTemplates.filter(template => {
        const templateDate = new Date(template.created_at);
        const startDate = currentFilters.dateRange.start ? new Date(currentFilters.dateRange.start) : null;
        const endDate = currentFilters.dateRange.end ? new Date(currentFilters.dateRange.end) : null;
        
        if (startDate && templateDate < startDate) return false;
        if (endDate && templateDate > endDate) return false;
        return true;
      });
    }

    // Filtro por favoritos
    if (currentFilters.showFavoritesOnly) {
      filteredTemplates = filteredTemplates.filter(template => 
        favorites.includes(template.id)
      );
    }

    // Ordenamiento
    filteredTemplates.sort((a, b) => {
      switch (currentFilters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'usage':
          const aUsage = templateUsageStats[a.id]?.count || 0;
          const bUsage = templateUsageStats[b.id]?.count || 0;
          return bUsage - aUsage;
        case 'favorites':
          const aIsFav = favorites.includes(a.id);
          const bIsFav = favorites.includes(b.id);
          if (aIsFav === bIsFav) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return bIsFav ? 1 : -1;
        default:
          return 0;
      }
    });

    onFilterChange(filteredTemplates, currentFilters);
  }, [templates, historicNotes, favorites, templateUsageStats, onFilterChange]);

  // Debounced search function
  const debouncedSearch = useDebounce((searchTerm: string, currentFilters: FilterOptions) => {
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

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearFilters = () => {
    const newFilters: FilterOptions = {
      searchTerm: '',
      patientFilter: '',
      dateRange: { start: '', end: '' },
      sortBy: 'date',
      showFavoritesOnly: false
    };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const hasActiveFilters = filters.searchTerm || filters.patientFilter || filters.dateRange.start || filters.dateRange.end || filters.showFavoritesOnly;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 mb-4">
      {/* Barra de búsqueda principal */}
      <div className="flex gap-3 items-center mb-3">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar plantillas por nombre o contenido..."
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
                placeholder="Buscar plantillas usadas con este paciente..."
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
                💡 Busca plantillas que han sido usadas con pacientes que coincidan con este término
              </p>
            )}
          </div>

          {/* Primera fila: Ordenar y Favoritos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Ordenar por
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value as FilterOptions['sortBy'])}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100"
              >
                <option value="date">Fecha de creación</option>
                <option value="name">Nombre (A-Z)</option>
                <option value="usage">Más utilizadas</option>
                <option value="favorites">Favoritas primero</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showFavoritesOnly}
                  onChange={(e) => handleFilterChange('showFavoritesOnly', e.target.checked)}
                  className="rounded border-neutral-300 text-primary focus:ring-primary"
                />
                <StarIcon className="h-4 w-4 text-yellow-500" />
                Solo favoritas
              </label>
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
            <span>
              {templates.length} plantilla{templates.length !== 1 ? 's' : ''} disponible{templates.length !== 1 ? 's' : ''}
            </span>
            {filters.patientFilter && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                👤 Filtrado por: "{filters.patientFilter}"
              </span>
            )}
          </div>
          {favorites.length > 0 && (
            <span className="flex items-center gap-1">
              <StarIcon className="h-3 w-3 text-yellow-500" />
              {favorites.length} favorita{favorites.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}; 