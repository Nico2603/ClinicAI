'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SessionWarningDialogProps {
  warningThreshold?: number;
  autoExtendThreshold?: number;
}

export const SessionWarningDialog: React.FC<SessionWarningDialogProps> = ({
  warningThreshold = 300, // 5 minutos
  autoExtendThreshold = 60 // 1 minuto
}) => {
  // El sistema ahora maneja la expiración automáticamente sin mostrar avisos
  // Este componente ya no muestra popups al usuario
  return null;
}; 