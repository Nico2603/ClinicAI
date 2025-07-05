import React, { useState, useEffect } from 'react';
import { CopyIcon, EditIcon, CheckIcon } from '../ui/Icons';
import { GroundingMetadata, GroundingChunk } from '../../types';

interface NoteDisplayProps {
  note: string;
  onNoteChange?: (newNote: string) => void;
  title?: string;
  isLoading?: boolean;
  groundingMetadata?: GroundingMetadata;
}

const NoteDisplay: React.FC<NoteDisplayProps> = ({ note, onNoteChange, title = "Resultado Generado", isLoading = false, groundingMetadata }) => {
  const [editableNote, setEditableNote] = useState(note);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEditableNote(note);
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
  
  const renderGroundingSources = () => {
    if (!groundingMetadata || !groundingMetadata.groundingChunks || groundingMetadata.groundingChunks.length === 0) {
      return null;
    }

    const webChunks = groundingMetadata.groundingChunks.filter(chunk => chunk.web && chunk.web.uri);

    if (webChunks.length === 0) return null;

    return (
      <div className="mt-4 p-3 bg-neutral-100 dark:bg-neutral-700/50 rounded-md border border-neutral-200 dark:border-neutral-600">
        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          Fuentes (Google Search):
        </h4>
        <ul className="list-disc list-inside text-xs space-y-1">
          {webChunks.map((chunk: GroundingChunk, index: number) => (
            // chunk.web and chunk.web.uri are guaranteed by the filter above
            chunk.web && chunk.web.uri && ( 
              <li key={index} className="break-words">
                <a 
                  href={chunk.web.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline dark:text-primary-light break-all"
                  title={chunk.web.title || chunk.web.uri}
                >
                  {chunk.web.title || chunk.web.uri}
                </a>
              </li>
            )
          ))}
        </ul>
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
      {renderGroundingSources()}
    </div>
  );
};

export default NoteDisplay;
