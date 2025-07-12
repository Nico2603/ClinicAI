import { Theme, Templates, HistoricNote } from '../../types';

const THEME_KEY = 'notasai_theme';
const TEMPLATES_KEY = 'notasai_templates';
const HISTORY_KEY = 'notasai_history';

// Favoritos de plantillas

const getUserFavoritesKey = (userId: string): string => `notasai_fav_templates_${userId}`;

// Tipos
interface FavoriteTemplate {
  id: string; // uuid
  name: string;
  content: string;
  specialty_id?: string;
  created_at: string;
}

// User-specific storage keys
const getUserTemplatesKey = (userId: string): string => `notasai_templates_${userId}`;
const getUserHistoryKey = (userId: string): string => `notasai_history_${userId}`;

// Empty templates object since predefined templates were removed
const EMPTY_TEMPLATES: Templates = {};

export const getThemePreference = (): Theme => {
  const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
  return storedTheme || Theme.Light; // Default to light theme
};

export const setThemePreference = (theme: Theme): void => {
  localStorage.setItem(THEME_KEY, theme);
};

export const getStoredTemplates = (): Templates => {
  const storedTemplates = localStorage.getItem(TEMPLATES_KEY);
  if (storedTemplates) {
    try {
      return JSON.parse(storedTemplates);
    } catch (error) {
      console.error("Failed to parse stored templates:", error);
      // Fallback to empty object if parsing fails
      return { ...EMPTY_TEMPLATES };
    }
  }
  return { ...EMPTY_TEMPLATES }; // Return a copy to avoid mutation
};

export const saveTemplates = (templates: Templates): void => {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error("Failed to save templates:", error);
  }
};

export const getStoredHistoricNotes = (): HistoricNote[] => {
  const storedHistory = localStorage.getItem(HISTORY_KEY);
  if (storedHistory) {
    try {
      return JSON.parse(storedHistory);
    } catch (error) {
      console.error("Failed to parse stored historic notes:", error);
      return [];
    }
  }
  return [];
};

export const saveHistoricNotes = (notes: HistoricNote[]): void => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error("Failed to save historic notes:", error);
  }
};

// Helper to add a new note and save, keeping a reasonable limit (e.g., last 50 notes)
export const addHistoricNoteEntry = (newNote: HistoricNote): HistoricNote[] => {
  let notes = getStoredHistoricNotes();
  notes.unshift(newNote); // Add to the beginning
  if (notes.length > 50) { // Keep only the last 50 notes
    notes = notes.slice(0, 50);
  }
  saveHistoricNotes(notes);
  return notes;
};

// User-specific storage functions
export const getUserStoredTemplates = (userId: string): Templates => {
  const storedTemplates = localStorage.getItem(getUserTemplatesKey(userId));
  if (storedTemplates) {
    try {
      return JSON.parse(storedTemplates);
    } catch (error) {
      console.error("Failed to parse stored user templates:", error);
      return { ...EMPTY_TEMPLATES };
    }
  }
  return { ...EMPTY_TEMPLATES };
};

export const saveUserTemplates = (userId: string, templates: Templates): void => {
  try {
    localStorage.setItem(getUserTemplatesKey(userId), JSON.stringify(templates));
  } catch (error) {
    console.error("Failed to save user templates:", error);
  }
};

export const getUserStoredHistoricNotes = (userId: string): HistoricNote[] => {
  const storedHistory = localStorage.getItem(getUserHistoryKey(userId));
  if (storedHistory) {
    try {
      return JSON.parse(storedHistory);
    } catch (error) {
      console.error("Failed to parse stored user historic notes:", error);
      return [];
    }
  }
  return [];
};

export const saveUserHistoricNotes = (userId: string, notes: HistoricNote[]): void => {
  try {
    localStorage.setItem(getUserHistoryKey(userId), JSON.stringify(notes));
  } catch (error) {
    console.error("Failed to save user historic notes:", error);
  }
};

export const addUserHistoricNoteEntry = (userId: string, newNote: HistoricNote): HistoricNote[] => {
  let notes = getUserStoredHistoricNotes(userId);
  notes.unshift(newNote); // Add to the beginning
  if (notes.length > 50) { // Keep only the last 50 notes
    notes = notes.slice(0, 50);
  }
  saveUserHistoricNotes(userId, notes);
  return notes;
};

