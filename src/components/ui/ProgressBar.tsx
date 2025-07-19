'use client';

import React from 'react';

export interface ProgressStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  active: boolean;
}

interface ProgressBarProps {
  steps: ProgressStep[];
  currentStepIndex: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  steps, 
  currentStepIndex,
  className = '' 
}) => {
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className={`w-full ${className}`}>
      {/* Barra de progreso visual */}
      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mb-4 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Etapa actual */}
      <div className="mb-4">
        {steps.map((step, index) => {
          if (index === currentStepIndex) {
            return (
              <div key={step.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {step.label}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Lista de etapas */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {step.completed ? (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : step.active ? (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              ) : (
                <div className="w-6 h-6 bg-neutral-300 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {index + 1}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${
                step.completed 
                  ? 'text-green-600 dark:text-green-400' 
                  : step.active 
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-neutral-500 dark:text-neutral-500'
              }`}>
                {step.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Porcentaje */}
      <div className="mt-3 text-center">
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {Math.round(progressPercentage)}% completado
        </span>
      </div>
    </div>
  );
};

export default ProgressBar; 