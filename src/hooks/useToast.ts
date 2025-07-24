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

import { toast } from 'sonner';
import { SUCCESS_MESSAGES, CONFIRMATION_MESSAGES } from '@/lib/constants';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useToast = () => {
  const showSuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: options?.duration || 3000,
      action: options?.action,
      className: 'animate-in slide-in-from-right-full',
      style: {
        border: '1px solid #10b981',
        backgroundColor: '#f0fdf4',
        color: '#065f46',
      },
    });
  };

  const showError = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: options?.duration || 4000,
      action: options?.action,
      className: 'animate-in slide-in-from-right-full',
      style: {
        border: '1px solid #ef4444',
        backgroundColor: '#fef2f2',
        color: '#991b1b',
      },
    });
  };

  const showInfo = (message: string, options?: ToastOptions) => {
    toast.info(message, {
      duration: options?.duration || 3000,
      action: options?.action,
      className: 'animate-in slide-in-from-right-full',
      style: {
        border: '1px solid #3b82f6',
        backgroundColor: '#eff6ff',
        color: '#1e40af',
      },
    });
  };

  const showLoading = (message: string) => {
    return toast.loading(message, {
      className: 'animate-in slide-in-from-right-full',
    });
  };

  const showConfirmation = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    toast(message, {
      duration: 6000,
      action: {
        label: 'Confirmar',
        onClick: onConfirm,
      },
      cancel: onCancel ? {
        label: 'Cancelar',
        onClick: onCancel,
      } : undefined,
      className: 'animate-in slide-in-from-right-full',
    });
  };

  // Funciones preconfiguradas para acciones comunes
  const showSaveSuccess = () => showSuccess(SUCCESS_MESSAGES.SAVED);
  const showCreateSuccess = () => showSuccess(SUCCESS_MESSAGES.CREATED);
  const showDeleteSuccess = () => showSuccess(SUCCESS_MESSAGES.DELETED);
  const showGenerateSuccess = () => showSuccess(SUCCESS_MESSAGES.GENERATED);

  const showDeleteConfirmation = (onConfirm: () => void) => 
    showConfirmation(CONFIRMATION_MESSAGES.DELETE, onConfirm);
  
  const showClearConfirmation = (onConfirm: () => void) =>
    showConfirmation(CONFIRMATION_MESSAGES.CLEAR_ALL, onConfirm);

  return {
    showSuccess,
    showError,
    showInfo,
    showLoading,
    showConfirmation,
    showSaveSuccess,
    showCreateSuccess,
    showDeleteSuccess,
    showGenerateSuccess,
    showDeleteConfirmation,
    showClearConfirmation,
    dismiss: toast.dismiss,
  };
}; 