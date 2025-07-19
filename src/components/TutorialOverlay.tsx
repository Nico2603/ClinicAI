'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { TutorialStep } from '../hooks/useTutorial';
import { Button } from './ui/button';

interface TutorialOverlayProps {
  step: TutorialStep;
  isFirstStep: boolean;
  isLastStep: boolean;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onClose: () => void;
}

interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  step,
  isFirstStep,
  isLastStep,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onClose
}) => {
  const [targetPosition, setTargetPosition] = useState<ElementPosition | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  // Función para obtener la posición del elemento objetivo
  const getTargetPosition = useCallback((): ElementPosition | null => {
    const element = document.querySelector(step.target);
    if (!element) {
      console.warn(`Tutorial: Elemento con selector "${step.target}" no encontrado`);
      return null;
    }

    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    };
  }, [step.target]);

  // Función para calcular la posición del popup
  const calculatePopupPosition = useCallback((targetPos: ElementPosition, popupElement: HTMLElement) => {
    const popupRect = popupElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 20;
    
    let top = 0;
    let left = 0;

    switch (step.placement) {
      case 'top':
        top = targetPos.top - popupRect.height - margin;
        left = targetPos.left + (targetPos.width / 2) - (popupRect.width / 2);
        break;
      case 'bottom':
        top = targetPos.top + targetPos.height + margin;
        left = targetPos.left + (targetPos.width / 2) - (popupRect.width / 2);
        break;
      case 'left':
        top = targetPos.top + (targetPos.height / 2) - (popupRect.height / 2);
        left = targetPos.left - popupRect.width - margin;
        break;
      case 'right':
        top = targetPos.top + (targetPos.height / 2) - (popupRect.height / 2);
        left = targetPos.left + targetPos.width + margin;
        break;
    }

    // Ajustar si se sale de los límites de la ventana
    if (left < margin) {
      left = margin;
    } else if (left + popupRect.width > viewportWidth - margin) {
      left = viewportWidth - popupRect.width - margin;
    }

    if (top < margin) {
      top = margin;
    } else if (top + popupRect.height > viewportHeight - margin) {
      top = viewportHeight - popupRect.height - margin;
    }

    return { top, left };
  }, [step.placement]);

  // Actualizar posiciones cuando cambia el paso
  useEffect(() => {
    const updatePositions = () => {
      const targetPos = getTargetPosition();
      if (targetPos) {
        setTargetPosition(targetPos);
        
        if (popupRef.current) {
          const popupPos = calculatePopupPosition(targetPos, popupRef.current);
          setPopupPosition(popupPos);
        }
      }
    };

    // Pequeño delay para asegurar que el DOM esté actualizado
    const timeoutId = setTimeout(updatePositions, 100);

    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
    };
  }, [step.target, getTargetPosition, calculatePopupPosition]);

  // Ejecutar acción del paso si existe
  useEffect(() => {
    if (step.action) {
      step.action();
    }
  }, [step]);

  // Manejar teclas del teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
        case 'Enter':
          if (!isLastStep) onNext();
          else onClose();
          break;
        case 'ArrowLeft':
          if (!isFirstStep) onPrev();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFirstStep, isLastStep, onNext, onPrev, onClose]);

  if (!targetPosition) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay con recorte para destacar el elemento */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        style={{
          clipPath: `polygon(
            0% 0%, 
            0% 100%, 
            ${targetPosition.left}px 100%, 
            ${targetPosition.left}px ${targetPosition.top}px, 
            ${targetPosition.left + targetPosition.width}px ${targetPosition.top}px, 
            ${targetPosition.left + targetPosition.width}px ${targetPosition.top + targetPosition.height}px, 
            ${targetPosition.left}px ${targetPosition.top + targetPosition.height}px, 
            ${targetPosition.left}px 100%, 
            100% 100%, 
            100% 0%
          )`
        }}
        onClick={onClose}
      />

      {/* Highlight del elemento objetivo */}
      <div
        className="absolute border-4 border-blue-500 rounded-lg shadow-lg pointer-events-none"
        style={{
          top: targetPosition.top - 2,
          left: targetPosition.left - 2,
          width: targetPosition.width + 4,
          height: targetPosition.height + 4,
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
        }}
      />

      {/* Popup del tutorial */}
      <div
        ref={popupRef}
        className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-80 border border-gray-200 dark:border-gray-700"
        style={{
          top: popupPosition.top,
          left: popupPosition.left
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {step.title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Cerrar tutorial"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
          {step.content}
        </p>

        {/* Progreso */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>Paso {currentStepIndex + 1} de {totalSteps}</span>
            <span>{Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPrev}
                className="text-gray-600 dark:text-gray-300"
              >
                ← Anterior
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Saltar tutorial
            </Button>
            
            {isLastStep ? (
              <Button
                onClick={onClose}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                ¡Finalizar! 🎉
              </Button>
            ) : (
              <Button
                onClick={onNext}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Siguiente →
              </Button>
            )}
          </div>
        </div>

        {/* Indicador de teclas */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 Usa las flechas ←→ o Esc para navegar
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay; 