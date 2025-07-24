import { useState, useEffect, useCallback, useMemo } from 'react';
import { validateText, validateAIInput } from '@/lib/utils/simpleValidation';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => string | null;
}

interface FieldValidation {
  isValid: boolean;
  error: string | null;
  warning: string | null;
  hasBeenTouched: boolean;
}

interface ValidationState {
  [fieldName: string]: FieldValidation;
}

export const useRealTimeValidation = (
  validationRules: Record<string, ValidationRule>
) => {
  const [validationState, setValidationState] = useState<ValidationState>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Inicializar estado de validación
  useEffect(() => {
    const initialState: ValidationState = {};
    Object.keys(validationRules).forEach(fieldName => {
      initialState[fieldName] = {
        isValid: true,
        error: null,
        warning: null,
        hasBeenTouched: false
      };
    });
    setValidationState(initialState);
  }, [validationRules]);

  // Validar un campo específico
  const validateField = useCallback((fieldName: string, value: string): FieldValidation => {
    const rules = validationRules[fieldName];
    if (!rules) {
      return {
        isValid: true,
        error: null,
        warning: null,
        hasBeenTouched: touchedFields.has(fieldName)
      };
    }

    let error: string | null = null;
    let warning: string | null = null;

    // Validación requerido
    if (rules.required && (!value || value.trim().length === 0)) {
      error = 'Este campo es requerido';
    }

    // Validación longitud mínima
    if (!error && rules.minLength && value.length < rules.minLength) {
      error = `Debe tener al menos ${rules.minLength} caracteres`;
    }

    // Validación longitud máxima
    if (!error && rules.maxLength && value.length > rules.maxLength) {
      error = `No puede tener más de ${rules.maxLength} caracteres`;
    }

    // Validación patrón
    if (!error && rules.pattern && !rules.pattern.test(value)) {
      error = 'Formato inválido';
    }

    // Validador personalizado
    if (!error && rules.customValidator) {
      error = rules.customValidator(value);
    }

    // Advertencias para longitud
    if (!error && rules.maxLength) {
      const remaining = rules.maxLength - value.length;
      if (remaining < 100 && remaining > 0) {
        warning = `${remaining} caracteres restantes`;
      }
    }

    // Validación específica para contenido de IA
    if (!error && fieldName.includes('content') && value.length > 0) {
      const aiValidationError = validateAIInput(value);
      if (aiValidationError) {
        error = aiValidationError;
      }
    }

    return {
      isValid: error === null,
      error,
      warning,
      hasBeenTouched: touchedFields.has(fieldName)
    };
  }, [validationRules, touchedFields]);

  // Manejar cambio de valor en campo
  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    const validation = validateField(fieldName, value);
    
    setValidationState(prev => ({
      ...prev,
      [fieldName]: validation
    }));
  }, [validateField]);

  // Marcar campo como tocado
  const markFieldAsTouched = useCallback((fieldName: string) => {
    setTouchedFields(prev => new Set(Array.from(prev).concat(fieldName)));
    
    setValidationState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isValid: prev[fieldName]?.isValid ?? true,
        error: prev[fieldName]?.error ?? null,
        warning: prev[fieldName]?.warning ?? null,
        hasBeenTouched: true
      }
    }));
  }, []);

  // Resetear validación
  const resetValidation = useCallback(() => {
    const resetState: ValidationState = {};
    Object.keys(validationRules).forEach(fieldName => {
      resetState[fieldName] = {
        isValid: true,
        error: null,
        warning: null,
        hasBeenTouched: false
      };
    });
    setValidationState(resetState);
    setTouchedFields(new Set());
  }, [validationRules]);

  // Validar todos los campos
  const validateAllFields = useCallback((values: Record<string, string>) => {
    const newValidationState: ValidationState = {};
    const newTouchedFields = new Set<string>();

    Object.entries(values).forEach(([fieldName, value]) => {
      if (validationRules[fieldName]) {
        newTouchedFields.add(fieldName);
        newValidationState[fieldName] = {
          ...validateField(fieldName, value),
          hasBeenTouched: true
        };
      }
    });

    setTouchedFields(newTouchedFields);
    setValidationState(newValidationState);

    return Object.values(newValidationState).every(field => field.isValid);
  }, [validateField, validationRules]);

  // Crear handlers para input
  const createFieldHandlers = useCallback((fieldName: string) => {
    return {
      onChange: (value: string) => handleFieldChange(fieldName, value),
      onBlur: () => markFieldAsTouched(fieldName),
      onFocus: () => {
        // Opcional: limpiar errores al enfocar
      }
    };
  }, [handleFieldChange, markFieldAsTouched]);

  // Obtener clases CSS para styling
  const getFieldClasses = useCallback((fieldName: string, baseClasses = '') => {
    const field = validationState[fieldName];
    if (!field) return baseClasses;

    const classes = [baseClasses];

    if (field.hasBeenTouched) {
      if (field.error) {
        classes.push('border-red-500 focus:border-red-500 focus:ring-red-500');
      } else if (field.isValid) {
        classes.push('border-green-500 focus:border-green-500 focus:ring-green-500');
      }
    }

    return classes.join(' ');
  }, [validationState]);

  // Estado general de validación
  const formValidation = useMemo(() => {
    const allFields = Object.values(validationState);
    const touchedFieldsArray = Object.entries(validationState)
      .filter(([_, field]) => field.hasBeenTouched);

    return {
      isValid: allFields.every(field => field.isValid),
      hasErrors: allFields.some(field => field.error !== null),
      hasWarnings: allFields.some(field => field.warning !== null),
      touchedFieldsCount: touchedFieldsArray.length,
      totalFieldsCount: allFields.length,
      errorCount: allFields.filter(field => field.error !== null).length
    };
  }, [validationState]);

  return {
    validationState,
    formValidation,
    handleFieldChange,
    markFieldAsTouched,
    resetValidation,
    validateAllFields,
    createFieldHandlers,
    getFieldClasses,
    
    // Helpers para campos específicos
    getFieldValidation: (fieldName: string) => validationState[fieldName],
    isFieldValid: (fieldName: string) => validationState[fieldName]?.isValid ?? true,
    getFieldError: (fieldName: string) => validationState[fieldName]?.error,
    getFieldWarning: (fieldName: string) => validationState[fieldName]?.warning,
    hasFieldBeenTouched: (fieldName: string) => validationState[fieldName]?.hasBeenTouched ?? false,
  };
}; 