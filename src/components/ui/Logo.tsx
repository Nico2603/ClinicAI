'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only';
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-16',
  xl: 'h-20'
};

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  variant = 'full' 
}) => {
  const logoClass = `${sizeClasses[size]} w-auto ${className}`;

  return (
    <Image
      src="/logo.png"
      alt="ClinicAI"
      width={200}
      height={80}
      className={logoClass}
      priority
    />
  );
};

export default Logo; 