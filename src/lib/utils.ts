import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Limpia la URL actual de parámetros de autenticación
 * Esto evita bucles de redirección y URLs sucias
 */
export function cleanAuthUrl(): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  let shouldClean = false;
  
  // Parámetros de query que deben ser removidos
  const authParams = ['error', 'error_description', 'state', 'code'];
  authParams.forEach(param => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      shouldClean = true;
    }
  });
  
  // Limpiar hash si contiene tokens de autenticación
  if (url.hash.includes('access_token') || url.hash.includes('refresh_token')) {
    url.hash = '';
    shouldClean = true;
  }
  
  // Aplicar cambios si es necesario
  if (shouldClean) {
    window.history.replaceState({}, document.title, url.toString());
  }
}

/**
 * Retrasa la ejecución de una función
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verifica si estamos en el cliente
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Maneja errores de autenticación de forma consistente
 */
export function handleAuthError(error: any): string {
  if (!error) return 'Error desconocido';
  
  if (typeof error === 'string') return error;
  
  if (error.message) {
    // Mensajes específicos de Supabase
    if (error.message.includes('Invalid login credentials')) {
      return 'Credenciales de acceso inválidas';
    }
    if (error.message.includes('Email not confirmed')) {
      return 'Email no confirmado';
    }
    if (error.message.includes('User not found')) {
      return 'Usuario no encontrado';
    }
    if (error.message.includes('Invalid refresh token')) {
      return 'Sesión expirada. Por favor, inicia sesión nuevamente';
    }
    if (error.message.includes('Network error')) {
      return 'Error de conexión. Verifica tu conexión a internet';
    }
    
    return error.message;
  }
  
  return 'Error inesperado durante la autenticación';
} 