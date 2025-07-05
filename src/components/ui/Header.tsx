'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './button';
import { SunIcon, MoonIcon, DocumentTextIcon, ChevronLeftIcon } from './Icons';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Theme } from '@/types';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const router = useRouter();
  const [theme, toggleTheme] = useDarkMode();

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeftIcon className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="w-6 h-6" />
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={toggleTheme}>
        {theme === Theme.Light ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
      </Button>
    </header>
  );
}; 