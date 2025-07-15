'use client';

import React, { useState, useEffect } from 'react';
import { Theme, ActiveView, HistoricNote, UserTemplate } from '../../types';
import { SunIcon, MoonIcon, DocumentTextIcon, PencilSquareIcon, SparklesIcon, ClockIcon, EditIcon, LightBulbIcon, CalculatorIcon, SearchIcon } from './Icons';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  theme: Theme;
  toggleTheme: () => void;
  historicNotes?: HistoricNote[];
  userTemplates?: UserTemplate[];
  onLoadNoteInEditor?: (note: HistoricNote) => void;
  onLoadNoteInUpdater?: (note: HistoricNote) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  theme, 
  toggleTheme, 
  historicNotes = [], 
  userTemplates = [],
  onLoadNoteInEditor,
  onLoadNoteInUpdater
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const navItems = [
    { id: 'nota-plantilla', label: 'Nota con Plantilla', icon: <PencilSquareIcon className="h-5 w-5" /> },
    { id: 'historial-notas', label: 'Historial de Notas', icon: <ClockIcon className="h-5 w-5" /> },
    { id: 'templates', label: 'Editor de Plantillas', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { id: 'note-updater', label: 'Actualizador de Notas', icon: <EditIcon className="h-5 w-5" /> },
  ];

  const handleNavClick = (view: ActiveView) => {
    if (view === 'historial-notas') {
      setShowHistoryDropdown(!showHistoryDropdown);
    } else {
      setActiveView(view);
      setShowHistoryDropdown(false);
    }
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
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

  const handleLoadInEditor = (note: HistoricNote) => {
    onLoadNoteInEditor?.(note);
    setActiveView('nota-plantilla');
    setShowHistoryDropdown(false);
  };

  const handleLoadInUpdater = (note: HistoricNote) => {
    onLoadNoteInUpdater?.(note);
    setActiveView('note-updater');
    setShowHistoryDropdown(false);
  };

  const sidebarClasses = `
    ${isMobile ? 'fixed' : 'fixed'} 
    top-0 left-0 bottom-0
    ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
    w-64
    bg-white dark:bg-neutral-900 
    text-neutral-800 dark:text-neutral-200 
    flex flex-col h-screen
    shadow-lg 
    z-50
    border-r border-neutral-200 dark:border-neutral-700
    transition-transform duration-300 ease-in-out
  `;

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-primary text-white shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          aria-label="Abrir menú"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <div className="flex items-center">
            <SparklesIcon className="h-7 w-7 mr-2 text-primary" />
            <h1 className="text-lg font-bold text-primary">
              NOTASAI
            </h1>
          </div>
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Cerrar menú"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleNavClick(item.id as ActiveView)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                  text-sm font-medium
                  transition-all duration-200 ease-in-out group
                  focus:outline-none focus:ring-2 focus:ring-offset-2 
                  dark:focus:ring-offset-neutral-900 focus:ring-primary
                  ${
                    activeView === item.id
                      ? 'bg-primary text-white shadow-md'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-primary'
                  }
                  ${item.id === 'historial-notas' && showHistoryDropdown ? 'bg-neutral-100 dark:bg-neutral-800' : ''}
                `}
                aria-current={activeView === item.id ? 'page' : undefined}
              >
                {React.cloneElement(item.icon, { 
                  className: `h-5 w-5 ${activeView === item.id ? 'text-white' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-primary transition-colors'}`
                })}
                <span className="truncate">{item.label}</span>
                {item.id === 'historial-notas' && (
                  <svg 
                    className={`h-4 w-4 transition-transform ${showHistoryDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              
              {/* Historial de Notas Dropdown */}
              {item.id === 'historial-notas' && showHistoryDropdown && (
                <div className="mt-2 ml-4 space-y-1 max-h-64 overflow-y-auto">
                  {historicNotes.length === 0 ? (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 px-3 py-2">
                      No hay notas guardadas
                    </div>
                  ) : (
                    historicNotes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-2 border border-neutral-200 dark:border-neutral-700"
                      >
                        <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          {note.type === 'template' ? getTemplateName(note.specialty_id || '') : 'Nota General'}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                          {formatDate(note.timestamp)}
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleLoadInEditor(note)}
                            className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                            title="Cargar en editor"
                          >
                            Editor
                          </button>
                          <button
                            onClick={() => handleLoadInUpdater(note)}
                            className="flex-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                            title="Cargar en actualizador"
                          >
                            Actualizar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 focus:ring-primary"
            aria-label={theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
          >
            {theme === 'light' ? (
              <MoonIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            ) : (
              <SunIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            )}
            <span className="truncate">
              {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
