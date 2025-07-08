'use client';

import React, { useState, useEffect } from 'react';
import { Theme, ActiveView } from '../../types'; // Import ActiveView
import { SunIcon, MoonIcon, DocumentTextIcon, PencilSquareIcon, SparklesIcon, ClockIcon, EditIcon } from './Icons';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, theme, toggleTheme }) => {
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
    { id: 'generate', label: 'Generar Nota', icon: <PencilSquareIcon className="h-5 w-5" /> },
    { id: 'templates', label: 'Editor de Plantillas', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { id: 'note-updater', label: 'Actualizador de Notas', icon: <EditIcon className="h-5 w-5" /> },
    { id: 'notes', label: 'Mis Notas', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { id: 'history', label: 'Historial Local', icon: <ClockIcon className="h-5 w-5" /> },
  ];

  const handleNavClick = (view: ActiveView) => {
    setActiveView(view);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
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
        <nav className="flex-grow p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
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
              `}
              aria-current={activeView === item.id ? 'page' : undefined}
            >
              {React.cloneElement(item.icon, { 
                className: `h-5 w-5 ${activeView === item.id ? 'text-white' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-primary transition-colors'}`
              })}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 focus:ring-primary text-neutral-700 dark:text-neutral-300 transition-colors group"
            aria-label={theme === Theme.Light ? 'Activar modo oscuro' : 'Activar modo claro'}
          >
            {theme === Theme.Light ? (
              <MoonIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400 group-hover:text-primary" />
            ) : (
              <SunIcon className="h-5 w-5 text-yellow-500 group-hover:text-yellow-400" />
            )}
            <span className="truncate">
              {theme === Theme.Light ? 'Modo Oscuro' : 'Modo Claro'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
