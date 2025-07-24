// Servicio de cache local para historial con estrategias inteligentes
import { HistoryEntry } from '@/lib/services/databaseService';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  version: number;
}

interface CacheConfig {
  maxSize: number;
  maxAge: number; // en milisegundos
  storageKey: string;
  version: number;
}

interface HistoryUsageStats {
  entryId: string;
  accessCount: number;
  lastAccessed: number;
  createdAt: number;
}

class HistoryCacheService {
  private config: CacheConfig = {
    maxSize: 100, // máximo 100 entradas de historial en cache
    maxAge: 60 * 60 * 1000, // 60 minutos (más tiempo que plantillas)
    storageKey: 'notasai_history_cache',
    version: 1 // ← Incrementar versión para resetear caches existentes
  };

  private usageStatsKey = 'notasai_history_usage';
  private userKey = '';

  constructor() {
    // Solo hacer cleanup si estamos en el cliente
    if (this.isClient()) {
      this.cleanup();
    }
  }

  // Verificar si estamos en el cliente (browser)
  private isClient(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // Configurar cache para usuario específico
  setUser(userId: string): void {
    this.userKey = userId;
    this.config.storageKey = `notasai_history_cache_${userId}`;
    this.usageStatsKey = `notasai_history_usage_${userId}`;
  }

  // Obtener historial del cache (SIN incrementar contadores automáticamente)
  getHistoryEntries(): HistoryEntry[] | null {
    if (!this.isClient()) return null;
    
    try {
      const cached = localStorage.getItem(this.config.storageKey);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      
      // Verificar versión del cache
      if (cacheData.version !== this.config.version) {
        this.clear();
        return null;
      }

      const now = Date.now();
      const validEntries: HistoryEntry[] = [];

      // Filtrar entradas válidas SIN incrementar contadores
      for (const [entryId, entry] of Object.entries(cacheData.data || {})) {
        const cacheEntry = entry as CacheEntry<HistoryEntry>;
        
        // Verificar si no ha expirado
        if (now - cacheEntry.timestamp < this.config.maxAge) {
          validEntries.push(cacheEntry.data);
        }
      }

      if (validEntries.length === 0) {
        this.clear();
        return null;
      }

      console.log(`📦 Cache hit: ${validEntries.length} entradas de historial recuperadas del cache local`);
      return validEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
    } catch (error) {
      console.error('Error al leer cache de historial:', error);
      this.clear();
      return null;
    }
  }

  // Método específico para registrar el acceso a una entrada de historial individual
  recordHistoryAccess(entryId: string): void {
    if (!this.isClient()) return;
    
    try {
      const existing = this.getCacheData();
      const entry = existing[entryId];
      
      if (entry) {
        entry.lastAccessed = Date.now();
        entry.accessCount += 1;
        this.saveCache(existing);
        
        console.log(`📊 Acceso registrado para entrada de historial: ${entry.data.title} (${entry.accessCount} accesos)`);
      }
    } catch (error) {
      console.error('Error al registrar acceso a entrada de historial:', error);
    }
  }

  // Guardar historial en cache
  setHistoryEntries(entries: HistoryEntry[]): void {
    if (!this.isClient()) return;
    
    try {
      const now = Date.now();
      const cacheData: Record<string, CacheEntry<HistoryEntry>> = {};
      
      // Leer cache existente para preservar estadísticas
      const existing = this.getCacheData();
      
      entries.forEach(entry => {
        const existingEntry = existing[entry.id];
        cacheData[entry.id] = {
          data: entry,
          timestamp: now,
          accessCount: existingEntry?.accessCount || 0, // Empezar en 0, no en 1
          lastAccessed: existingEntry?.lastAccessed || now,
          version: this.config.version
        };
      });

      // Aplicar límite de tamaño usando LRU
      const limitedCache = this.applyLRULimit(cacheData);
      this.saveCache(limitedCache);
      
      console.log(`💾 Cache de historial actualizado: ${Object.keys(limitedCache).length} entradas guardadas`);
      
    } catch (error) {
      console.error('Error al guardar cache de historial:', error);
    }
  }

  // Añadir una entrada individual al cache
  addHistoryEntry(entry: HistoryEntry): void {
    if (!this.isClient()) return;
    
    try {
      const existing = this.getCacheData();
      const now = Date.now();
      
      existing[entry.id] = {
        data: entry,
        timestamp: now,
        accessCount: 0, // Empezar en 0, no en 1
        lastAccessed: now,
        version: this.config.version
      };

      const limitedCache = this.applyLRULimit(existing);
      this.saveCache(limitedCache);
      
      console.log(`➕ Entrada de historial añadida al cache: ${entry.title}`);
      
    } catch (error) {
      console.error('Error al añadir entrada de historial al cache:', error);
    }
  }

  // Actualizar una entrada en el cache (SIN incrementar contador automáticamente)
  updateHistoryEntry(entry: HistoryEntry): void {
    if (!this.isClient()) return;
    
    try {
      const existing = this.getCacheData();
      
      if (existing[entry.id]) {
        const cacheEntry = existing[entry.id];
        if (cacheEntry) {
          cacheEntry.data = entry;
          cacheEntry.timestamp = Date.now();
          // NO incrementar accessCount automáticamente aquí
          
          this.saveCache(existing);
          console.log(`🔄 Entrada de historial actualizada en cache: ${entry.title}`);
        }
      } else {
        this.addHistoryEntry(entry);
      }
      
    } catch (error) {
      console.error('Error al actualizar entrada de historial en cache:', error);
    }
  }

  // Eliminar una entrada del cache
  removeHistoryEntry(entryId: string): void {
    if (!this.isClient()) return;
    
    try {
      const existing = this.getCacheData();
      
      if (existing[entryId]) {
        delete existing[entryId];
        this.saveCache(existing);
        console.log(`🗑️ Entrada de historial eliminada del cache: ${entryId}`);
      }
      
    } catch (error) {
      console.error('Error al eliminar entrada de historial del cache:', error);
    }
  }

  // Verificar si el cache es válido y reciente
  isCacheValid(): boolean {
    if (!this.isClient()) return false;
    
    try {
      const cached = localStorage.getItem(this.config.storageKey);
      if (!cached) return false;

      const cacheData = JSON.parse(cached);
      return cacheData.version === this.config.version && 
             Object.keys(cacheData.data || {}).length > 0;
             
    } catch {
      return false;
    }
  }

  // Obtener entradas más utilizadas
  getMostUsedEntries(limit: number = 5): HistoryEntry[] {
    const cached = this.getHistoryEntries();
    if (!cached) return [];

    const existing = this.getCacheData();
    
    // Filtrar y mapear con la información de uso
    const entriesWithUsage = cached
      .map(entry => {
        const cacheEntry = existing[entry.id];
        if (!cacheEntry) return null;
        return {
          entry,
          accessCount: cacheEntry.accessCount
        };
      })
      .filter((item): item is { entry: HistoryEntry; accessCount: number } => item !== null);
    
    // Solo retornar entradas que tienen al menos 1 acceso
    return entriesWithUsage
      .filter(item => item.accessCount > 0)
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit)
      .map(item => item.entry);
  }

