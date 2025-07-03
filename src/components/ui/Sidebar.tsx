
import React from 'react';
import { Theme, ActiveView } from '../types'; // Import ActiveView
import { SunIcon, MoonIcon, DocumentTextIcon, PencilSquareIcon, SparklesIcon, ClockIcon } from './Icons';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, theme, toggleTheme }) => {
  const navItems = [
    { id: 'generate', label: 'Generar Nota', icon: <PencilSquareIcon className="h-5 w-5" /> },
    { id: 'templates', label: 'Editor de Plantillas', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { id: 'history', label: 'Historial de Notas', icon: <ClockIcon className="h-5 w-5" /> },
  ];

  return (
    <aside className="w-64 bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 flex flex-col h-full shadow-lg fixed top-0 left-0 z-40 border-r border-neutral-200 dark:border-neutral-700">
      {/* Logo/Branding */}
      <div className="p-5 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
        <SparklesIcon className="h-8 w-8 mr-2 text-secondary dark:text-dark-secondary" />
        <h1 className="text-2xl font-bold text-primary dark:text-dark-primary">
          NOTASAI
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-grow p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as ActiveView)}
            className={`
              w-full flex items-center space-x-3 px-3 py-2.5 rounded-md
              text-sm font-medium
              transition-all duration-200 ease-in-out group
              focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 focus:ring-primary 
              ${
                activeView === item.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'hover:bg-primary-light/20 dark:hover:bg-dark-primary/20 text-neutral-700 dark:text-neutral-300 hover:text-primary dark:hover:text-dark-primary'
              }
            `}
            aria-current={activeView === item.id ? 'page' : undefined}
          >
            {React.cloneElement(item.icon, { 
              className: `h-5 w-5 ${activeView === item.id ? 'text-white' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-primary dark:group-hover:text-dark-primary transition-colors'}`
            })}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 focus:ring-primary text-neutral-700 dark:text-neutral-300 transition-colors group"
          aria-label={theme === Theme.Light ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
          {theme === Theme.Light ? (
            <MoonIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400 group-hover:text-primary dark:group-hover:text-dark-primary" />
          ) : (
            <SunIcon className="h-5 w-5 text-yellow-500 group-hover:text-yellow-400" />
          )}
          <span>
            {theme === Theme.Light ? 'Modo Oscuro' : 'Modo Claro'}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
