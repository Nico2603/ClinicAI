import { VALIDATION_RULES, ERROR_MESSAGES } from '../constants';

// Validaciones simples para la aplicación

export const validateText = (text: string, fieldName: string = 'campo'): string | null => {
  if (!text || text.trim().length === 0) {
    return `${fieldName} es requerido`;
  }
  
  if (text.trim().length < VALIDATION_RULES.MIN_TEXT_LENGTH) {
    return `${fieldName} debe tener al menos ${VALIDATION_RULES.MIN_TEXT_LENGTH} caracteres`;
  }
  
  if (text.length > VALIDATION_RULES.MAX_TEXT_LENGTH) {
    return `${fieldName} es demasiado largo (máximo ${VALIDATION_RULES.MAX_TEXT_LENGTH} caracteres)`;
  }
  
  return null;
};

export const validateTemplateName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return 'El nombre de la plantilla es requerido';
  }
  
  if (name.length > VALIDATION_RULES.MAX_TEMPLATE_NAME_LENGTH) {
    return `El nombre es demasiado largo (máximo ${VALIDATION_RULES.MAX_TEMPLATE_NAME_LENGTH} caracteres)`;
  }
  
  return null;
};

// Función simple para validar entrada antes de enviar a IA
export const validateAIInput = (input: string): string | null => {
  return validateText(input, 'El contenido');
};

// Función simple para verificar API key
export const hasApiKey = (): boolean => {
  return !!process.env.NEXT_PUBLIC_OPENAI_API_KEY;
}; 