  // Obtener estadísticas del cache
  getCacheStats(): {
    totalEntries: number;
    cacheSize: string;
    oldestEntry: string;
    newestEntry: string;
    mostUsed: string;
    hitRate?: number;
  } {
    if (!this.isClient()) {
      return {
        totalEntries: 0,
        cacheSize: '0 KB',
        oldestEntry: 'N/A',
        newestEntry: 'N/A',
        mostUsed: 'N/A'
      };
    }
    
    try {
      const existing = this.getCacheData();
      const entries = Object.values(existing);
      
      if (entries.length === 0) {
        return {
          totalEntries: 0,
          cacheSize: '0 KB',
          oldestEntry: 'N/A',
          newestEntry: 'N/A',
          mostUsed: 'N/A'
        };
      }

      const oldest = entries.reduce((prev, curr) => 
        prev.timestamp < curr.timestamp ? prev : curr
      );
      
      const newest = entries.reduce((prev, curr) => 
        prev.timestamp > curr.timestamp ? prev : curr
      );
      
      const mostUsed = entries.reduce((prev, curr) => 
        prev.accessCount > curr.accessCount ? prev : curr
      );

      const cacheData = localStorage.getItem(this.config.storageKey);
      const sizeInKB = cacheData ? Math.round(new Blob([cacheData]).size / 1024) : 0;

      return {
        totalEntries: entries.length,
        cacheSize: `${sizeInKB} KB`,
        oldestEntry: oldest.data.title,
        newestEntry: newest.data.title,
        mostUsed: mostUsed.accessCount > 0 
          ? `${mostUsed.data.title} (${mostUsed.accessCount} accesos)`
          : 'Ninguna usada aún'
      };

    } catch (error) {
      console.error('Error al obtener estadísticas del cache de historial:', error);
      return {
        totalEntries: 0,
        cacheSize: '0 KB',
        oldestEntry: 'Error',
        newestEntry: 'Error',
        mostUsed: 'Error'
      };
    }
  }

