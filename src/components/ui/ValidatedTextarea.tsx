import React, { forwardRef } from 'react';
import { useRealTimeValidation } from '@/hooks/useRealTimeValidation';
import TextareaWithSpeech from './TextareaWithSpeech';
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from './Icons';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => string | null;
}

interface ValidatedTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  fieldName: string;
  validationRules?: ValidationRule;
  placeholder?: string;
  label?: string;
  rows?: number;
  className?: string;
  showCharacterCount?: boolean;
  speechLanguage?: string;
  speechDisabled?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
}

export const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(({
  value,
  onChange,
  fieldName,
  validationRules = {},
  placeholder,
  label,
  rows = 4,
  className = '',
  showCharacterCount = true,
  speechLanguage = 'es-ES',
  speechDisabled = false,
  disabled = false,
  onBlur,
  onFocus,
  ...props
}, ref) => {
  const {
    handleFieldChange,
    markFieldAsTouched,
    getFieldValidation,
    getFieldClasses
  } = useRealTimeValidation({
    [fieldName]: validationRules
  });

  const validation = getFieldValidation(fieldName);
  const baseClasses = 'w-full p-2.5 sm:p-3 pr-10 sm:pr-12 border rounded-lg resize-y bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:ring-2 transition-colors text-sm sm:text-base leading-relaxed';
  const validatedClasses = getFieldClasses(fieldName, baseClasses);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(e);
    handleFieldChange(fieldName, newValue);
  };

  const handleBlur = () => {
    markFieldAsTouched(fieldName);
    if (onBlur) onBlur();
  };

  const handleFocus = () => {
    if (onFocus) onFocus();
  };

  const renderValidationIcon = () => {
    if (!validation?.hasBeenTouched) return null;

    if (validation.error) {
      return (
        <div className="absolute top-2.5 sm:top-3 right-10 sm:right-12">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
        </div>
      );
    }

    if (validation.warning) {
      return (
        <div className="absolute top-2.5 sm:top-3 right-10 sm:right-12">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
        </div>
      );
    }

    if (validation.isValid && value.trim().length > 0) {
      return (
        <div className="absolute top-2.5 sm:top-3 right-10 sm:right-12">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        </div>
      );
    }

    return null;
  };

  const renderValidationMessage = () => {
    if (!validation?.hasBeenTouched) return null;

    if (validation.error) {
      return (
        <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
          <ExclamationCircleIcon className="h-4 w-4" />
          {validation.error}
        </div>
      );
    }

    if (validation.warning) {
      return (
        <div className="flex items-center gap-1 mt-1 text-sm text-yellow-600 dark:text-yellow-400">
          <ExclamationTriangleIcon className="h-4 w-4" />
          {validation.warning}
        </div>
      );
    }

    return null;
  };

  const renderCharacterCount = () => {
    if (!showCharacterCount) return null;

    const maxLength = validationRules.maxLength;
    const currentLength = value.length;
    
    let countClasses = 'text-xs text-neutral-500 dark:text-neutral-400';
    
    if (maxLength) {
      const percentage = (currentLength / maxLength) * 100;
      if (percentage >= 90) {
        countClasses = 'text-xs text-red-600 dark:text-red-400 font-medium';
      } else if (percentage >= 75) {
        countClasses = 'text-xs text-yellow-600 dark:text-yellow-400';
      } else if (validation?.isValid && currentLength > 0) {
        countClasses = 'text-xs text-green-600 dark:text-green-400';
      }
    }

    return (
      <div className="flex justify-end mt-1">
        <span className={countClasses}>
          {currentLength}{maxLength ? ` / ${maxLength}` : ''} caracteres
        </span>
      </div>
    );
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          {label}
          {validationRules.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}
      
      <div className="relative">
        <TextareaWithSpeech
          ref={ref}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          speechLanguage={speechLanguage}
          speechDisabled={speechDisabled}
          showCharacterCount={false} // Manejamos el contador nosotros
          className={`${validatedClasses} ${className}`}
          {...props}
        />
        
        {renderValidationIcon()}
      </div>
      
      {renderValidationMessage()}
      {renderCharacterCount()}
    </div>
  );
});

ValidatedTextarea.displayName = 'ValidatedTextarea'; 