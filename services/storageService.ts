
import { Theme, Templates, HistoricNote } from '../types';
import { DEFAULT_TEMPLATES } from '../constants';

const THEME_KEY = 'notasai_theme';
const TEMPLATES_KEY = 'notasai_templates';
const HISTORY_KEY = 'notasai_history';

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
      // Fallback to default if parsing fails
      return { ...DEFAULT_TEMPLATES };
    }
  }
  return { ...DEFAULT_TEMPLATES }; // Return a copy to avoid mutation
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
