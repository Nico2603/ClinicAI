import React, { useState, useEffect } from 'react';
import { CopyIcon, EditIcon, CheckIcon } from '../ui/Icons';
import { GroundingMetadata, GroundingChunk, MissingDataInfo } from '../../types';

interface NoteDisplayProps {
  note: string;
  onNoteChange?: (newNote: string) => void;
  title?: string;
  isLoading?: boolean;
  groundingMetadata?: GroundingMetadata;
  missingData?: MissingDataInfo;
}

const NoteDisplay: React.FC<NoteDisplayProps> = ({ note, onNoteChange, title = "Resultado Generado", isLoading = false, groundingMetadata, missingData }) => {
  const [editableNote, setEditableNote] = useState(note);
  const [originalNote, setOriginalNote] = useState(note);
  const [isUppercase, setIsUppercase] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEditableNote(note);
    setOriginalNote(note);
    setIsUppercase(false);
  }, [note]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableNote)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  };

  const toggleEdit = () => {
    if (isEditing && onNoteChange) {
      onNoteChange(editableNote);
    }
    setIsEditing(!isEditing);
  };

  const toggleUppercase = () => {
    if (isUppercase) {
      setEditableNote(originalNote);
    } else {
      setOriginalNote(editableNote);
      setEditableNote(editableNote.toUpperCase());
    }
    setIsUppercase(!isUppercase);
  };
  
  const renderMissingData = () => {
    // Debug temporal para verificar qué datos llegan
    console.log('🔍 Debug missingData:', missingData);
    
    // Solo ocultar si realmente no hay missingData o si explícitamente dice que todo está completo
    if (!missingData || !missingData.summary) {
      console.log('🚫 No hay missingData o summary');
      return null;
    }

    // Solo ocultar si el mensaje indica explícitamente que la información está completa
    if ((missingData.summary === "Información completa disponible" || 
         missingData.summary === "Información completa para esta plantilla" ||
         missingData.summary === "La información disponible cubre las secciones principales de la plantilla") && 
        (!missingData.missingFields || missingData.missingFields.length === 0)) {
      console.log('🚫 Información completa detectada, ocultando sección');
      return null;
    }

    console.log('✅ Mostrando sección de datos faltantes');
    return (
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-700">
        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center">
          <span className="mr-2">📊</span>
          Análisis de Datos Faltantes:
        </h4>
        <div className="text-xs text-amber-700 dark:text-amber-300 whitespace-pre-wrap leading-relaxed">
          {missingData.summary}
        </div>
        {missingData.missingFields && missingData.missingFields.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">
              Campos específicos que podrían necesitar más información:
            </p>
            <ul className="list-disc list-inside text-xs space-y-1 text-amber-700 dark:text-amber-300">
              {missingData.missingFields.map((field, index) => (
                <li key={index} className="break-words">
                  {field}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 italic">
          💡 Esta información puede ayudarte a complementar la nota médica con datos adicionales.
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="mt-4 md:mt-6 p-4 md:p-6 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm bg-white dark:bg-neutral-800 animate-pulse">
        <div className="h-6 bg-neutral-300 dark:bg-neutral-600 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-full"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-5/6"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-full"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-3/4"></div>
        </div>
      </div>
    );
  }
  
  if (!note && !isLoading) {
      return (
        <div className="mt-4 md:mt-6 p-4 md:p-6 text-center text-neutral-500 dark:text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800">
          <p className="text-sm md:text-base">No hay contenido para mostrar aún.</p>
        </div>
      );
  }

  return (
    <div className="mt-4 md:mt-6 p-4 md:p-6 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm bg-white dark:bg-neutral-800">
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <h3 className="text-base md:text-lg font-semibold text-neutral-800 dark:text-neutral-100 pr-4 flex-1 min-w-0">
          <span className="truncate block md:inline">{title}</span>
        </h3>
        <div className="flex space-x-2 shrink-0">
          {onNoteChange && (
            <button
              onClick={toggleEdit}
              className="p-2 text-neutral-500 hover:text-primary dark:text-neutral-400 dark:hover:text-primary rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              title={isEditing ? "Guardar Cambios" : "Editar Nota"}
              aria-label={isEditing ? "Guardar Cambios de la nota" : "Habilitar edición de la nota"}
            >
              {isEditing ? <CheckIcon className="h-4 w-4 md:h-5 md:w-5" /> : <EditIcon className="h-4 w-4 md:h-5 md:w-5" />}
            </button>
          )}
          <button
            onClick={toggleUppercase}
            className="p-2 text-neutral-500 hover:text-primary dark:text-neutral-400 dark:hover:text-primary rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            title={isUppercase ? 'Vista Original' : 'Todo en MAYÚSCULAS'}
            aria-label={isUppercase ? 'Volver a vista original' : 'Convertir nota a mayúsculas'}
          >
            <span className="font-bold text-xs">{isUppercase ? 'Ab' : 'AB'}</span>
          </button>
          <button
            onClick={handleCopy}
            className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
              copied 
                ? 'text-green-500 hover:text-green-600' 
                : 'text-neutral-500 hover:text-primary dark:text-neutral-400 dark:hover:text-primary'
            }`}
            title="Copiar al Portapapeles"
            aria-label="Copiar nota al portapapeles"
          >
            {copied ? <CheckIcon className="h-4 w-4 md:h-5 md:w-5" /> : <CopyIcon className="h-4 w-4 md:h-5 md:w-5" />}
          </button>
        </div>
      </div>
      {isEditing && onNoteChange ? (
        <textarea
          value={editableNote}
          onChange={(e) => setEditableNote(e.target.value)}
          rows={15}
          className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100 transition-colors text-sm md:text-base"
          aria-label="Editor de texto para la nota generada"
        />
      ) : (
        <div className="overflow-x-auto">
          <pre className="whitespace-pre-wrap text-xs md:text-sm text-neutral-700 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-700/40 p-3 md:p-4 rounded-md min-w-0">{editableNote}</pre>
        </div>
      )}
      {renderMissingData()}
    </div>
  );
};

export default NoteDisplay;
