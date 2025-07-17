'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'embed';
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-12', 
  lg: 'h-16',
  xl: 'h-20'
};

const CanvaLogoEmbed: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-full overflow-hidden rounded-lg shadow-sm ${className}`} style={{ 
    height: '0', 
    paddingTop: '40%',
    maxWidth: '300px'
  }}>
    <iframe 
      loading="lazy" 
      style={{ 
        position: 'absolute', 
        width: '100%', 
        height: '100%', 
        top: '0', 
        left: '0', 
        border: 'none', 
        padding: '0',
        margin: '0'
      }}
      src="https://www.canva.com/design/DAGtWoipHRA/rhwQqdK_PmICWeoAVBYeVA/view?embed" 
      allowFullScreen
      allow="fullscreen"
      title="ClinicAI Logo"
    />
  </div>
);

const SimpleClinicAILogo: React.FC<{ size: string; className?: string }> = ({ size, className = '' }) => (
  <div className={`flex items-center justify-center ${size} ${className}`}>
    <div className="flex items-center gap-2">
      {/* Ícono de estetoscopio estilizado */}
      <div className="relative">
        <svg viewBox="0 0 100 100" className="w-full h-full text-blue-600" fill="currentColor">
          <path d="M20 30 Q20 20, 30 20 Q40 20, 40 30 L40 50 Q40 70, 60 70 Q80 70, 80 50 L80 30 Q80 20, 70 20 Q60 20, 60 30" 
                stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <circle cx="30" cy="25" r="8" strokeWidth="3" stroke="currentColor" fill="none"/>
          <circle cx="70" cy="25" r="8" strokeWidth="3" stroke="currentColor" fill="none"/>
          <circle cx="60" cy="75" r="12" fill="currentColor"/>
        </svg>
      </div>
      {/* Texto del logo */}
      <div className="flex items-baseline">
        <span className="font-bold text-blue-900 dark:text-blue-100">Clinic</span>
        <span className="font-bold text-blue-600 dark:text-blue-400">AI</span>
      </div>
    </div>
  </div>
);

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  variant = 'full'
}) => {
  const logoClass = `${sizeClasses[size]} w-auto ${className}`;

  if (variant === 'embed') {
    return <CanvaLogoEmbed className={className} />;
  }

  return <SimpleClinicAILogo size={logoClass} className={className} />;
};

export default Logo; 