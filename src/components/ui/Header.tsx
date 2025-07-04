'use client';

import React from 'react';
import { useTheme } from '../ThemeProvider';
import { Sun, Moon } from 'lucide-react';

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-primary text-primary-foreground shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">NOTASAI</h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary-foreground"
          aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
          {theme === 'light' ? (
            <Moon className="h-6 w-6" />
          ) : (
            <Sun className="h-6 w-6 text-yellow-300" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;