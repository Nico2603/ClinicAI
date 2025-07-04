
import React from 'react';
import { Theme } from '../../types';
import { SunIcon, MoonIcon } from './Icons'; // Assuming Icons.tsx is created

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  return (
    <header className="bg-primary-DEFAULT dark:bg-gray-800 text-white shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">NOTASAI</h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-primary-light dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={theme === Theme.Light ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
          {theme === Theme.Light ? (
            <MoonIcon className="h-6 w-6 text-white" />
          ) : (
            <SunIcon className="h-6 w-6 text-yellow-300" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
