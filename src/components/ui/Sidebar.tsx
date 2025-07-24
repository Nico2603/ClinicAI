/**
 * ClínicAI - Asistente de IA para Notas Clínicas
 * 
 * Autor: Nicolas Ceballos Brito
 * Portfolio: https://nico2603.github.io/PersonalPage/
 * GitHub: https://github.com/Nico2603
 * LinkedIn: https://www.linkedin.com/in/nicolas-ceballos-brito/
 * 
 * Desarrollado para Teilur.ai
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Theme, ActiveView, HistoricNote, UserTemplate } from '../../types';
import { SunIcon, MoonIcon, DocumentTextIcon, PencilSquareIcon, ClockIcon, EditIcon, Logo, CheckIcon } from './Icons';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  theme: Theme;
  toggleTheme: () => void;
  historicNotes?: HistoricNote[];
  userTemplates?: UserTemplate[];
  refreshTemplates?: () => void;
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
  refreshTemplates,
  onLoadNoteInEditor,
  onLoadNoteInUpdater
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const navItems = [
    { id: 'templates', label: 'Plantillas', icon: <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6" /> },
    { id: 'nota-plantilla', label: 'Nueva nota', icon: <PencilSquareIcon className="h-5 w-5 sm:h-6 sm:w-6" /> },
    { id: 'note-updater', label: 'Actualizar nota', icon: <EditIcon className="h-5 w-5 sm:h-6 sm:w-6" /> },
    { id: 'historial-notas', label: 'Historial', icon: <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6" /> },
  ];

  const handleNavClick = (view: ActiveView) => {
    setActiveView(view);
    
    // Refrescar plantillas automáticamente al hacer clic en "Plantillas"
    if (view === 'templates' && refreshTemplates) {
      refreshTemplates();
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
  };

  const handleLoadInUpdater = (note: HistoricNote) => {
    onLoadNoteInUpdater?.(note);
    setActiveView('note-updater');
  };

  const sidebarClasses = `
    ${isMobile ? 'fixed' : 'fixed'} 
    top-0 left-0 bottom-0
    ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
    ${isMobile ? 'w-72' : 'w-64'}
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
      {/* Mobile Menu Button - Relocated to top-left */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-primary text-white shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors touch-target"
          aria-label="Abrir menú"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="p-2 sm:p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <div className="flex items-center justify-center w-full">
            <Logo size="md" className="h-6 sm:h-8" />
          </div>
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors touch-target"
              aria-label="Cerrar menú"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-2 sm:p-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleNavClick(item.id as ActiveView)}
                data-nav-item={item.id}
                className={`
                  w-full flex items-center space-x-3 sm:space-x-4 px-3 sm:px-4 py-3 sm:py-4 rounded-xl
                  text-sm sm:text-base font-semibold
                  transition-all duration-200 ease-in-out group
                  focus:outline-none focus:ring-2 focus:ring-offset-2 
                  dark:focus:ring-offset-neutral-900 focus:ring-primary
                  touch-target relative
                  ${
                    activeView === item.id
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg transform scale-[1.02] border-l-4 border-white/30'
                      : 'hover:bg-gradient-to-r hover:from-neutral-50 hover:to-neutral-100 dark:hover:from-neutral-800 dark:hover:to-neutral-750 text-neutral-700 dark:text-neutral-300 hover:text-primary dark:hover:text-primary hover:shadow-md hover:scale-[1.01]'
                  }
                `}
                aria-current={activeView === item.id ? 'page' : undefined}
              >
                {/* Active indicator */}
                {activeView === item.id && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full opacity-80"></div>
                )}
                
                <div className={`flex-shrink-0 ${activeView === item.id ? 'text-white' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-primary transition-colors'}`}>
                  {React.cloneElement(item.icon, { 
                    className: `h-5 w-5 sm:h-6 sm:w-6 ${activeView === item.id ? 'text-white drop-shadow-sm' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-primary transition-colors'}`
                  })}
                </div>
                
                <span className={`truncate text-sm sm:text-base font-semibold ${activeView === item.id ? 'text-white drop-shadow-sm' : ''}`}>
                  {item.label}
                </span>
                
                {/* Active icon indicator */}
                {activeView === item.id && (
                  <div className="ml-auto">
                    <CheckIcon className="h-4 w-4 text-white/80" />
                  </div>
                )}
              </button>
            </div>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="p-2 sm:p-3 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center space-x-3 sm:space-x-4 px-3 sm:px-4 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 ease-in-out hover:bg-gradient-to-r hover:from-neutral-50 hover:to-neutral-100 dark:hover:from-neutral-800 dark:hover:to-neutral-750 text-neutral-700 dark:text-neutral-300 hover:text-primary dark:hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 focus:ring-primary touch-target hover:shadow-md hover:scale-[1.01] group"
            aria-label={theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
          >
            <div className="flex-shrink-0">
              {theme === 'light' ? (
                <MoonIcon className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-500 dark:text-neutral-400 group-hover:text-primary transition-colors" />
              ) : (
                <SunIcon className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-500 dark:text-neutral-400 group-hover:text-primary transition-colors" />
              )}
            </div>
            <span className="truncate text-sm sm:text-base font-semibold">
              {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
