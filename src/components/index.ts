// =============================================================================
// BARREL EXPORTS - COMPONENTES
// =============================================================================

// Componentes principales
export { default as AuthenticatedApp } from './AuthenticatedApp';
export { default as Providers } from './Providers';
export { default as ClientOnly } from './ClientOnly';
export { default as ThemeProvider } from './ThemeProvider';

// Componentes de autenticación
export { default as UserProfile } from './auth/UserProfile';

// Componentes de notas
export { default as NoteDisplay } from './notes/NoteDisplay';
export { default as NoteUpdater } from './notes/NoteUpdater';
export { default as AIClinicalScales } from './notes/AIClinicalScales';
export { default as EvidenceBasedConsultation } from './notes/EvidenceBasedConsultation';
export { default as SpecialtySelector } from './notes/SpecialtySelector';
export { default as TemplateEditor } from './notes/TemplateEditor';
export { default as CustomTemplateManager } from './notes/CustomTemplateManager';

// Componentes de vistas
export { TemplatesView } from './views/TemplatesView';
export { TemplateNoteView } from './views/TemplateNoteView';
export { HistoryView } from './views/HistoryView';

// Componentes de UI
export { default as Sidebar } from './ui/Sidebar';
export { Header } from './ui/Header';
export { Footer } from './ui/Footer';
export { Logo } from './ui/Logo';
export { ProgressBar } from './ui/ProgressBar';
export { default as SpeechButton } from './ui/SpeechButton';
export { default as TextareaWithSpeech } from './ui/TextareaWithSpeech';
export { LoadingFallback } from './ui/LoadingFallback';
export { Button } from './ui/button';

// Iconos
export * from './ui/Icons';

// Spinners y loading
export { LoadingSpinner } from './ui/Icons';

// Tutorial
export { default as TutorialOverlay } from './TutorialOverlay'; 