// Utility function to clear user data (for logout)
export const clearUserData = (userId: string): void => {
  localStorage.removeItem(getUserTemplatesKey(userId));
  localStorage.removeItem(getUserHistoryKey(userId));
};

export const getUserFavoriteTemplates = (userId: string): FavoriteTemplate[] => {
  const stored = localStorage.getItem(getUserFavoritesKey(userId));
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse favorite templates:', error);
      return [];
    }
  }
  return [];
};

export const saveUserFavoriteTemplates = (userId: string, templates: FavoriteTemplate[]): void => {
  try {
    localStorage.setItem(getUserFavoritesKey(userId), JSON.stringify(templates));
  } catch (error) {
    console.error('Failed to save favorite templates:', error);
  }
};

export const addUserFavoriteTemplate = (userId: string, template: Omit<FavoriteTemplate, 'id' | 'created_at'>): FavoriteTemplate[] => {
  const favorites = getUserFavoriteTemplates(userId);
  const newFav: FavoriteTemplate = {
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    ...template,
  };
  const updated = [...favorites, newFav];
  saveUserFavoriteTemplates(userId, updated);
  return updated;
};

export const removeUserFavoriteTemplate = (userId: string, favId: string): FavoriteTemplate[] => {
  const favorites = getUserFavoriteTemplates(userId).filter(f => f.id !== favId);
  saveUserFavoriteTemplates(userId, favorites);
  return favorites;
};

// Funciones de limpieza completa para manejo de sesiones
export const clearAllUserData = (userId?: string): void => {
  try {
    if (userId) {
      // Limpiar datos específicos del usuario
      localStorage.removeItem(getUserTemplatesKey(userId));
      localStorage.removeItem(getUserHistoryKey(userId));
      localStorage.removeItem(getUserFavoritesKey(userId));
    }
    
    // Limpiar datos generales
    localStorage.removeItem(TEMPLATES_KEY);
    localStorage.removeItem(HISTORY_KEY);
    
    console.log('✅ Datos de usuario limpiados del localStorage');
  } catch (error) {
    console.error('❌ Error al limpiar datos del usuario:', error);
  }
};

export const clearAllApplicationData = (): void => {
  try {
    // Obtener todas las claves que empiecen con 'notasai_'
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('notasai_')) {
        keysToRemove.push(key);
      }
    }
    
    // Remover las claves encontradas
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log(`✅ ${keysToRemove.length} elementos de la aplicación limpiados`);
  } catch (error) {
    console.error('❌ Error al limpiar datos de la aplicación:', error);
  }
};

export const clearAllSessionData = (): void => {
  try {
    // Limpiar sessionStorage
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('notasai_')) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log(`✅ ${sessionKeysToRemove.length} elementos de sesión limpiados`);
  } catch (error) {
    console.error('❌ Error al limpiar datos de sesión:', error);
  }
};

export const performCompleteCleanup = (userId?: string): void => {
  console.log('🧹 Iniciando limpieza completa de datos...');
  
  try {
    clearAllUserData(userId);
    clearAllApplicationData();
    clearAllSessionData();
    
    console.log('✅ Limpieza completa finalizada');
  } catch (error) {
    console.error('❌ Error durante la limpieza completa:', error);
  }
};

export const getStorageStats = (userId?: string): {
  userTemplates: number;
  userHistory: number;
  userFavorites: number;
  globalTemplates: number;
  globalHistory: number;
  totalItems: number;
} => {
  try {
    const stats = {
      userTemplates: userId ? Object.keys(getUserStoredTemplates(userId)).length : 0,
      userHistory: userId ? getUserStoredHistoricNotes(userId).length : 0,
      userFavorites: userId ? getUserFavoriteTemplates(userId).length : 0,
      globalTemplates: Object.keys(getStoredTemplates()).length,
      globalHistory: getStoredHistoricNotes().length,
      totalItems: 0
    };
    
    stats.totalItems = stats.userTemplates + stats.userHistory + stats.userFavorites + 
                      stats.globalTemplates + stats.globalHistory;
    
    return stats;
  } catch (error) {
    console.error('❌ Error al obtener estadísticas de almacenamiento:', error);
    return {
      userTemplates: 0,
      userHistory: 0,
      userFavorites: 0,
      globalTemplates: 0,
      globalHistory: 0,
      totalItems: 0
    };
  }
};
