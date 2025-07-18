'use client';

import React, { forwardRef } from 'react';
import SpeechButton from './SpeechButton';

interface TextareaWithSpeechProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSpeechChange?: (value: string) => void;
  speechLanguage?: string;
  speechDisabled?: boolean;
  showCharacterCount?: boolean;
  label?: string;
}

const TextareaWithSpeech = forwardRef<HTMLTextAreaElement, TextareaWithSpeechProps>(({
  value,
  onChange,
  onSpeechChange,
  speechLanguage = 'es-ES',
  speechDisabled = false,
  showCharacterCount = false,
  label,
  className = '',
  placeholder,
  disabled,
  rows = 4,
  ...props
}, ref) => {
  
  const handleSpeechChange = (newValue: string) => {
    if (onSpeechChange) {
      onSpeechChange(newValue);
    } else {
      // Si no se proporciona onSpeechChange, simular un evento de cambio del textarea
      const syntheticEvent = {
        target: { value: newValue },
        currentTarget: { value: newValue }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div className="w-full">
      {/* Label y contador en la parte superior */}
      {label && (
        <div className="flex justify-between items-center mb-1.5 sm:mb-2">
          <label className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label}
          </label>
          {showCharacterCount && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {value.length} caracteres
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <textarea
          ref={ref}
          value={value}
          onChange={onChange}
          className={`
            w-full p-2.5 sm:p-3 pr-10 sm:pr-12 border border-neutral-300 dark:border-neutral-600 rounded-lg resize-y 
            bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 
            placeholder-neutral-500 dark:placeholder-neutral-400 
            focus:border-primary focus:ring-primary transition-colors
            text-sm sm:text-base leading-relaxed
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          {...props}
        />
        
        {/* Botón de micrófono posicionado absolutamente */}
        <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3">
          <SpeechButton
            value={value}
            onChange={handleSpeechChange}
            disabled={speechDisabled || disabled}
            language={speechLanguage}
            placeholder="Haz clic para dictar texto"
          />
        </div>
      </div>
      
      {/* Contador de caracteres en la parte inferior si no hay label */}
      {!label && showCharacterCount && (
        <div className="flex justify-end mt-1">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {value.length} caracteres
          </span>
        </div>
      )}
    </div>
  );
});

TextareaWithSpeech.displayName = 'TextareaWithSpeech';

export default TextareaWithSpeech; 