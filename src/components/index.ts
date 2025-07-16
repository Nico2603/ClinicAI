// =============================================================================
// BARREL EXPORTS - COMPONENTES
// =============================================================================

// Componentes principales
export { default as AuthenticatedApp } from './AuthenticatedApp';
export { default as ClientOnly } from './ClientOnly';
export { default as Providers } from './Providers';
export { default as ThemeProvider } from './ThemeProvider';

// Componentes de autenticación
export { default as LoginButton } from './auth/LoginButton';
export { default as LoginPage } from './auth/LoginPage';
export { default as UserProfile } from './auth/UserProfile';

// Componentes de notas
export { default as AIClinicalScales } from './notes/AIClinicalScales';
export { default as CustomTemplateManager } from './notes/CustomTemplateManager';
export { default as EvidenceBasedConsultation } from './notes/EvidenceBasedConsultation';
export { default as NoteDisplay } from './notes/NoteDisplay';
export { default as NoteUpdater } from './notes/NoteUpdater';
export { default as SpecialtySelector } from './notes/SpecialtySelector';
export { default as TemplateEditor } from './notes/TemplateEditor';

// Componentes de vistas
export * from './views';

// Componentes de UI
export * from './ui/button';
export { Footer } from './ui/Footer';
export { Header } from './ui/Header';
export * from './ui/Icons';
export * from './ui/LoadingFallback';
export { default as Sidebar } from './ui/Sidebar'; 