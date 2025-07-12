import { ERROR_MESSAGES, VALIDATION_RULES } from '../constants';

// =============================================================================
// VALIDACIONES GENERALES
// =============================================================================

export const validateApiKey = (apiKey?: string): void => {
  if (!apiKey) {
    throw new Error(ERROR_MESSAGES.OPENAI_API_KEY_MISSING);
  }
};

export const validateInput = (input: string, minLength: number = 1): void => {
  if (!input || input.trim().length < minLength) {
    throw new Error(`Input inválido: el texto debe tener al menos ${minLength} caracteres`);
  }
};

export const validateStringLength = (input: string, maxLength: number, fieldName: string): void => {
  if (input.length > maxLength) {
    throw new Error(`${fieldName} es demasiado largo (máximo ${maxLength} caracteres)`);
  }
};

// =============================================================================
// VALIDACIONES ESPECÍFICAS
// =============================================================================

export const validateTemplateInput = (templateContent: string, patientInfo: string): void => {
  validateInput(templateContent, 10);
  validateInput(patientInfo, VALIDATION_RULES.MIN_PATIENT_INFO_LENGTH);
  validateStringLength(patientInfo, VALIDATION_RULES.MAX_PATIENT_INFO_LENGTH, 'La información del paciente');
};

export const validateClinicalInput = (clinicalInput: string): void => {
  validateInput(clinicalInput, VALIDATION_RULES.MIN_CLINICAL_INFO_LENGTH);
  validateStringLength(clinicalInput, VALIDATION_RULES.MAX_CLINICAL_INFO_LENGTH, 'La información clínica');
};

export const validateScaleInput = (clinicalInput: string, scaleName: string): void => {
  validateClinicalInput(clinicalInput);
  validateInput(scaleName, 2);
};

// =============================================================================
// VALIDACIÓN DE RESPUESTAS
// =============================================================================

export const validateResponseContent = (content: string, context: string): void => {
  if (!content || !content.trim()) {
    throw new Error(`No se pudo generar contenido válido para ${context}`);
  }
};

// =============================================================================
// MANEJO DE ERRORES
// =============================================================================

export const handleOpenAIError = (error: unknown, context: string): Error => {
  console.error(`Error en ${context}:`, error);
  
  if (error instanceof Error) {
    // Manejar errores específicos de OpenAI
    if (error.message.includes('API key')) {
      return new Error(ERROR_MESSAGES.OPENAI_API_KEY_MISSING);
    }
    if (error.message.includes('rate limit')) {
      return new Error('Límite de API excedido. Por favor, inténtelo más tarde.');
    }
    if (error.message.includes('timeout')) {
      return new Error('Tiempo de espera agotado. Por favor, inténtelo de nuevo.');
    }
    if (error.message.includes('content_filter')) {
      return new Error('El contenido fue filtrado por políticas de seguridad.');
    }
    if (error.message.includes('tokens')) {
      return new Error('El texto es demasiado largo. Por favor, reduzca el contenido.');
    }
    
    return new Error(`Error en ${context}: ${error.message}`);
  }
  
  return new Error(`Error desconocido en ${context}`);
};

// =============================================================================
// VALIDACIÓN DE CONFIGURACIÓN
// =============================================================================

export const validateOpenAIConfiguration = (apiKey?: string): boolean => {
  return Boolean(apiKey);
};

export const validateServiceConfiguration = (config: {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): void => {
  if (!config.apiKey) {
    throw new Error(ERROR_MESSAGES.OPENAI_API_KEY_MISSING);
  }
  
  if (config.temperature && (config.temperature < 0 || config.temperature > 1)) {
    throw new Error('La temperatura debe estar entre 0 y 1');
  }
  
  if (config.maxTokens && config.maxTokens < 1) {
    throw new Error('El límite de tokens debe ser mayor a 0');
  }
}; 