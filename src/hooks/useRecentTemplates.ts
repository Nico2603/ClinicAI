import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTemplate } from '@/types';

const RECENT_TEMPLATES_KEY = 'notasai_recent_templates';
const MAX_RECENT_TEMPLATES = 5;

interface RecentTemplateEntry {
  templateId: string;
  lastAccessed: string;
  accessCount: number;
}

export const useRecentTemplates = (allTemplates: UserTemplate[]) => {
  const { user } = useAuth();
  const [recentEntries, setRecentEntries] = useState<RecentTemplateEntry[]>([]);

  // Cargar recientes desde localStorage
  useEffect(() => {
    if (!user?.id) return;

    const key = `${RECENT_TEMPLATES_KEY}_${user.id}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        const entries: RecentTemplateEntry[] = JSON.parse(stored);
        setRecentEntries(entries);
      } catch (error) {
        console.error('Error loading recent templates:', error);
        setRecentEntries([]);
      }
    }
  }, [user?.id]);

  // Guardar recientes en localStorage
  const saveRecents = useCallback((entries: RecentTemplateEntry[]) => {
    if (!user?.id) return;

    const key = `${RECENT_TEMPLATES_KEY}_${user.id}`;
    localStorage.setItem(key, JSON.stringify(entries));
    setRecentEntries(entries);
  }, [user?.id]);

  // Registrar acceso a plantilla
  const recordTemplateAccess = useCallback((templateId: string) => {
    const now = new Date().toISOString();
    
    setRecentEntries(prev => {
      const existing = prev.find(entry => entry.templateId === templateId);
      let newEntries: RecentTemplateEntry[];

      if (existing) {
        // Actualizar entrada existente
        newEntries = prev.map(entry =>
          entry.templateId === templateId
            ? { ...entry, lastAccessed: now, accessCount: entry.accessCount + 1 }
            : entry
        );
      } else {
        // Crear nueva entrada
        const newEntry: RecentTemplateEntry = {
          templateId,
          lastAccessed: now,
          accessCount: 1
        };
        newEntries = [newEntry, ...prev];
      }

      // Ordenar por fecha de acceso y limitar cantidad
      newEntries = newEntries
        .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
        .slice(0, MAX_RECENT_TEMPLATES);

      // Guardar en localStorage
      if (user?.id) {
        const key = `${RECENT_TEMPLATES_KEY}_${user.id}`;
        localStorage.setItem(key, JSON.stringify(newEntries));
      }

      return newEntries;
    });
  }, [user?.id]);

  // Obtener plantillas recientes con información completa
  const recentTemplates = useMemo(() => {
    return recentEntries
      .map(entry => {
        const template = allTemplates.find(t => t.id === entry.templateId);
        return template ? { template, ...entry } : null;
      })
      .filter((item): item is { template: UserTemplate; templateId: string; lastAccessed: string; accessCount: number } => item !== null)
      .slice(0, MAX_RECENT_TEMPLATES);
  }, [recentEntries, allTemplates]);

  // Limpiar recientes
  const clearRecents = useCallback(() => {
    if (!user?.id) return;
    
    const key = `${RECENT_TEMPLATES_KEY}_${user.id}`;
    localStorage.removeItem(key);
    setRecentEntries([]);
  }, [user?.id]);

  // Remover plantilla específica de recientes
  const removeFromRecents = useCallback((templateId: string) => {
    const newEntries = recentEntries.filter(entry => entry.templateId !== templateId);
    saveRecents(newEntries);
  }, [recentEntries, saveRecents]);

  // Estadísticas
  const recentCount = recentTemplates.length;

  return {
    recentTemplates,
    recentCount,
    recordTemplateAccess,
    clearRecents,
    removeFromRecents,
    // Helpers
    isRecent: (templateId: string) => recentEntries.some(entry => entry.templateId === templateId),
    getAccessCount: (templateId: string) => recentEntries.find(entry => entry.templateId === templateId)?.accessCount || 0,
    getLastAccessed: (templateId: string) => recentEntries.find(entry => entry.templateId === templateId)?.lastAccessed
  };
}; 