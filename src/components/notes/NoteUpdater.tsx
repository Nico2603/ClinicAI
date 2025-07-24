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

'use client';

import React, { useState } from 'react';
import { updateClinicalNote } from '../../lib/services/openaiService';
import { GroundingMetadata } from '../../types';
import { SparklesIcon, LoadingSpinner } from '../ui/Icons';
import { Button } from '../ui/button';
import NoteDisplay from './NoteDisplay';
import { TextareaWithSpeech } from '@/components';

interface NoteUpdaterProps {
  className?: string;
  initialNote?: string;
}

const NoteUpdater: React.FC<NoteUpdaterProps> = ({ className = '', initialNote = '' }) => {
  // Estados principales
  const [originalNote, setOriginalNote] = useState<string>(initialNote);
  const [newInformation, setNewInformation] = useState<string>('');
  const [updatedNote, setUpdatedNote] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [groundingMetadata, setGroundingMetadata] = useState<GroundingMetadata | undefined>(undefined);

  const handleUpdateNote = async () => {
    if (!originalNote.trim()) {
      setError("Por favor, ingrese la nota clínica original.");
      return;
    }

    if (!newInformation.trim()) {
      setError("Por favor, ingrese la nueva información para actualizar.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setUpdatedNote('');

    try {
      const result = await updateClinicalNote(originalNote.trim(), newInformation.trim());
      setUpdatedNote(result.text);
      setGroundingMetadata(result.groundingMetadata);
    } catch (error) {
      console.error('Error updating note:', error);
      setError(`Error al actualizar la nota: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    setOriginalNote('');
    setNewInformation('');
    setUpdatedNote('');
    setError(null);
    setGroundingMetadata(undefined);
  };

  const handleUseUpdatedNote = () => {
    setOriginalNote(updatedNote);
    setNewInformation('');
    setUpdatedNote('');
    setError(null);
    setGroundingMetadata(undefined);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <SparklesIcon className="h-6 w-6 text-green-600" />
          Actualizador de Notas Clínicas
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Actualiza notas clínicas existentes con nueva información de manera <strong>selectiva</strong> y precisa.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>💡 Actualización Inteligente:</strong> Solo se modificarán las secciones específicas que requieren cambios, 
            preservando el formato y contenido original intactos.
          </p>
        </div>
      </div>

      {/* Entrada de Nota Original */}
      <div className="space-y-2" data-tutorial="note-input">
        <TextareaWithSpeech
          value={originalNote}
          onChange={(e) => setOriginalNote(e.target.value)}
          placeholder="Pegue aquí la nota clínica original que desea actualizar..."
          rows={12}
          label="Nota Clínica Original"
          showCharacterCount={true}
          speechLanguage="es-ES"
          className="focus:border-green-500 focus:ring-green-500"
        />
      </div>

      {/* Entrada de Nueva Información */}
      <div className="space-y-2">
        <TextareaWithSpeech
          value={newInformation}
          onChange={(e) => setNewInformation(e.target.value)}
          placeholder="Ingrese la nueva información médica que desea integrar en la nota existente..."
          rows={8}
          label="Nueva Información a Integrar"
          showCharacterCount={true}
          speechLanguage="es-ES"
          className="focus:border-green-500 focus:ring-green-500"
        />
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleUpdateNote}
          disabled={isProcessing || !originalNote.trim() || !newInformation.trim()}
          data-tutorial="update-note"
          className="flex-1 min-w-[200px] bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <LoadingSpinner className="h-4 w-4 mr-2" />
              Actualizando Nota...
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4 mr-2" />
              Actualizar Nota
            </>
          )}
        </Button>
        
        <Button
          onClick={handleClearAll}
          variant="tertiary"
          size="sm"
        >
          Limpiar Todo
        </Button>

        {updatedNote && (
          <Button
            onClick={handleUseUpdatedNote}
            variant="outline"
            className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/20"
          >
            Usar Nota Actualizada
          </Button>
        )}
      </div>

      {/* Mostrar Errores */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300 rounded-lg">
          <p className="font-bold text-sm">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Mostrar Resultado */}
      {updatedNote && (
        <NoteDisplay
          note={updatedNote}
          title="Nota Clínica Actualizada"
          isLoading={isProcessing}
          groundingMetadata={groundingMetadata}
        />
      )}
    </div>
  );
};

export default NoteUpdater; 