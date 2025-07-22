import React, { useState, useCallback } from 'react';
import { useTemplateCacheStats } from '@/lib/services/templateCacheService';
import { useSimpleUserTemplates } from '@/hooks/useSimpleDatabase';

interface TemplateCacheManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const TemplateCacheManager: React.FC<TemplateCacheManagerProps> = ({ isOpen, onClose }) => {
  const { getStats, getMostUsed, invalidate, clear } = useTemplateCacheStats();
  const { refreshFromServer, invalidateCache } = useSimpleUserTemplates();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(getStats());
  const [mostUsed, setMostUsed] = useState(getMostUsed());

  const refreshStats = useCallback(() => {
    setStats(getStats());
    setMostUsed(getMostUsed());
  }, [getStats, getMostUsed]);

  const handleInvalidateCache = useCallback(async () => {
    setIsLoading(true);
    try {
      await invalidateCache();
      refreshStats();
      console.log('✅ Cache invalidado y datos refrescados desde servidor');
    } catch (error) {
      console.error('Error al invalidar cache:', error);
    } finally {
      setIsLoading(false);
    }
  }, [invalidateCache, refreshStats]);

  const handleClearCache = useCallback(() => {
    clear();
    refreshStats();
    console.log('✅ Cache limpiado completamente');
  }, [clear, refreshStats]);

  const handleRefreshFromServer = useCallback(async () => {
    setIsLoading(true);
    try {
      await refreshFromServer();
      refreshStats();
      console.log('✅ Datos actualizados desde servidor');
    } catch (error) {
      console.error('Error al refrescar desde servidor:', error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshFromServer, refreshStats]);

  React.useEffect(() => {
    if (isOpen) {
      refreshStats();
    }
  }, [isOpen, refreshStats]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            📦 Gestión de Cache de Plantillas
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Estadísticas del Cache */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-4">
            📊 Estadísticas del Cache
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400">Total de Plantillas</div>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                {stats.totalTemplates}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400">Tamaño del Cache</div>
              <div className="text-2xl font-bold text-green-800 dark:text-green-300">
                {stats.cacheSize}
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-sm text-purple-600 dark:text-purple-400">Más Antigua</div>
              <div className="text-sm font-medium text-purple-800 dark:text-purple-300 truncate">
                {stats.oldestEntry}
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="text-sm text-orange-600 dark:text-orange-400">Más Usada</div>
              <div className="text-sm font-medium text-orange-800 dark:text-orange-300 truncate">
                {stats.mostUsed}
              </div>
            </div>
          </div>
        </div>

        {/* Plantillas Más Usadas */}
        {mostUsed.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-4">
              🏆 Plantillas Más Utilizadas
            </h3>
            <div className="space-y-2">
              {mostUsed.map((template, index) => (
                <div
                  key={template.id}
                  className="flex items-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold">
                    {index + 1}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {template.name}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Creada: {new Date(template.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones del Cache */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
            🔧 Acciones de Cache
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={handleRefreshFromServer}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refrescar
            </button>

            <button
              onClick={handleInvalidateCache}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Invalidar
            </button>

            <button
              onClick={handleClearCache}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V9a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
              Limpiar Todo
            </button>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
              ℹ️ Información sobre las Acciones
            </h4>
            <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
              <div><strong>Refrescar:</strong> Actualiza el cache con datos frescos del servidor</div>
              <div><strong>Invalidar:</strong> Borra el cache y fuerza una recarga completa</div>
              <div><strong>Limpiar Todo:</strong> Elimina completamente el cache local</div>
            </div>
          </div>
        </div>

        {/* Indicador de Performance */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-green-800 dark:text-green-300">
                Cache Activo - Performance Optimizada
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                Las plantillas se cargan instantáneamente desde el cache local
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCacheManager; 