  // Resetear contadores de acceso (útil para debugging)
  resetAccessCounters(): void {
    if (!this.isClient()) return;
    
    try {
      const existing = this.getCacheData();
      
      Object.keys(existing).forEach(entryId => {
        const entry = existing[entryId];
        if (entry) {
          entry.accessCount = 0;
          entry.lastAccessed = Date.now();
        }
      });
      
      this.saveCache(existing);
      console.log('🔄 Contadores de acceso del historial reseteados');
    } catch (error) {
      console.error('Error al resetear contadores del historial:', error);
    }
  }

  // Invalidar cache (forzar recarga desde servidor)
  invalidate(): void {
    this.clear();
    console.log('🔄 Cache de historial invalidado');
  }

  // Limpiar cache completamente
  clear(): void {
    if (!this.isClient()) return;
    
    try {
      localStorage.removeItem(this.config.storageKey);
      localStorage.removeItem(this.usageStatsKey);
      console.log('🧹 Cache de historial limpiado');
    } catch (error) {
      console.error('Error al limpiar cache de historial:', error);
    }
  }

  // --- Métodos privados ---

  private getCacheData(): Record<string, CacheEntry<HistoryEntry>> {
    if (!this.isClient()) return {};
    
    try {
      const cached = localStorage.getItem(this.config.storageKey);
      if (!cached) return {};

      const cacheData = JSON.parse(cached);
      return cacheData.data || {};
    } catch {
      return {};
    }
  }

  private saveCache(data: Record<string, CacheEntry<HistoryEntry>>): void {
    if (!this.isClient()) return;
    
    const cacheData = {
      version: this.config.version,
      data,
      lastUpdated: Date.now()
    };

    localStorage.setItem(this.config.storageKey, JSON.stringify(cacheData));
  }

  private applyLRULimit(data: Record<string, CacheEntry<HistoryEntry>>): Record<string, CacheEntry<HistoryEntry>> {
    const entries = Object.entries(data);
    
    if (entries.length <= this.config.maxSize) {
      return data;
    }

    // Ordenar por última vez accedido (LRU)
    entries.sort(([, a], [, b]) => b.lastAccessed - a.lastAccessed);
    
    // Mantener solo los más recientes
    const limitedEntries = entries.slice(0, this.config.maxSize);
    
    console.log(`🔄 Cache LRU del historial: manteniendo ${this.config.maxSize} de ${entries.length} entradas`);
    
    return Object.fromEntries(limitedEntries);
  }

  private updateUsageStats(entries: HistoryEntry[]): void {
    if (!this.isClient()) return;
    
    try {
      const stats: HistoryUsageStats[] = entries.map(entry => ({
        entryId: entry.id,
        accessCount: 0, // Empezar en 0
        lastAccessed: Date.now(),
        createdAt: new Date(entry.created_at).getTime()
      }));

      localStorage.setItem(this.usageStatsKey, JSON.stringify(stats));
    } catch (error) {
      console.error('Error al actualizar estadísticas de uso del historial:', error);
    }
  }

  private cleanup(): void {
    // Limpiar caches antiguos o corruptos al inicializar
    if (!this.isClient()) return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('notasai_history_cache_') || key.startsWith('notasai_history_usage_')) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              // Si no tiene versión o es una versión antigua, eliminar
              if (!parsed.version || parsed.version < this.config.version) {
                localStorage.removeItem(key);
                console.log(`🧹 Cache de historial antiguo eliminado: ${key}`);
              }
            }
          } catch {
            localStorage.removeItem(key);
            console.log(`🧹 Cache de historial corrupto eliminado: ${key}`);
          }
        }
      });
    } catch (error) {
      console.error('Error durante cleanup del cache de historial:', error);
    }
  }
}

// Instancia singleton del servicio de cache de historial
export const historyCacheService = new HistoryCacheService();

// Hook para estadísticas del cache de historial
export const useHistoryCacheStats = () => {
  const getStats = () => historyCacheService.getCacheStats();
  const getMostUsed = (limit?: number) => historyCacheService.getMostUsedEntries(limit);
  const invalidate = () => historyCacheService.invalidate();
  const clear = () => historyCacheService.clear();
  const resetCounters = () => historyCacheService.resetAccessCounters();
  const recordAccess = (entryId: string) => historyCacheService.recordHistoryAccess(entryId);

  return {
    getStats,
    getMostUsed,
    invalidate,
    clear,
    resetCounters,
    recordAccess
  };
}; 