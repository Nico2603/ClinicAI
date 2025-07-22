/**
 * ClínicAI - Asistente de IA para Notas Clínicas
 * 
 * Autor: Nicolas Ceballos Brito
 * Portfolio: https://nico2603.github.io/PersonalPage/
 * GitHub: https://github.com/Nico2603
 * LinkedIn: https://www.linkedin.com/in/nicolas-ceballos-brito/
 * 
 * Desarrollado para Teilur.ai
 */

// =============================================================================
// UTILIDADES DE FORMATO
// =============================================================================

export const formatDateTime = (date: Date): string => {
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDateOnly = (date: Date): string => {
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatTimeOnly = (date: Date): string => {
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// =============================================================================
// UTILIDADES DE TEXTO
// =============================================================================

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const capitalizeFirstLetter = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const removeExtraSpaces = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim();
};

export const sanitizeText = (text: string): string => {
  return removeExtraSpaces(text.replace(/[^\w\s.-]/g, ''));
};

// =============================================================================
// UTILIDADES DE VALIDACIÓN DE FORMATO
// =============================================================================

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
};

export const isValidDateString = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// =============================================================================
// UTILIDADES DE FORMATO DE NOTAS MÉDICAS
// =============================================================================

export const formatPatientName = (name: string): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => capitalizeFirstLetter(word.toLowerCase()))
    .join(' ');
};

export const formatDiagnosis = (diagnosis: string): string => {
  if (!diagnosis) return '';
  return capitalizeFirstLetter(diagnosis.toLowerCase());
};

export const formatMedication = (medication: string): string => {
  if (!medication) return '';
  return capitalizeFirstLetter(medication.toLowerCase());
};

export const formatVitalSigns = (vitalSigns: {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  respiratoryRate?: string;
  oxygenSaturation?: string;
}): string => {
  const signs = [];
  
  if (vitalSigns.bloodPressure) {
    signs.push(`TA: ${vitalSigns.bloodPressure} mmHg`);
  }
  if (vitalSigns.heartRate) {
    signs.push(`FC: ${vitalSigns.heartRate} lpm`);
  }
  if (vitalSigns.respiratoryRate) {
    signs.push(`FR: ${vitalSigns.respiratoryRate} rpm`);
  }
  if (vitalSigns.temperature) {
    signs.push(`T°: ${vitalSigns.temperature}°C`);
  }
  if (vitalSigns.oxygenSaturation) {
    signs.push(`Sat O2: ${vitalSigns.oxygenSaturation}%`);
  }
  
  return signs.join(', ');
};

// =============================================================================
// UTILIDADES DE CONVERSIÓN
// =============================================================================

export const convertToTitleCase = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => capitalizeFirstLetter(word))
    .join(' ');
};

export const convertToSentenceCase = (text: string): string => {
  if (!text) return '';
  return capitalizeFirstLetter(text.toLowerCase());
};

export const convertLineBreaksToHtml = (text: string): string => {
  return text.replace(/\n/g, '<br>');
};

export const convertHtmlToLineBreaks = (html: string): string => {
  return html.replace(/<br\s*\/?>/gi, '\n');
};

// =============================================================================
// UTILIDADES DE EXTRACCIÓN
// =============================================================================

export const extractNumbersFromText = (text: string): number[] => {
  const matches = text.match(/\d+\.?\d*/g);
  return matches ? matches.map(Number) : [];
};

export const extractEmailsFromText = (text: string): string[] => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
};

export const extractDatesFromText = (text: string): string[] => {
  const dateRegex = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g;
  return text.match(dateRegex) || [];
};

// =============================================================================
// UTILIDADES DE HASH Y IDENTIFICADORES
// =============================================================================

export const generateSimpleHash = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

export const generateTimestampId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const generateReadableId = (prefix: string = 'id'): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}_${timestamp}_${random}`;
}; 