'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './button';
import { SunIcon, MoonIcon, ChevronLeftIcon, Logo } from './Icons';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Theme } from '@/types';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const router = useRouter();
  const [theme, toggleTheme] = useDarkMode();

  return (
    <header className="flex items-center justify-between p-3 sm:p-4 border-b bg-white dark:bg-neutral-800 sticky top-0 z-40">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="h-8 w-8 sm:h-10 sm:w-10 shrink-0"
        >
          <ChevronLeftIcon className="w-4 h-4 sm:w-6 sm:h-6" />
        </Button>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <Logo size="sm" className="h-5 sm:h-6 shrink-0" />
          <h1 className="text-base sm:text-xl font-bold truncate text-neutral-900 dark:text-neutral-100">
            {title}
          </h1>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleTheme}
        className="h-8 w-8 sm:h-10 sm:w-10 shrink-0"
      >
        {theme === Theme.Light ? (
          <MoonIcon className="w-4 h-4 sm:w-6 sm:h-6" />
        ) : (
          <SunIcon className="w-4 h-4 sm:w-6 sm:h-6" />
        )}
      </Button>
    </header>
  );
}; 